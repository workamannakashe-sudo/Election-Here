import React from 'react';

const SectionHeader = ({ title, icon: Icon, action, onAction }) => (
  <div className="flex justify-between items-center mb-10 px-4">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-cyan-500/10 rounded-[1.2rem] text-cyan-400 shadow-[0_0_15px_rgba(0,242,255,0.2)] border border-cyan-500/20">
        <Icon size={22} strokeWidth={2.5} />
      </div>
      <h3 className="text-base font-black text-white uppercase tracking-[0.3em] font-mono">{title}</h3>
    </div>
    {action && (
      <button 
        onClick={onAction} 
        aria-label={action}
        className="text-[10px] font-black text-cyan-400 bg-white/5 border border-cyan-500/30 px-5 py-2.5 rounded-full hover:bg-cyan-500/20 hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all uppercase tracking-widest active:scale-95 font-mono"
      >
        {action}
      </button>
    )}
  </div>
);

export default SectionHeader;
