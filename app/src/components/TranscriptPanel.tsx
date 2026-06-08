'use client';

import { useEffect, useRef } from 'react';
import { useMeetingStore } from '@/store/meetingStore';

export default function TranscriptPanel() {
  const { transcript, isLive } = useMeetingStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new lines
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  if (!isLive && transcript.length === 0) {
    return (
      <div className="idle-state">
        <div className="idle-icon" aria-hidden="true">🎙</div>
        <p className="idle-label">No active call</p>
        <p className="idle-sub">Paste a meeting URL below and hit Join to begin live transcription via Vexa.</p>
      </div>
    );
  }

  return (
    <div className="transcript-container" aria-live="polite" aria-label="Live transcript">
      {transcript.map((line, i) => (
        <div
          key={line.id}
          className="transcript-line"
          style={{ animationDelay: `${Math.min(i * 20, 100)}ms` }}
        >
          <span className={`transcript-speaker ${line.speaker === 'You' ? 'you' : 'them'}`}>
            {line.speaker}
          </span>
          <span className={`transcript-text ${i === transcript.length - 1 ? 'new-line' : ''}`}>
            {line.text}
            {i === transcript.length - 1 && isLive && (
              <span className="transcript-cursor" aria-hidden="true" />
            )}
          </span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
