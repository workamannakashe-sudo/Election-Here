import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Orbit, Globe, Database, MessageSquare, 
  Newspaper, User, Cpu, BookOpen, FileText, 
  CheckCircle, Activity, ArrowRight, Shield 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- Components ---
import GlassCard from './components/ui/GlassCard';
import SectionHeader from './components/ui/SectionHeader';
import Landing from './components/onboarding/Landing';
import OnboardingSetup from './components/onboarding/OnboardingSetup';
import Dashboard from './components/Dashboard';

// --- Lazy loaded features for performance ---
const NationalBrief = lazy(() => import('./components/features/NationalBrief'));
const RightsLedger = lazy(() => import('./components/features/RightsLedger'));
const ComparativeHub = lazy(() => import('./components/features/ComparativeHub'));
const ManifestoAnalyst = lazy(() => import('./components/features/ManifestoAnalyst'));
const ElectionAssistant = lazy(() => import('./components/features/ElectionAssistant'));
const NewsReports = lazy(() => import('./components/features/NewsReports'));
const QuickInsight = lazy(() => import('./components/features/QuickInsight'));

// --- Constants ---
const DEMOCRATIC_LIFECYCLE = [
  { id: 1, title: 'Notification', desc: 'The Election Commission issues the official notification for the election.', icon: <FileText /> },
  { id: 2, title: 'Nomination', desc: 'Candidates file their nomination papers, declaring their intent to run.', icon: <CheckCircle /> },
  { id: 3, title: 'Scrutiny', desc: 'The Returning Officer verifies the nomination papers for validity.', icon: <Database /> },
  { id: 4, title: 'Campaign', desc: 'Candidates and parties campaign to win the support of voters.', icon: <Activity /> },
  { id: 5, title: 'Polling', desc: 'Eligible voters cast their votes at designated polling booths.', icon: <User /> },
  { id: 6, title: 'Counting', desc: 'Votes are counted, and the results are officially declared.', icon: <BarChart3 /> }
];

const BOOTH_SIMULATION_STEPS = [
  { title: 'Verification', desc: 'Polling Officer checks your name on the voter list and ID.', icon: <Shield /> },
  { title: 'Ink Marking', desc: 'Indelible ink is applied to your finger.', icon: <CheckCircle /> },
  { title: 'Booth Enabling', desc: 'The presiding officer enables the EVM for your vote.', icon: <Cpu /> },
  { title: 'Casting & VVPAT', desc: 'Press the button on the EVM and verify the VVPAT slip.', icon: <Activity /> }
];

function BarChart3(props) { return <div {...props}><Activity /></div>; }

const NavItem = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick} 
    aria-label={label}
    className={`p-4 md:p-5 rounded-[1.5rem] md:rounded-[1.8rem] transition-all duration-500 transform ${active ? 'bg-cyan-500 text-black scale-110 shadow-[0_0_20px_rgba(0,242,255,0.5)]' : 'text-gray-500 hover:text-cyan-300 hover:scale-105 hover:bg-white/5'}`}
  >
    {React.cloneElement(icon, { size: 24, strokeWidth: active ? 2.5 : 2 })}
  </button>
);

const Navbar = ({ active, setPage }) => (
  <nav className="fixed bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 w-[95%] max-w-lg h-20 md:h-24 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] md:rounded-[3rem] px-6 md:px-10 flex justify-between items-center z-50 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
    <NavItem active={active === 'dashboard'} onClick={() => setPage('dashboard')} icon={<Orbit />} label="Dashboard" />
    <NavItem active={active === 'news'} onClick={() => setPage('news')} icon={<Newspaper />} label="News" />
    <NavItem active={active === 'assistant'} onClick={() => setPage('assistant')} icon={<MessageSquare />} label="Assistant" />
    <NavItem active={active === 'framework'} onClick={() => setPage('framework')} icon={<Database />} label="Policy Analyst" />
    <NavItem active={active === 'global'} onClick={() => setPage('global')} icon={<Globe />} label="Global Hub" />
  </nav>
);

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#0A0A1A]">
    <Activity className="text-cyan-400 animate-spin" size={48} />
  </div>
);

