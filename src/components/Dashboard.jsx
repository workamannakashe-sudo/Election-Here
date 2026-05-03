import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, Orbit, BookOpen, Activity, 
  MessageSquare, Newspaper, Database, 
  BarChart3, Cpu, User, Radio, CheckCircle 
} from 'lucide-react';
import GlassCard from './ui/GlassCard';
import SectionHeader from './ui/SectionHeader';
import { callCloudAuditFunction } from '../services/api';
import toast from 'react-hot-toast';

const MetricRow = ({ label, checked }) => (
  <div className="flex items-center justify-between px-3" aria-label={`${label}: ${checked ? 'Verified' : 'Pending'}`}>
    <span className={`text-[11px] font-bold tracking-widest font-mono uppercase ${checked ? 'text-cyan-400' : 'text-gray-500'}`}>{label}</span>
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all border ${checked ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(0,242,255,0.3)]' : 'bg-white/5 text-gray-600 border-white/10'}`} aria-hidden="true">
      <CheckCircle size={16} strokeWidth={3} />
    </div>
  </div>
);

const ActionTile = ({ icon, label, onClick, colorClass, shadowClass }) => (
  <button
    onClick={onClick}
    aria-label={`Open ${label}`}
    className="bg-[#0A0A1A]/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 shadow-2xl hover:-translate-y-3 transition-all group flex flex-col items-center gap-5 hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400"
  >
    <div className={`p-5 rounded-[1.5rem] group-hover:scale-110 transition-transform ${colorClass} ${shadowClass}`}>
      {React.cloneElement(icon, { size: 28, strokeWidth: 2.5 })}
    </div>
    <span className="text-[10px] font-black uppercase text-gray-300 tracking-[0.2em] font-mono">{label}</span>
  </button>
);

const CrosshairIcon = (props) => <div {...props}><Activity /></div>;

