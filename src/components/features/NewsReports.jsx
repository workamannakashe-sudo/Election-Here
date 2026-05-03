import React, { useState, useEffect } from 'react';
import { Newspaper, RefreshCw } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import SectionHeader from '../ui/SectionHeader';
import { callGemini } from '../../services/api';

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
        if (res.text && !res.text.includes("Offline Mode") && !res.text.includes("Telemetry")) {
          const stories = res.text.split('[BR]').map(s => {
            const parts = s.split('|');
            return { 
              title: parts[0]?.trim() || "News Update", 
              summary: parts[1]?.trim() || "Details pending sync..." 
            };
          }).filter(s => s.title.length > 5);
          
          if (stories.length > 0) {
            setNews(stories);
          }
        }
      } catch (e) { 
        console.error("News fetch failed", e);
      } finally { 
        setLoading(false); 
      }
    };
    fetchNews();
  }, []);

  const displayNews = news || fallbackNews;

  return (
    <section className="min-h-screen pt-12 md:pt-20 pb-32 md:pb-60 px-4 md:px-8 max-w-6xl mx-auto">
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
    </section>
  );
};

export default NewsReports;
