/**
 * GET /api/bot/status?botId=xxx&platform=yyy&nativeMeetingId=zzz
 *
 * Polls Vexa for the current bot status.
 * The client uses this to detect when the bot is confirmed 'in_call'
 * before opening the WebSocket transcript stream.
 *
 * Statuses: 'waiting' | 'joining' | 'in_call' | 'left' | 'error'
 */

import { NextRequest, NextResponse } from 'next/server';
import { vexaBotStatus, type MeetingPlatform } from '@/lib/vexaClient';

export async function GET(req: NextRequest) {
  try {
    const platform        = req.nextUrl.searchParams.get('platform') as MeetingPlatform | null;
    const nativeMeetingId = req.nextUrl.searchParams.get('nativeMeetingId');

    if (!platform || !nativeMeetingId) {
      return NextResponse.json(
        { error: 'platform and nativeMeetingId are required' },
        { status: 400 },
      );
    }

    const data = await vexaBotStatus(platform, nativeMeetingId);

    return NextResponse.json({
      botId:  data.id,
      status: data.status,
      platform,
      nativeMeetingId,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[bot/status] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
