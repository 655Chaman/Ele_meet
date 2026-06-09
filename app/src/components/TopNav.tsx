'use client';

import { type ViewMode } from '@/app/page';
import { motion } from 'framer-motion';
import { Zap, BrainCircuit, Activity } from 'lucide-react';

interface TopNavProps {
  viewMode: ViewMode;
  onTabChange: (tab: ViewMode) => void;
  isLive:    boolean;
  isJoining: boolean;
}

export default function TopNav({ viewMode, onTabChange, isLive, isJoining }: TopNavProps) {
  return (
    <nav className="top-nav" role="navigation" aria-label="Main navigation">
      {/* Logo */}
      <div className="nav-logo">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 border border-white/20 shadow-lg mr-2">
           <Zap className="text-white" size={16} />
        </div>
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50 tracking-[0.15em]">Ele Meet</span>
      </div>

      {/* View Toggle */}
      <div className="nav-tabs" role="tablist" aria-label="View mode">
        <button
          id="tab-copilot"
          role="tab"
          aria-selected={viewMode === 'copilot'}
          className={`nav-tab relative z-10 flex items-center gap-2 ${viewMode === 'copilot' ? 'text-white' : 'text-white/40'}`}
          onClick={() => onTabChange('copilot')}
        >
          {viewMode === 'copilot' && (
            <motion.div
              layoutId="navTabIndicator"
              className="absolute inset-0 bg-white/5 rounded-md border border-white/10 z-[-1]"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <Zap size={14} className={viewMode === 'copilot' ? 'text-white' : ''} />
          Copilot
        </button>
        <button
          id="tab-thinking"
          role="tab"
          aria-selected={viewMode === 'thinking'}
          className={`nav-tab relative z-10 flex items-center gap-2 ${viewMode === 'thinking' ? 'text-white' : 'text-white/40'}`}
          onClick={() => onTabChange('thinking')}
        >
          {viewMode === 'thinking' && (
            <motion.div
              layoutId="navTabIndicator"
              className="absolute inset-0 bg-white/5 rounded-md border border-white/10 z-[-1]"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <BrainCircuit size={14} className={viewMode === 'thinking' ? 'text-white' : ''} />
          Thinking
        </button>
      </div>

      {/* Status */}
      <div className="nav-right">
        <div
          className={`status-badge ${isLive ? 'live' : isJoining ? 'joining' : ''}`}
          aria-label={isLive ? 'Live — call active' : isJoining ? 'Connecting…' : 'Standby'}
          title={isLive ? 'Connected to live call' : isJoining ? 'Bots joining the call…' : 'No active call'}
        >
          {isLive ? <Activity size={12} className="text-[var(--accent-green)] animate-pulse" /> : <span className="status-dot" aria-hidden="true" />}
          <span>{isLive ? 'Live' : isJoining ? 'Connecting…' : 'Standby'}</span>
        </div>
      </div>
    </nav>
  );
}
