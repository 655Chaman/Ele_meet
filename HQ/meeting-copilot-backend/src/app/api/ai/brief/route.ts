/**
 * POST /api/ai/brief
 *
 * Deep reasoning engine (Engine B).
 * Generates the strategic brief by:
 * 1. Extracting the prospect's company name from the transcript.
 * 2. Searching Tavily for live web intelligence on the company.
 * 3. Passing the transcript + intel to a DeepSeek reasoning model hosted on NVIDIA to build the brief.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { searchTavily } from '@/lib/tavilyClient';
import type { StrategicBrief, ProspectData } from '@/store/meetingStore';

// Groq is PRIMARY (fastest), NVIDIA Nemotron is fallback
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
    const { transcript: rawTranscript, prospectData } = await req.json() as { transcript: string; prospectData?: ProspectData };

    if (!rawTranscript?.trim()) {
      return NextResponse.json({ error: 'transcript is required' }, { status: 400 });
    }

    const transcript = rawTranscript.split(/\\s+/).slice(-3000).join(' ');

    // 1. Extract company name using Groq (fastest)
    let companyName: string | null = null;
    try {
      if (!process.env.GROQ_API_KEY) throw new Error('No GROQ_API_KEY');
      const extractionRes = await generateObject({
        model: groq('llama-3.3-70b-versatile'),
        system: EXTRACTION_SYSTEM_PROMPT,
        prompt: `Transcript:\n${transcript}`,
        schema: z.object({
          companyName: z.string().nullable(),
        }),
        temperature: 0,
      });
      companyName = extractionRes.object.companyName;
      console.log(`[ai/brief] Extracted company: ${companyName || 'None'}`);
    } catch (err) {
      console.warn('[ai/brief] Company extraction failed, continuing without company name:', err);
    }

    // 2. Fetch web intel if we have a company name
    let webIntelContext = 'No external web intelligence available.';
    if (companyName) {
      try {
        const tavilyRes = await searchTavily(`${companyName} company news funding strategy`, 3);
        const snippets = tavilyRes.results.map(r => `- ${r.title}: ${r.content}`).join('\n');
        webIntelContext = `Web Intelligence for ${companyName}:\n${snippets}`;
      } catch (err) {
        console.warn(`[ai/brief] Tavily search failed for ${companyName}:`, err);
        // Fallback: Instruct LLM to rely on transcript context if search API fails
        webIntelContext = `Web Intelligence unavailable due to search failure. Rely heavily on the meeting transcript to deduce ${companyName}'s strategy.`;
      }
    }

    // 3. Generate Strategic Brief — Groq first, NVIDIA Nemotron fallback
    const prospectContext = prospectData ? `Prospect Context: Name: ${prospectData.name || 'Unknown'}, Domain: ${prospectData.domain || 'Unknown'}\n` : '';
    const promptContext = `${prospectContext}Transcript:\n${transcript}\n\n${webIntelContext}`;

    const briefSchema = z.object({
      prospectProfile: z.string().nullable(),
      signalAssessment: z.string().nullable(),
      approach: z.string().nullable(),
      webIntel: z.array(z.string()).nullable(),
      tags: z.array(
        z.object({
          label: z.string(),
          type: z.enum(['buyer', 'risk', 'opportunity', 'neutral']),
        })
      ).nullable(),
    });

    let briefPayload: any = null;

    try {
      if (!process.env.GROQ_API_KEY) throw new Error('No GROQ_API_KEY');
      const briefRes = await generateObject({
        model: groq('llama-3.3-70b-versatile'),
        system: REASONING_SYSTEM_PROMPT,
        prompt: promptContext,
        schema: briefSchema,
        temperature: 0.1,
      });
      briefPayload = briefRes.object;
      console.log('[ai/brief] Groq brief succeeded ✓');
    } catch (groqErr: any) {
      console.warn('[ai/brief] Groq failed, trying NVIDIA Nemotron:', groqErr.message);
      try {
        const briefRes = await generateObject({
          model: nvidia(process.env.NVIDIA_COPILOT_MODEL || 'nvidia/llama-3.1-nemotron-ultra-253b-v1'),
          system: REASONING_SYSTEM_PROMPT,
          prompt: promptContext,
          schema: briefSchema,
          temperature: 0.1,
        });
        briefPayload = briefRes.object;
        console.log('[ai/brief] NVIDIA Nemotron brief succeeded ✓');
      } catch (nvidiaErr: any) {
        console.warn('[ai/brief] NVIDIA failed, trying OpenAI:', nvidiaErr.message);
        try {
          if (!process.env.OPENAI_API_KEY) throw new Error('No OPENAI_API_KEY');
          const briefRes = await generateObject({
            model: fallbackOpenAI('gpt-4o'),
            system: REASONING_SYSTEM_PROMPT,
            prompt: promptContext,
            schema: briefSchema,
            temperature: 0.1,
          });
          briefPayload = briefRes.object;
        } catch (openaiErr: any) {
          console.error('[ai/brief] All providers failed.', openaiErr.message);
          briefPayload = {
            prospectProfile: 'System offline. Cannot process profile.',
            signalAssessment: 'System offline. Cannot process signals.',
            approach: 'Please check your API limits or network connection.',
            webIntel: ['No data retrieved.'],
            tags: [{ label: 'Error', type: 'risk' }]
          };
        }
      }
    }

    return NextResponse.json(briefPayload);
  } catch (err) {
    console.error('[ai/brief] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
