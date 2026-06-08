'use client';

import TranscriptPanel from '@/components/TranscriptPanel';
import OutputPanel from '@/components/OutputPanel';

export default function CopilotView() {
  return (
    <>
      {/* Left: Live Transcript */}
      <div className="panel" id="panel-transcript">
        <div className="panel-header">
          <span className="panel-label cyan">Live Transcript</span>
          <span
            className="panel-label"
            style={{ fontSize: '9px', color: 'var(--text-micro)' }}
          >
            via Vexa
          </span>
        </div>
        <div className="panel-content" id="transcript-scroll">
          <TranscriptPanel />
        </div>
      </div>

      {/* Right: AI Output */}
      <div className="panel" id="panel-output">
        <div className="panel-header">
          <span className="panel-label green">AI Output</span>
          <span
            className="panel-label"
            style={{ fontSize: '9px', color: 'var(--text-micro)' }}
          >
            Engine B · deepseek-chat
          </span>
        </div>
        <div className="panel-content" id="output-scroll">
          <OutputPanel />
        </div>
      </div>
    </>
  );
}
