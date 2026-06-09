'use client';

import { useEffect, useRef } from 'react';
import { useMeetingStore } from '@/store/meetingStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic } from 'lucide-react';

export default function TranscriptPanel() {
  const { transcript, isLive } = useMeetingStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new lines
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  if (!isLive && transcript.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="idle-state"
      >
        <div className="idle-icon flex items-center justify-center w-16 h-16 rounded-full bg-white/5 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)] mb-4" aria-hidden="true">
          <Mic size={32} className="text-white/40" />
        </div>
        <p className="idle-label text-lg font-semibold text-white/80">No active call</p>
        <p className="idle-sub text-sm text-white/40 max-w-xs text-center mt-2 leading-relaxed">
          Paste a meeting URL below and hit Join to begin live transcription via Vexa.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="transcript-container flex flex-col gap-3" aria-live="polite" aria-label="Live transcript">
      <AnimatePresence initial={false}>
        {transcript.map((line, i) => (
          <motion.div
            key={line.id}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="transcript-line grid grid-cols-[60px_1fr] gap-4 items-start"
          >
            <span className={`transcript-speaker text-[10px] font-bold tracking-widest uppercase pt-1 ${line.speaker === 'You' ? 'text-[var(--accent-cyan)] drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]' : 'text-[var(--accent-amber)] drop-shadow-[0_0_8px_rgba(255,184,0,0.4)]'}`}>
              {line.speaker}
            </span>
            <span className={`transcript-text text-sm leading-relaxed ${i === transcript.length - 1 ? 'text-white font-normal' : 'text-white/70 font-light'}`}>
              {line.text}
              {i === transcript.length - 1 && isLive && (
                <motion.span 
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  className="transcript-cursor inline-block w-1.5 h-3.5 bg-white ml-1 align-middle rounded-sm" 
                  aria-hidden="true" 
                />
              )}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
}
