'use client';

import { useState, useCallback } from 'react';
import { useMeetingStore } from '@/store/meetingStore';

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
      className={`copy-btn ${copied ? 'copied' : ''}`}
      onClick={handleCopy}
      aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
      title={copied ? 'Copied!' : 'Copy'}
    >
      {copied ? '✓ copied' : 'copy'}
    </button>
  );
}

function ShimmerBlock() {
  return (
    <div style={{ padding: '10px 12px' }}>
      <div className="shimmer-line" style={{ width: '80%' }} />
      <div className="shimmer-line" style={{ width: '95%' }} />
      <div className="shimmer-line" style={{ width: '60%' }} />
    </div>
  );
}

export default function OutputPanel() {
  const { isLive, aiOutput, isStreaming } = useMeetingStore();

  if (!isLive && !aiOutput.openWith && !aiOutput.betweenUs && !aiOutput.say) {
    return (
      <div className="idle-state">
        <div className="idle-icon" aria-hidden="true">✦</div>
        <p className="idle-label">AI awaiting signal</p>
        <p className="idle-sub">
          Responses will appear here once a call begins. Use the action buttons to trigger instant overrides.
        </p>
      </div>
    );
  }

  return (
    <div className="output-stack" role="region" aria-label="AI generated output">

      {/* OPEN WITH */}
      {(aiOutput.openWith || (isLive && isStreaming && !aiOutput.openWith)) && (
        <div className="output-card open-with" id="card-open-with">
          <div className="output-card-header">
            <span className="output-card-type open-with">Open With</span>
            {aiOutput.openWith && <CopyButton text={aiOutput.openWith} id="open-with" />}
          </div>
          {aiOutput.openWith ? (
            <p className="output-card-body">{aiOutput.openWith}</p>
          ) : (
            <ShimmerBlock />
          )}
        </div>
      )}

      {/* BETWEEN US */}
      {(aiOutput.betweenUs || (isLive && isStreaming)) && (
        <div className="output-card between-us" id="card-between-us">
          <div className="output-card-header">
            <span className="output-card-type between-us">Between Us</span>
            {aiOutput.betweenUs && <CopyButton text={aiOutput.betweenUs} id="between-us" />}
          </div>
          {aiOutput.betweenUs ? (
            <p className="output-card-body">{aiOutput.betweenUs}</p>
          ) : (
            <ShimmerBlock />
          )}
        </div>
      )}

      {/* SAY */}
      {(aiOutput.say || isLive) && (
        <div className="output-card say" id="card-say">
          <div className="output-card-header">
            <span className="output-card-type say">Say</span>
            {aiOutput.say && <CopyButton text={aiOutput.say} id="say" />}
          </div>
          {aiOutput.say ? (
            <p className={`output-card-body ${isStreaming ? 'streaming-cursor' : ''}`}>
              {aiOutput.say}
            </p>
          ) : (
            <ShimmerBlock />
          )}
        </div>
      )}
    </div>
  );
}
