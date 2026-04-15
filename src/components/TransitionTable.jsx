import React from 'react';
import { Trash2 } from 'lucide-react';

export default function TransitionTable({ transitions, onDelete }) {
  if (!transitions || transitions.length === 0) {
    return (
      <div className="text-slate-500 text-sm p-4 border border-white/5 rounded-lg border-dashed text-center">
        No transitions defined.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-white/10 rounded-lg hide-scrollbar">
      <table className="w-full text-left text-sm text-slate-300 font-mono">
        <thead className="text-xs uppercase bg-slate-900 text-slate-500 font-sans tracking-widest border-b border-white/10">
          <tr>
            <th className="px-3 py-3">From</th>
            <th className="px-3 py-3 font-bold text-amber-500/80">Input</th>
            <th className="px-3 py-3 font-bold text-rose-500/80">Pop</th>
            <th className="px-2 py-3 text-white/30 text-center">→</th>
            <th className="px-3 py-3">To</th>
            <th className="px-3 py-3 font-bold text-emerald-500/80 text-center">Push</th>
            <th className="px-3 py-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 bg-black/20">
          {transitions.map((t, i) => (
            <tr key={t.id || i} className="hover:bg-white/5 transition-colors group">
              <td className="px-3 py-2 text-blue-300 font-bold">{t.from}</td>
              <td className="px-3 py-2">{t.input === 'ε' ? <span className="text-slate-500">ε</span> : t.input}</td>
              <td className="px-3 py-2">{t.stackPop === 'ε' ? <span className="text-slate-500">ε</span> : t.stackPop}</td>
              <td className="px-2 py-2 text-center text-slate-600">→</td>
              <td className="px-3 py-2 text-blue-300 font-bold">{t.to}</td>
              <td className="px-3 py-2 text-center">{t.stackPush === 'ε' ? <span className="text-slate-500">ε</span> : t.stackPush}</td>
              <td className="px-3 py-2">
                <div className="flex justify-center">
                  <button 
                    onClick={() => onDelete(i)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
