/**
 * screenappClient.ts
 * Typed HTTP client for the self-hosted ScreenApp Meeting Bot.
 *
 * ScreenApp Meeting Bot: https://github.com/screenappai/meeting-bot
 *
 * Base URL from env: SCREENAPP_API_URL (default http://localhost:3001)
 *
 * Endpoints:
 *   POST /google/join        — joins Google Meet
 *   POST /microsoft/join     — joins Microsoft Teams
 *   POST /zoom/join          — joins Zoom
 *   GET  /isbusy             — check if bot is already processing a job
 *
 * Webhook payload sent to NOTIFY_WEBHOOK_URL (our /api/archive/webhook):
 * {
 *   recordingId, meetingLink, status, timestamp,
 *   metadata: { userId, teamId, botId, contentType, uploaderType, storage: { ... } },
 *   blobUrl
 * }
 */

import { v4 as uuidv4 } from 'uuid';

const SCREENAPP_BASE = process.env.SCREENAPP_API_URL ?? 'http://localhost:3001';
const APP_URL        = process.env.APP_URL           ?? 'http://localhost:3000';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ScreenAppJoinRequest {
  bearerToken: string;
  url:         string;
  name:        string;
  teamId:      string;
  timezone:    string;
  userId:      string;
  botId:       string;
}

export interface ScreenAppJoinResponse {
  success: boolean;
  message: string;
  data?: {
    userId:  string;
    teamId:  string;
    status:  'processing';
  };
  error?: string;   // "BUSY" when another job is in flight
}

export interface ScreenAppWebhookPayload {
  recordingId:  string;
  meetingLink:  string;
  status:       'completed' | 'failed';
  timestamp:    string;
  metadata: {
    userId:       string;
    teamId:       string;
    botId:        string;
    contentType:  string;
    uploaderType: string;
    storage: {
      provider:       string;
      bucket?:        string;
      key?:           string;
      region?:        string;
      endpoint?:      string;
      url:            string;
    };
  };
  blobUrl: string;
}

// ─── Platform routing ─────────────────────────────────────────────────────────

function resolveJoinPath(url: string): string {
  if (url.includes('meet.google.com'))    return '/google/join';
  if (url.includes('teams.microsoft.com') || url.includes('teams.live.com')) return '/microsoft/join';
  if (url.includes('zoom.us'))            return '/zoom/join';
  return '/google/join'; // default
}

// ─── Client ──────────────────────────────────────────────────────────────────

/** Send the ScreenApp bot to join a meeting. Returns the generated botId. */
export async function screenAppJoin(meetingUrl: string): Promise<string> {
  const botId    = uuidv4();
  const joinPath = resolveJoinPath(meetingUrl);

  const payload: ScreenAppJoinRequest = {
    bearerToken: process.env.SCREENAPP_API_KEY ?? '',
    url:         meetingUrl,
    name:        'Ele Meet Recorder',
    teamId:      'elemeet-team',
    timezone:    'UTC',
    userId:      'elemeet-user',
    botId,
  };

  const res = await fetch(`${SCREENAPP_BASE}${joinPath}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ScreenApp join failed (${res.status}): ${text}`);
  }

  const data = await res.json() as ScreenAppJoinResponse;

  if (!data.success) {
    if (data.error === 'BUSY') {
      throw new Error('ScreenApp bot is already processing another meeting.');
    }
    throw new Error(`ScreenApp join error: ${data.message}`);
  }

  return botId;
}

/** Check whether the ScreenApp bot is currently busy. */
export async function screenAppIsBusy(): Promise<boolean> {
  try {
    const res  = await fetch(`${SCREENAPP_BASE}/isbusy`);
    const data = await res.json() as { busy: boolean };
    return data.busy ?? false;
  } catch {
    return false; // Assume not busy if unreachable
  }
}

/** Returns the webhook URL that ScreenApp should call on recording completion. */
export function screenAppWebhookUrl(): string {
  return `${APP_URL}/api/archive/webhook`;
}
