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
        className="flex flex-col items-center justify-center h-full w-full p-8"
      >
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white/5 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)] mb-4" aria-hidden="true">
          <Mic size={32} className="text-white/40" />
        </div>
        <p className="text-lg font-medium text-white/80" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}>No active call</p>
        <p className="text-sm text-white/40 max-w-xs text-center mt-2 leading-relaxed" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" }}>
          Paste a meeting URL below and hit Join to begin live transcription via Vexa.
        </p>
      </motion.div>
    );
  }

  return (
    <div 
      className="flex flex-col gap-2 p-6 overflow-y-auto h-full scroll-smooth scrollbar-hide" 
      aria-live="polite" 
      aria-label="Live transcript"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}
    >
      <AnimatePresence initial={false}>
        {transcript.map((line, i) => {
          const isYou = line.speaker === 'You';
          return (
            <motion.div
              key={line.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex w-full mb-1 ${isYou ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex flex-col max-w-[75%] ${isYou ? 'items-end' : 'items-start'}`}>
                {!isYou && (
                  <span className="text-[11px] font-medium text-white/40 ml-2 mb-1 tracking-wide">
                    {line.speaker}
                  </span>
                )}
                <div 
                  className={`px-4 py-2.5 rounded-2xl shadow-sm text-[15px] leading-relaxed tracking-tight ${
                    isYou 
                      ? 'bg-[#007AFF] text-white rounded-br-[4px]' 
                      : 'bg-[#2A2A2C] text-[#EBEBF5] rounded-bl-[4px] border border-white/5'
                  }`}
                >
                  {line.text}
                  {i === transcript.length - 1 && isLive && (
                    <motion.span 
                      animate={{ opacity: [1, 0.2] }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
                      className="inline-block w-1.5 h-3.5 bg-current ml-1 align-middle rounded-sm" 
                      aria-hidden="true" 
                    />
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      <div ref={bottomRef} className="h-20 flex-shrink-0" />
    </div>
  );
}
