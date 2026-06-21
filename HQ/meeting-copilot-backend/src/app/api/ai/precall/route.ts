import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createOpenAI as createGroq } from '@ai-sdk/openai';
import { createOpenAI as createNvidia } from '@ai-sdk/openai';
import { z } from 'zod';
import { searchTavily } from '@/lib/tavilyClient';

// Initialize AI providers
const groq = createGroq({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || '',
});

const nvidia = createNvidia({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_COPILOT_API_KEY || process.env.NVIDIA_API_KEY || '',
});

import { SPARTAN_DOCTRINE } from '../doctrine';

const SYSTEM_PROMPT = `
${SPARTAN_DOCTRINE}

You are the intelligence engine for a High-Ticket B2B Matchmaker and Connector.
Your task is to act as a 6-loop agentic researcher. You do not just generate an icebreaker, you analyze the prospect deeply based on web intelligence to formulate a comprehensive Strategic Brief.

CRITICAL BLUEPRINT RULES:
1. prospectProfile: Provide a deep analysis of who they are, probability of decision-maker status, and their company's core value prop.
2. signalAssessment: Evaluate their current state, recent news, momentum, or funding signals. Read between the lines.
3. approach: Recommend the tactical posture to take on the call.
4. icebreaker: Provide exactly ONE Spartan Connector Opener. NO FLUFF. No B2B sales jargon. Strip company names to the bare minimum (e.g. no LLC). Do not ask for their time. Do not pitch. Frame it as a hyper-specific observation to establish peer-level authority instantly.

Output strictly in JSON matching the provided schema.
`;

const responseSchema = z.object({
  prospectProfile: z.string().describe('Deep analysis of who they are (probability of decision maker status, etc).'),
  signalAssessment: z.string().describe('What their current state/funding signals.'),
  approach: z.string().describe('The tactical posture to take.'),
  icebreaker: z.string().describe('The single Spartan Connector Opener (no fluff).'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = body.prospectData?.name || body.name;
    const domain = body.prospectData?.domain || body.domain;
    const emailSequence = body.prospectData?.emailSequence || body.emailSequence;

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    const emailContext = emailSequence 
      ? `\n\nCRITICAL CONTEXT (Prior Communication):\nThe following messages/emails were exchanged prior to this call. Evaluate their strategy through the lens of what was already discussed:\n"${emailSequence}"` 
      : '';

    const promptContext = `Prospect Name: ${name || 'Unknown'}\nCompany Domain: ${domain}${emailContext}\n\nUse your searchWeb tool to dig deep. Do not guess. You must loop and search until you have a rock-solid understanding of their strategy and funding. Then, output your final brief strictly in JSON matching the schema.`;
    
    let briefPayload: any = null;

    try {
      if (!process.env.GROQ_API_KEY) throw new Error('No GROQ_API_KEY');
      
      const { text } = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        system: SYSTEM_PROMPT + '\n\nOutput only valid JSON, no markdown formatting or backticks at the very end after your research.',
        prompt: promptContext,
        temperature: 0.2,
        maxSteps: 6,
        tools: {
          searchWeb: {
            description: 'Search the web for recent news, funding, and strategy.',
            parameters: z.object({
              query: z.string().describe('The search query. e.g., "Acme Corp recent news funding"')
            }),
            execute: async ({ query }) => {
              console.log(`[ai/precall] Agent executing searchWeb: ${query}`);
              try {
                const tavilyRes = await searchTavily(query, 3);
                if (tavilyRes && tavilyRes.results && tavilyRes.results.length > 0) {
                  return tavilyRes.results.map((r: any) => `- ${r.title}: ${r.content}`).join('\n');
                }
                return 'No relevant search results found.';
              } catch (e) {
                return 'Search failed.';
              }
            }
          }
        }
      });
      
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      briefPayload = JSON.parse(cleanText);
      console.log('[ai/precall] 6-Loop Groq agent generation succeeded ✓');
    } catch (groqErr: any) {
      console.warn('[ai/precall] Agent failed:', groqErr.message);
      throw new Error('AI Agent Generation failed');
    }

    return NextResponse.json(briefPayload);
  } catch (error: any) {
    console.error('[ai/precall] Route error:', error);
    return NextResponse.json({ error: error.message || 'Internal Error' }, { status: 500 });
  }
}
