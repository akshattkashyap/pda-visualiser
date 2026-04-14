import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Stack({ stack }) {
  return (
    <div className="flex flex-col w-full h-full">
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-3 flex-shrink-0">
        <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold">Stack</h3>
        <span className="text-xs font-mono bg-neutral-800 text-neutral-300 px-2 rounded-full border border-white/10">
          {stack.length}
        </span>
      </div>

      {/* Stack grows downward visually but logically top = index 0.
          We render from bottom to top: reverse the array, display bottom item first,
          then items stack upward using flex-col-reverse on the scrollable zone. */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Scrollable cells region — flex-col-reverse so new items appear at top */}
        <div className="flex-1 overflow-y-auto flex flex-col justify-end items-center gap-0.5 hide-scrollbar min-h-0 pt-1">
          <AnimatePresence initial={false} mode="popLayout">
            {stack.map((char, index) => {
              const isTop = index === 0;
              return (
                <motion.div
                  key={`${index}-${char}`}
                  layout
                  initial={{ opacity: 0, y: -12, scale: 0.9 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    backgroundColor: isTop ? 'rgba(59,130,246,0.12)' : 'rgba(38,38,38,0.7)',
                    borderColor: isTop ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)',
                  }}
                  exit={{ opacity: 0, scale: 0.85, backgroundColor: 'rgba(239,68,68,0.2)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className={`w-20 h-10 border rounded flex justify-center items-center font-mono font-bold text-base flex-shrink-0 ${
                    isTop ? 'text-blue-300' : 'text-neutral-300'
                  }`}
                >
                  {char}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Bottom-of-stack marker — normal flow, always visible, never clipped */}
        <div className="flex flex-col items-center flex-shrink-0 mt-1">
          <div className="w-20 h-[3px] bg-neutral-600 rounded" />
          <span className="text-neutral-500 font-bold text-lg mt-0.5 leading-none">⊥</span>
        </div>
      </div>
    </div>
  );
}
