/**
 * useDeepgram.ts
 *
 * Captures microphone audio and streams to Deepgram via a native WebSocket.
 *
 * WHY NATIVE WEBSOCKET (not the SDK):
 * Deepgram's JS SDK opens WebSockets with custom Authorization headers.
 * Electron's renderer strips custom headers on WebSocket upgrade requests
 * for security reasons, causing auth to fail with an empty error {}.
 *
 * Solution: pass the API key as a WebSocket subprotocol ["token", key]
 * which Electron does NOT strip — this is Deepgram's own recommended
 * approach for browser/Electron environments.
 *
 * HOW SPEAKER SEGREGATION WORKS:
 * diarize: true makes Deepgram analyze voice frequency signatures.
 * Speaker 0 = first distinct voice = You (since it's your mic, you speak first).
 * Speaker 1 = second distinct voice = Them (audible via laptop speakers).
 * No bot. No screen share. No external tooling.
 */

import { useState, useCallback, useRef } from 'react';
import { useMeetingStore } from '@/store/meetingStore';

export function useDeepgram() {
  const { appendTranscriptLine, fireLiveSuggestion, setLive, setInterimTranscript } = useMeetingStore();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<{ speaker: number; text: string }[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const systemStreamRef = useRef<MediaStream | null>(null);
  const gutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gutCooldownRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    try {
      // 1. Fetch API key directly from environment (Tauri static export)
      const key = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
      if (!key) throw new Error('NEXT_PUBLIC_DEEPGRAM_API_KEY is missing in .env.local');

      // 2. Open native WebSocket — pass key as subprotocol
      //    Electron allows subprotocols but strips custom headers on WS upgrade
      const params = new URLSearchParams({
        model: 'nova-2',
        language: 'en-US',
        smart_format: 'true',
        multichannel: 'true',
        punctuate: 'true',
        interim_results: 'true',
        endpointing: '600',
      });

      const ws = new WebSocket(
        `wss://api.deepgram.com/v1/listen?${params.toString()}`,
        ['token', key] // <-- key passed as subprotocol, not Authorization header
      );
      wsRef.current = ws;

      // 3. On connection open, start mic capture
      ws.onopen = async () => {
        console.log('[Deepgram] WebSocket connected ✓');
        setIsRecording(true);
        setLive(true);

        try {
          // 1. Enumerate devices to find BlackHole
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioInputs = devices.filter(d => d.kind === 'audioinput');
          const blackHoleDevice = audioInputs.find(d => d.label.toLowerCase().includes('blackhole'));
          
          if (!blackHoleDevice) {
            console.warn('[Deepgram] BlackHole virtual driver not found. Only physical mic will be captured.');
          } else {
            console.log('[Deepgram] BlackHole detected:', blackHoleDevice.label);
          }

          // 2. Capture Default Microphone
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
            },
          });
          micStreamRef.current = micStream;

          // 3. Capture BlackHole (System Audio / Prospect)
          let systemStream: MediaStream | null = null;
          if (blackHoleDevice) {
            try {
              systemStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                  deviceId: { exact: blackHoleDevice.deviceId },
                  echoCancellation: false, // Don't cancel echo on system audio
                  noiseSuppression: false,
                }
              });
              systemStreamRef.current = systemStream;
            } catch (bhErr) {
              console.error('[Deepgram] Failed to capture BlackHole stream:', bhErr);
            }
          }

          // 4. Merge Streams into Left/Right Channels
          const audioCtx = new AudioContext();
          const merger = audioCtx.createChannelMerger(2);
          const dest = audioCtx.createMediaStreamDestination();
          merger.connect(dest);

          // Route Mic to Left Channel (0)
          const micSource = audioCtx.createMediaStreamSource(micStream);
          micSource.connect(merger, 0, 0);

          // Route BlackHole to Right Channel (1)
          if (systemStream && systemStream.getAudioTracks().length > 0) {
            const systemSource = audioCtx.createMediaStreamSource(systemStream);
            systemSource.connect(merger, 0, 1);
          }

          const mediaRecorder = new MediaRecorder(dest.stream);
          mediaRecorderRef.current = mediaRecorder;

          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
              ws.send(e.data);
            }
          };

          mediaRecorder.start(250); // send chunks every 250ms
          console.log('[Deepgram] Mic recording started ✓');

        } catch (mediaErr: any) {
          console.error('[Deepgram] Mic access failed:', mediaErr.message);
          alert(`Microphone Access Failed: ${mediaErr.message}\nIf you denied permission to Antigravity earlier, macOS will permanently block it. You must go to System Settings > Privacy & Security > Microphone and check the box for your Terminal/Antigravity.`);
          setIsRecording(false);
          ws.close();
        }
      };

      // 4. Handle incoming transcription events
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          const words = data?.channel?.alternatives?.[0]?.words;
          const text = data?.channel?.alternatives?.[0]?.transcript?.trim();

          if (!text || !words || words.length === 0) return;

          const channelIndex: number = data?.channel_index?.[0] ?? (data?.channel as any)?.index ?? 0;
          const speakerName = channelIndex === 0 ? 'You' : 'Them';

          // Handle interim results instantaneously
          if (data.is_final === false) {
            setInterimTranscript(`${speakerName}: ${text}`);
            return;
          }

          // Clear interim and append final result
          setInterimTranscript('');
          
          const transcriptId = `dg-${Date.now()}-${Math.random()}`;

          setTranscript((prev) => [...prev, { speaker: channelIndex, text }]);
          appendTranscriptLine({
            id: transcriptId,
            speaker: speakerName,
            text,
            timestampMs: Date.now(),
          });

          console.log(`[Deepgram] ${speakerName}: ${text}`);

          // --- The Gut (Live Teleprompter Trigger) ---
          if (speakerName === 'Them') {
            if (text.length >= 10) { // Shorter threshold for faster triggers
              const now = Date.now();
              if (now - gutCooldownRef.current >= 400) { // 400ms hair-trigger
                // Gather recent transcript context (last 30s)
                const recentContext = [...transcript, { speaker: channelIndex, text }]
                  .slice(-10) // Take last 10 lines max to prevent huge payloads
                  .map(t => `${t.speaker === 0 ? 'You' : 'Them'}: ${t.text}`)
                  .join('\n');
                
                fireLiveSuggestion(recentContext);
                gutCooldownRef.current = now;
                console.log(`[Teleprompter] Fired suggestion for: ${text}`);
              }
            }
          }
        } catch {
          // Ignore malformed/keepalive messages
        }
      };

      ws.onerror = (err) => {
        console.error('[Deepgram] WebSocket error:', err);
      };

      ws.onclose = (event) => {
        console.log(`[Deepgram] Closed — Code: ${event.code}, Reason: "${event.reason}"`);
        setIsRecording(false);
        setLive(false);
      };

    } catch (err: any) {
      console.error('[Deepgram] Startup failed:', err.message);
      alert(`Deepgram Startup Failed: ${err.message}`);
      setIsRecording(false);
      setLive(false);
    }
  }, [appendTranscriptLine, fireLiveSuggestion, setLive, setInterimTranscript]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (systemStreamRef.current) {
      systemStreamRef.current.getTracks().forEach((t) => t.stop());
      systemStreamRef.current = null;
    }
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) wsRef.current.close();
      wsRef.current = null;
    }
    if (gutTimerRef.current) {
      clearTimeout(gutTimerRef.current);
      gutTimerRef.current = null;
    }
    setIsRecording(false);
    setLive(false);
    console.log('[Deepgram] Stopped ✓');
  }, []);

  return { isRecording, transcript, startRecording, stopRecording };
}
