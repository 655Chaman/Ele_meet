/**
 * POST /api/webhooks/booking
 *
 * Automated intake pipe. When a prospect books a meeting (e.g. via Calendly),
 * this webhook fires to synthesize their providerCapabilities.
 *
 * Payload:
 * {
 *   "prospectName": "Katherine",
 *   "companyUrl": "https://example.com",
 *   "domain": "Environmental Remediation",
 *   "objective": "Explore partnership"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchTavily } from '@/lib/tavilyClient';
import { deepReasoningJson } from '@/lib/deepseekClient';
import type { ProspectData } from '@/store/meetingStore';

const INGESTION_SYSTEM_PROMPT = `You are an elite B2B strategic advisor preparing a brief for a new prospect.
You have the prospect's basic booking details and raw web intelligence about their company.
Synthesize a concise, sharp 'providerCapabilities' summary detailing what their company does, their scale, and their market position.
Output exactly this JSON format:
{ "providerCapabilities": "A sharp 2-3 sentence summary of their capabilities and scale." }`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prospectName, companyUrl, domain, objective } = body;

    if (!prospectName || (!companyUrl && !domain)) {
      return NextResponse.json({ error: 'Missing required prospect fields' }, { status: 400 });
    }

    console.log(`[webhooks/booking] Ingesting prospect: ${prospectName}`);

    // 1. Scrape context via Tavily
    const query = `${prospectName} ${companyUrl || ''} ${domain || ''} company overview capabilities services`;
    let webIntelContext = 'No external web intelligence found.';
    try {
      const tavilyRes = await searchTavily(query, 3);
      const snippets = tavilyRes.results.map(r => `- ${r.title}: ${r.content}`).join('\n');
      webIntelContext = `Web Intelligence:\n${snippets}`;
    } catch (err) {
      console.warn(`[webhooks/booking] Tavily search failed:`, err);
    }

    // 2. Synthesize provider capabilities via Deepseek
    const promptContext = `Prospect Name: ${prospectName}\nDomain: ${domain}\nObjective: ${objective}\n\n${webIntelContext}`;
    const synthesis = await deepReasoningJson<{ providerCapabilities: string }>(
      INGESTION_SYSTEM_PROMPT,
      promptContext
    );

    // 3. Construct the full ProspectData
    const prospectData: ProspectData = {
      name: prospectName,
      objective: objective || 'Explore options',
      domain: domain || 'General',
    };

    console.log(`[webhooks/booking] Intake complete for ${prospectName}. Capabilities generated.`);

    // In a full production system, you would upsert this prospectData into your DB here.
    // e.g. await db.prospects.create({ data: prospectData })

    return NextResponse.json({ success: true, prospectData });
  } catch (err) {
    console.error('[webhooks/booking] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
