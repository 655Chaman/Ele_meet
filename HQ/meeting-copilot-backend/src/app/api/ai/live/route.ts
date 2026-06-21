import { NextRequest } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { SPARTAN_DOCTRINE } from '../doctrine';
import * as lancedb from 'vectordb';
import { pipeline } from '@xenova/transformers';

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || 'dummy_key_to_prevent_init_error',
});

// Cache the embedding model
let extractorInstance: any = null;
async function getExtractor() {
  if (!extractorInstance) {
    extractorInstance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return extractorInstance;
}

// Retrieve relevant context from LanceDB
async function getRelevantContext(query: string) {
  try {
    const extractor = await getExtractor();
    const output = await extractor(query, { pooling: 'mean', normalize: true });
    const queryVector = Array.from(output.data);

    const db = await lancedb.connect('/Users/syedchamansha/HQ/meeting-copilot-backend/lancedb_data');
    const table = await db.openTable('doctrine');
    
    const results = await table.search(queryVector).limit(2).execute();
    return results.map(r => r.text).join('\n\n');
  } catch (err) {
    console.error('LanceDB Retrieval Error:', err);
    return ''; // Fail gracefully and proceed without RAG
  }
}

async function getLiveSystemPrompt(prospectData: any, ragContext: string, currentPhase: string, strategicBrief: any): string {
  const baseContext = prospectData?.domain
    ? `You are speaking with ${prospectData.name || 'a prospect'} from the ${prospectData.domain} space.`
    : `You don't have deep context on the prospect's industry yet.`;

  const webIntel = strategicBrief?.prospectProfile 
    ? `TAVILY DOMAIN INTELLIGENCE:\nProfile: ${strategicBrief.prospectProfile}\nSignals: ${strategicBrief.signalAssessment}\nStrategy: ${strategicBrief.approach}`
    : 'No web intel available yet.';

  const phaseDirective = currentPhase === 'discovery'
    ? `PHASE: DISCOVERY (EXTRACTION)
Your sole objective right now is to extract pain points and map their supply chain gaps. 
DO NOT pitch. DO NOT offer solutions yet.
Based on what the prospect just said and the Tavily domain intelligence, generate ONE surgical, open-ended question or provocative statement to dig deeper into their bottlenecks.`
    : `PHASE: CLOSING (THE STRIKE)
You have enough information. Your objective is now to close the gap and secure the monthly retainer.
Stop asking open-ended discovery questions.
Based on their admitted pain points and the LanceDB business context, generate exactly ONE definitive, authoritative statement. Use transition hooks or price anchoring to move them to the close.`;

  return `${SPARTAN_DOCTRINE}

You are a tactical sales teleprompter for a Market-Maker/Connector. 
The user's goal is to close the prospect on a monthly retainer for priority access to filtered deal flow.

Your job is to listen to what the prospect just said and generate exactly ONE verbatim phrase for the user to say out loud next.
It must be casual, human-like, and highly strategic.
Do NOT use JSON or any formatting tags. Just output the raw conversational text.

${phaseDirective}

BUSINESS CONTEXT (LanceDB RAG):
${ragContext}

PROSPECT CONTEXT:
${baseContext}

${webIntel}`;
}

export async function POST(req: NextRequest) {
  try {
    const { recentTranscript, prospectData, currentPhase = 'discovery', strategicBrief } = await req.json();

    if (!recentTranscript) {
      return new Response('recentTranscript is required', { status: 400 });
    }

    // Ultrafast Retrieval
    const ragContext = await getRelevantContext(recentTranscript);

    // Using Groq for Sub-500ms TTFT
    const copilotModel = process.env.GROQ_COPILOT_MODEL || 'llama-3.1-70b-versatile';

    const result = await streamText({
      model: groq(copilotModel),
      system: await getLiveSystemPrompt(prospectData, ragContext, currentPhase, strategicBrief),
      prompt: `Prospect just said:\n"${recentTranscript}"\n\nGenerate ONE concise, casual, high-impact sentence the user should say next based on the current phase. Keep it under 30 words. No formatting.`,
      temperature: 0.5,
      maxTokens: 60,
    });

    return result.toTextStreamResponse();

  } catch (err) {
    console.error('[ai/live] Error:', err);
    return new Response(err instanceof Error ? err.message : 'Unknown error', { status: 500 });
  }
}
