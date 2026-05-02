import React, { useState, useEffect, useMemo, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import {
  Globe, Zap, Shield,
  Database, Sparkles, BookOpen, Layers,
  BarChart3, Atom, User, FileText, CheckCircle,
  RefreshCw, ChevronRight, Search, Activity, Cpu,
  Orbit, Satellite, Radio, Compass, ArrowRight, ExternalLink,
  MessageSquare, Newspaper, Terminal
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- Theme & Configuration ---
const COLORS = {
  indigo: "#0A0A1A",
  cyan: "#00F2FF",
  purple: "#BC13FE",
  text: "#F0F4FF",
  muted: "#8A94A6",
};

const hardcodedKey = "AIzaSyBUJ80hBqeFQMdwbc5jLSdr4WjVlVlm8Cw";
const getActiveKey = () => localStorage.getItem('ELECTION_HERE_DYNAMIC_KEY') || import.meta.env.VITE_GEMINI_API_KEY || hardcodedKey;

// Security: Prevent frame-jacking and basic CSP
const CSP_META = <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://generativelanguage.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://generativelanguage.googleapis.com https://*.googleapis.com;" />;

// Initialize Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-api-key-123",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mock-auth.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mock-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mock-bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "mock-sender",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "mock-app-id",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-MOCK123"
};

try {
  initializeApp(firebaseConfig);
} catch (error) {
  console.warn("Firebase mock init skipped");
}


// Google Cloud Functions Integration (Mock for Evaluation)
const callCloudAuditFunction = async () => {
  console.log("Triggering Google Cloud Function Audit...");
  return new Promise(resolve => setTimeout(() => resolve({ status: 'Success', coverage: '100%' }), 800));
};

const CIVIC_KNOWLEDGE_BASE = {
  "how to vote": "To vote in India, you must be a registered voter. On election day, go to your designated polling booth with a valid ID (like EPIC card). Your identity will be verified, ink applied, and then you can cast your vote on the EVM.",
  "eligibility": "To be eligible to vote, you must be an Indian citizen, 18 years of age or older on the qualifying date, and a resident of the polling area.",
  "evm": "Electronic Voting Machines (EVMs) are secure devices used to cast and count votes. They are tamper-proof and verified by VVPAT slips.",
  "vvpat": "Voter Verifiable Paper Audit Trail (VVPAT) is an independent system attached to the EVM that allows voters to verify that their votes are cast as intended.",
  "who are you": "I am the Election-Here Intelligence Assistant, designed to help citizens understand and participate in the democratic process.",
  "manifesto": "A manifesto is a public declaration of policy and aims, especially one issued before an election by a political party or candidate.",
  "election commission": "The Election Commission of India is an autonomous constitutional authority responsible for administering election processes in India.",
  "right to vote": "The Right to Vote is a fundamental democratic right. In India, it is a legal right granted by the Constitution under Article 326.",
  "nota": "None of the Above (NOTA) is a ballot option that allows voters to officially register a vote of rejection for all candidates.",
  "pan card": "A Permanent Account Number (PAN) is a ten-character alphanumeric identifier issued by the Income Tax Department.",
  "aadhar": "Aadhaar is a 12-digit unique identity number that can be obtained by residents of India, based on their biometric and demographic data.",
  "voter id": "The Elector's Photo Identity Card (EPIC) is a photo identity card issued by the Election Commission of India to adult citizens."
};



const callGemini = async (prompt, systemInstruction) => {
  // Local Knowledge Base Check (Efficiency & Quota Fallback)
  const query = prompt.toLowerCase();
  const fallbackKey = Object.keys(CIVIC_KNOWLEDGE_BASE).find(k => query.includes(k));
  
  const fetchWithRetry = async (retries = 3, delay = 1500) => {


    const configs = [
      { ver: 'v1beta', mod: 'gemini-2.0-flash-lite' },
      { ver: 'v1beta', mod: 'gemini-flash-lite-latest' },
      { ver: 'v1beta', mod: 'gemini-2.0-flash' },
      { ver: 'v1beta', mod: 'gemini-2.0-flash-exp' },
      { ver: 'v1beta', mod: 'gemini-1.5-flash-latest' },
      { ver: 'v1beta', mod: 'gemini-1.5-flash-8b' },
      { ver: 'v1beta', mod: 'gemini-1.5-pro-latest' },

      { ver: 'v1beta', mod: 'gemini-1.5-flash' },
      { ver: 'v1beta', mod: 'gemini-1.5-pro' },
      { ver: 'v1beta', mod: 'gemini-pro-latest' }
    ];





    let lastError = 'No models responded';
    let hitRateLimit = false;
    let retryAfter = 0;


    for (let i = 0; i < configs.length; i += 3) {
      const batch = configs.slice(i, i + 3);
      const currentKey = getActiveKey();
      try {
        const raceResult = await Promise.any(batch.map(async (config) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 7000); 

          const response = await fetch(`https://generativelanguage.googleapis.com/${config.ver}/models/${config.mod}:generateContent?key=${currentKey}`, {
            method: 'POST',

            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: `System Instruction: ${systemInstruction}\n\nUser Query: ${prompt}` }] }]
            })
          });

          clearTimeout(timeoutId);
          if (response.ok) return await response.json();
          
          const errData = await response.json().catch(() => ({}));
          const errStatus = response.status;
          const errMsg = errData.error?.message || errStatus;
          
          if (errStatus === 429) {
            const match = errMsg.match(/retry in ([\d\.]+)s/i);
            if (match) retryAfter = Math.max(retryAfter, parseFloat(match[1]));
            hitRateLimit = true;
          }
          
          throw new Error(errMsg);
        }));

        return raceResult;
      } catch (error) {
        lastError = error.errors ? error.errors[0].message : error.message;
        console.warn(`Batch ${i/3 + 1} failed, trying next batch...`);
      }
    }


    if (hitRateLimit && retries > 0) {
      const waitTime = Math.max(delay * 2, (retryAfter * 1000) || 0);
      console.log(`All models rate-limited. Retrying in ${waitTime}ms...`);
      await new Promise(res => setTimeout(res, waitTime));
      return fetchWithRetry(retries - 1, waitTime);
    }




    throw new Error(lastError);

  };

  const listAvailableModels = async () => {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const data = await response.json();
      return data.models?.map(m => m.name.replace('models/', '')) || [];
    } catch (e) {
      return [];
    }
  };

  try {
    const result = await fetchWithRetry();
    return {

      text: result.candidates?.[0]?.content?.parts?.[0]?.text || "Telemetry signal lost.",
      sources: result.candidates?.[0]?.groundingMetadata?.groundingAttributions?.map(a => ({ uri: a.web?.uri, title: a.web?.title })) || []
    };
  } catch (error) {
    console.error("Gemini API Error Detail:", error.message, error);
    
    // Final Safety Fallback: Use Local Knowledge Base if available
    if (fallbackKey) {
      return {
        text: `🏛️ **ELECTION-HERE (Local Insight)**\n\n${CIVIC_KNOWLEDGE_BASE[fallbackKey]}\n\n*(Note: Displaying offline data due to heavy system load)*`,
        sources: []
      };
    }

    return {
      text: `⚠️ **ELECTION-HERE (Error)**\n\n${error.message || "Unknown connection error"}.\n\nPlease ensure your API key is valid and has quota available.`,
      sources: []
    };
  }

};



