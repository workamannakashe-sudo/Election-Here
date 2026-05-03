import React, { useState } from 'react';
import { MessageSquare, Terminal, ArrowRight, RefreshCw } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import SectionHeader from '../ui/SectionHeader';
import { callGemini } from '../../services/api';
import toast from 'react-hot-toast';

const ElectionAssistant = () => {
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Security: Enhanced Input Validation
  const validateInput = (str) => {
    if (!str || str.trim().length === 0) return false;
    if (str.length > 500) return false;
    // Prevent common XSS and injection patterns
    const forbiddenPatterns = [/<script/i, /javascript:/i, /onerror/i, /onload/i];
    return !forbiddenPatterns.some(pattern => pattern.test(str));
  };

  const ask = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;
    
    if (!validateInput(trimmedInput)) {
      toast.error("Invalid input detected. Security protocol engaged.");
      return;
    }

    const userMsg = { role: 'user', text: trimmedInput };
    setChat(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    
    try {
      const prompt = `User question: "${trimmedInput}"`;
      const system = "You are the ELECTION-HERE Interactive Assistant, a highly intelligent and versatile AI. While your primary expertise is in the democratic process, elections, and politics, you are fully capable and authorized to answer ANY question the user asks you, regardless of the topic. Provide clear, accurate, and helpful answers.";
      const res = await callGemini(prompt, system);

      setChat(prev => [...prev, { role: 'assistant', text: res.text }]);
    } catch (e) { 
      toast.error("Assistant relay failed."); 
      setChat(prev => [...prev, { role: 'assistant', text: "⚠️ System offline. Please check your connection or API configuration." }]);
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <section className="min-h-screen pt-12 md:pt-20 pb-32 md:pb-60 px-4 md:px-8 max-w-4xl mx-auto">
      <SectionHeader title="Election Assistant" icon={MessageSquare} />
      <GlassCard className="flex flex-col h-[600px] border-l-[6px] border-l-purple-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10"><Terminal size={100} className="text-purple-400" /></div>
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 mb-6 p-4 relative z-10">
          {chat.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-500 font-mono tracking-widest uppercase text-xs mb-4">Election-Here Terminal V2.4</p>
              <div className="w-1 h-6 bg-cyan-400 mx-auto animate-pulse" />
            </div>
          )}
          {chat.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`} aria-live={m.role === 'assistant' ? 'polite' : 'off'}>
              <div className={`max-w-[85%] p-5 rounded-[1.5rem] font-mono text-sm leading-relaxed shadow-2xl ${m.role === 'user' ? 'bg-cyan-500/10 text-cyan-200 border border-cyan-500/30' : 'bg-black/60 text-gray-300 border border-white/10 backdrop-blur-md'}`}>
                <span className="text-[9px] block mb-2 opacity-50 uppercase tracking-widest">{m.role === 'user' ? 'Voter-Command' : 'Electoral-Node'}</span>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/5 p-5 rounded-[1.5rem] border border-white/10 animate-pulse text-cyan-500 font-mono text-[10px] uppercase tracking-widest font-black">
                Syncing with Central Database...
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-4 bg-black/80 border border-white/10 rounded-[1.5rem] px-6 py-3 relative z-10 mx-2 mb-2">
          <span className="text-cyan-500 font-black font-mono pt-1">$</span>
          <input 
            className="flex-1 bg-transparent outline-none text-white font-mono py-1 placeholder:text-gray-700" 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && ask()} 
            placeholder="Type command..." 
            aria-label="Assistant message input"
          />
          <button 
            onClick={ask} 
            aria-label="Send message"
            className="bg-purple-600 text-white p-2 rounded-xl hover:bg-purple-500 transition-all shadow-[0_0_15px_rgba(188,19,254,0.4)]"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </GlassCard>
    </section>
  );
};

export default ElectionAssistant;
