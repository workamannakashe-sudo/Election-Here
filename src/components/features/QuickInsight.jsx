import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, RefreshCw, Cpu } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import SectionHeader from '../ui/SectionHeader';
import { callGemini } from '../../services/api';
import toast from 'react-hot-toast';

const QuickInsight = ({ onBack }) => {
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const getInsight = async () => {
    if (!name || !country) {
      toast.error("Please provide both Name and Country.");
      return;
    }
    setLoading(true);
    try {
      const prompt = `Hello, my name is ${name}. Explain the election process in ${country} in 4 clear, high-tech sentences. Include key steps like registration, polling, and counting.`;
      const res = await callGemini(prompt, "You are the ELECTION-HERE Insight Engine. Provide clear, concise election process summaries.");
      setData(res.text);
    } catch (e) { toast.error("Insight relay failed."); } finally { setLoading(false); }
  };

  return (
    <section className="min-h-screen pt-12 md:pt-20 pb-32 md:pb-60 px-4 md:px-8 max-w-2xl mx-auto">
      <SectionHeader title="Quick Insight" icon={Zap} action="BACK" onAction={onBack} />
      <GlassCard className="space-y-8 p-8 md:p-12 border-t-[6px] border-t-cyan-500">
        {!data ? (
          <>
            <div className="space-y-3">
              <label htmlFor="insight-name" className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em] font-mono">Civic Identifier</label>
              <input id="insight-name" className="w-full bg-black/50 p-6 rounded-[1.5rem] outline-none font-black text-xl border border-white/10 focus:border-cyan-500/50 transition-all text-white font-mono" value={name} onChange={e => setName(e.target.value)} placeholder="Enter Name" />
            </div>
            <div className="space-y-3">
              <label htmlFor="insight-country" className="text-[10px] font-black text-purple-500 uppercase tracking-[0.4em] font-mono">Target Country</label>
              <input id="insight-country" className="w-full bg-black/50 p-6 rounded-[1.5rem] outline-none font-black text-xl border border-white/10 focus:border-purple-500/50 transition-all text-white font-mono" value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g., India, USA" />
            </div>
            <div className="mt-12 space-y-6">
              <h3 className="text-xs font-black text-cyan-500 uppercase tracking-[0.4em] mb-6 font-mono">System Configuration</h3>
              <GlassCard className="p-8 border-l-[6px] border-l-orange-500">
                <div className="flex items-center gap-4 mb-6">
                  <Cpu className="text-orange-500" size={24} />
                  <span className="text-sm font-black tracking-widest font-mono">API GATEWAY PROTOCOL</span>
                </div>
                <p className="text-gray-400 text-xs mb-6 font-medium leading-relaxed font-mono">
                  If system load is critical (Quota Exhausted), inject a fresh Gemini API Key below. This key is stored locally in your secure environment.
                </p>
                <div className="flex gap-4">
                  <input 
                    type="password"
                    placeholder="Paste New Gemini API Key"
                    aria-label="New Gemini API Key"
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-6 py-4 text-sm font-mono outline-none focus:border-orange-500/50 text-white"
                    onChange={(e) => {
                      if (e.target.value.startsWith("AIza")) {
                        localStorage.setItem('ELECTION_HERE_DYNAMIC_KEY', e.target.value);
                        toast.success("API Key Protocol Synchronized.");
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      localStorage.removeItem('ELECTION_HERE_DYNAMIC_KEY');
                      window.location.reload();
                    }}
                    aria-label="Reset API Key"
                    className="bg-white/5 border border-white/10 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all font-mono"
                  >
                    RESET
                  </button>
                </div>
              </GlassCard>
            </div>
            <button onClick={getInsight} className="w-full bg-cyan-500 text-[#0A0A1A] py-6 rounded-[1.5rem] font-black text-xs tracking-[0.4em] shadow-2xl hover:bg-cyan-400 transition-all font-mono">
              {loading ? <RefreshCw className="animate-spin mx-auto" size={20} /> : 'GENERATE INSIGHT'}
            </button>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="p-6 bg-cyan-500/10 border border-cyan-500/30 rounded-[1.5rem]">
              <p className="text-gray-300 font-mono text-sm leading-relaxed whitespace-pre-wrap">{data}</p>
            </div>
            <button onClick={() => setData(null)} className="w-full bg-white/5 text-white py-5 rounded-[1.5rem] font-black text-[10px] tracking-[0.3em] border border-white/10 hover:bg-white/10 transition-all font-mono uppercase">New Query</button>
          </motion.div>
        )}
      </GlassCard>
    </section>
  );
};

export default QuickInsight;
