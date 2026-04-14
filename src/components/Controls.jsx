import React from 'react';
import { Play, Pause, SkipBack, StepForward, RotateCcw } from 'lucide-react';

export default function Controls({ forward, backward, reset, speed, setSpeed, isRunning, setRunning, canGoBack, canGoForward }) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-900 border-t border-white/10 gap-4 mt-auto">
      <div className="flex items-center gap-2">
        <button 
          onClick={reset}
          className="glass-button flex items-center gap-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
        >
          <RotateCcw size={16} /> Reset
        </button>
        <div className="w-px h-6 bg-white/10 mx-2" />
        <button 
          onClick={backward}
          disabled={!canGoBack}
          className="glass-button flex items-center gap-2 text-slate-300"
        >
          <SkipBack size={16} /> Back
        </button>
        <button 
          onClick={forward}
          disabled={!canGoForward && !isRunning}
          className="glass-button flex items-center gap-2 text-slate-300"
        >
          Step <StepForward size={16} />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => setRunning(!isRunning)}
          className={`glass-button flex items-center gap-2 shadow-lg transition-colors ${
            isRunning 
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30' 
            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
          }`}
        >
          {isRunning ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Run All</>}
        </button>

        <div className="flex items-center gap-3 text-sm text-slate-400 font-medium">
          <span>Speed</span>
          <input 
            type="range" 
            min="100" 
            max="2000" 
            step="100"
            value={2100 - speed} // Invert slider so right = fast (low ms)
            onChange={(e) => setSpeed(2100 - Number(e.target.value))}
            className="w-24 accent-blue-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
