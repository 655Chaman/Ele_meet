'use client';

import { useMeetingStore } from '@/store/meetingStore';

export default function ThinkingView() {
  const { isLive, strategicBrief, isThinking } = useMeetingStore();

  return (
    <div className="panel" id="panel-thinking" style={{ gridColumn: '1 / -1' }}>
      <div className="panel-header">
        <span className="panel-label amber">Strategic Brief</span>
        <span className="panel-label" style={{ fontSize: '9px', color: 'var(--text-micro)' }}>
          Engine A · deepseek-reasoner + Tavily
        </span>
      </div>
      <div className="panel-content" id="thinking-scroll">
        {!isLive && !strategicBrief ? (
          <div className="idle-state">
            <div className="idle-icon" aria-hidden="true">🔍</div>
            <p className="idle-label">Thinking engine is quiet</p>
            <p className="idle-sub">
              Once a call starts, Engine A will silently research the prospect and synthesize a strategic brief here.
            </p>
          </div>
        ) : (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            role="region"
            aria-label="Strategic brief"
          >
            {/* Prospect Profile */}
            <div className="thinking-section" id="section-profile">
              <div className="thinking-section-header">
                <span style={{ fontSize: '10px', color: 'var(--accent-amber)' }}>◈</span>
                <span className="thinking-section-title">Prospect Profile</span>
                {isThinking && (
                  <span style={{ fontSize: '9px', color: 'var(--accent-amber)', marginLeft: 'auto', opacity: 0.7 }}>
                    Researching…
                  </span>
                )}
              </div>
              <div className="thinking-section-body">
                {strategicBrief?.prospectProfile ? (
                  <p>{strategicBrief.prospectProfile}</p>
                ) : (
                  <>
                    <div className="shimmer-line" style={{ width: '70%' }} />
                    <div className="shimmer-line" style={{ width: '90%' }} />
                    <div className="shimmer-line" style={{ width: '55%' }} />
                  </>
                )}
              </div>
            </div>

            {/* Strategic Tags */}
            {strategicBrief?.tags && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '0 2px' }}>
                {strategicBrief.tags.map((tag) => (
                  <span key={tag.label} className={`strategic-tag ${tag.type}`}>
                    {tag.label}
                  </span>
                ))}
              </div>
            )}

            {/* Buying Signal Assessment */}
            <div className="thinking-section" id="section-signal">
              <div className="thinking-section-header">
                <span style={{ fontSize: '10px', color: 'var(--accent-cyan)' }}>◈</span>
                <span className="thinking-section-title">Signal Assessment</span>
              </div>
              <div className="thinking-section-body">
                {strategicBrief?.signalAssessment ? (
                  <p>{strategicBrief.signalAssessment}</p>
                ) : (
                  <>
                    <div className="shimmer-line" style={{ width: '85%' }} />
                    <div className="shimmer-line" style={{ width: '65%' }} />
                  </>
                )}
              </div>
            </div>

            {/* Recommended Approach */}
            <div className="thinking-section" id="section-approach">
              <div className="thinking-section-header">
                <span style={{ fontSize: '10px', color: 'var(--accent-green)' }}>◈</span>
                <span className="thinking-section-title">Recommended Approach</span>
              </div>
              <div className="thinking-section-body">
                {strategicBrief?.approach ? (
                  <p>{strategicBrief.approach}</p>
                ) : (
                  <>
                    <div className="shimmer-line" style={{ width: '90%' }} />
                    <div className="shimmer-line" style={{ width: '75%' }} />
                    <div className="shimmer-line" style={{ width: '50%' }} />
                  </>
                )}
              </div>
            </div>

            {/* Key Intel from Web */}
            {(strategicBrief?.webIntel || isThinking) && (
              <div className="thinking-section" id="section-intel">
                <div className="thinking-section-header">
                  <span style={{ fontSize: '10px', color: 'var(--accent-purple)' }}>◈</span>
                  <span className="thinking-section-title">Web Intel</span>
                  <span style={{ fontSize: '9px', color: 'var(--text-micro)', marginLeft: 'auto' }}>Tavily</span>
                </div>
                <div className="thinking-section-body">
                  {strategicBrief?.webIntel ? (
                    strategicBrief.webIntel.map((item, i) => (
                      <p key={i} style={{ marginTop: i > 0 ? '6px' : 0 }}>
                        <span style={{ color: 'var(--accent-purple)', marginRight: '6px', fontSize: '10px' }}>→</span>
                        {item}
                      </p>
                    ))
                  ) : (
                    <>
                      <div className="shimmer-line" style={{ width: '88%' }} />
                      <div className="shimmer-line" style={{ width: '72%' }} />
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
