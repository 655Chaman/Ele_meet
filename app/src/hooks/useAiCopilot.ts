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
import { jsonrepair } from 'jsonrepair';
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

  // --- Fast Chat (Copilot) Trigger ---
  useEffect(() => {
    if (!store.isLive || transcriptLength === 0 || IS_DEMO) return;

    const lastLine = store.transcript[transcriptLength - 1];
    if (!lastLine) return;

    const isFiller = (text: string) => /^(yeah|right|mhm|ok|okay|uh huh|ah|yes)$/i.test(text.trim());

    // Ignore filler words from resetting the active listening timer
    if (isFiller(lastLine.text) && copilotTimer.current) {
      return; 
    }

    if (copilotTimer.current) {
      clearTimeout(copilotTimer.current);
    }

    const fireCopilot = async () => {
      if (isFetchingCopilot.current) return;
      isFetchingCopilot.current = true;
      store.setStreaming(true);

      const transcriptText = getContextWindow(store.transcript, 800);

      try {
        const res = await fetch('/api/ai/copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            transcript: transcriptText, 
            prospectData: store.prospectData, 
            currentPhase: store.currentPhase,
            longTermContext: store.strategicBrief 
          }),
        });

        if (res.ok) {
          const textData = await res.text();
          let data: any = {};
          
          try {
            // Repair any hallucinated/missing brackets
            const repaired = jsonrepair(textData);
            data = JSON.parse(repaired);
          } catch (repairErr) {
            console.warn('[useAiCopilot] jsonrepair failed to salvage the output:', repairErr);
          }

          // Force strict validation with fallback values
          // This mathematically guarantees OutputPanel never crashes due to undefined properties
          const aiOutputSchema = z.object({
            openWith: z.string().nullable().catch(null),
            betweenUs: z.string().nullable().catch(null),
            say: z.string().nullable().catch(null),
          });

          const safeData = aiOutputSchema.parse(data);
          store.setAiOutput(safeData);
        }
      } catch (err) {
        console.error('[useAiCopilot] Copilot fetch failed:', err);
      } finally {
        isFetchingCopilot.current = false;
        store.setStreaming(false);
      }
    };

    // 1. Turn Handoff (Them -> You)
    if (lastLine.speaker === 'You' && !isFiller(lastLine.text)) {
      fireCopilot();
      return;
    }

    // 2. Monologue check
    let monologueWords = 0;
    for (let i = transcriptLength - 1; i >= 0; i--) {
      const line = store.transcript[i];
      if (line.speaker === 'Them') {
        monologueWords += line.text.trim().split(/\s+/).length;
      } else if (!isFiller(line.text)) {
        break;
      }
    }

    // If prospect is speaking, wait for a pause
    let delay = 2500; // Default normal pause
    if (monologueWords > 50) {
      delay = 1500; // Shorter pause if they've been talking a lot (Monologue Threshold)
    }

    copilotTimer.current = setTimeout(fireCopilot, delay);

    return () => {
      if (copilotTimer.current) clearTimeout(copilotTimer.current);
    };
  }, [transcriptLength, store.isLive, store.transcript]); // Deps omitted explicit setter references to avoid constant recreation issues since they are stable

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
        const res = await fetch('/api/ai/brief', {
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
