'use client';

import { useMeetingStore } from '@/store/meetingStore';
import { useAiCopilot } from '@/hooks/useAiCopilot';
import { AppleIntelDeck } from '@/components/AppleIntelDeck';
import { AppleNexus } from '@/components/AppleNexus';
import { AppleTacticalFeed } from '@/components/AppleTacticalFeed';

import { motion } from 'framer-motion';

export default function Home() {
  // Core system hooks
  useAiCopilot();

  const meetingState = useMeetingStore();
  const { error, isSidebarCollapsed } = meetingState;

  return (
    <>
      <motion.main 
        className="h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 p-6 gap-6 grid"
        animate={{
          gridTemplateColumns: isSidebarCollapsed 
            ? '64px 1fr' 
            : '260px 1fr'
        }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} // Springy apple-like ease out
      >
        <AppleIntelDeck meetingState={meetingState} />
        <AppleNexus meetingState={meetingState} />
      </motion.main>

      {/* Error Overlay */}
      {error && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-white px-6 py-3 rounded-[9999px] text-slate-900 text-[14px] shadow-lg border border-[#e0e0e0]">
          {error}
        </div>
      )}
    </>
  );
}
