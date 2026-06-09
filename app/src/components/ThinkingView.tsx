'use client';

import { useMeetingStore } from '@/store/meetingStore';
import { motion } from 'framer-motion';
import { Search, User, Target, Zap, Globe } from 'lucide-react';

export default function ThinkingView() {
  const { isLive, strategicBrief, isThinking } = useMeetingStore();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="panel bg-black/20 border border-white/5 rounded-2xl overflow-hidden" id="panel-thinking" style={{ gridColumn: '1 / -1' }}>
      <div className="panel-header bg-black/40 border-b border-white/5 px-6 py-3 flex justify-between items-center">
        <span className="panel-label amber text-xs font-bold tracking-widest uppercase text-[var(--accent-amber)] flex items-center gap-2">
          <BrainCircuitIcon /> Strategic Brief
        </span>
        <span className="panel-label text-[9px] text-white/40 tracking-wider">
          Engine A · deepseek-reasoner + Tavily
        </span>
      </div>
      <div className="panel-content p-6" id="thinking-scroll">
        {!isLive && !strategicBrief ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="idle-state flex flex-col items-center justify-center h-full py-12"
          >
            <div className="idle-icon flex items-center justify-center w-16 h-16 rounded-full bg-white/5 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)] mb-4" aria-hidden="true">
              <Search size={32} className="text-[var(--accent-amber)] opacity-60" />
            </div>
            <p className="idle-label text-lg font-semibold text-white/80">Thinking engine is quiet</p>
            <p className="idle-sub text-sm text-white/40 max-w-xs text-center mt-2 leading-relaxed">
              Once a call starts, Engine A will silently research the prospect and synthesize a strategic brief here.
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6"
            role="region"
            aria-label="Strategic brief"
          >
            {/* Prospect Profile */}
            <motion.div variants={itemVariants} className="thinking-section bg-white/5 rounded-xl p-5 border border-white/10 relative overflow-hidden" id="section-profile">
              <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent-amber)]"></div>
              <div className="thinking-section-header flex items-center gap-2 mb-3">
                <User size={14} className="text-[var(--accent-amber)]" />
                <span className="thinking-section-title text-[11px] font-bold tracking-widest uppercase text-white/80">Prospect Profile</span>
                {isThinking && (
                  <span className="text-[9px] text-[var(--accent-amber)] ml-auto opacity-70 animate-pulse">
                    Researching…
                  </span>
                )}
              </div>
              <div className="thinking-section-body text-sm leading-relaxed text-white/70">
                {strategicBrief?.prospectProfile ? (
                  <p>{strategicBrief.prospectProfile}</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="shimmer-line bg-white/10 h-2 rounded-full w-[70%]" />
                    <div className="shimmer-line bg-white/10 h-2 rounded-full w-[90%]" />
                    <div className="shimmer-line bg-white/10 h-2 rounded-full w-[55%]" />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Strategic Tags */}
            {strategicBrief?.tags && (
              <motion.div variants={itemVariants} className="flex flex-wrap gap-2 px-1">
                {strategicBrief.tags.map((tag) => (
                  <span key={tag.label} className={`strategic-tag ${tag.type} px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${(tag.type === 'buyer' || tag.type === 'opportunity') ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)] border-[var(--accent-green)]/30' : tag.type === 'risk' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] border-[var(--accent-cyan)]/30'}`}>
                    {tag.label}
                  </span>
                ))}
              </motion.div>
            )}

            {/* Buying Signal Assessment */}
            <motion.div variants={itemVariants} className="thinking-section bg-white/5 rounded-xl p-5 border border-white/10 relative overflow-hidden" id="section-signal">
              <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent-cyan)]"></div>
              <div className="thinking-section-header flex items-center gap-2 mb-3">
                <Zap size={14} className="text-[var(--accent-cyan)]" />
                <span className="thinking-section-title text-[11px] font-bold tracking-widest uppercase text-white/80">Signal Assessment</span>
              </div>
              <div className="thinking-section-body text-sm leading-relaxed text-white/70">
                {strategicBrief?.signalAssessment ? (
                  <p>{strategicBrief.signalAssessment}</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="shimmer-line bg-white/10 h-2 rounded-full w-[85%]" />
                    <div className="shimmer-line bg-white/10 h-2 rounded-full w-[65%]" />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Recommended Approach */}
            <motion.div variants={itemVariants} className="thinking-section bg-white/5 rounded-xl p-5 border border-white/10 relative overflow-hidden" id="section-approach">
               <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent-green)]"></div>
              <div className="thinking-section-header flex items-center gap-2 mb-3">
                <Target size={14} className="text-[var(--accent-green)]" />
                <span className="thinking-section-title text-[11px] font-bold tracking-widest uppercase text-white/80">Recommended Approach</span>
              </div>
              <div className="thinking-section-body text-sm leading-relaxed text-white/70">
                {strategicBrief?.approach ? (
                  <p>{strategicBrief.approach}</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="shimmer-line bg-white/10 h-2 rounded-full w-[90%]" />
                    <div className="shimmer-line bg-white/10 h-2 rounded-full w-[75%]" />
                    <div className="shimmer-line bg-white/10 h-2 rounded-full w-[50%]" />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Key Intel from Web */}
            {(strategicBrief?.webIntel || isThinking) && (
              <motion.div variants={itemVariants} className="thinking-section bg-white/5 rounded-xl p-5 border border-white/10 relative overflow-hidden" id="section-intel">
                 <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent-purple)]"></div>
                <div className="thinking-section-header flex items-center gap-2 mb-3">
                  <Globe size={14} className="text-[var(--accent-purple)]" />
                  <span className="thinking-section-title text-[11px] font-bold tracking-widest uppercase text-white/80">Web Intel</span>
                  <span className="text-[9px] text-white/40 ml-auto">Tavily</span>
                </div>
                <div className="thinking-section-body text-sm leading-relaxed text-white/70">
                  {strategicBrief?.webIntel ? (
                    strategicBrief.webIntel.map((item, i) => (
                      <p key={i} className="mt-2 flex gap-2">
                        <span className="text-[var(--accent-purple)] text-[10px] pt-1">→</span>
                        <span>{item}</span>
                      </p>
                    ))
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="shimmer-line bg-white/10 h-2 rounded-full w-[88%]" />
                      <div className="shimmer-line bg-white/10 h-2 rounded-full w-[72%]" />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function BrainCircuitIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-brain-circuit">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
      <path d="M15 13h4.5a2 2 0 0 1 1.96 1.6l.5 2.4"/>
      <path d="M20 16.5a1.5 1.5 0 0 0-3 0"/>
      <path d="M15 13h2.5a2 2 0 0 0 1.96-1.6l.5-2.4"/>
      <path d="M20 9.5a1.5 1.5 0 0 0-3 0"/>
      <path d="M9 13H4.5a2 2 0 0 0-1.96 1.6l-.5 2.4"/>
      <path d="M4 16.5a1.5 1.5 0 0 1 3 0"/>
      <path d="M9 13H6.5a2 2 0 0 1-1.96-1.6l-.5-2.4"/>
      <path d="M4 9.5a1.5 1.5 0 0 1 3 0"/>
    </svg>
  );
}
