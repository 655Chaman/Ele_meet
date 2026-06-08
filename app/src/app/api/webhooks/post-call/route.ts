/**
 * POST /api/webhooks/post-call
 *
 * Automated exhaust pipe. When a meeting ends, the frontend explicitly fires this
 * endpoint, handing off the final transcript and deep-reasoning strategic brief.
 *
 * This payload is immediately relayed to a workflow automation tool (Make.com, n8n)
 * to draft follow-up emails, update CRM records, and prep intro connections.
 */

import { NextRequest, NextResponse } from 'next/server';

const AUTOMATION_WEBHOOK_URL = process.env.AUTOMATION_WEBHOOK_URL || 'https://hook.us1.make.com/mock-webhook-url';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transcript, strategicBrief, prospectData, meetingId } = body;

    console.log(`[webhooks/post-call] Relaying post-call payload for meeting ${meetingId || 'unknown'}...`);

    // Fire off to the automation tool (e.g. n8n or Make.com)
    // We don't await this because we want to return 200 OK to the frontend instantly.
    // The automation tool will handle the slow work of CRM syncing.
    fetch(AUTOMATION_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'meeting.ended',
        meetingId,
        prospectData,
        strategicBrief,
        fullTranscript: transcript,
      }),
    }).catch(err => {
      console.error('[webhooks/post-call] Failed to relay payload to automation tool:', err);
    });

    return NextResponse.json({ success: true, message: 'Payload dispatched to automation engine.' });
  } catch (err) {
    console.error('[webhooks/post-call] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