export default function App() {
  const [page, setPage] = useState('landing');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('aether_gravity_user');
    return saved ? JSON.parse(saved) : {
      name: '',
      country: '',
      persona: '',
      setupCompleted: false
    };
  });

  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('aether_gravity_user', JSON.stringify(user));
    window.scrollTo(0, 0);
    
    const handleSetPage = (e) => setPage(e.detail);
    window.addEventListener('setPage', handleSetPage);
    return () => window.removeEventListener('setPage', handleSetPage);
  }, [user, page]);

  const OfflineBanner = () => (
    <div className="fixed top-0 left-0 w-full bg-red-600 text-white text-center py-2 z-50">
      ⚠️ You are offline – data may be limited to local knowledge.
    </div>
  );

  const renderContent = () => {
    if (page === 'landing') return <Landing onStart={() => setPage(user.setupCompleted ? 'dashboard' : 'setup')} />;
    if (page === 'setup') return <OnboardingSetup user={user} setUser={setUser} onComplete={() => { setUser({ ...user, setupCompleted: true }); setPage('dashboard'); }} />;

    switch (page) {
      case 'dashboard': return <Dashboard user={user} setPage={setPage} NationalBrief={NationalBrief} />;
      case 'ledger': return <RightsLedger />;
      case 'lifecycle': return (
        <section className="min-h-screen pt-12 md:pt-20 pb-32 md:pb-60 px-4 md:px-8 max-w-5xl mx-auto">
          <SectionHeader title="Democratic Lifecycle" icon={Orbit} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {DEMOCRATIC_LIFECYCLE.map(p => (
              <GlassCard key={p.id} className="hover:border-cyan-500/50 transition-all duration-500 group">
                <div className="flex gap-6 items-start">
                  <div className="p-4 bg-white/5 border border-white/10 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/50 rounded-2xl text-gray-400 group-hover:text-cyan-400 transition-all shadow-[0_0_0_rgba(0,242,255,0)] group-hover:shadow-[0_0_15px_rgba(0,242,255,0.3)]">
                    {React.cloneElement(p.icon, { size: 24 })}
                  </div>
                  <div>
                    <h4 className="text-xl md:text-2xl font-black mb-2 text-white font-mono tracking-widest">{p.title}</h4>
                    <p className="text-xs md:text-sm font-medium text-gray-400 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      );
      case 'global': return <ComparativeHub />;
      case 'framework': return <ManifestoAnalyst />;
      case 'assistant': return <ElectionAssistant />;
      case 'news': return <NewsReports />;
      case 'insight': return <QuickInsight onBack={() => setPage('landing')} />;
      case 'simulator': return (
        <section className="min-h-screen pt-12 md:pt-20 pb-32 md:pb-60 px-4 md:px-8 max-w-5xl mx-auto">
          <SectionHeader title="Tactile Booth Simulator" icon={Cpu} />
          <div className="space-y-6 md:space-y-8">
            {BOOTH_SIMULATION_STEPS.map((s, i) => (
              <GlassCard key={i} className="flex flex-col md:flex-row gap-6 md:gap-10 items-start md:items-center p-6 md:p-8 hover:border-purple-500/40">
                <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 bg-black border border-purple-500/30 text-purple-400 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center font-black text-2xl md:text-3xl shadow-[0_0_20px_rgba(188,19,254,0.15)] font-mono">0{i + 1}</div>
                <div>
                  <h4 className="text-2xl md:text-3xl font-black text-white mb-2 font-mono tracking-widest flex items-center gap-3">
                    {s.title}
                    <span className="text-purple-400 opacity-50">{s.icon}</span>
                  </h4>
                  <p className="text-sm md:text-base font-medium text-gray-400">{s.desc}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      );
      case 'profile': return (
        <section className="min-h-screen pt-12 md:pt-20 pb-32 md:pb-60 px-4 md:px-8 max-w-xl mx-auto">
          <SectionHeader title="Identity Terminal" icon={User} />
          <GlassCard className="space-y-10 p-8 md:p-12">
            <div className="space-y-3">
              <label htmlFor="voter-name" className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em] font-mono">Voter Designation</label>
              <input id="voter-name" aria-label="Voter Designation" className="w-full bg-black/50 p-6 rounded-[2rem] outline-none font-black text-2xl border border-white/10 focus:border-cyan-500/50 transition-all text-white font-mono" value={user.name} onChange={e => setUser({ ...user, name: e.target.value.replace(/[<>]/g, "") })} placeholder="Enter your full name" />
            </div>
            <div className="space-y-3">
              <label htmlFor="voter-country" className="text-[10px] font-black text-purple-500 uppercase tracking-[0.4em] font-mono">National Base</label>
              <input id="voter-country" aria-label="National Base" className="w-full bg-black/50 p-6 rounded-[2rem] outline-none font-black text-2xl border border-white/10 focus:border-purple-500/50 transition-all text-white font-mono" value={user.country} onChange={e => setUser({ ...user, country: e.target.value.replace(/[<>]/g, "") })} placeholder="Your Country (e.g. India)" />
            </div>
            <button aria-label="Sync State and Finalize Identity" onClick={() => {
              if (user.name.length < 2) {
                toast.error("Invalid Voter Designation.");
                return;
              }
              toast.success("Identity Finalized & Secured", { icon: '🛡️', style: { background: '#0A0A1A', color: '#00F2FF', border: '1px solid #00F2FF' } });
              setPage('dashboard');
            }} className="w-full bg-white/10 text-white py-6 rounded-[2rem] font-black text-xs tracking-[0.4em] shadow-2xl hover:bg-cyan-500 hover:text-black hover:border-cyan-400 transition-all font-mono border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500">SYNC STATE</button>
          </GlassCard>
        </section>
      );
      default: return <Dashboard user={user} setPage={setPage} />;
    }
  };

  return (
    <div className="font-sans selection:bg-cyan-500/30 bg-[#0A0A1A] min-h-screen overflow-x-hidden text-gray-200">
      {isOffline && <OfflineBanner />}
      {/* Accessibility: Skip Link */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-cyan-500 focus:text-black focus:px-6 focus:py-3 focus:rounded-xl focus:font-black focus:font-mono">
        SKIP TO MAIN CONTENT
      </a>

      <Toaster position="bottom-center" />
      <AnimatePresence mode="wait">
        <motion.div id="main-content" key={page} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <Suspense fallback={<LoadingSpinner />}>
            {renderContent()}
          </Suspense>
        </motion.div>
      </AnimatePresence>
      {page !== 'landing' && page !== 'setup' && <Navbar active={page} setPage={setPage} />}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&family=Inter:wght@400;500;700;900&display=swap');
        :root { scroll-behavior: smooth; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        body { overscroll-behavior: none; background-color: #0A0A1A; }
        input:focus { border-color: #00F2FF !important; box-shadow: 0 0 20px rgba(0,242,255,0.2); }
      `}</style>
    </div>
  );
}
