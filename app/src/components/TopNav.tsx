'use client';

import { type ViewMode } from '@/app/page';

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
        <img src="/logo.png" alt="Ele Meet" className="logo-image" style={{ height: '28px', width: 'auto', objectFit: 'contain' }} />
        <span>Ele Meet</span>
      </div>

      {/* View Toggle */}
      <div className="nav-tabs" role="tablist" aria-label="View mode">
        <button
          id="tab-copilot"
          role="tab"
          aria-selected={viewMode === 'copilot'}
          className={`nav-tab ${viewMode === 'copilot' ? 'active' : ''}`}
          onClick={() => onTabChange('copilot')}
        >
          ⚡ Copilot
        </button>
        <button
          id="tab-thinking"
          role="tab"
          aria-selected={viewMode === 'thinking'}
          className={`nav-tab ${viewMode === 'thinking' ? 'active' : ''}`}
          onClick={() => onTabChange('thinking')}
        >
          🧠 Thinking
        </button>
      </div>

      {/* Status */}
      <div className="nav-right">
        <div
          className={`status-badge ${isLive ? 'live' : isJoining ? 'joining' : ''}`}
          aria-label={isLive ? 'Live — call active' : isJoining ? 'Connecting…' : 'Standby'}
          title={isLive ? 'Connected to live call' : isJoining ? 'Bots joining the call…' : 'No active call'}
        >
          <span className="status-dot" aria-hidden="true" />
          <span>{isLive ? 'Live' : isJoining ? 'Connecting…' : 'Standby'}</span>
        </div>
      </div>
    </nav>
  );
}
