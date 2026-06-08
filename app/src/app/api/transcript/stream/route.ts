/**
 * GET /api/transcript/stream?botId=xxx
 *
 * Server-Sent Events (SSE) proxy that bridges the browser ↔ Vexa WebSocket.
 *
 * Why proxy instead of direct browser WebSocket?
 *   - Keeps VEXA_BASE_URL and VEXA_API_KEY server-side only
 *   - Handles CORS for the browser transparently
 *   - Allows future server-side pre-processing of transcript lines
 *     (e.g. speaker diarization enrichment, PII redaction)
 *
 * Flow:
 *   Browser  →  GET /api/transcript/stream?botId=xxx  (SSE)
 *              ↓
 *   Next.js server  →  ws://VEXA_BASE/ws/transcript/xxx  (WebSocket)
 *              ↓
 *   Each Vexa WS message  →  forwarded as SSE data event to browser
 *
 * SSE event format:
 *   data: { speaker, text, timestamp_ms, is_final }
 *
 * The client hook (useVexaTranscript) consumes these events.
 */

import { NextRequest } from 'next/server';

const VEXA_BASE = process.env.VEXA_BASE_URL ?? 'http://localhost:8765';
const VEXA_KEY  = process.env.VEXA_API_KEY  ?? '';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const nativeMeetingId = req.nextUrl.searchParams.get('botId') // legacy compat
    ?? req.nextUrl.searchParams.get('nativeMeetingId');

  if (!nativeMeetingId) {
    return new Response('nativeMeetingId is required', { status: 400 });
  }

  // Build Vexa WebSocket URL
  const wsBase    = VEXA_BASE.replace(/^http/, 'ws');
  const vexaWsUrl = `${wsBase}/ws/transcript/${encodeURIComponent(nativeMeetingId)}?token=${VEXA_KEY}`;


  // Set up the SSE stream to the client
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let ws: WebSocket | null = null;
      let closed = false;

      function send(data: unknown) {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          closed = true;
        }
      }

      function sendPing() {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          closed = true;
        }
      }

      function connect() {
        try {
          // Node 18+ global WebSocket (Next.js 14+ runtime)
          ws = new WebSocket(vexaWsUrl);

          ws.onmessage = (event) => {
            try {
              const parsed = JSON.parse(event.data as string);
              // Normalise Vexa segment shape:
              // { speaker, text, timestamp_ms, is_final }
              send({
                speaker:      parsed.speaker      ?? parsed.name ?? 'Speaker',
                text:         parsed.text         ?? parsed.transcript ?? '',
                timestamp_ms: parsed.timestamp_ms ?? parsed.ts ?? Date.now(),
                is_final:     parsed.is_final     ?? parsed.final ?? true,
              });
            } catch {
              // Non-JSON keepalive frames — ignore
            }
          };

          ws.onerror = () => {
            if (!closed) {
              send({ __error: 'vexa_ws_error' });
            }
          };

          ws.onclose = (ev) => {
            if (!closed && ev.code !== 1000) {
              // Unexpected close — signal client to reconnect
              send({ __error: 'vexa_ws_closed', code: ev.code });
            }
          };
        } catch (err) {
          send({ __error: 'ws_connect_failed', message: String(err) });
        }
      }

      // Keep-alive ping every 20 seconds to prevent Vercel/nginx timeout
      const pingInterval = setInterval(sendPing, 20_000);

      // Connect to Vexa
      connect();

      // Handle client disconnect
      req.signal.addEventListener('abort', () => {
        closed = true;
        clearInterval(pingInterval);
        ws?.close(1000, 'client_disconnected');
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
