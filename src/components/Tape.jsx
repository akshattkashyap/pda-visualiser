import React from 'react';
import { motion } from 'framer-motion';

export default function Tape({ tape, head }) {
  // If no string, show a single empty cell for visual clarity
  const cells = tape.length > 0 ? tape : [''];

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">Input Tape</h3>
      <div className="flex overflow-x-auto max-w-full pb-4 hide-scrollbar relative">
        <div className="flex gap-1 px-4">
          {cells.map((char, i) => {
            const isPast = i < head;
            const isCurrent = i === head;

            return (
              <div key={i} className="flex flex-col items-center relative">
                <motion.div 
                  layout
                  className={`w-10 h-12 flex flex-col justify-center items-center text-lg font-bold border rounded transition-colors ${
                    isCurrent ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : isPast ? 'bg-slate-800/50 text-slate-500 border-white/5'
                    : 'bg-slate-800 text-slate-200 border-white/10'
                  }`}
                >
                  <span>{char === '' ? 'ε' : char}</span>
                </motion.div>
                {isCurrent && (
                  <motion.div 
                    layoutId="read-head"
                    className="absolute -bottom-4 text-amber-500 text-lg"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    ▲
                  </motion.div>
                )}
              </div>
            );
          })}
          {head >= tape.length && (
            <div className="flex flex-col items-center relative">
              <div className="w-10 h-12 flex justify-center items-center text-lg font-bold border border-white/5 rounded bg-slate-900/50 text-slate-600">
                -
              </div>
              <motion.div 
                layoutId="read-head"
                className="absolute -bottom-4 text-emerald-500 text-lg"
              >
                ▲
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
