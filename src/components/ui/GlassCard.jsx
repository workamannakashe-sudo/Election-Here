import React from 'react';
import { motion } from 'framer-motion';

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

export default GlassCard;
