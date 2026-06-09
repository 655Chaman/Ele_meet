'use client';

import { useState, useCallback } from 'react';
import { useMeetingStore } from '@/store/meetingStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Copy, Sparkles } from 'lucide-react';

function CopyButton({ text, id }: { text: string; id: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable
    }
  }, [text]);

  return (
    <button
      id={`copy-${id}`}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${copied ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'}`}
      onClick={handleCopy}
      aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
      title={copied ? 'Copied!' : 'Copy'}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'copied' : 'copy'}
    </button>
  );
}

function ShimmerBlock() {
  return (
    <div className="p-3">
      <div className="shimmer-line mb-2" style={{ width: '80%' }} />
      <div className="shimmer-line mb-2" style={{ width: '95%' }} />
      <div className="shimmer-line" style={{ width: '60%' }} />
    </div>
  );
}

export default function OutputPanel() {
  const { isLive, aiOutput, isStreaming } = useMeetingStore();

  if (!isLive && !aiOutput.openWith && !aiOutput.betweenUs && !aiOutput.say) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="idle-state"
      >
        <div className="idle-icon flex items-center justify-center w-16 h-16 rounded-full bg-white/5 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)] mb-4" aria-hidden="true">
          <Sparkles size={32} className="text-[var(--accent-purple)] opacity-60" />
        </div>
        <p className="idle-label text-lg font-semibold text-white/80">AI awaiting signal</p>
        <p className="idle-sub text-sm text-white/40 max-w-xs text-center mt-2 leading-relaxed">
          Responses will appear here once a call begins. Use the action buttons to trigger instant overrides.
        </p>
      </motion.div>
    );
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 25 } }
  };

  return (
    <div className="output-stack flex flex-col gap-4" role="region" aria-label="AI generated output">
      <AnimatePresence>
        {/* OPEN WITH */}
        {(aiOutput.openWith || (isLive && isStreaming && !aiOutput.openWith)) && (
          <motion.div variants={cardVariants} initial="hidden" animate="visible" className="output-card open-with border-[var(--accent-purple-dim)] shadow-[0_0_20px_rgba(178,0,255,0.05)] relative overflow-hidden group" id="card-open-with">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-purple-dim)] to-transparent opacity-10 pointer-events-none"></div>
            <div className="output-card-header bg-black/40 border-b border-[var(--accent-purple-dim)]/30 flex justify-between items-center px-4 py-2">
              <span className="output-card-type open-with text-[10px] font-bold tracking-widest uppercase text-[var(--accent-purple)] flex items-center gap-2">
                <Sparkles size={12} /> Open With
              </span>
              {aiOutput.openWith && <CopyButton text={aiOutput.openWith} id="open-with" />}
            </div>
            {aiOutput.openWith ? (
              <p className="output-card-body p-4 text-sm leading-relaxed text-white/80">{aiOutput.openWith}</p>
            ) : (
              <ShimmerBlock />
            )}
          </motion.div>
        )}

        {/* BETWEEN US */}
        {(aiOutput.betweenUs || (isLive && isStreaming)) && (
          <motion.div variants={cardVariants} initial="hidden" animate="visible" className="output-card between-us border-[var(--accent-amber-dim)] shadow-[0_0_20px_rgba(255,184,0,0.05)] relative overflow-hidden group" id="card-between-us">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-amber-dim)] to-transparent opacity-10 pointer-events-none"></div>
            <div className="output-card-header bg-black/40 border-b border-[var(--accent-amber-dim)]/30 flex justify-between items-center px-4 py-2">
              <span className="output-card-type between-us text-[10px] font-bold tracking-widest uppercase text-[var(--accent-amber)]">Between Us</span>
              {aiOutput.betweenUs && <CopyButton text={aiOutput.betweenUs} id="between-us" />}
            </div>
            {aiOutput.betweenUs ? (
              <p className="output-card-body p-4 text-sm leading-relaxed text-[var(--accent-amber)] italic opacity-90">{aiOutput.betweenUs}</p>
            ) : (
              <ShimmerBlock />
            )}
          </motion.div>
        )}

        {/* SAY */}
        {(aiOutput.say || isLive) && (
          <motion.div variants={cardVariants} initial="hidden" animate="visible" className="output-card say border-[var(--accent-green-dim)] shadow-[0_0_20px_rgba(0,255,157,0.05)] relative overflow-hidden group" id="card-say">
             <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-green-dim)] to-transparent opacity-10 pointer-events-none"></div>
            <div className="output-card-header bg-black/40 border-b border-[var(--accent-green-dim)]/30 flex justify-between items-center px-4 py-2">
              <span className="output-card-type say text-[10px] font-bold tracking-widest uppercase text-[var(--accent-green)]">Say</span>
              {aiOutput.say && <CopyButton text={aiOutput.say} id="say" />}
            </div>
            {aiOutput.say ? (
              <p className={`output-card-body p-4 text-base leading-relaxed text-white font-medium ${isStreaming ? 'streaming-cursor' : ''}`}>
                {aiOutput.say}
              </p>
            ) : (
              <ShimmerBlock />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
