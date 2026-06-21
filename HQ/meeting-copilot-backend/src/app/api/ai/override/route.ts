/**
 * POST /api/ai/override
 *
 * Generates tactical override responses when the user clicks an action button
 * (e.g., transition, discovery, takeover, slowdown).
 *
 * This endpoint streams the response token-by-token using NVIDIA NIM.
 */

import { NextRequest } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import type { TacticalAction, ProspectData } from '@/store/meetingStore';
import { SPARTAN_DOCTRINE } from '../doctrine';

const SYSTEM_PROMPT = `
${SPARTAN_DOCTRINE}

You are the real-time tactical brain for a B2B Connector Copilot.`;

const OVERRIDE_PROMPTS: Record<TacticalAction, string> = {
  transition: "Generate a smooth but assertive transition that pivots the conversation away from the current topic and towards next steps or a broader strategic mapping. Keep it under 30 words.",
  discovery: "Generate a sharp, multi-layered discovery question based on the recent context to uncover their actual pain point or internal blocker. Keep it under 30 words.",
  takeover: "Generate a confident takeover statement that seizes control of the frame and positions the user as the authority. Keep it under 30 words.",
  slowdown: "Generate a statement to politely interrupt and slow the prospect down to unpack something important they just glossed over. Keep it under 30 words."
};

// Initialize NVIDIA client
const nvidia = createOpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_API_KEY || 'dummy_key_to_prevent_init_error',
});

function getOverrideSystemPrompt(prospectData: ProspectData | null): string {
  const objectiveText = prospectData?.objective ? `\nYOUR ULTIMATE OBJECTIVE: ${prospectData.objective}\n` : '';
  const baseContext = prospectData?.domain
    ? `You are speaking with ${prospectData.name || 'a prospect'} from the ${prospectData.domain} space. As an industry expert, you MUST use their specific industry terminology to build immediate authority.`
    : `You don't have deep context on the prospect's industry yet, so rely on raw psychological framing.`;

  return `You are a tactical sales copilot for a Market-Maker/Connector. The user connects pre-qualified demand with supply. The user DOES NOT fulfill services. 
The user's goal is to close the prospect on a monthly retainer for priority access to filtered deal flow.

Your job is to generate exactly ONE verbatim phrase for the user to say out loud right now.
It must be casual, human-like, and highly strategic.
Do NOT use JSON or any formatting tags. Just output the raw conversational text.

CONTEXT:
${baseContext}
${objectiveText}`;
}

export async function POST(req: NextRequest) {
  try {
    const { action, recentTranscript, prospectData } = await req.json() as {
      action: TacticalAction;
      recentTranscript: string;
      prospectData: ProspectData | null;
    };

    if (!action || !recentTranscript) {
      return new Response('action and recentTranscript are required', { status: 400 });
    }

    const tacticalPrompt = OVERRIDE_PROMPTS[action];
    const copilotModel = process.env.NVIDIA_COPILOT_MODEL || 'nvidia/llama-3.1-nemotron-ultra-253b-v1';

    const result = await streamText({
      model: nvidia(copilotModel),
      system: getOverrideSystemPrompt(prospectData),
      prompt: `Recent Conversation:\n${recentTranscript}\n\nTask: ${tacticalPrompt}`,
      temperature: 0.5,
    });

    return result.toTextStreamResponse();

  } catch (err) {
    console.error('[ai/override] Error:', err);
    return new Response(err instanceof Error ? err.message : 'Unknown error', { status: 500 });
  }
}
