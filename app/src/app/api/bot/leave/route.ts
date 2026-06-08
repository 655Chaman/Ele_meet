/**
 * DELETE /api/bot/leave
 *
 * Removes both bots from the meeting gracefully.
 * Called by the UI when the user clicks "Stop".
 */

import { NextRequest, NextResponse } from 'next/server';
import { vexaLeaveMeeting, type MeetingPlatform } from '@/lib/vexaClient';

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json() as {
      botId?:           string;
      platform?:        MeetingPlatform;
      nativeMeetingId?: string;
    };

    const { platform, nativeMeetingId } = body;

    if (!platform || !nativeMeetingId) {
      return NextResponse.json(
        { error: 'platform and nativeMeetingId are required' },
        { status: 400 },
      );
    }

    await vexaLeaveMeeting(platform, nativeMeetingId);

    console.log(`[bot/leave] Vexa bot removed from meeting ${platform}/${nativeMeetingId}`);

    // ScreenApp bot completes on its own when the meeting ends.
    // No explicit stop API — it detects meeting termination automatically.

    return NextResponse.json({ success: true, platform, nativeMeetingId });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[bot/leave] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
