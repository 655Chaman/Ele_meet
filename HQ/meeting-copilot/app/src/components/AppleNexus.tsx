'use client';

import React, { useEffect, useRef } from 'react';
import { useDeepgram } from '@/hooks/useDeepgram';
import { useMeetingStore } from '@/store/meetingStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Activity } from 'lucide-react';

export function AppleNexus() {
  const { isRecording, startRecording, stopRecording } = useDeepgram();
  const {
    isLive,
    isJoining,
    transcript,
    interimTranscript,
    isThinking,
    liveSuggestion,
    currentPhase,
    setCallPhase,
    startMeeting,
    stopMeeting
  } = useMeetingStore();
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, isThinking]);

  const toggleRecording = () => {
    if (IS_DEMO) {
      if (isLive || isJoining) stopMeeting();
      else startMeeting();
    } else {
      if (isRecording) stopRecording();
      else startRecording();
    }
  };

  const active = IS_DEMO ? (isLive || isJoining) : isRecording;

  return (
    <section className="relative flex flex-col h-full w-full overflow-hidden">
      
      {/* Live Teleprompter Display - Huge & Prominent */}
      <div className="w-full max-w-5xl mx-auto flex flex-col justify-center items-center flex-shrink-0 mt-12 mb-8 min-h-[250px] p-10 bg-slate-900 rounded-[2rem] shadow-2xl relative overflow-hidden ring-1 ring-slate-800">
        <div className="absolute top-6 left-6 flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]"></div>
          <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            {currentPhase === 'discovery' ? 'Extraction Phase' : 'Strike Phase'}
          </span>
        </div>

        {/* Phase Toggle */}
        <div className="absolute top-6 right-6 flex items-center bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setCallPhase('discovery')}
            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wide rounded-md transition-all ${
              currentPhase === 'discovery'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Discovery
          </button>
          <button
            onClick={() => setCallPhase('pitch')}
            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wide rounded-md transition-all ${
              currentPhase === 'pitch' || currentPhase === 'objection'
                ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            The Close
          </button>
        </div>
        
        {liveSuggestion ? (
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white text-3xl md:text-5xl font-semibold leading-tight tracking-tight text-center drop-shadow-lg max-w-4xl"
          >
            {liveSuggestion}
          </motion.p>
        ) : (
          <p className="text-slate-600 text-2xl font-medium tracking-wide italic text-center">
            {active ? "Listening to prospect..." : "Awaiting Intel Stream..."}
          </p>
        )}
      </div>

      {/* Transcript Feed - Smaller & Scrolling below */}
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 overflow-y-auto flex-grow pb-40 px-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)">

        <AnimatePresence initial={false}>
          {transcript.map((line) => {
            const isYou = line.speaker === 'You';
            return (
              <motion.div 
                key={line.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex flex-col max-w-[80%] ${isYou ? 'self-end items-end' : 'self-start items-start'}`}
              >
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1">
                  {line.speaker}
                </span>
                <div 
                  className={`px-5 py-3.5 rounded-2xl text-[17px] leading-relaxed shadow-sm ${
                    isYou 
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-sm'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                  }`}
                >
                  {line.text}
                </div>
              </motion.div>
            );
          })}

          {interimTranscript && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col max-w-[80%] ${interimTranscript.startsWith('You:') ? 'self-end items-end' : 'self-start items-start'}`}
            >
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1">
                {interimTranscript.startsWith('You:') ? 'You' : 'Them'}
              </span>
              <div 
                className={`px-5 py-3.5 rounded-2xl text-[17px] leading-relaxed shadow-sm opacity-60 ${
                  interimTranscript.startsWith('You:') 
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-sm'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                }`}
              >
                {interimTranscript.replace(/^(You:|Them:)\s*/, '')}
                <span className="ml-1 animate-pulse font-bold text-lg">|</span>
              </div>
            </motion.div>
          )}

          {isThinking && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="self-start flex flex-col items-start max-w-[80%]"
            >
              <div className="px-5 py-4 bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm flex gap-2 items-center">
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={transcriptEndRef} className="h-1" />
      </div>

      {/* Floating Control Dock */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleRecording}
          className={`flex items-center gap-3 px-6 py-3.5 rounded-[9999px] shadow-2xl backdrop-blur-xl border transition-all duration-300 ${
            active 
              ? 'bg-slate-900/90 border-slate-800 shadow-red-500/20'
              : 'bg-white/80 border-slate-200 text-slate-800 shadow-slate-200/50'
          }`}
        >
          {active ? (
            <>
              <div className="relative flex items-center justify-center">
                <div className="absolute w-full h-full bg-red-500 rounded-full animate-ping opacity-20"></div>
                <Mic className="w-5 h-5 text-red-500" />
              </div>
              <span className="text-white font-medium tracking-wide">Live Stream Active</span>
              <Activity className="w-4 h-4 text-red-500 ml-2 animate-pulse" />
            </>
          ) : (
            <>
              <MicOff className="w-5 h-5 text-slate-500" />
              <span className="font-medium tracking-wide">Initiate Stream</span>
            </>
          )}
        </motion.button>
      </div>

    </section>
  );
}
