/**
 * POST /api/ai/copilot
 *
 * Real-time fast chat engine (Engine A).
 * Analyzes the recent sliding window of the transcript to provide tactical
 * guidance to the user in real-time, categorized by the 4-Phase framework.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import type { AiOutput, ProspectData, CallPhase } from '@/store/meetingStore';

function getPhaseDirectives(phase: CallPhase, objective?: string): string {
  const objectiveText = objective ? `\nYOUR ULTIMATE OBJECTIVE: ${objective}` : '';

  switch (phase) {
    case 'cold':
      return `PHASE: THE COLD OPENER
Role: The Matchmaker / Authority
Directive: Signal authority instantly. Establish the "Doctor/Patient" frame. You route pre-qualified deals to the right partner. Let them vent about their pipeline gaps.
- openWith: A jarring, high-authority question about their current deal flow or gaps.
- say: A calm, non-needy opener establishing that you filter and route deals.${objectiveText}`;
      
    case 'discovery':
      return `PHASE: DEEP DISCOVERY
Role: The Forensic Analyst
Directive: Listen for pipeline bottlenecks, wasted capital on bad leads, and episodic revenue. Ignore surface-level complaints and find the root cause of their deal flow pain.
- betweenUs: Identify the actual pain they are trying to hide regarding their pipeline.
- say: A probing question to make them quantify the cost of their bad deal flow.${objectiveText}`;
      
    case 'pitch':
      return `PHASE: THE MATCH / PITCH
Role: The Strategic Matchmaker
Directive: Prescribe your filtration pipeline. Pitch priority access to pre-qualified deals on a monthly retainer ($2K-$5.5K FCR). Flatly state the terms. "If you flinch, they flinch."
- openWith: A statement seizing control and shifting to the prescription.
- say: A tailored value proposition emphasizing filtration, quality over volume, and the monthly retainer.${objectiveText}`;
      
    case 'objection':
      return `PHASE: OBJECTION HANDLING
Role: The Shield & Pivot
Directive: Handle market-maker objections ruthlessly.
- If "need more volume": Reframe to filtration ("4 that fit vs 40 you have to sort").
- If "references": Reframe to Discretion ("I keep both sides confidential").
- betweenUs: Blunt truth about why they are hesitating.
- say: A word-for-word reframing tactic to bypass the objection.${objectiveText}`;
      
    default:
      return '';
  }
}

function getCopilotPrompt(
  prospectData: ProspectData | null, 
  currentPhase: CallPhase,
  longTermContext?: any,
  ragContext?: string
): string {
  const identityContext = prospectData?.domain
    ? `You are speaking with ${prospectData.name || 'a prospect'} from the ${prospectData.domain} space. As an industry expert, you MUST use their specific industry terminology to build immediate authority.`
    : `You don't have deep context on the prospect's industry yet, so rely on raw psychological framing.`;

  const phaseDirectives = getPhaseDirectives(currentPhase, prospectData?.objective);
  
  const deepContext = longTermContext?.painHypothesis 
    ? `\nLONG-TERM CONTEXT (From earlier in call):\nProspect Profile: ${longTermContext.prospectProfile}\nActual Pain/Bottleneck: ${longTermContext.painHypothesis}\n`
    : '';

  const emailContext = prospectData?.emailSequence
    ? `\nPRIOR COMMUNICATION CONTEXT:\nThe following email sequence/messages got them on the call:\n"${prospectData.emailSequence}"\nEnsure your suggestions never contradict the frame established in these messages.\n`
    : '';

  return `You are "Ele Meet", an elite tactical matchmaking copilot for a Market-Maker/Connector business. 
The user (You) connects pre-qualified demand with supply. The user DOES NOT fulfill services. 
The user's goal is to close the prospect (usually Supply) on a monthly retainer for priority access to filtered deal flow.

USE THE DOCTRINE: Only use spartan, concise, non-needy language. Never use B2B jargon.

You are silently listening to a live conversation between the user ("You") and a prospect ("Them").

CONTEXT:
${identityContext}
${deepContext}${emailContext}
${ragContext || ''}

${phaseDirectives}

Your goal is to provide real-time tactical leverage. Return the exact words the user should say, and ONLY the exact words. IT MUST SOUND LIKE A CASUAL HUMAN INTERACTION. The user speaks to many different niches and needs you to feed them exactly what to say naturally. Match the rhythm of a casual conversation. Do not write "You should say...", just write the exact words to speak.`;
}

// Initialize AI clients — Groq is PRIMARY (fastest), NVIDIA Nemotron is fallback
const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || 'dummy_key_to_prevent_init_error',
});

const nvidia = createOpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_API_KEY || 'dummy_key_to_prevent_init_error',
});

const fallbackOpenAI = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key_to_prevent_init_error',
});

export async function POST(req: NextRequest) {
  try {
    const { transcript, prospectData, currentPhase, longTermContext, manualDirective } = await req.json() as { 
      transcript: string;
      prospectData: ProspectData | null;
      currentPhase: CallPhase;
      longTermContext?: any;
      manualDirective?: string | null;
    };

    if (!transcript?.trim()) {
      return NextResponse.json({ error: 'transcript is required' }, { status: 400 });
    }

    // System 2 (Context Analyzer)
    let distilledContext = "Context: Unclear";
    try {
      const system2Response = await generateText({
        model: groq('llama-3.1-8b-instant'), // Fast context analysis
        system: 'Analyze the following transcript segment. Return a concise, distilled context summary (e.g. "Arc: Discovery, Frame: Strong, Current Objection: Price"). Keep it under 15 words. USE THE DOCTRINE: Only use spartan, concise, non-needy language. Never use B2B jargon.',
        prompt: `Recent Conversation:\n${transcript}`,
        temperature: 0.1,
      });
      distilledContext = system2Response.text;
    } catch (err) {
      console.warn('[ai/copilot] System 2 Context Analyzer failed:', err);
    }

    // RAG Lookup
    let ragContext = '';
    try {
      if (process.env.NVIDIA_API_KEY && transcript) {
        const lancedb = await import('@lancedb/lancedb');
        const path = await import('path');
        const DB_PATH = path.resolve(process.cwd(), 'lancedb_data');
        const db = await lancedb.connect(DB_PATH);
        const tables = await db.tableNames();
        
        if (tables.includes('doctrine')) {
          const queryText = transcript.slice(-200);
          const embedRes = await fetch('https://integrate.api.nvidia.com/v1/embeddings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
            },
            body: JSON.stringify({
              input: queryText,
              model: "nvidia/nv-embedqa-e5-v5",
              input_type: "query"
            })
          });

          if (embedRes.ok) {
            const embedData = await embedRes.json();
            const queryVector = embedData.data[0].embedding;
            const table = await db.openTable('doctrine');
            const results = await table.search(queryVector).limit(3).toArray();
            
            if (results.length > 0) {
              ragContext = `\nCRITICAL DOCTRINE RULES TO APPLY:\n`;
              results.forEach((r, i) => {
                ragContext += `[Rule ${i+1}]: ${r.text}\n`;
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("[ai/copilot] RAG Lookup Failed:", err);
    }

    const system1BasePrompt = getCopilotPrompt(prospectData, currentPhase || 'cold', longTermContext, ragContext);
    
    // Inject Manual Directive aggressively if present
    const directiveOverride = manualDirective 
      ? `\n\nCRITICAL USER OVERRIDE: The user clicked "${manualDirective}". You MUST instantly pivot the conversation and generate exact words that execute this specific directive.`
      : '';

    const systemPrompt = `${system1BasePrompt}\n\nDISTILLED CONTEXT (System 2 Analysis):\n${distilledContext}${directiveOverride}`;
    const userPrompt = `Recent Conversation:\n${transcript}`;

    // System 1 (Reflex)
    try {
      if (!process.env.GROQ_API_KEY) throw new Error('No GROQ_API_KEY provided');
      
      const result = streamText({
        model: groq('llama-3.3-70b-versatile'),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.3,
      });
      
      console.log('[ai/copilot] System 1 Streaming Response initiated ✓');
      return result.toDataStreamResponse();
    } catch (err: any) {
      console.error('[ai/copilot] System 1 streaming failed:', err.message);
      
      // Fallback
      const result = streamText({
        model: fallbackOpenAI('gpt-4o-mini'),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.3,
      });
      
      return result.toDataStreamResponse();
    }
  } catch (err) {
    console.error('[ai/copilot] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

