import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function StepLog({ log }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log.length]);

  return (
    <div className="flex flex-col h-full bg-black/20 rounded-xl border border-white/5 overflow-hidden">
      <div className="p-3 bg-slate-900/80 border-b border-white/5 flex justify-between items-center text-xs text-slate-400">
        <span className="uppercase tracking-widest font-bold">Execution Log</span>
        <span>{log.length} steps</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1 hide-scrollbar">
        {log.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600 text-sm">
            Simulation has not started.
          </div>
        ) : (
          log.map((entry, idx) => {
            const r = entry.rule;
            
            let badgeStyle = "bg-blue-500/20 text-blue-300 border-blue-500/30";
            if (entry.type === "PUSH") badgeStyle = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
            if (entry.type === "POP") badgeStyle = "bg-rose-500/20 text-rose-300 border-rose-500/30";
            if (entry.type === "ε-MOVE") badgeStyle = "bg-purple-500/20 text-purple-300 border-purple-500/30";

            return (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={idx} 
                className="flex items-center gap-3 p-2 hover:bg-white/5 rounded transition-colors text-sm font-mono text-slate-300"
              >
                <div className={`text-[10px] w-14 text-center px-1 py-0.5 rounded border font-sans font-bold tracking-wide flex-shrink-0 ${badgeStyle}`}>
                  {entry.type}
                </div>
                
                {r ? (
                  <div className="flex items-center gap-2 flex-1 whitespace-nowrap">
                    <span>{r.from}</span>
                    <span className="text-slate-500">,</span>
                    <span className="text-amber-300 font-bold">{r.input}</span>
                    <span className="text-slate-500">,</span>
                    <span className={entry.type === "POP" ? "text-rose-400" : ""}>{r.stackPop}</span>
                    <span className="text-slate-500 mx-1">→</span>
                    <span>{r.to}</span>
                    <span className="text-slate-500">,</span>
                    <span className={entry.type === "PUSH" ? "text-emerald-400" : ""}>{r.stackPush}</span>
                  </div>
                ) : (
                  <div className="flex-1 text-red-400 italic">Path exhausted</div>
                )}

                <div className="text-xs text-slate-500 ml-auto whitespace-nowrap">
                  stack: [{entry.stackAfter.join(', ')}]
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
