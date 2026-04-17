import React, { useState } from 'react';
import TransitionTable from './TransitionTable';
import { examples } from '../engine/examples';
import { Plus } from 'lucide-react';

const E = "ε";

export default function DefinitionPanel({ pdaDef, setPdaDef, inputString, setInput, load }) {
  const [newRule, setNewRule] = useState({ from: '', input: '', stackPop: '', to: '', stackPush: '' });
  const [newStateName, setNewStateName] = useState('');
  
  const handleLoadExample = (e) => {
    const ex = examples.find(x => x.id === e.target.value);
    if (ex) {
      setPdaDef(ex.pda);
      setInput(ex.defaultInput);
      load(ex.defaultInput);
    }
  };

  const handleAddState = () => {
    const stateIds = pdaDef.states.map(s => s.id);
    if (newStateName && !stateIds.includes(newStateName)) {
      setPdaDef({
        ...pdaDef,
        states: [...pdaDef.states, { id: newStateName, label: newStateName, isStart: false, isAccept: false }]
      });
      setNewStateName('');
    }
  };

  const handleAddRule = () => {
    if (newRule.from && newRule.to) {
      setPdaDef({
        ...pdaDef,
        transitions: [...pdaDef.transitions, {
          id: `t-${Date.now()}`,
          from: newRule.from,
          to: newRule.to,
          input: newRule.input || E,
          stackPop: newRule.stackPop || E,
          stackPush: newRule.stackPush || E,
        }]
      });
      setNewRule({ ...newRule, input: '', stackPop: '', stackPush: '' });
    }
  };

  const handleDeleteRule = (index) => {
    const newTrans = [...pdaDef.transitions];
    newTrans.splice(index, 1);
    setPdaDef({ ...pdaDef, transitions: newTrans });
  };

  return (
    <div className="flex flex-col gap-6 h-full p-6 overflow-y-auto hide-scrollbar">
      {/* Header & Example Loader */}
      <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">PDA Simulator</h1>
          <p className="text-xs text-slate-400 mt-1">Pushdown Automaton IDE</p>
        </div>
        <select 
          className="glass-input cursor-pointer min-w-[200px]"
          onChange={handleLoadExample}
          defaultValue="equal_ab"
        >
          <option value="" disabled>Load Example...</option>
          {examples.map(ex => (
            <option key={ex.id} value={ex.id}>{ex.name}</option>
          ))}
        </select>
      </div>

      {/* Input Tape Loader */}
      <div className="bg-slate-900/50 p-5 rounded-xl border border-white/5">
        <h2 className="text-sm uppercase tracking-widest font-bold text-slate-500 mb-4">Input String</h2>
        <div className="flex gap-3">
          <input 
            type="text" 
            className="glass-input flex-1 font-mono text-lg"
            placeholder="e.g. ((()))"
            value={inputString}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(inputString)}
          />
        </div>
      </div>

      {/* States Editor */}
      <div className="bg-slate-900/50 p-5 rounded-xl border border-white/5">
        <h2 className="text-sm uppercase tracking-widest font-bold text-slate-500 mb-4">States</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {pdaDef.states.map(s => {
            const sid = s.id;
            const isStart = pdaDef.startState === sid;
            const isAccept = pdaDef.acceptStates.includes(sid);
            return (
              <div key={sid} className="flex overflow-hidden rounded-lg border border-white/10 text-sm">
                <div className="px-3 py-1.5 bg-slate-800 font-bold">{sid}</div>
                <button 
                  className={`px-2 py-1.5 text-xs transition-colors ${isStart ? 'bg-amber-500/20 tracking-wider text-amber-300 font-bold' : 'bg-slate-900 text-slate-500 hover:text-white'}`}
                  onClick={() => setPdaDef({ ...pdaDef, startState: sid })}
                  title="Set as Start State"
                >
                  Start
                </button>
                <button 
                  className={`px-2 py-1.5 text-xs transition-colors ${isAccept ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'bg-slate-900 text-slate-500 hover:text-white'}`}
                  onClick={() => setPdaDef({ 
                    ...pdaDef, 
                    acceptStates: isAccept ? pdaDef.acceptStates.filter(x => x !== sid) : [...pdaDef.acceptStates, sid] 
                  })}
                  title="Toggle Accept State"
                >
                  Accept
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="New state name..." 
            className="glass-input w-40" 
            value={newStateName}
            onChange={e => setNewStateName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddState()}
          />
          <button onClick={handleAddState} className="glass-button"><Plus size={16}/></button>
        </div>
      </div>

      {/* Transitions Editor */}
      <div className="bg-slate-900/50 p-5 rounded-xl border border-white/5 flex-1 flex flex-col">
        <h2 className="text-sm uppercase tracking-widest font-bold text-slate-500 mb-4">Transition Function (δ)</h2>
        
        <div className="flex flex-wrap items-center gap-2 mb-4 bg-black/20 p-3 rounded-lg border border-white/5">
          <input className="glass-input w-20 text-center font-mono placeholder:font-sans" placeholder="from" value={newRule.from} onChange={e => setNewRule({...newRule, from: e.target.value})} />
          <span className="text-slate-500">,</span>
          <input className="glass-input w-16 text-center text-amber-300 font-mono font-bold placeholder:font-sans" placeholder="in ε" value={newRule.input} onChange={e => setNewRule({...newRule, input: e.target.value.replace(/-/g, 'ε')})} title="Type '-' for ε" />
          <span className="text-slate-500">,</span>
          <input className="glass-input w-16 text-center text-rose-300 font-mono font-bold placeholder:font-sans" placeholder="pop ε" value={newRule.stackPop} onChange={e => setNewRule({...newRule, stackPop: e.target.value.replace(/-/g, 'ε')})} title="Type '-' for ε" />
          <span className="text-white/30 hidden sm:inline">→</span>
          <input className="glass-input w-20 text-center font-mono placeholder:font-sans" placeholder="to" value={newRule.to} onChange={e => setNewRule({...newRule, to: e.target.value})} />
          <span className="text-slate-500">,</span>
          <input className="glass-input w-20 text-center text-emerald-300 font-mono font-bold placeholder:font-sans" placeholder="push ε" value={newRule.stackPush} onChange={e => setNewRule({...newRule, stackPush: e.target.value.replace(/-/g, 'ε')})} title="Type '-' for ε" />
          
          <div className="flex flex-col ml-auto gap-1">
            <button onClick={handleAddRule} className="glass-button bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/40 w-full">
              Add
            </button>
            <span className="text-xs text-slate-400 text-center mt-1">Tip: type <b>-</b> for ε</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto hide-scrollbar min-h-[300px]">
          <TransitionTable transitions={pdaDef.transitions} onDelete={handleDeleteRule} />
        </div>
      </div>
    </div>
  );
}
