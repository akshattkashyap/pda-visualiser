import React from 'react';
import Tape from './Tape';
import Stack from './Stack';
import StateCircle from './StateCircle';
import StepLog from './StepLog';
import StateDiagram from './StateDiagram';

export default function SimulationPanel({ pdaDef, currentConfig }) {
  if (!currentConfig) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-neutral-500 gap-4">
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl">?</div>
        <p className="text-sm">Load a tape to begin simulation.</p>
      </div>
    );
  }

  const lastRule = currentConfig.log.length > 0
    ? currentConfig.log[currentConfig.log.length - 1].rule
    : null;

  return (
    <div className="flex gap-4 p-4 h-full min-h-0">
      <div className="flex-1 flex flex-col gap-4 min-h-0 min-w-0">

        {/* State Diagram */}
        <div className="glass-panel flex-none h-[280px] relative overflow-auto">
          <div className="absolute top-3 left-4 z-10 text-xs uppercase tracking-widest font-bold text-neutral-500 pointer-events-none">
            State Transition Diagram
          </div>
          <StateDiagram
            pdaDef={pdaDef}
            activeState={currentConfig.state}
            accepted={currentConfig.accepted}
            lastRule={lastRule}
          />
        </div>

        {/* Current State + Tape */}
        <div className="glass-panel flex-none h-[140px] flex items-center px-6 gap-6">
          <StateCircle state={currentConfig.state} accepted={currentConfig.accepted} />
          <div className="w-px self-stretch bg-white/5 mx-2" />
          <div className="flex-1 flex justify-center overflow-x-auto hide-scrollbar">
            <Tape tape={currentConfig.tape} head={currentConfig.head} />
          </div>
        </div>

        {/* Execution Log */}
        <div className="glass-panel flex-1 overflow-hidden p-0 min-h-0">
          <StepLog log={currentConfig.log} />
        </div>

      </div>

      {/* Stack */}
      <div className="glass-panel flex-none w-[180px] flex flex-col p-4 min-h-0">
        <Stack stack={currentConfig.stack} />
      </div>
    </div>
  );
}
