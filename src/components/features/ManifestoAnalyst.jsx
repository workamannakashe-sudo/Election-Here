import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Search, RefreshCw, Shield } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import SectionHeader from '../ui/SectionHeader';
import { callGemini, callCloudAuditFunction } from '../../services/api';
import toast from 'react-hot-toast';

const ManifestoAnalyst = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!query || query.length < 3) {
      toast.error("Please enter a valid manifesto or policy to analyze.");
      return;
    }
    setLoading(true);
    try {
      const prompt = `Provide a neutral, ground-truth summary and analysis of the political manifesto or policy: "${query}". Analyze its viability and focus (Economy, Infrastructure, Welfare) in 4 sentences based on real-time data.`;
      
      // Google Services: Trigger Cloud Audit Function for data integrity
      await callCloudAuditFunction();
      
      const res = await callGemini(prompt, "You are an advanced political manifesto analysis engine. Provide neutral, unbiased analysis.");
      setResult(res);
    } catch (e) { 
      toast.error("Compute cluster offline."); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <section className="min-h-screen pt-12 md:pt-20 pb-32 md:pb-60 px-4 md:px-8 max-w-5xl mx-auto">
      <SectionHeader title="Manifesto Analyst" icon={Database} />
      <GlassCard className="mb-14 flex flex-col md:flex-row gap-6 p-6 border-l-[6px] border-l-cyan-500">
        <div className="flex-1 flex items-center gap-4 bg-black/50 border border-white/10 rounded-[1.8rem] px-8 py-3 focus-within:border-cyan-500/50 transition-colors">
          <Search size={24} className="text-cyan-600" />
          <input 
            className="flex-1 bg-transparent font-black outline-none text-xl md:text-2xl placeholder:text-gray-700 w-full text-white font-mono" 
            value={query} 
            onChange={e => setQuery(e.target.value.substring(0, 200))} 
            onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
            placeholder="e.g., National Education Policy" 
            aria-label="Manifesto or policy query"
          />
        </div>
        <button 
          onClick={handleAnalyze} 
          disabled={loading}
          className="bg-cyan-500 text-[#0A0A1A] px-8 md:px-14 py-4 md:py-6 rounded-[1.8rem] font-black text-xs tracking-[0.3em] hover:bg-cyan-400 shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all flex items-center justify-center gap-3 w-full md:w-auto font-mono disabled:opacity-50"
        >
          {loading ? <RefreshCw className="animate-spin" size={18} /> : 'ANALYZE'}
        </button>
      </GlassCard>
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-8 md:p-14 text-sm md:text-base font-medium leading-relaxed prose prose-invert prose-sm max-w-none font-mono">
            <div className="flex items-center gap-3 text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-10 border-b border-white/10 pb-6">
              <Shield size={16} /> Truth-Grounding Engine Active
            </div>
            <div className="whitespace-pre-wrap">{result.text}</div>
          </GlassCard>
        </motion.div>
      )}
    </section>
  );
};

export default ManifestoAnalyst;
