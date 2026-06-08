/**
 * POST /api/ai/copilot
 *
 * Real-time fast chat engine (Engine A).
 * Analyzes the recent sliding window of the transcript to provide tactical
 * guidance to the user in real-time, categorized by the 4-Phase framework.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import type { AiOutput, ProspectData, CallPhase } from '@/store/meetingStore';

function getPhaseDirectives(phase: CallPhase, objective?: string): string {
  const objectiveText = objective ? `\nYOUR ULTIMATE OBJECTIVE: ${objective}` : '';

  switch (phase) {
    case 'cold':
      return `PHASE: THE COLD OPENER
Role: The Doctor / Pattern Interrupter
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
Directive: Prescribe your filtration pipeline. Pitch priority access to pre-qualified deals on a monthly retainer. Flatly state the terms. "If you flinch, they flinch."
- openWith: A statement seizing control and shifting to the prescription.
- say: A tailored value proposition emphasizing filtration, quality over volume, and the monthly retainer.${objectiveText}`;
      
    case 'objection':
      return `PHASE: OBJECTION HANDLING
Role: The Shield & Pivot
Directive: Handle market-maker objections ruthlessly.
- If "send me one intro first": Reframe to process integrity (you don't send candidates without a search agreement).
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
  longTermContext?: any
): string {
  const identityContext = prospectData?.domain
    ? `You are speaking with ${prospectData.name || 'a prospect'} from the ${prospectData.domain} space. As an industry expert, you MUST use their specific industry terminology to build immediate authority.`
    : `You don't have deep context on the prospect's industry yet, so rely on raw psychological framing.`;

  const phaseDirectives = getPhaseDirectives(currentPhase, prospectData?.objective);
  
  const deepContext = longTermContext?.painHypothesis 
    ? `\nLONG-TERM CONTEXT (From earlier in call):\nProspect Profile: ${longTermContext.prospectProfile}\nActual Pain/Bottleneck: ${longTermContext.painHypothesis}\n`
    : '';

  return `You are "Ele Meet", an elite tactical matchmaking copilot for a Market-Maker/Connector business. 
The user (You) connects pre-qualified demand with supply. The user DOES NOT fulfill services. 
The user's goal is to close the prospect (usually Supply) on a monthly retainer for priority access to filtered deal flow.

You are silently listening to a live conversation between the user ("You") and a prospect ("Them").

CONTEXT:
${identityContext}
${deepContext}

${phaseDirectives}

Your goal is to provide real-time tactical leverage. You output JSON with exactly three fields based strictly on the Phase Directives above:
1. "openWith": Keep it under 25 words.
2. "betweenUs": Keep it under 25 words. Be blunt.
3. "say": A precise, WORD-FOR-WORD script the user can read verbatim. Use a casual, human-like tone. NEVER sound robotic. Match the rhythm of the conversation. Do not write "You should say...", just write the exact words to speak.

If there isn't enough context to provide all three, you can leave fields as null.`;
}

// Initialize NVIDIA client
const nvidia = createOpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_API_KEY || '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',
});

export async function POST(req: NextRequest) {
  try {
    const { transcript, prospectData, currentPhase, longTermContext } = await req.json() as { 
      transcript: string;
      prospectData: ProspectData | null;
      currentPhase: CallPhase;
      longTermContext?: any;
    };

    if (!transcript?.trim()) {
      return NextResponse.json({ error: 'transcript is required' }, { status: 400 });
    }

    const systemPrompt = getCopilotPrompt(prospectData, currentPhase || 'cold', longTermContext);
    const userPrompt = `Recent Conversation:\n${transcript}`;

    // Nemotron Nano 8B is so fast that we can generate the whole JSON object in ~300ms.
    // This allows us to keep the frontend completely intact without setting up JSON streaming parsing.
    let objectPayload: any = null;

    try {
      const { object } = await generateObject({
        model: nvidia('nvidia/llama-3.1-nemotron-nano-8b-v1'),
        system: systemPrompt,
        prompt: userPrompt,
        schema: z.object({
          openWith: z.string().nullable(),
          betweenUs: z.string().nullable(),
          say: z.string().nullable()
        }),
        temperature: 0,
        topP: 0.95,
      });
      objectPayload = object;
    } catch (err: any) {
      console.warn('[ai/copilot] Initial JSON generation failed, attempting strict retry:', err.message);
      try {
        // Retry with a slightly modified temperature to break out of the bad formatting loop
        const { object } = await generateObject({
          model: nvidia('nvidia/llama-3.1-nemotron-nano-8b-v1'),
          system: systemPrompt,
          prompt: userPrompt,
          schema: z.object({
            openWith: z.string().nullable(),
            betweenUs: z.string().nullable(),
            say: z.string().nullable()
          }),
          temperature: 0.1, 
          topP: 1,
        });
        objectPayload = object;
      } catch (retryErr: any) {
        console.error('[ai/copilot] Retry failed. Yielding graceful fallback.', retryErr.message);
        // Return a graceful fallback instead of throwing a 500 to the frontend
        objectPayload = {
          openWith: null,
          betweenUs: "System overload. Pause.",
          say: "Give me one second to pull up those exact numbers..."
        };
      }
    }

    return NextResponse.json(objectPayload);
  } catch (err) {
    console.error('[ai/copilot] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

