import React from 'react';
import { motion } from 'framer-motion';
import { Atom, ArrowRight, Zap } from 'lucide-react';

const Landing = ({ onStart }) => (
  <main className="min-h-screen bg-[#0A0A1A] flex flex-col items-center justify-center p-4 md:p-8 text-center relative overflow-hidden">
    {/* Nebula Background Gradients */}
    <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-purple-900/20 blur-[150px] rounded-full mix-blend-screen" />
    <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-cyan-900/20 blur-[150px] rounded-full mix-blend-screen" />
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>

    <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} className="z-10 relative">
      <motion.div 
        animate={{ y: [0, -10, 0] }} 
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }} 
        className="inline-flex items-center gap-4 px-8 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-cyan-400 mb-12 shadow-[0_0_30px_rgba(0,242,255,0.15)] tracking-[0.4em] uppercase backdrop-blur-md font-mono"
      >
        <Atom size={16} className="text-purple-400" /> Democratic Framework V1.0
      </motion.div>
      <h1 className="text-5xl md:text-7xl lg:text-[9rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-cyan-100 to-purple-300 mb-6 tracking-widest leading-none select-none font-mono drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">
        Election<br /><span className="text-cyan-400 drop-shadow-[0_0_30px_rgba(0,242,255,0.5)]">Here</span>
      </h1>
      <p className="text-sm md:text-lg text-gray-400 max-w-2xl mx-auto mb-16 leading-relaxed font-mono tracking-widest px-4">
        Advanced intelligence platform for national election awareness and democratic participation.
      </p>
      <div className="flex flex-col md:flex-row gap-6 mx-auto justify-center">
        <button 
          onClick={onStart} 
          aria-label="Initialize connection and start onboarding"
          className="group bg-cyan-500 text-[#0A0A1A] px-10 py-5 md:px-14 md:py-6 rounded-full font-black text-[10px] md:text-xs tracking-[0.4em] shadow-[0_0_40px_rgba(0,242,255,0.5)] hover:bg-cyan-400 hover:scale-105 transition-all flex items-center gap-4 uppercase font-mono"
        >
          INITIALIZE LINK <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
        </button>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('setPage', { detail: 'insight' }))} 
          aria-label="Access quick electoral insight"
          className="group bg-white/5 text-white border border-white/20 px-10 py-5 md:px-14 md:py-6 rounded-full font-black text-[10px] md:text-xs tracking-[0.4em] hover:bg-white/10 hover:scale-105 transition-all flex items-center gap-4 uppercase font-mono"
        >
          QUICK INSIGHT <Zap size={20} className="text-cyan-400" />
        </button>
      </div>
    </motion.div>
  </main>
);

export default Landing;
