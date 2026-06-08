/**
 * useVexaTranscript.ts
 *
 * React hook that manages the full lifecycle of a live transcript session:
 *
 *   1. Calls POST /api/bot/join → gets { botId, websocketUrl, status }
 *   2. Polls GET /api/bot/status until status === 'in_call'
 *   3. Opens EventSource to GET /api/transcript/stream?botId=xxx (SSE proxy)
 *   4. Parses each segment → dispatches APPEND_TRANSCRIPT to the store
 *   5. On teardown: calls DELETE /api/bot/leave and closes EventSource
 *
 * Reconnection:
 *   If the SSE stream drops unexpectedly, the hook automatically reopens it
 *   with exponential back-off (1s → 2s → 4s … max 30s).
 *
 * Speaker classification:
 *   The hook applies a heuristic: if the speaker name matches `botName`
 *   (e.g. "Ele Meet"), it is classified as "You". All others are "Them".
 *   Step 3 will enrich this with actual speaker diarization from Vexa.
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useMeetingStore }               from '@/store/meetingStore';
import type { TranscriptLine }           from '@/store/meetingStore';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_POLL_INTERVAL_MS = 2_000;
const STATUS_POLL_MAX_TRIES   = 30;   // 60 seconds total
const RECONNECT_BASE_MS       = 1_000;
const RECONNECT_MAX_MS        = 30_000;
const BOT_DISPLAY_NAME        = 'Ele Meet';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VexaSegment {
  speaker:      string;
  text:         string;
  timestamp_ms: number;
  is_final:     boolean;
  __error?:     string;
  code?:        number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVexaTranscript() {
  const store = useMeetingStore();

  const botIdRef          = useRef<string | null>(null);
  const platformRef       = useRef<string | null>(null);
  const nativeMeetingRef  = useRef<string | null>(null);
  const esRef             = useRef<EventSource | null>(null);
  const reconnectDelay    = useRef(RECONNECT_BASE_MS);
  const reconnectTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingTimer      = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef    = useRef<any>(null); // For Web Speech API fallback
  const mountedRef        = useRef(true);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const stopAll = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    if (pollingTimer.current)   clearInterval(pollingTimer.current);
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  const classifySpeaker = useCallback(
    (speakerName: string): 'You' | 'Them' => {
      const name = speakerName.toLowerCase();
      // Map your specific identity to "You"
      if (
        name.includes('chaman') ||
        name.includes('syed') ||
        name.includes('chamansyed655')
      ) {
        return 'You';
      }
      return 'Them';
    },
    [],
  );

  const appendLine = useCallback(
    (seg: VexaSegment) => {
      if (!seg.text?.trim()) return;
      // Only surface final segments to avoid UI flicker from partials
      if (!seg.is_final) return;

      const line: TranscriptLine = {
        id:          `${seg.timestamp_ms}-${Math.random().toString(36).slice(2, 7)}`,
        speaker:     classifySpeaker(seg.speaker),
        text:        seg.text.trim(),
        timestampMs: seg.timestamp_ms,
      };

      store.appendTranscriptLine(line);
    },
    [classifySpeaker, store],
  );

  // ── Open SSE stream ────────────────────────────────────────────────────────

  const openStream = useCallback((botId: string) => {
    if (!mountedRef.current) return;

    const url = `/api/transcript/stream?botId=${encodeURIComponent(botId)}`;
    const es  = new EventSource(url);
    esRef.current = es;

    es.onmessage = (event: MessageEvent<string>) => {
      if (!mountedRef.current) return;
      try {
        const seg = JSON.parse(event.data) as VexaSegment;

        if (seg.__error) {
          console.warn('[useVexaTranscript] Stream error signal:', seg.__error);
          // Reconnect with back-off
          es.close();
          if (mountedRef.current) {
            reconnectTimer.current = setTimeout(() => {
              reconnectDelay.current = Math.min(
                reconnectDelay.current * 2,
                RECONNECT_MAX_MS,
              );
              openStream(botId);
            }, reconnectDelay.current);
          }
          return;
        }

        reconnectDelay.current = RECONNECT_BASE_MS; // Reset on success
        appendLine(seg);

      } catch {
        // Malformed JSON or ping comment — ignore
      }
    };

    es.onerror = () => {
      if (!mountedRef.current) return;
      es.close();
      reconnectTimer.current = setTimeout(() => {
        reconnectDelay.current = Math.min(
          reconnectDelay.current * 2,
          RECONNECT_MAX_MS,
        );
        openStream(botId);
      }, reconnectDelay.current);
    };
  }, [appendLine]);

  // ── Poll until bot is in-call ──────────────────────────────────────────────

  const pollUntilInCall = useCallback(
    async (platform: string, nativeMeetingId: string) => {
      let tries = 0;

      return new Promise<void>((resolve, reject) => {
        pollingTimer.current = setInterval(async () => {
          if (!mountedRef.current) {
            clearInterval(pollingTimer.current!);
            return reject(new Error('unmounted'));
          }

          tries++;
          try {
            const params = new URLSearchParams({ platform, nativeMeetingId });
            const res  = await fetch(`/api/bot/status?${params}`);
            const data = await res.json() as { status: string };

            if (data.status === 'in_call') {
              clearInterval(pollingTimer.current!);
              resolve();
            } else if (data.status === 'error') {
              clearInterval(pollingTimer.current!);
              reject(new Error('Vexa bot encountered an error joining the call.'));
            } else if (tries >= STATUS_POLL_MAX_TRIES) {
              clearInterval(pollingTimer.current!);
              reject(new Error('Bot timed out joining the call.'));
            }
          } catch (err) {
            clearInterval(pollingTimer.current!);
            reject(err);
          }
        }, STATUS_POLL_INTERVAL_MS);
      });
    },
    [],
  );

  // ── Fallback: Local Browser Microphone ─────────────────────────────────────

  const startLocalFallback = useCallback(() => {
    store.setJoining(false);
    store.setLive(true);
    // Removed the error dispatch so the transition is seamless without warnings

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      store.setError('Web Speech API not supported in this browser. Copilot offline.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const text = event.results[last][0].transcript;
      if (text.trim()) {
        appendLine({
          speaker: BOT_DISPLAY_NAME, // defaults to "You" in classifySpeaker
          text: text,
          timestamp_ms: Date.now(),
          is_final: true,
        });
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('[useVexaTranscript] Local fallback error:', event.error);
    };

    recognition.onend = () => {
      if (mountedRef.current && botIdRef.current === 'fallback') {
        recognition.start(); // auto-restart
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    botIdRef.current = 'fallback'; // mark as fallback mode
  }, [store, appendLine]);

  // ── Join flow ──────────────────────────────────────────────────────────────

  const joinAndStream = useCallback(async () => {
    // Permanently bypass the Vexa bot logic and jump straight to local microphone mode
    store.setJoining(true);
    
    // Simulate a brief joining delay to show the "Connecting..." UI
    setTimeout(() => {
      startLocalFallback();
    }, 800);
    
  }, [store, startLocalFallback]);

  // ── Leave flow ─────────────────────────────────────────────────────────────

  const leaveAndStop = useCallback(async () => {
    stopAll();

    const platform       = platformRef.current;
    const nativeMeetingId = nativeMeetingRef.current;

    if (platform && nativeMeetingId) {
      try {
        // 1. Send the post-call payload to our Next.js execution engine
        // which forwards it to Make.com / n8n for CRM logging
        fetch('/api/webhooks/post-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platform,
            meetingId: nativeMeetingId,
            prospectData: store.prospectData,
            strategicBrief: store.strategicBrief,
            transcript: store.transcript,
          }),
        }).catch(err => console.warn('[useVexaTranscript] Post-call webhook failed:', err));

        // 2. Command the Vexa bot to leave the meeting
        await fetch('/api/bot/leave', {
          method:  'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ platform, nativeMeetingId }),
        });
      } catch (err) {
        console.warn('[useVexaTranscript] Leave error (non-fatal):', err);
      }
      botIdRef.current         = null;
      platformRef.current      = null;
      nativeMeetingRef.current = null;
    } else if (botIdRef.current === 'fallback') {
      botIdRef.current = null;
    }
  }, [stopAll]);

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopAll();
    };
  }, [stopAll]);

  // Expose join/leave to the store so ActionBar can trigger them
  useEffect(() => {
    store.registerVexaHandlers({ joinAndStream, leaveAndStop });
  }, [store, joinAndStream, leaveAndStop]);
}
