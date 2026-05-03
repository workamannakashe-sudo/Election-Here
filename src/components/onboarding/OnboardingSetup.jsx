import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Compass, Atom, ChevronRight } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import toast from 'react-hot-toast';

const OnboardingSetup = ({ user, setUser, onComplete }) => {
  const [step, setStep] = useState(0);
  const personas = ['First-Time Voter', 'Veteran Voter', 'Election Observer'];

  const next = async () => {
    if (step === 2) {
      toast.success("Identity Synchronized", { icon: '🏛️', style: { background: '#0A0A1A', color: '#00F2FF', border: '1px solid #00F2FF' } });
      onComplete();
    } else {
      setStep(step + 1);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 text-center bg-[#0A0A1A] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0A0A1A] to-[#0A0A1A]"></div>

      <motion.div key={step} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="max-w-md w-full relative z-10">
        <div className="mb-14">
          <GlassCard noBlur className="w-24 h-24 mx-auto flex items-center justify-center border-cyan-500/30 shadow-[0_0_30px_rgba(0,242,255,0.2)] bg-black/50">
            {step === 0 ? <User size={40} className="text-cyan-400" /> : step === 1 ? <Compass size={40} className="text-purple-400" /> : <Atom size={40} className="text-cyan-400" />}
          </GlassCard>
        </div>
        <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-widest text-white font-mono uppercase">
          {step === 0 ? "Voter Identity" : step === 1 ? "National Base" : "Voter Class"}
        </h2>
        <p className="text-gray-500 mb-12 font-bold uppercase text-[10px] tracking-[0.4em] font-mono">Election Protocol Setup</p>

        {step === 0 && (
          <input
            className="w-full bg-black/50 p-6 md:p-8 rounded-[2rem] shadow-inner text-center text-2xl font-black outline-none border border-white/10 focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(0,242,255,0.3)] transition-all placeholder:text-gray-700 text-cyan-50 font-mono"
            value={user.name}
            onChange={e => setUser({ ...user, name: e.target.value.replace(/[<>]/g, "") })}
            placeholder="Dr. Example"
            aria-label="Enter your name"
          />
        )}
        {step === 1 && (
          <input
            className="w-full bg-black/50 p-6 md:p-8 rounded-[2rem] shadow-inner text-center text-2xl font-black outline-none border border-white/10 focus:border-purple-400 focus:shadow-[0_0_20px_rgba(188,19,254,0.3)] transition-all placeholder:text-gray-700 text-purple-50 font-mono"
            value={user.country}
            onChange={e => setUser({ ...user, country: e.target.value.replace(/[<>]/g, "") })}
            placeholder="e.g. India, USA, UK, Brazil"
            aria-label="Enter your country"
          />
        )}
        {step === 2 && (
          <div className="grid grid-cols-1 gap-4">
            {personas.map(p => (
              <button
                key={p}
                onClick={() => { setUser({ ...user, persona: p }); next(); }}
                aria-label={`Select persona: ${p}`}
                className={`p-6 rounded-[2rem] font-black text-sm md:text-base flex items-center justify-between transition-all border font-mono tracking-widest ${user.persona === p ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_20px_rgba(0,242,255,0.3)]' : 'bg-black/50 text-gray-500 border-white/10 hover:border-cyan-500/50'}`}
              >
                <span>{p}</span>
                <ChevronRight size={20} className="opacity-50" />
              </button>
            ))}
          </div>
        )}

        {step < 2 && (
          <button
            onClick={next}
            disabled={(step === 0 && !user.name) || (step === 1 && !user.country)}
            className="mt-16 w-full bg-white/10 text-white py-6 rounded-[2rem] font-black text-xs tracking-[0.3em] border border-white/20 shadow-xl disabled:opacity-20 transition-all hover:bg-cyan-500 hover:text-black hover:border-cyan-400 active:scale-95 font-mono"
          >
            CONFIRM DATA
          </button>
        )}
      </motion.div>
    </main>
  );
};

export default OnboardingSetup;
