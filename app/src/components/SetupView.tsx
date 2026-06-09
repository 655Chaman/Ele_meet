'use client';

import { useMeetingStore } from '@/store/meetingStore';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Video, Target, Building2, User } from 'lucide-react';
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

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95, filter: 'blur(10px)' },
    visible: { 
      opacity: 1, 
      scale: 1, 
      filter: 'blur(0px)',
      transition: { 
        duration: 0.8, 
        ease: [0.16, 1, 0.3, 1] as const,
        staggerChildren: 0.1,
        delayChildren: 0.2
      } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } }
  };

  return (
    <div className={styles.wrapper}>
      {/* Background glowing orbs */}
      <motion.div 
        className={`${styles.glowOrb} ${styles.orb1}`}
        animate={{ 
          scale: [1, 1.2, 1], 
          x: [0, 50, 0], 
          y: [0, 30, 0] 
        }}
        transition={{ duration: 15, repeat: Infinity, repeatType: 'reverse' }}
      />
      <motion.div 
        className={`${styles.glowOrb} ${styles.orb2}`}
        animate={{ 
          scale: [1, 1.1, 1], 
          x: [0, -40, 0], 
          y: [0, -40, 0] 
        }}
        transition={{ duration: 18, repeat: Infinity, repeatType: 'reverse' }}
      />
      
      <motion.div 
        className={styles.glassCard}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className={styles.header} variants={itemVariants}>
          <div className={styles.logoBadge}>
            <Sparkles className="text-white" size={32} />
          </div>
          <h2>Initialize Session</h2>
          <p>Provide context to activate the tactical AI copilot.</p>
        </motion.div>
        
        <div className={styles.form}>
          <motion.div variants={itemVariants} className={`${styles.inputGroup} ${focusedField === 'name' ? styles.focused : ''}`}>
            <label htmlFor="setup-name"><User size={14} className={styles.labelIcon}/> Prospect Name <span className={styles.optional}>(Optional)</span></label>
            <div className={styles.inputWrapper}>
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
          </motion.div>

          <motion.div variants={itemVariants} className={`${styles.inputGroup} ${focusedField === 'domain' ? styles.focused : ''}`}>
            <label htmlFor="setup-domain"><Building2 size={14} className={styles.labelIcon}/> Domain / Industry <span className={styles.optional}>(Optional)</span></label>
            <div className={styles.inputWrapper}>
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
          </motion.div>

          <motion.div variants={itemVariants} className={`${styles.inputGroup} ${focusedField === 'objective' ? styles.focused : ''}`}>
            <label htmlFor="setup-objective"><Target size={14} className={styles.labelIcon}/> My Objective <span className={styles.optional}>(What are you selling?)</span></label>
            <div className={styles.inputWrapper}>
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
          </motion.div>

          <motion.div variants={itemVariants} className={`${styles.inputGroup} ${focusedField === 'url' ? styles.focused : ''}`}>
            <label htmlFor="setup-url"><Video size={14} className={styles.labelIcon}/> Meeting URL</label>
            <div className={styles.inputWrapper}>
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
          </motion.div>

          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={styles.joinBtn}
            onClick={startMeeting}
            disabled={!meetingUrl.trim() || isJoining}
          >
            <AnimatePresence mode="wait">
              {isJoining ? (
                <motion.span 
                  key="joining"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={styles.btnContent}
                >
                  <span className={styles.spinner}></span>
                  Connecting...
                </motion.span>
              ) : (
                <motion.span 
                  key="deploy"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={styles.btnContent}
                >
                  Deploy Copilot
                  <ArrowRight size={18} className={styles.arrow} />
                </motion.span>
              )}
            </AnimatePresence>
            <div className={styles.btnGlow}></div>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

