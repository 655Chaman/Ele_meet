/**
 * vexaClient.ts
 * Typed HTTP client for the self-hosted Vexa REST API.
 *
 * Vexa API reference: https://docs.vexa.ai/api/bots
 *
 * Base URL from env: VEXA_BASE_URL (default http://localhost:8765)
 * Auth:              X-API-Key header
 *
 * Key endpoints:
 *   POST   /bots                               — send a bot into a meeting
 *   GET    /bots/status?platform=&native_meeting_id=  — poll status
 *   DELETE /bots/{platform}/{native_meeting_id}       — remove bot
 *
 * WebSocket for live transcript (self-hosted Vexa):
 *   ws://<VEXA_BASE>/ws/transcript/<meeting_id>?token=<VEXA_API_KEY>
 */

const VEXA_BASE = process.env.VEXA_BASE_URL ?? 'http://localhost:8765';
const VEXA_KEY  = process.env.VEXA_API_KEY  ?? '';

function vexaHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-API-Key': VEXA_KEY,
  };
}

// ─── Types ──────────────────────────────────────────────────────────────────

export type MeetingPlatform = 'google_meet' | 'zoom' | 'teams';

export interface VexaBotRequest {
  native_meeting_id: string; // e.g. "abc-defg-hij" for Google Meet
  platform:          MeetingPlatform;
  bot_name?:         string;
  language?:         string;
  record?:           boolean;
  metadata?:         Record<string, string>;
}

export interface VexaBotResponse {
  id:                    string; // internal meeting ID
  platform:              MeetingPlatform;
  native_meeting_id:     string;
  constructed_meeting_url: string;
  status:                'waiting' | 'joining' | 'in_call' | 'left' | 'error';
  bot_container_id?:     string;
  start_time?:           string;
  end_time?:             string;
  created_at:            string;
  updated_at:            string;
}

export interface VexaTranscriptSegment {
  speaker:      string;
  text:         string;
  timestamp_ms: number;
  is_final:     boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extract the native meeting ID from a full URL.
 * Google Meet: https://meet.google.com/abc-defg-hij  → abc-defg-hij
 * Zoom:        https://zoom.us/j/1234567890          → 1234567890
 * Teams:       https://teams.microsoft.com/l/...      → passcode from query
 */
export function extractNativeMeetingId(url: string): string {
  try {
    const u = new URL(url);
    if (url.includes('meet.google.com')) {
      const pathSegs = u.pathname.split('/').filter(Boolean);
      
      // Reject lookup links explicitly
      if (pathSegs[0] === 'lookup') {
        throw new Error('Lookup links are not supported. Please use the direct meet.google.com/abc-defg-hij URL.');
      }
      
      const potentialId = pathSegs.pop() ?? '';
      
      // Google Meet IDs must be 3-4-3 letters (e.g. abc-defg-hij)
      const meetRegex = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/i;
      
      // Sometimes IDs might omit dashes (abcdefghij)
      const noDashRegex = /^[a-z]{10}$/i;
      
      if (meetRegex.test(potentialId)) {
        return potentialId;
      } else if (noDashRegex.test(potentialId)) {
        // Normalize to dashed format
        return `${potentialId.slice(0, 3)}-${potentialId.slice(3, 7)}-${potentialId.slice(7, 10)}`;
      } else {
        throw new Error(`Invalid Google Meet ID format in URL. Extracted: "${potentialId}"`);
      }
    }
    if (url.includes('zoom.us')) {
      // /j/<id>
      const parts = u.pathname.split('/').filter(Boolean);
      const jIdx = parts.indexOf('j');
      return jIdx !== -1 ? parts[jIdx + 1] : url;
    }
    if (url.includes('teams.microsoft.com') || url.includes('teams.live.com')) {
      // Extract meeting ID from the Teams URL — use the full URL as fallback
      return u.searchParams.get('meetingId') ?? url;
    }
  } catch (err: any) {
    // If it's our explicit error, throw it. Otherwise pass through.
    if (err.message.includes('Invalid') || err.message.includes('Lookup links')) {
      throw err;
    }
  }
  return url;
}

// ─── Bot lifecycle ───────────────────────────────────────────────────────────

/** Send a Vexa bot into a meeting. Returns the meeting record. */
export async function vexaJoinMeeting(
  meetingUrl: string,
  platform:   MeetingPlatform,
  botName?:   string,
): Promise<VexaBotResponse> {
  const nativeId = extractNativeMeetingId(meetingUrl);

  const payload: VexaBotRequest = {
    native_meeting_id: nativeId,
    platform,
    bot_name:          botName ?? 'Ele Meet',
    language:          'en',
    record:            false, // ScreenApp handles recording
  };

  // Prevent phantom bots: Hard timeout on the deployment request
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const res = await fetch(`${VEXA_BASE}/bots`, {
      method:  'POST',
      headers: vexaHeaders(),
      body:    JSON.stringify(payload),
      signal:  controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Vexa join failed (${res.status}): ${text}`);
    }

    return res.json() as Promise<VexaBotResponse>;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Vexa Cloud API timed out after 10 seconds. Deployment aborted to prevent a phantom bot.');
    }
    throw err;
  }
}

/** Poll bot status by platform + native meeting ID. */
export async function vexaBotStatus(
  platform:        MeetingPlatform,
  nativeMeetingId: string,
): Promise<VexaBotResponse> {
  const params = new URLSearchParams({ platform, native_meeting_id: nativeMeetingId });
  const res = await fetch(`${VEXA_BASE}/bots/status?${params}`, {
    headers: vexaHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Vexa status check failed (${res.status})`);
  }

  return res.json() as Promise<VexaBotResponse>;
}

/** Remove the bot from the meeting. */
export async function vexaLeaveMeeting(
  platform:        MeetingPlatform,
  nativeMeetingId: string,
): Promise<void> {
  const res = await fetch(
    `${VEXA_BASE}/bots/${encodeURIComponent(platform)}/${encodeURIComponent(nativeMeetingId)}`,
    { method: 'DELETE', headers: vexaHeaders() },
  );

  if (!res.ok && res.status !== 404) {
    throw new Error(`Vexa leave failed (${res.status})`);
  }
}

/**
 * Build the WebSocket URL for live transcript streaming.
 * The VEXA_BASE_URL is a server env var; expose this via the join response
 * so the browser never needs to know the Vexa host directly.
 */
export function vexaWebSocketUrl(nativeMeetingId: string): string {
  const wsBase = VEXA_BASE.replace(/^http/, 'ws');
  return `${wsBase}/ws/transcript/${encodeURIComponent(nativeMeetingId)}?token=${VEXA_KEY}`;
}

// ─── Platform detection ──────────────────────────────────────────────────────

export function detectPlatform(url: string): MeetingPlatform {
  if (url.includes('meet.google.com'))    return 'google_meet';
  if (url.includes('zoom.us'))            return 'zoom';
  if (url.includes('teams.microsoft.com') || url.includes('teams.live.com')) return 'teams';
  return 'google_meet';
}
