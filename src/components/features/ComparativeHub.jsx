import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Satellite, User, Activity, BarChart3, RefreshCw } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import SectionHeader from '../ui/SectionHeader';
import { callGemini } from '../../services/api';
import toast from 'react-hot-toast';

const GLOBAL_HUBS = [
  { id: 'ec', name: 'Election Commission', type: 'Electoral Process', feature: 'Free & Fair Elections', icon: <Satellite /> },
  { id: 'voter', name: 'Voter Registration', type: 'Civic Duty', feature: 'Universal Adult Franchise', icon: <User /> },
  { id: 'polling', name: 'Polling Booth', type: 'Voting', feature: 'Secret Ballot', icon: <Activity /> },
  { id: 'results', name: 'Counting & Results', type: 'Transparency', feature: 'VVPAT Verification', icon: <BarChart3 /> },
];

const ComparativeHub = () => {
  const [selected, setSelected] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const explore = async (hub) => {
    setSelected(hub);
    setLoading(true);
    setAnalysis(null);
    try {
      const prompt = `Compare the electoral system of ${hub.name} (specifically focusing on ${hub.feature}) against global democratic standards. Keep it to 3 highly technical, concise paragraphs analyzing its pros and cons.`;
      const res = await callGemini(prompt, "You are ELECTION-HERE, a comparative political science intelligence node.");
      setAnalysis(res);
    } catch (e) { toast.error("Global electoral relay failed."); } finally { setLoading(false); }
  };

  return (
    <section className="min-h-screen pt-12 md:pt-20 pb-32 md:pb-60 px-4 md:px-8 max-w-6xl mx-auto">
      <SectionHeader title="Global Comparative Hub" icon={Globe} />
      <div className="flex gap-6 overflow-x-auto no-scrollbar mb-14 pb-6">
        {GLOBAL_HUBS.map(hub => (
          <button 
            key={hub.id} 
            onClick={() => explore(hub)} 
            aria-label={`Explore ${hub.name}`}
            className={`flex-shrink-0 px-6 py-4 md:px-10 md:py-6 rounded-[1.8rem] md:rounded-[2.2rem] font-black text-sm md:text-base border transition-all flex items-center gap-3 md:gap-4 ${selected?.id === hub.id ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_30px_rgba(0,242,255,0.4)]' : 'bg-[#0A0A1A]/80 text-gray-400 border-white/10 shadow-sm hover:border-white/30'}`}
          >
            <span className="text-2xl text-cyan-400">{hub.icon}</span> <span className="font-mono tracking-widest">{hub.name}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {selected && (
          <motion.div key={selected.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}>
            <GlassCard className="border-t-[6px] border-t-purple-500 p-8 md:p-14 relative overflow-hidden">
              <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />
              <div className="flex items-center gap-4 mb-5 relative z-10">
                <div className="px-4 py-1.5 bg-purple-500/20 border border-purple-500/40 rounded-full text-[10px] font-black text-purple-300 uppercase tracking-[0.3em] font-mono">Node Connection Secure</div>
              </div>
              <h3 className="text-3xl md:text-5xl font-black mb-3 tracking-widest text-white font-mono relative z-10">{selected.name}</h3>
              <p className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.4em] mb-12 relative z-10 font-mono">Focus: {selected.type}</p>
              {loading ? <div className="py-24 flex justify-center relative z-10"><RefreshCw className="animate-spin text-purple-400" size={48} /></div> : (
                <div className="prose prose-invert prose-sm max-w-none text-base md:text-lg font-medium leading-[2] text-gray-300 font-mono relative z-10 whitespace-pre-wrap">{analysis?.text}</div>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default ComparativeHub;
