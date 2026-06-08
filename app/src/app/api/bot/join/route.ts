/**
 * POST /api/bot/join
 *
 * Triggers both infrastructure bots to join a meeting:
 *   1. Vexa bot        → real-time WebSocket transcript
 *   2. ScreenApp bot   → silent video recording + S3 upload + webhook
 *
 * Returns to client:
 *   { botId, archiveBotId, websocketUrl, platform, nativeMeetingId }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  vexaJoinMeeting,
  detectPlatform,
  vexaWebSocketUrl,
  extractNativeMeetingId,
} from '@/lib/vexaClient';
import { screenAppJoin } from '@/lib/screenappClient';

export async function POST(req: NextRequest) {
  try {
    const { meetingUrl, botName } = await req.json() as {
      meetingUrl: string;
      botName?:   string;
    };

    if (!meetingUrl?.trim()) {
      return NextResponse.json(
        { error: 'meetingUrl is required' },
        { status: 400 },
      );
    }

    const platform       = detectPlatform(meetingUrl);
    const nativeMeetingId = extractNativeMeetingId(meetingUrl);

    // ── 1. Vexa Bot — live transcript ────────────────────────────────
    const vexaBot = await vexaJoinMeeting(meetingUrl, platform, botName ?? 'Ele Meet');
    const wsUrl   = vexaWebSocketUrl(nativeMeetingId);

    // ── 2. ScreenApp Bot — silent archive ────────────────────────────
    let archiveBotId: string | null = null;
    try {
      archiveBotId = await screenAppJoin(meetingUrl);
    } catch (err) {
      // Archive bot is non-critical — log and continue
      console.warn('[bot/join] ScreenApp bot failed (non-fatal):', err);
    }

    console.log(`[bot/join] Bots joined →`, {
      platform,
      nativeMeetingId,
      vexaBotId: vexaBot.id,
      archiveBotId,
      status:    vexaBot.status,
    });

    return NextResponse.json({
      success:         true,
      botId:           vexaBot.id,
      nativeMeetingId,
      archiveBotId,
      websocketUrl:    wsUrl,
      platform,
      status:          vexaBot.status,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[bot/join] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