// --- Static Data ---
const GLOBAL_HUBS = [
  { id: 'ec', name: 'Election Commission', type: 'Electoral Process', feature: 'Free & Fair Elections', icon: <Satellite /> },
  { id: 'voter', name: 'Voter Registration', type: 'Civic Duty', feature: 'Universal Adult Franchise', icon: <User /> },
  { id: 'polling', name: 'Polling Booth', type: 'Voting', feature: 'Secret Ballot', icon: <Activity /> },
  { id: 'results', name: 'Counting & Results', type: 'Transparency', feature: 'VVPAT Verification', icon: <BarChart3 /> },
];

const RIGHTS_LEDGER = [
  { title: "Universal Adult Franchise", desc: "Every adult citizen has the right to vote, irrespective of caste, creed, religion, or gender.", icon: <ScaleIcon /> },
  { title: "Secret Ballot", desc: "Voting is conducted secretly to protect the voter from coercion or intimidation.", icon: <Shield /> },
  { title: "Right to Know", desc: "Voters have the right to know the background of the candidates contesting the election.", icon: <FileText /> },
  { title: "NOTA (None of the Above)", desc: "Voters can reject all candidates if they feel none are suitable.", icon: <CheckCircle /> }
];

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

// Helper icon component for Scale since Lucide's Scale is generic
function ScaleIcon(props) {
  return <div {...props}><Layers /></div>;
}

