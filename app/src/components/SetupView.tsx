'use client';

import { useMeetingStore } from '@/store/meetingStore';
import { useState } from 'react';
import styles from './SetupView.module.css';

export default function SetupView() {
  const { 
    meetingUrl, 
    setMeetingUrl, 
    prospectData, 
    setProspectData, 
    startMeeting,
    isJoining 
  } = useMeetingStore();

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleJoinKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && meetingUrl.trim() && !isJoining) {
      startMeeting();
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Background glowing orbs */}
      <div className={`${styles.glowOrb} ${styles.orb1}`}></div>
      <div className={`${styles.glowOrb} ${styles.orb2}`}></div>
      
      <div className={styles.glassCard}>
        <div className={styles.header}>
          <div className={styles.logoBadge}>
            <img src="/logo.png" alt="Ele Meet Logo" className={styles.logoIcon} style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
          </div>
          <h2>Initialize Session</h2>
          <p>Provide context to activate the tactical AI copilot.</p>
        </div>
        
        <div className={styles.form}>
          <div className={`${styles.inputGroup} ${focusedField === 'name' ? styles.focused : ''}`}>
            <label htmlFor="setup-name">Prospect Name <span className={styles.optional}>(Optional)</span></label>
            <input
              id="setup-name"
              className={styles.input}
              type="text"
              placeholder="e.g. Sarah Connor"
              value={prospectData?.name || ''}
              onChange={(e) => setProspectData({ ...prospectData, name: e.target.value, domain: prospectData?.domain || '' })}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              disabled={isJoining}
              autoComplete="off"
              spellCheck={false}
            />
            <div className={styles.inputBorderGlow}></div>
          </div>

          <div className={`${styles.inputGroup} ${focusedField === 'domain' ? styles.focused : ''}`}>
            <label htmlFor="setup-domain">Domain / Industry <span className={styles.optional}>(Optional)</span></label>
            <input
              id="setup-domain"
              className={styles.input}
              type="text"
              placeholder="e.g. Healthcare Compliance"
              value={prospectData?.domain || ''}
              onChange={(e) => setProspectData({ ...prospectData, name: prospectData?.name || '', domain: e.target.value })}
              onFocus={() => setFocusedField('domain')}
              onBlur={() => setFocusedField(null)}
              disabled={isJoining}
              autoComplete="off"
              spellCheck={false}
            />
            <div className={styles.inputBorderGlow}></div>
          </div>

          <div className={`${styles.inputGroup} ${focusedField === 'objective' ? styles.focused : ''}`}>
            <label htmlFor="setup-objective">My Objective <span className={styles.optional}>(What are you selling?)</span></label>
            <input
              id="setup-objective"
              className={styles.input}
              type="text"
              placeholder="e.g. Selling a $50k AI integration"
              value={prospectData?.objective || ''}
              onChange={(e) => setProspectData({ name: prospectData?.name || '', domain: prospectData?.domain || '', objective: e.target.value })}
              onFocus={() => setFocusedField('objective')}
              onBlur={() => setFocusedField(null)}
              disabled={isJoining}
              autoComplete="off"
              spellCheck={false}
            />
            <div className={styles.inputBorderGlow}></div>
          </div>

          <div className={`${styles.inputGroup} ${focusedField === 'url' ? styles.focused : ''}`}>
            <label htmlFor="setup-url">Meeting URL</label>
            <input
              id="setup-url"
              className={`${styles.input} ${styles.mono}`}
              type="url"
              placeholder="zoom.us/j/… or meet.google.com/…"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              onKeyDown={handleJoinKeyDown}
              onFocus={() => setFocusedField('url')}
              onBlur={() => setFocusedField(null)}
              disabled={isJoining}
              autoComplete="off"
              spellCheck={false}
            />
            <div className={styles.inputBorderGlow}></div>
          </div>

          <button
            className={styles.joinBtn}
            onClick={startMeeting}
            disabled={!meetingUrl.trim() || isJoining}
          >
            {isJoining ? (
              <span className={styles.btnContent}>
                <span className={styles.spinner}></span>
                Connecting...
              </span>
            ) : (
              <span className={styles.btnContent}>
                Deploy Copilot
                <span className={styles.arrow}>→</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
