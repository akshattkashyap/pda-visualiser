import React from 'react';
import { motion } from 'framer-motion';

export default function StateCircle({ state, accepted }) {
  const isAccepted = accepted === true;
  const isRejected = accepted === false;
  
  return (
    <div className="flex flex-col items-center justify-center overflow-hidden">
      <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Current State</h3>
      <motion.div 
        layout
        className={`w-20 h-20 rounded-full flex items-center justify-center border-[3px] text-lg font-bold shadow-2xl transition-all duration-300 relative ${
          isAccepted ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
          : isRejected ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_30px_rgba(244,63,94,0.3)]'
          : 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.2)]'
        }`}
      >
        {isAccepted && (
          <div className="absolute inset-2 border-[2px] border-emerald-500/50 rounded-full" />
        )}
        {state}
      </motion.div>
      
      {isAccepted && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-medium">
          String accepted ✓
        </motion.div>
      )}
      {isRejected && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-xs font-medium">
          Rejected ✗
        </motion.div>
      )}
    </div>
  );
}
