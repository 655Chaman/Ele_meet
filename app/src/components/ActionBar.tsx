'use client';

import { useState, useCallback } from 'react';
import { useMeetingStore } from '@/store/meetingStore';

type TacticalAction = 'transition' | 'discovery' | 'takeover' | 'slowdown';

const ACTIONS: { id: TacticalAction; label: string; icon: string; cls: string; tooltip: string }[] = [
  {
    id: 'transition',
    label: 'Transition',
    icon: '→',
    cls: 'transition-btn',
    tooltip: 'Move the conversation forward',
  },
  {
    id: 'discovery',
    label: 'Discovery',
    icon: '◎',
    cls: 'discovery-btn',
    tooltip: 'Surface 2 deep discovery questions',
  },
  {
    id: 'takeover',
    label: 'Take it away',
    icon: '✦',
    cls: 'takeover-btn',
    tooltip: 'Hand off gracefully to the prospect',
  },
  {
    id: 'slowdown',
    label: 'Slow down',
    icon: '◌',
    cls: 'slowdown-btn',
    tooltip: 'Re-anchor and pace down',
  },
];

interface ActionBarProps {
  isLive:             boolean;
  isJoining:          boolean;
  meetingUrl:         string;
  onMeetingUrlChange: (url: string) => void;
  onStart:            () => void;
  onStop:             () => void;
}

export default function ActionBar({
  isLive,
  isJoining,
  meetingUrl,
  onMeetingUrlChange,
  onStart,
  onStop,
}: ActionBarProps) {
  const { fireOverride, currentPhase, setCallPhase } = useMeetingStore();
  const [firingId, setFiringId] = useState<TacticalAction | null>(null);

  const handleAction = useCallback(
    async (action: TacticalAction) => {
      setFiringId(action);
      await fireOverride(action);
      setTimeout(() => setFiringId(null), 600);
    },
    [fireOverride]
  );

  if (!isLive) return null;

  return (
    <footer
      className="action-bar"
      role="toolbar"
      aria-label="Meeting controls and tactical actions"
    >
      {/* Phase Selector */}
      <div className="phase-selector" role="group" aria-label="Tactical Phase">
        {(['cold', 'discovery', 'pitch', 'objection'] as const).map((phase) => (
          <button
            key={phase}
            className={`phase-btn ${currentPhase === phase ? 'active' : ''}`}
            onClick={() => setCallPhase(phase)}
            aria-pressed={currentPhase === phase}
          >
            {phase.charAt(0).toUpperCase() + phase.slice(1)}
          </button>
        ))}
      </div>

      {/* Tactical Override Buttons */}
      <div className="action-buttons" role="group" aria-label="Tactical overrides">
        {ACTIONS.map((action) => (
          <button
            key={action.id}
            id={`btn-${action.id}`}
            className={`action-btn ${action.cls} ${firingId === action.id ? 'firing' : ''}`}
            onClick={() => handleAction(action.id)}
            disabled={!isLive}
            data-tooltip={action.tooltip}
            aria-label={action.tooltip}
          >
            <span className="btn-icon" aria-hidden="true">{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>

      {/* Meeting URL + Join / Stop */}
      <div className="join-controls" role="group" aria-label="Meeting controls">
        <button
          id="btn-stop-meeting"
          className="join-btn stop-btn"
          onClick={onStop}
          aria-label="Stop meeting and disconnect bots"
        >
          ◼ End Session
        </button>
      </div>
    </footer>
  );
}
