'use client';

import { useState, useCallback } from 'react';
import TopNav from '@/components/TopNav';
import CopilotView from '@/components/CopilotView';
import ThinkingView from '@/components/ThinkingView';
import SetupView from '@/components/SetupView';
import ActionBar from '@/components/ActionBar';
import { useMeetingStore } from '@/store/meetingStore';
import { useVexaTranscript } from '@/hooks/useVexaTranscript';
import { useAiCopilot } from '@/hooks/useAiCopilot';

export type ViewMode = 'copilot' | 'thinking';

export default function Home() {
  // Mount the Vexa lifecycle hook — it self-registers with the store
  useVexaTranscript();
  // Mount the AI orchestrator hook
  useAiCopilot();

  const [viewMode, setViewMode] = useState<ViewMode>('copilot');
  const {
    isLive,
    isJoining,
    meetingUrl,
    setMeetingUrl,
    startMeeting,
    stopMeeting,
    error,
  } = useMeetingStore();

  const handleTabChange = useCallback((tab: ViewMode) => {
    setViewMode(tab);
  }, []);

  return (
    <div className="app-shell">
      <TopNav
        viewMode={viewMode}
        onTabChange={handleTabChange}
        isLive={isLive}
        isJoining={isJoining}
      />

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          style={{
            position: 'absolute',
            top: '44px',
            left: 0,
            right: 0,
            zIndex: 20,
            background: 'var(--accent-red-dim)',
            borderBottom: '1px solid var(--accent-red)',
            padding: '6px 16px',
            fontSize: '11px',
            color: 'var(--accent-red)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span aria-hidden="true">✕</span>
          {error}
        </div>
      )}

      <main className={`main-area ${viewMode === 'thinking' ? 'thinking-mode' : ''}`}>
        {!isLive && !isJoining ? (
          <SetupView />
        ) : viewMode === 'copilot' ? (
          <CopilotView />
        ) : (
          <ThinkingView />
        )}
      </main>

      <ActionBar
        isLive={isLive}
        isJoining={isJoining}
        meetingUrl={meetingUrl}
        onMeetingUrlChange={setMeetingUrl}
        onStart={startMeeting}
        onStop={stopMeeting}
      />
    </div>
  );
}
