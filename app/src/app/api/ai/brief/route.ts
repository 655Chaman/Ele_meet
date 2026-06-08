/**
 * POST /api/ai/brief
 *
 * Deep reasoning engine (Engine B).
 * Generates the strategic brief by:
 * 1. Extracting the prospect's company name from the transcript.
 * 2. Searching Tavily for live web intelligence on the company.
 * 3. Passing the transcript + intel to `deepseek-reasoner` to build the brief.
 */

import { NextRequest, NextResponse } from 'next/server';
import { fastChatJson, deepReasoningJson } from '@/lib/deepseekClient';
import { searchTavily } from '@/lib/tavilyClient';
import type { StrategicBrief } from '@/store/meetingStore';

const EXTRACTION_SYSTEM_PROMPT = `Extract the name of the prospect's company from the conversation.
If the company name is explicitly mentioned or strongly implied, return it.
If you cannot determine the company name, return null for the companyName field.
Output JSON format: { "companyName": "string | null" }`;

const REASONING_SYSTEM_PROMPT = `You are an elite B2B strategic advisor analyzing a live sales/partnership call.
You have the transcript of the call so far, and some recent web intelligence about the prospect's company.

Your task is to synthesize this into a "Strategic Brief" with exactly these JSON fields:
{
  "prospectProfile": "A 2-3 sentence summary of who they are, their scale, and their core business model based on the conversation and web intel.",
  "signalAssessment": "A sharp, blunt assessment of what they are actually signaling. Are they in pain, shopping around, or trying to pivot? Don't be polite, be accurate.",
  "approach": "A 2-3 sentence tactical recommendation on how to position the pitch or handle the remainder of the call.",
  "webIntel": ["Array of 1-3 bullet points of relevant external context (e.g. recent funding, news, hiring trends). Use the provided web intel."],
  "tags": [
    { "label": "Short Tag 1", "type": "buyer" | "risk" | "opportunity" | "neutral" },
    { "label": "Short Tag 2", "type": "buyer" | "risk" | "opportunity" | "neutral" }
  ]
}

Make the insights highly actionable and specific to the conversation context.`;

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json() as { transcript: string };

    if (!transcript?.trim()) {
      return NextResponse.json({ error: 'transcript is required' }, { status: 400 });
    }

    // 1. Extract company name
    const extraction = await fastChatJson<{ companyName: string | null }>(
      EXTRACTION_SYSTEM_PROMPT,
      `Transcript:\n${transcript}`
    );

    const companyName = extraction.companyName;
    console.log(`[ai/brief] Extracted company: ${companyName || 'None'}`);

    // 2. Fetch web intel if we have a company name
    let webIntelContext = 'No external web intelligence available.';
    if (companyName) {
      try {
        const tavilyRes = await searchTavily(`${companyName} company news funding strategy`, 3);
        const snippets = tavilyRes.results.map(r => `- ${r.title}: ${r.content}`).join('\n');
        webIntelContext = `Web Intelligence for ${companyName}:\n${snippets}`;
      } catch (err) {
        console.warn(`[ai/brief] Tavily search failed for ${companyName}:`, err);
      }
    }

    // 3. Generate Strategic Brief using deep reasoning
    const promptContext = `Transcript:\n${transcript}\n\n${webIntelContext}`;
    const brief = await deepReasoningJson<StrategicBrief>(
      REASONING_SYSTEM_PROMPT,
      promptContext
    );

    return NextResponse.json(brief);
  } catch (err) {
    console.error('[ai/brief] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
