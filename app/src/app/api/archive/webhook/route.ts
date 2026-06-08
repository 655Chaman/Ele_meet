/**
 * POST /api/archive/webhook
 *
 * Receives the recording-complete notification from ScreenApp Meeting Bot.
 *
 * ScreenApp sends this payload when the recording has been uploaded to S3:
 * {
 *   recordingId:  string,
 *   meetingLink:  string,
 *   status:       "completed" | "failed",
 *   timestamp:    string,     // ISO-8601
 *   metadata: {
 *     userId, teamId, botId, contentType, uploaderType,
 *     storage: { provider, bucket?, key?, region?, url }
 *   },
 *   blobUrl:      string      // direct S3 URL
 * }
 *
 * Security: If SCREENAPP_WEBHOOK_SECRET is set, verify the
 * X-Webhook-Signature HMAC-SHA256 header before processing.
 *
 * Post-processing pipeline (ready for Step 3+):
 *   1. Persist recording metadata
 *   2. Trigger post-call AI summary (Engine A)
 *   3. Send push notification to UI via Server-Sent Events
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import type { ScreenAppWebhookPayload } from '@/lib/screenappClient';

const WEBHOOK_SECRET = process.env.SCREENAPP_WEBHOOK_SECRET;

// ─── Signature verification ──────────────────────────────────────────────────

function verifySignature(body: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET) return true; // Secret not configured — skip check
  if (!signature)      return false;

  const expected = createHmac('sha256', WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  try {
    return timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected,  'hex'),
    );
  } catch {
    return false;
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rawBody  = await req.text();
  const signature = req.headers.get('x-webhook-signature');

  // ── Security check ───────────────────────────────────────────────
  if (!verifySignature(rawBody, signature)) {
    console.warn('[archive/webhook] Invalid signature — rejecting payload.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: ScreenAppWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { recordingId, meetingLink, status, timestamp, metadata, blobUrl } = payload;

  console.log(`[archive/webhook] Recording ${status}:`, {
    recordingId,
    meetingLink,
    blobUrl,
    botId:   metadata?.botId,
    storage: metadata?.storage?.provider,
    at:      timestamp,
  });

  if (status === 'completed' && blobUrl) {
    // ── Step 3+: Trigger post-call pipeline ───────────────────────
    // await db.recordings.upsert({
    //   where:  { botId: metadata.botId },
    //   create: { recordingId, meetingLink, blobUrl, completedAt: new Date(timestamp) },
    //   update: { blobUrl, completedAt: new Date(timestamp) },
    // });

    // ── Kick off Engine A post-call summary ───────────────────────
    // await fetch(`${process.env.APP_URL}/api/ai/summary`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ botId: metadata.botId, blobUrl }),
    // });

    // ── Push notification to open UI sessions (SSE broadcast) ─────
    // archiveBroadcast.emit('recording_ready', { recordingId, blobUrl });

    console.log(`[archive/webhook] ✓ Recording ready at: ${blobUrl}`);
  } else if (status === 'failed') {
    console.error(`[archive/webhook] ✗ Recording failed for bot ${metadata?.botId}`);
  }

  // Always return 200 quickly — ScreenApp retries on non-2xx
  return NextResponse.json({ received: true, recordingId });
}