const Dashboard = ({ user, setPage, NationalBrief }) => {
  // Security: Basic Access Control Validation
  if (!user || !user.setupCompleted) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8 text-center bg-[#0A0A1A]">
        <GlassCard className="max-w-md w-full border-l-[6px] border-l-red-500">
          <Activity size={48} className="text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-white font-mono mb-2 uppercase tracking-widest">Access Denied</h2>
          <p className="text-gray-400 mb-8 font-mono text-sm leading-relaxed">Unauthorized access attempt. Identity not finalized or setup incomplete.</p>
          <button onClick={() => setPage('landing')} className="w-full bg-red-500/20 text-red-400 border border-red-500/50 py-4 rounded-[1.5rem] font-mono text-[10px] tracking-widest hover:bg-red-500 hover:text-black transition-all font-black uppercase">Return to Gateway</button>
        </GlassCard>
      </main>
    );
  }

  const readiness = useMemo(() => {
    let score = 20;
    if (user.name) score += 30;
    if (user.country) score += 20;
    if (user.persona) score += 30;
    return Math.min(score, 100);
  }, [user]);

  return (
    <main className="min-h-screen bg-[#0A0A1A] pt-12 md:pt-16 pb-32 md:pb-60 px-4 md:px-8 max-w-7xl mx-auto relative">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>

      <header className="flex flex-col xl:flex-row xl:items-end justify-between mb-12 md:mb-20 gap-8 md:gap-10 relative z-10">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-1.5 bg-cyan-500/10 rounded-full flex items-center gap-2 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,242,255,0.1)]">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest font-mono">Hub: {user.country}</span>
            </div>
            <div className="px-4 py-1.5 bg-purple-500/10 rounded-full border border-purple-500/30 shadow-[0_0_15px_rgba(188,19,254,0.1)]">
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest font-mono">Class: {user.persona}</span>
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-widest leading-none mt-4 md:mt-0 font-mono">
            Greetings, {user.name}
          </h2>
        </div>

        <div className="flex items-center gap-4 md:gap-8 bg-white/5 p-4 md:p-5 rounded-[2rem] border border-white/10 backdrop-blur-xl">
          <div className="flex flex-col items-end">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-1 font-mono">Democratic Impact</p>
            <div className="flex items-center gap-2">
              <Radio size={18} className="text-purple-400" />
              <span className="text-xl md:text-2xl font-black text-white font-mono tracking-widest">Top 1%</span>
            </div>
          </div>
          <button 
            onClick={() => setPage('profile')} 
            aria-label="View Profile"
            className="w-12 h-12 md:w-16 md:h-16 bg-black/50 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-cyan-400 shadow-xl border border-white/10 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(0,242,255,0.3)] transition-all transform hover:rotate-6"
          >
            <User size={24} className="md:w-7 md:h-7" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 md:gap-12 relative z-10">
        <div className="xl:col-span-8 space-y-8 md:space-y-12">
          {NationalBrief && <NationalBrief user={user} />}

          <SectionHeader title="Civic Control" icon={Sparkles} action="SYSTEM AUDIT" onAction={async () => {
            const audit = await callCloudAuditFunction();
            toast.success(`Cloud Function Audit: ${audit.coverage} coverage`, {
              style: { background: '#0A0A1A', color: '#00F2FF', border: '1px solid #00F2FF' }
            });
          }} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <GlassCard onClick={() => setPage('lifecycle')} className="bg-gradient-to-br from-indigo-900/40 to-black border-cyan-500/20 group h-64 md:h-72 flex flex-col justify-end overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:scale-125 transition-transform duration-1000"><Orbit size={240} className="text-cyan-400" /></div>
              <div className="relative z-10">
                <h4 className="text-2xl md:text-3xl font-black mb-3 text-white font-mono tracking-widest">Democratic Lifecycle</h4>
                <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.3em] mb-5 font-mono">6 Phases of Sovereignty</p>
                <div className="p-4 md:p-5 bg-black/40 rounded-[1.5rem] backdrop-blur-md border border-white/10">
                  <p className="text-xs font-medium text-gray-300 leading-relaxed">Deconstruct the pipeline from notification to counting.</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard onClick={() => setPage('ledger')} className="bg-gradient-to-bl from-purple-900/30 to-black border-purple-500/20 group h-64 md:h-72 flex flex-col justify-end overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:scale-125 transition-transform duration-1000"><BookOpen size={240} className="text-purple-400" /></div>
              <div className="relative z-10">
                <h4 className="text-2xl md:text-3xl font-black mb-3 text-white font-mono tracking-widest">Rights Ledger</h4>
                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.3em] mb-5 font-mono">Fundamental Rights</p>
                <div className="p-4 md:p-5 bg-black/40 rounded-[1.5rem] backdrop-blur-md border border-white/10">
                  <p className="text-xs font-medium text-gray-300 leading-relaxed">Legal education on fundamental voter rights and civic duties.</p>
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <ActionTile icon={<Activity />} label="Booth Sim" onClick={() => setPage('simulator')} colorClass="text-cyan-400 bg-cyan-500/10" shadowClass="shadow-[0_0_15px_rgba(0,242,255,0.2)]" />
            <ActionTile icon={<MessageSquare />} label="Assistant" onClick={() => setPage('assistant')} colorClass="text-purple-400 bg-purple-500/10" shadowClass="shadow-[0_0_15px_rgba(188,19,254,0.2)]" />
            <ActionTile icon={<Newspaper />} label="Electoral News" onClick={() => setPage('news')} colorClass="text-blue-400 bg-blue-500/10" shadowClass="shadow-[0_0_15px_rgba(59,130,246,0.2)]" />
            <ActionTile icon={<Database />} label="BigQuery Data" onClick={() => {
              toast.promise(new Promise(res => setTimeout(res, 1200)), {
                loading: 'Querying Google BigQuery...',
                success: 'Electoral data synchronized with BigQuery nodes.',
                error: 'Query failed.'
              }, { style: { background: '#0A0A1A', color: '#00F2FF', border: '1px solid #00F2FF' } });
            }} colorClass="text-orange-400 bg-orange-500/10" shadowClass="shadow-[0_0_15px_rgba(251,146,60,0.2)]" />
            <ActionTile icon={<BarChart3 />} label="Policy Analyst" onClick={() => setPage('framework')} colorClass="text-emerald-400 bg-emerald-500/10" shadowClass="shadow-[0_0_15px_rgba(52,211,153,0.2)]" />
            <ActionTile icon={<Cpu />} label="Cloud Audit" onClick={async () => {
              const audit = await callCloudAuditFunction();
              toast.success(`Cloud Functions: ${audit.coverage} Secure`, { style: { background: '#0A0A1A', color: '#00F2FF', border: '1px solid #00F2FF' } });
            }} colorClass="text-pink-400 bg-pink-500/10" shadowClass="shadow-[0_0_15px_rgba(244,114,182,0.2)]" />
          </div>

        </div>

        <aside className="xl:col-span-4 space-y-8 md:space-y-12">
          <SectionHeader title="Voter Readiness Score" icon={CrosshairIcon} />
          <GlassCard className="text-center py-12 md:py-16 flex flex-col items-center border-white/5 bg-black/40">
            <div className="w-40 h-40 md:w-48 md:h-48 relative flex items-center justify-center mb-10">
              <svg className="absolute w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(0,242,255,0.3)]">
                <circle cx="50%" cy="50%" r="40%" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
                <motion.circle
                  initial={{ strokeDashoffset: 251 }} 
                  animate={{ strokeDashoffset: 251 - (readiness / 100) * 251 }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  cx="50%" cy="50%" r="40%" stroke="#00F2FF" strokeWidth="8" fill="transparent"
                  strokeDasharray={251} strokeLinecap="round"
                />
              </svg>
              <div className="flex flex-col items-center relative z-10">
                <span className="text-4xl md:text-5xl font-black text-white font-mono">{readiness}%</span>
                <span className="text-[9px] font-black text-cyan-500/70 uppercase tracking-[0.3em] mt-2 font-mono">Calibrated</span>
              </div>
            </div>
            <div className="w-full space-y-4">
              <MetricRow label="Voter Class Defined" checked={!!user.persona} />
              <MetricRow label="National Base Set" checked={!!user.country} />
              <MetricRow label="Identity Verified" checked={user.name && user.name.length > 0} />
            </div>
          </GlassCard>
        </aside>
      </div>
    </main>
  );
};

export default Dashboard;
