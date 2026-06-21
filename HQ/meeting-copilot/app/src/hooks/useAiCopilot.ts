/**
 * useAiCopilot.ts
 *
 * Orchestrates the AI engine calls based on the live transcript.
 *
 * - Fast Chat (Copilot): Triggers when a new transcript line arrives, debounced
 *   by a few seconds (simulating "speaker finished a thought"). Only sends the
 *   recent sliding window (e.g., last 15 lines).
 * - Deep Reasoning (Brief): Triggers periodically (e.g. every 2 minutes) or
 *   after significant chunks of new transcript.
 */

'use client';

import { useEffect, useRef } from 'react';
import { useMeetingStore } from '@/store/meetingStore';
import { z } from 'zod';

const COPILOT_DEBOUNCE_MS = 2500; // wait for 2.5s of silence before triggering fast chat
const BRIEF_INTERVAL_MS = 120_000; // 2 minutes
const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

// Helper to extract a Token Mass Window (~800 words) instead of fixed line counts
function getContextWindow(transcript: any[], maxWords = 800) {
  let wordCount = 0;
  const windowLines = [];
  for (let i = transcript.length - 1; i >= 0; i--) {
    const line = transcript[i];
    const words = line.text.trim().split(/\s+/).length;
    if (wordCount + words > maxWords && windowLines.length > 0) break;
    windowLines.unshift(line);
    wordCount += words;
  }
  return windowLines.map(l => `${l.speaker}: ${l.text}`).join('\n');
}

export function useAiCopilot() {
  const store = useMeetingStore();
  const transcriptLength = store.transcript.length;
  
  const copilotTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const briefTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastBriefTranscriptLength = useRef<number>(0);
  const isFetchingCopilot = useRef(false);
  const isFetchingBrief = useRef(false);
  const lastCopilotRequestTime = useRef<number>(0);
  const copilotAbortController = useRef<AbortController | null>(null);

  // Abort on unmount or when isLive goes false
  useEffect(() => {
    if (!store.isLive && copilotAbortController.current) {
      copilotAbortController.current.abort();
    }
  }, [store.isLive]);

  useEffect(() => {
    return () => {
      if (copilotAbortController.current) {
        copilotAbortController.current.abort();
      }
    };
  }, []);

  // --- Fast Chat (Copilot) Trigger ---
  useEffect(() => {
    // Fire if triggerCopilotId changes OR if manualDirective changes
    if (!store.triggerCopilotId && !store.manualDirective) return;
    if (IS_DEMO) return;

    const fireCopilot = async () => {
      if (copilotAbortController.current) {
        copilotAbortController.current.abort();
      }
      copilotAbortController.current = new AbortController();
      const currentSignal = copilotAbortController.current.signal;

      isFetchingCopilot.current = true;
      store.setStreaming(true);
      
      // Clear the previous 'say' output so the typewriter effect is clean
      store.setAiOutput({ say: '', openWith: null, betweenUs: null });

      const transcriptText = getContextWindow(store.transcript, 800);
      
      let currentPhase = store.currentPhase;

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${baseUrl}/api/ai/copilot`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            transcript: transcriptText, 
            prospectData: store.prospectData, 
            currentPhase: currentPhase,
            longTermContext: store.strategicBrief,
            manualDirective: store.manualDirective // Pass the directive
          }),
          signal: currentSignal
        });

        if (res.ok && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let streamedText = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            streamedText += chunk;
            
            // Update the UI progressively
            store.setAiOutput({ say: streamedText });
          }
          
          // Clear manual directive once fulfilled
          if (store.manualDirective) {
            store.setManualDirective(null);
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('[useAiCopilot] Copilot stream failed:', err);
        }
      } finally {
        if (copilotAbortController.current?.signal === currentSignal) {
          isFetchingCopilot.current = false;
          store.setStreaming(false);
        }
      }
    };

    fireCopilot();

  }, [store.triggerCopilotId, store.manualDirective]);

  // --- Deep Reasoning (Brief) Trigger ---
  useEffect(() => {
    if (!store.isLive || IS_DEMO) {
      if (briefTimer.current) clearInterval(briefTimer.current);
      lastBriefTranscriptLength.current = 0;
      return;
    }

    const fetchBrief = async () => {
      // Only fetch if transcript has grown by at least 5 lines since last brief
      if (isFetchingBrief.current || store.transcript.length < lastBriefTranscriptLength.current + 5) return;

      const transcriptText = store.transcript.map(l => `${l.speaker}: ${l.text}`).join('\n');
      
      isFetchingBrief.current = true;
      store.setThinking(true);

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${baseUrl}/api/ai/brief`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: transcriptText, prospectData: store.prospectData }),
        });

        if (res.ok) {
          const data = await res.json();
          store.setStrategicBrief(data);
          lastBriefTranscriptLength.current = store.transcript.length;
        }
      } catch (err) {
        console.error('[useAiCopilot] Brief fetch failed:', err);
      } finally {
        isFetchingBrief.current = false;
        store.setThinking(false);
      }
    };

    // Trigger periodically
    briefTimer.current = setInterval(fetchBrief, BRIEF_INTERVAL_MS);

    return () => {
      if (briefTimer.current) clearInterval(briefTimer.current);
    };
  }, [store.isLive, store.transcript]);
}
