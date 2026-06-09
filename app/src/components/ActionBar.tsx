'use client';

import { useState, useCallback } from 'react';
import { useMeetingStore } from '@/store/meetingStore';
import { motion } from 'framer-motion';
import { ArrowRight, Compass, ShieldAlert, PauseCircle, Square } from 'lucide-react';

type TacticalAction = 'transition' | 'discovery' | 'takeover' | 'slowdown';

const ACTIONS: { id: TacticalAction; label: string; icon: React.ReactNode; cls: string; tooltip: string }[] = [
  {
    id: 'transition',
    label: 'Transition',
    icon: <ArrowRight size={18} />,
    cls: 'transition-btn',
    tooltip: 'Move the conversation forward',
  },
  {
    id: 'discovery',
    label: 'Discovery',
    icon: <Compass size={18} />,
    cls: 'discovery-btn',
    tooltip: 'Surface 2 deep discovery questions',
  },
  {
    id: 'takeover',
    label: 'Take it away',
    icon: <ShieldAlert size={18} />,
    cls: 'takeover-btn',
    tooltip: 'Hand off gracefully to the prospect',
  },
  {
    id: 'slowdown',
    label: 'Slow down',
    icon: <PauseCircle size={18} />,
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
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="floating-dock-wrapper"
    >
      <footer
        className="action-bar-dock"
        role="toolbar"
        aria-label="Meeting controls and tactical actions"
      >
        {/* Phase Selector */}
        <div className="phase-selector-dock" role="group" aria-label="Tactical Phase">
          {(['cold', 'discovery', 'pitch', 'objection'] as const).map((phase) => (
            <button
              key={phase}
              className={`phase-btn-dock ${currentPhase === phase ? 'active' : ''}`}
              onClick={() => setCallPhase(phase)}
              aria-pressed={currentPhase === phase}
            >
              {phase.charAt(0).toUpperCase() + phase.slice(1)}
            </button>
          ))}
        </div>

        <div className="dock-divider"></div>

        {/* Tactical Override Buttons */}
        <div className="action-buttons-dock" role="group" aria-label="Tactical overrides">
          {ACTIONS.map((action) => (
            <motion.button
              whileHover={{ scale: 1.1, y: -4 }}
              whileTap={{ scale: 0.95 }}
              key={action.id}
              id={`btn-${action.id}`}
              className={`action-btn-dock ${action.cls} ${firingId === action.id ? 'firing' : ''}`}
              onClick={() => handleAction(action.id)}
              disabled={!isLive}
              title={action.tooltip}
              aria-label={action.tooltip}
            >
              <span className="btn-icon" aria-hidden="true">{action.icon}</span>
              <span className="sr-only">{action.label}</span>
            </motion.button>
          ))}
        </div>

        <div className="dock-divider"></div>

        {/* Stop Button */}
        <div className="join-controls-dock" role="group" aria-label="Meeting controls">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            id="btn-stop-meeting"
            className="join-btn-dock stop-btn-dock"
            onClick={onStop}
            aria-label="Stop meeting and disconnect bots"
          >
            <Square size={16} fill="currentColor" className="mr-2" />
            End Session
          </motion.button>
        </div>
      </footer>
    </motion.div>
  );
}
