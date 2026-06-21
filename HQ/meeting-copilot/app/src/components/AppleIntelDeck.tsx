'use client';

import React, { useState } from 'react';
import { useMeetingStore } from '../store/meetingStore';
import { Target, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AppleIntelDeck = () => {
  const { setProspectData, setThinking, strategicBrief, setStrategicBrief, isSidebarCollapsed, setSidebarCollapsed } = useMeetingStore();
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [emailSequence, setEmailSequence] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateHooks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !domain) return;
    
    setIsLoading(true);
    setThinking(true);
    setProspectData({ name, domain, emailSequence });

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${baseUrl}/api/ai/precall`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, domain, emailSequence })
      });
      if (res.ok) {
        const data = await res.json();
        // Assuming API returns { brief: StrategicBrief } or similar
        if (data.brief) {
          setStrategicBrief(data.brief);
        }
      } else {
        console.error('Failed to generate hooks:', res.statusText);
      }
    } catch (err) {
      console.error('Pre-call generation failed', err);
    } finally {
      setIsLoading(false);
      setThinking(false);
    }
  };

  if (isSidebarCollapsed) {
    return (
      <div 
        className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-full w-full items-center py-6 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setSidebarCollapsed(false)}
        title="Expand Setup"
      >
        <Target className="w-6 h-6 text-blue-600 mb-4" />
        <div className="rotate-180 text-xs font-semibold tracking-widest text-slate-400 uppercase" style={{ writingMode: 'vertical-rl' }}>
          Setup Complete
        </div>
        <div className="flex-grow" />
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-full w-full overflow-y-auto overflow-x-hidden">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-slate-900">
          Setup
        </h1>
        {strategicBrief && (
          <button 
            onClick={() => setSidebarCollapsed(true)}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Collapse
          </button>
        )}
      </div>

      <form onSubmit={handleGenerateHooks} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Prospect Name</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jane Doe"
            className="bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Company Domain</label>
          <input 
            type="text" 
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="e.g. acme.com"
            className="bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Prior Emails / Context</label>
          <textarea 
            value={emailSequence}
            onChange={(e) => setEmailSequence(e.target.value)}
            placeholder="Paste the email sequence or LinkedIn messages that hooked them..."
            rows={3}
            className="bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full resize-y"
          />
        </div>

        <button 
          type="submit"
          disabled={isLoading}
          className={`bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 py-2.5 font-medium transition-colors w-full mt-2 whitespace-nowrap ${
            isLoading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Generating Brief...' : 'Deploy Researcher'}
        </button>
      </form>

      {/* Strategic Brief Display */}
      {strategicBrief && strategicBrief.prospectProfile && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex flex-col gap-4"
        >
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200 pb-2 whitespace-nowrap">
            Strategic Brief
          </h2>
          
          <div className="flex flex-col gap-3">
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase">Profile</h3>
              <p className="text-sm text-slate-800 mt-1 leading-relaxed">{strategicBrief.prospectProfile}</p>
            </div>
            
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase">Signal Assessment</h3>
              <p className="text-sm text-slate-800 mt-1 leading-relaxed">{strategicBrief.signalAssessment}</p>
            </div>
            
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase">Approach</h3>
              <p className="text-sm text-slate-800 mt-1 leading-relaxed">{strategicBrief.approach}</p>
            </div>

            {(strategicBrief as any).icebreaker && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <h3 className="text-xs font-bold text-blue-800 uppercase mb-1">Spartan Opener</h3>
                <p className="text-sm font-medium text-blue-900">"{(strategicBrief as any).icebreaker}"</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
