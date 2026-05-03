import React from 'react';
import { BookOpen, Shield, FileText, CheckCircle, Layers } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import SectionHeader from '../ui/SectionHeader';

const RIGHTS_LEDGER = [
  { title: "Universal Adult Franchise", desc: "Every adult citizen has the right to vote, irrespective of caste, creed, religion, or gender.", icon: <Layers /> },
  { title: "Secret Ballot", desc: "Voting is conducted secretly to protect the voter from coercion or intimidation.", icon: <Shield /> },
  { title: "Right to Know", desc: "Voters have the right to know the background of the candidates contesting the election.", icon: <FileText /> },
  { title: "NOTA (None of the Above)", desc: "Voters can reject all candidates if they feel none are suitable.", icon: <CheckCircle /> }
];

const RightsLedger = () => (
  <section className="space-y-8 pb-32 md:pb-40 px-4 md:px-6 max-w-5xl mx-auto pt-10 md:pt-16">
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
  </section>
);

export default RightsLedger;
