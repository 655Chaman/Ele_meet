import React, { useState } from 'react';
import { useMeetingStore } from '../store/meetingStore';

export function AppleTacticalFeed() {
  const { aiOutput, liveSuggestion } = useMeetingStore();

  if (!aiOutput) {
    return null;
  }

  return (
    <aside className="w-[300px] shrink-0 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-y-auto h-full flex flex-col">
      
      {/* Live Teleprompter Section */}
      <div className="mb-6 pb-6 border-b border-slate-100 flex-grow flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-slate-800 text-sm font-semibold flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            Live Teleprompter
          </h3>
        </div>
        
        <div className="flex-grow flex flex-col justify-center bg-slate-900 rounded-xl p-6 shadow-inner relative overflow-hidden">
          {/* Subtle gradient overlay for teleprompter feel */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/50 pointer-events-none"></div>
          
          {liveSuggestion ? (
            <p className="text-white text-xl leading-relaxed font-medium z-10 tracking-wide drop-shadow-md">
              {liveSuggestion}
            </p>
          ) : (
            <p className="text-slate-500 text-lg leading-relaxed font-medium z-10 tracking-wide italic">
              Listening to prospect...
            </p>
          )}
        </div>
      </div>

      {/* Say */}
      {aiOutput.say && (
        <div className="bg-slate-50 border-y border-r border-slate-200 rounded-xl p-4 mb-3 border-l-4 border-l-emerald-500">
          <span className="text-slate-500 text-xs font-semibold uppercase mb-1.5 block">
            Say
          </span>
          <p className="text-slate-900 font-medium text-sm">
            {aiOutput.say}
          </p>
        </div>
      )}

      {/* Between Us */}
      {aiOutput.betweenUs && (
        <div className="bg-slate-50 border-y border-r border-slate-200 rounded-xl p-4 mb-3 border-l-4 border-l-amber-500">
          <span className="text-slate-500 text-xs font-semibold uppercase mb-1.5 block">
            Between Us
          </span>
          <p className="text-slate-900 font-medium text-sm">
            {aiOutput.betweenUs}
          </p>
        </div>
      )}

      {/* Open With */}
      {aiOutput.openWith && (
        <div className="bg-slate-50 border-y border-r border-slate-200 rounded-xl p-4 mb-3 border-l-4 border-l-purple-500">
          <span className="text-slate-500 text-xs font-semibold uppercase mb-1.5 block">
            Open With
          </span>
          <p className="text-slate-900 font-medium text-sm">
            {aiOutput.openWith}
          </p>
        </div>
      )}
    </aside>
  );
}
