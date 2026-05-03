import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Orbit, Radio, RefreshCw, ExternalLink } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import { callGemini } from '../../services/api';

const NationalBrief = ({ user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const prompt = `Provide a very brief, high-tech, 3-sentence summary of the upcoming or ongoing national election cycle in ${user.country}. Include key dates like registration deadlines or polling phases if available. Use a neutral, civic intelligence tone.`;
        const system = "You are ELECTION-HERE, an advanced AI democratic intelligence system. Provide verified election data.";
        const res = await callGemini(prompt, system);
        setData(res);
      } catch (e) {
        setData({ text: `⚠️ **Intelligence Relay Error**\n\n${e.message || "Unknown error occurred during electoral sync."}` });
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [user.country]);

  return (
    <GlassCard className="mb-12 border-l-[6px] border-l-cyan-400 overflow-hidden group">
      <div className="absolute -top-10 -right-10 p-8 opacity-[0.05] group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
        <Orbit size={300} className="text-cyan-400" />
      </div>
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-ping shadow-[0_0_10px_#BC13FE]" />
            <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] font-mono">Live Electoral Sync</span>
          </div>
          <h4 className="text-3xl font-black text-white tracking-widest font-mono">National Intelligence Brief</h4>
        </div>
        <div className="p-4 bg-cyan-500/10 text-cyan-400 rounded-3xl border border-cyan-500/30 shadow-[0_0_20px_rgba(0,242,255,0.2)]">
          <Radio size={24} />
        </div>
      </div>
      {loading ? (
        <div className="py-16 flex flex-col items-center gap-6 relative z-10">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
            <RefreshCw className="text-cyan-400" size={40} />
          </motion.div>
          <p className="text-[10px] font-black text-cyan-500/70 uppercase tracking-[0.4em] font-mono">Decrypting Electoral Signals...</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 prose prose-invert prose-sm max-w-none">
          <div className="text-sm font-medium leading-loose text-gray-300 font-mono whitespace-pre-wrap">{data?.text}</div>
          {data?.sources?.length > 0 && (
            <div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap gap-3">
              <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest w-full mb-2">Verified ECI/Government Sources:</span>
              {data.sources.map((s, i) => (
                <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-4 py-2 rounded-2xl border border-purple-500/30 flex items-center gap-2 transition-all font-mono">
                  <ExternalLink size={12} /> {s.title}
                </a>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </GlassCard>
  );
};

export default NationalBrief;