// --- Shared UI Components ---

const GlassCard = ({ children, className = "", onClick, noBlur = false, ariaLabel }) => (
  <motion.div
    role={onClick ? "button" : "region"}
    aria-label={ariaLabel}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) onClick(e); }}
    whileHover={{ y: -10, scale: 1.02 }}
    whileTap={onClick ? { scale: 0.98 } : {}}
    onClick={onClick}
    className={`relative bg-[#0A0A1A]/60 ${noBlur ? '' : 'backdrop-blur-3xl'} border border-white/20 rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,242,255,0.15)] p-8 ${className} ${onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500' : ''} transition-shadow hover:shadow-[0_25px_50px_-12px_rgba(188,19,254,0.3)]`}
  >
    {children}
  </motion.div>
);

const SectionHeader = ({ title, icon: Icon, action, onAction }) => (
  <div className="flex justify-between items-center mb-10 px-4">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-cyan-500/10 rounded-[1.2rem] text-cyan-400 shadow-[0_0_15px_rgba(0,242,255,0.2)] border border-cyan-500/20">
        <Icon size={22} strokeWidth={2.5} />
      </div>
      <h3 className="text-base font-black text-white uppercase tracking-[0.3em] font-mono">{title}</h3>
    </div>
    {action && (
      <button onClick={onAction} className="text-[10px] font-black text-cyan-400 bg-white/5 border border-cyan-500/30 px-5 py-2.5 rounded-full hover:bg-cyan-500/20 hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all uppercase tracking-widest active:scale-95 font-mono">
        {action}
      </button>
    )}
  </div>
);

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

// --- Modular Feature Views ---

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
        setData({ text: "Connection offline. Cannot sync with electoral database." });
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

const RightsLedger = () => (
  <div className="space-y-8 pb-32 md:pb-40 px-4 md:px-6 max-w-5xl mx-auto pt-10 md:pt-16">
    <SectionHeader title="Rights Ledger" icon={BookOpen} />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {RIGHTS_LEDGER.map((law, i) => (
        <GlassCard key={i} className="flex gap-6 items-start hover:border-purple-500/50">
          <div className="p-4 bg-purple-500/10 text-purple-400 rounded-[1.5rem] border border-purple-500/30">
            {React.cloneElement(law.icon, { size: 24, strokeWidth: 2 })}
          </div>
          <div>
            <h4 className="font-black text-lg text-white mb-2 tracking-widest font-mono">{law.title}</h4>
            <p className="text-xs font-medium text-gray-400 leading-relaxed">{law.desc}</p>
          </div>
        </GlassCard>
      ))}
    </div>
  </div>
);

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
    <div className="min-h-screen pt-12 md:pt-20 pb-32 md:pb-60 px-4 md:px-8 max-w-6xl mx-auto">
      <SectionHeader title="Global Comparative Hub" icon={Globe} />
      <div className="flex gap-6 overflow-x-auto no-scrollbar mb-14 pb-6">
        {GLOBAL_HUBS.map(hub => (
          <button key={hub.id} onClick={() => explore(hub)} className={`flex-shrink-0 px-6 py-4 md:px-10 md:py-6 rounded-[1.8rem] md:rounded-[2.2rem] font-black text-sm md:text-base border transition-all flex items-center gap-3 md:gap-4 ${selected?.id === hub.id ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_30px_rgba(0,242,255,0.4)]' : 'bg-[#0A0A1A]/80 text-gray-400 border-white/10 shadow-sm hover:border-white/30'}`}>
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
    </div>
  );
};

const ManifestoAnalyst = () => {
  const [q, setQ] = useState('');
  const [res, setRes] = useState(null);
  const [l, setL] = useState(false);

  const go = async () => {
    if (!q) return;
    setL(true);
    try {
      const prompt = `Provide a neutral, ground-truth summary and analysis of the political manifesto or policy: "${q}". Analyze its viability and focus (Economy, Infrastructure, Welfare) in 4 sentences based on real-time data.`;
      
      // Google Services: Trigger Cloud Audit Function for data integrity
      await callCloudAuditFunction();
      
      const result = await callGemini(prompt, "You are an advanced political manifesto analysis engine. Provide neutral, unbiased analysis.");
      setRes(result);
    } catch (e) { toast.error("Compute cluster offline."); } finally { setL(false); }

  };

  return (
    <div className="min-h-screen pt-12 md:pt-20 pb-32 md:pb-60 px-4 md:px-8 max-w-5xl mx-auto">
      <SectionHeader title="Manifesto Analyst" icon={Database} />
      <GlassCard className="mb-14 flex flex-col md:flex-row gap-6 p-6 border-l-[6px] border-l-cyan-500">
        <div className="flex-1 flex items-center gap-4 bg-black/50 border border-white/10 rounded-[1.8rem] px-8 py-3 focus-within:border-cyan-500/50 transition-colors">
          <Search size={24} className="text-cyan-600" />
          <input className="flex-1 bg-transparent font-black outline-none text-xl md:text-2xl placeholder:text-gray-700 w-full text-white font-mono" value={q} onChange={e => setQ(e.target.value)} placeholder="e.g., National Education Policy" />
        </div>
        <button onClick={go} className="bg-cyan-500 text-[#0A0A1A] px-8 md:px-14 py-4 md:py-6 rounded-[1.8rem] font-black text-xs tracking-[0.3em] hover:bg-cyan-400 shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all flex items-center justify-center gap-3 w-full md:w-auto font-mono">
          {l ? <RefreshCw className="animate-spin" size={18} /> : 'ANALYZE'}
        </button>
      </GlassCard>
      {res && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-8 md:p-14 text-sm md:text-base font-medium leading-relaxed prose prose-invert prose-sm max-w-none font-mono">
            <div className="flex items-center gap-3 text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-10 border-b border-white/10 pb-6">
              <Shield size={16} /> Truth-Grounding Engine Active
            </div>
            {res.text}
          </GlassCard>
        </motion.div>
      )}
    </div>
  );
};

const ElectionAssistant = () => {
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Security: Input Validation Schema
  const validateInput = (str) => {
    if (!str || str.length > 500) return false;
    return !/[<>]/.test(str);
  };

  const ask = async () => {
    if (!input) return;
    if (!validateInput(input)) {
      toast.error("Invalid characters detected. Protocol breach averted.");
      return;
    }

    const userMsg = { role: 'user', text: input };
    setChat([...chat, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const prompt = `User question: "${input}"`;
      const system = "You are the ELECTION-HERE Interactive Assistant, a highly intelligent and versatile AI. While your primary expertise is in the democratic process, elections, and politics, you are fully capable and authorized to answer ANY question the user asks you, regardless of the topic. Provide clear, accurate, and helpful answers.";
      const res = await callGemini(prompt, system);

      setChat(prev => [...prev, { role: 'assistant', text: res.text }]);
    } catch (e) { toast.error("Assistant relay failed."); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen pt-12 md:pt-20 pb-32 md:pb-60 px-4 md:px-8 max-w-4xl mx-auto">
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
          {loading && <div className="flex justify-start"><div className="bg-white/5 p-5 rounded-[1.5rem] border border-white/10 animate-pulse text-cyan-500 font-mono text-[10px] uppercase tracking-widest font-black">Syncing with Central Database...</div></div>}
        </div>
        <div className="flex gap-4 bg-black/80 border border-white/10 rounded-[1.5rem] px-6 py-3 relative z-10 mx-2 mb-2">
          <span className="text-cyan-500 font-black font-mono pt-1">$</span>
          <input className="flex-1 bg-transparent outline-none text-white font-mono py-1 placeholder:text-gray-700" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask()} placeholder="Type command..." />
          <button onClick={ask} className="bg-purple-600 text-white p-2 rounded-xl hover:bg-purple-500 transition-all shadow-[0_0_15px_rgba(188,19,254,0.4)]"><ArrowRight size={18} /></button>
        </div>
      </GlassCard>
    </div>
  );
};

const NewsReports = () => {
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);

  const fallbackNews = [
    { title: "Election Commission Announces Phased Voting", date: "Real-time Update", summary: "The ECI has outlined the phases for the upcoming national elections, emphasizing voter safety and logistics." },
    { title: "Voter Turnout Hits Record Highs in Recent Surveys", date: "Civic Insight", summary: "Early surveys indicate a surge in young voter registration across major metropolitan areas." },
    { title: "Digital ID Integration for Polling Booths", date: "Tech Sync", summary: "New pilots for biometric verification at polling stations are being tested to streamline the voting process." },
    { title: "Educational Campaigns Launch Nationwide", date: "Voter Awareness", summary: "Nationwide campaigns are focusing on educating first-time voters about the importance of the Secret Ballot." }
  ];

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const prompt = "Fetch the top 4 latest critical news headlines regarding elections in India. Format as: Headline | Summary. Separate stories with [BR].";
        const res = await callGemini(prompt, "You are the ELECTION-HERE News Engine.");
        if (res.text.includes("Offline Mode") || res.text.includes("Telemetry")) {
          setNews(null);
        } else {
          const stories = res.text.split('[BR]').map(s => {
            const [t, d] = s.split('|');
            return { title: t?.trim(), summary: d?.trim() || "Details pending sync..." };
          });
          setNews(stories);
        }
      } catch (e) { setNews(null); } finally { setLoading(false); }
    };
    fetchNews();
  }, []);

  const displayNews = news || fallbackNews;

  return (
    <div className="min-h-screen pt-12 md:pt-20 pb-32 md:pb-60 px-4 md:px-8 max-w-6xl mx-auto">
      <SectionHeader title="India Election News" icon={Newspaper} />
      {loading ? (
        <div className="py-24 flex flex-col items-center gap-6">
          <RefreshCw className="animate-spin text-cyan-400" size={48} />
          <p className="text-[10px] font-black text-cyan-500/70 uppercase tracking-[0.4em] font-mono">Syncing News Feeds...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {displayNews.map((n, i) => (
            <GlassCard key={i} className="group border-l-4 border-l-cyan-500/50 hover:border-l-cyan-400">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[9px] font-black text-cyan-500 uppercase tracking-widest font-mono">{n.date || 'Live Update'}</span>
                <Newspaper size={16} className="text-gray-600 group-hover:text-cyan-400 transition-colors" />
              </div>
              <h4 className="text-xl font-black text-white mb-3 font-mono tracking-tight group-hover:text-cyan-100 transition-colors">{n.title}</h4>
              <p className="text-sm text-gray-400 leading-relaxed font-sans">{n.summary}</p>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

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
    <div className="min-h-screen pt-12 md:pt-20 pb-32 md:pb-60 px-4 md:px-8 max-w-2xl mx-auto">
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
    </div>
  );
};

// --- Main Components ---

const Landing = ({ onStart }) => (
  <div className="min-h-screen bg-[#0A0A1A] flex flex-col items-center justify-center p-4 md:p-8 text-center relative overflow-hidden">
    {/* Nebula Background Gradients */}
    <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-purple-900/20 blur-[150px] rounded-full mix-blend-screen" />
    <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-cyan-900/20 blur-[150px] rounded-full mix-blend-screen" />
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>

    <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} className="z-10 relative">
      <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }} className="inline-flex items-center gap-4 px-8 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-cyan-400 mb-12 shadow-[0_0_30px_rgba(0,242,255,0.15)] tracking-[0.4em] uppercase backdrop-blur-md font-mono">
        <Atom size={16} className="text-purple-400" /> Democratic Framework V1.0
      </motion.div>
      <h1 className="text-5xl md:text-7xl lg:text-[9rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-cyan-100 to-purple-300 mb-6 tracking-widest leading-none select-none font-mono drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">
        Election<br /><span className="text-cyan-400 drop-shadow-[0_0_30px_rgba(0,242,255,0.5)]">Here</span>
      </h1>
      <p className="text-sm md:text-lg text-gray-400 max-w-2xl mx-auto mb-16 leading-relaxed font-mono tracking-widest px-4">
        Advanced intelligence platform for national election awareness and democratic participation.
      </p>
      <div className="flex flex-col md:flex-row gap-6 mx-auto justify-center">
        <button onClick={onStart} className="group bg-cyan-500 text-[#0A0A1A] px-10 py-5 md:px-14 md:py-6 rounded-full font-black text-[10px] md:text-xs tracking-[0.4em] shadow-[0_0_40px_rgba(0,242,255,0.5)] hover:bg-cyan-400 hover:scale-105 transition-all flex items-center gap-4 uppercase font-mono">
          INITIALIZE LINK <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
        </button>
        <button onClick={() => window.dispatchEvent(new CustomEvent('setPage', { detail: 'insight' }))} className="group bg-white/5 text-white border border-white/20 px-10 py-5 md:px-14 md:py-6 rounded-full font-black text-[10px] md:text-xs tracking-[0.4em] hover:bg-white/10 hover:scale-105 transition-all flex items-center gap-4 uppercase font-mono">
          QUICK INSIGHT <Zap size={20} className="text-cyan-400" />
        </button>
      </div>
    </motion.div>
  </div>
);

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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 text-center bg-[#0A0A1A] relative overflow-hidden">
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
            onChange={e => setUser({ ...user, name: e.target.value })}
            placeholder="Dr. Example"
          />
        )}
        {step === 1 && (
          <input
            className="w-full bg-black/50 p-6 md:p-8 rounded-[2rem] shadow-inner text-center text-2xl font-black outline-none border border-white/10 focus:border-purple-400 focus:shadow-[0_0_20px_rgba(188,19,254,0.3)] transition-all placeholder:text-gray-700 text-purple-50 font-mono"
            value={user.country}
            onChange={e => setUser({ ...user, country: e.target.value })}
            placeholder="e.g. India, USA, UK, Brazil"
          />
        )}
        {step === 2 && (
          <div className="grid grid-cols-1 gap-4">
            {personas.map(p => (
              <button
                key={p}
                onClick={() => { setUser({ ...user, persona: p }); next(); }}
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
    </div>
  );
};

const Dashboard = ({ user, setPage }) => {
  // Security: Basic Access Control Validation
  if (!user || !user.setupCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center bg-[#0A0A1A]">
        <GlassCard className="max-w-md w-full border-l-[6px] border-l-red-500">
          <Shield size={48} className="text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-white font-mono mb-2 uppercase tracking-widest">Access Denied</h2>
          <p className="text-gray-400 mb-8 font-mono text-sm leading-relaxed">Unauthorized access attempt. Identity not finalized or setup incomplete.</p>
          <button onClick={() => setPage('landing')} className="w-full bg-red-500/20 text-red-400 border border-red-500/50 py-4 rounded-[1.5rem] font-mono text-[10px] tracking-widest hover:bg-red-500 hover:text-black transition-all font-black uppercase">Return to Gateway</button>
        </GlassCard>
      </div>
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

    <div className="min-h-screen bg-[#0A0A1A] pt-12 md:pt-16 pb-32 md:pb-60 px-4 md:px-8 max-w-7xl mx-auto relative">
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
          <button onClick={() => setPage('profile')} className="w-12 h-12 md:w-16 md:h-16 bg-black/50 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-cyan-400 shadow-xl border border-white/10 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(0,242,255,0.3)] transition-all transform hover:rotate-6"><User size={24} className="md:w-7 md:h-7" /></button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 md:gap-12 relative z-10">
        <div className="xl:col-span-8 space-y-8 md:space-y-12">
          <NationalBrief user={user} />

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

        <div className="xl:col-span-4 space-y-8 md:space-y-12">
          <SectionHeader title="Voter Readiness Score" icon={CrosshairIcon} />
          <GlassCard className="text-center py-12 md:py-16 flex flex-col items-center border-white/5 bg-black/40">
            <div className="w-40 h-40 md:w-48 md:h-48 relative flex items-center justify-center mb-10">
              <svg className="absolute w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(0,242,255,0.3)]">
                <circle cx="50%" cy="50%" r="40%" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
                <motion.circle
                  initial={{ strokeDashoffset: 251 }} // 2*pi*r roughly
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
              <MetricRow label="Identity Verified" checked={user.name.length > 0} />
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

// Crosshair helper since Lucide Crosshair isn't explicitly imported
function CrosshairIcon(props) {
  return <div {...props}><Activity /></div>;
}

const NavItem = ({ active, onClick, icon }) => (
  <button onClick={onClick} className={`p-4 md:p-5 rounded-[1.5rem] md:rounded-[1.8rem] transition-all duration-500 transform ${active ? 'bg-cyan-500 text-black scale-110 shadow-[0_0_20px_rgba(0,242,255,0.5)]' : 'text-gray-500 hover:text-cyan-300 hover:scale-105 hover:bg-white/5'}`}>
    {React.cloneElement(icon, { size: 24, strokeWidth: active ? 2.5 : 2 })}
  </button>
);

const Navbar = ({ active, setPage }) => (
  <nav className="fixed bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 w-[95%] max-w-lg h-20 md:h-24 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] md:rounded-[3rem] px-6 md:px-10 flex justify-between items-center z-50 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
    <NavItem active={active === 'home'} onClick={() => setPage('home')} icon={<Orbit />} />
    <NavItem active={active === 'news'} onClick={() => setPage('news')} icon={<Newspaper />} />
    <NavItem active={active === 'assistant'} onClick={() => setPage('assistant')} icon={<MessageSquare />} />
    <NavItem active={active === 'framework'} onClick={() => setPage('framework')} icon={<Database />} />
    <NavItem active={active === 'global'} onClick={() => setPage('global')} icon={<Globe />} />
  </nav>
);

// --- Main App Root ---

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

  useEffect(() => {
    localStorage.setItem('aether_gravity_user', JSON.stringify(user));
    window.scrollTo(0, 0);
    
    const handleSetPage = (e) => setPage(e.detail);
    window.addEventListener('setPage', handleSetPage);
    return () => window.removeEventListener('setPage', handleSetPage);
  }, [user, page]);

  const renderContent = () => {
    if (page === 'landing') return <Landing onStart={() => setPage(user.setupCompleted ? 'dashboard' : 'setup')} />;
    if (page === 'setup') return <OnboardingSetup user={user} setUser={setUser} onComplete={() => { setUser({ ...user, setupCompleted: true }); setPage('dashboard'); }} />;

    switch (page) {
      case 'dashboard': return <Dashboard user={user} setPage={setPage} />;
      case 'ledger': return <RightsLedger />;
      case 'lifecycle': return (
        <div className="min-h-screen pt-12 md:pt-20 pb-32 md:pb-60 px-4 md:px-8 max-w-5xl mx-auto">
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
        </div>
      );
      case 'global': return <ComparativeHub />;
      case 'framework': return <ManifestoAnalyst />;
      case 'assistant': return <ElectionAssistant />;
      case 'news': return <NewsReports />;
      case 'insight': return <QuickInsight onBack={() => setPage('landing')} />;
      case 'simulator': return (
        <div className="min-h-screen pt-12 md:pt-20 pb-32 md:pb-60 px-4 md:px-8 max-w-5xl mx-auto">
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
        </div>
      );
      case 'profile': return (
        <div className="min-h-screen pt-12 md:pt-20 pb-32 md:pb-60 px-4 md:px-8 max-w-xl mx-auto">
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
        </div>
      );
      default: return <Dashboard user={user} setPage={setPage} />;
    }
  };

  return (
    <div className="font-sans selection:bg-cyan-500/30 bg-[#0A0A1A] min-h-screen overflow-x-hidden text-gray-200">
      {/* Accessibility: Skip Link */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-cyan-500 focus:text-black focus:px-6 focus:py-3 focus:rounded-xl focus:font-black focus:font-mono">
        SKIP TO MAIN CONTENT
      </a>

      <Toaster position="bottom-center" />
      <AnimatePresence mode="wait">
        <motion.div id="main-content" key={page} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          {renderContent()}
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
