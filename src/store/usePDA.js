import { useState, useEffect, useCallback, useRef } from 'react';
import { initEngine, stepForward, stepBackward, getConfigPath, EPSILON } from '../engine/pda';
import { defaultPDA, defaultExample } from '../engine/examples';

function classifyType(t) {
  if (t.input !== EPSILON && t.stackPop !== EPSILON && t.stackPush === EPSILON) return 'POP';
  if (t.input !== EPSILON && t.stackPop !== EPSILON && t.stackPush !== EPSILON) return 'PUSH';
  if (t.input === EPSILON) return 'ε-MOVE';
  return 'MOVE';
}

export function usePDA() {
  const [pdaDef, setPdaDef] = useState(defaultPDA);
  const [inputString, setInput] = useState(defaultExample.defaultInput);
  const [engine, setEngine] = useState(null);
  const [speed, setSpeed] = useState(500);
  const [isRunning, setRunning] = useState(false);

  // ── Pick active config ──
  const activeConfig = (() => {
    if (!engine) return null;
    const { configurations } = engine;
    return (
      configurations.find(c => c.isAccepted) ||
      configurations.find(c => !c.isAccepted && !c.isRejected) ||
      configurations[0] || null
    );
  })();

  // ── Map engine → component view ──
  const currentConfig = (() => {
    if (!engine || !activeConfig) return null;

    const tape = engine.input.split('');
    const head = engine.input.length - activeConfig.remainingInput.length;

    let accepted = null;
    if (engine.status === 'accepted') accepted = true;
    else if (engine.status === 'rejected') accepted = false;

    // Build simple step-by-step log from active config's ancestor path
    const path = getConfigPath(activeConfig.id, engine.allConfigs);
    const log = path.slice(1).map((cfg, i) => {
      const t = cfg.transitionUsed;
      if (!t) return null;
      return {
        type: classifyType(t),
        rule: t,
        stackBefore: path[i].stack,
        stackAfter: cfg.stack,
      };
    }).filter(Boolean);

    return {
      state: activeConfig.stateId,
      tape,
      head,
      stack: activeConfig.stack,
      accepted,
      log,
    };
  })();

  // ── Load / init ──
  const load = useCallback((str) => {
    const es = initEngine(pdaDef, str);
    setEngine(es);
    setRunning(false);
  }, [pdaDef]);

  useEffect(() => {
    if (inputString) load(inputString);
    else setEngine(null);
  }, [pdaDef, inputString, load]);

  // ── Deterministic step: at midpoint, only take ε→q_pop; otherwise only take input-consuming ──
  const forward = useCallback(() => {
    if (!engine || engine.status !== 'running') return;
    setEngine(prev => stepForward(prev));
  }, [engine]);

  const backward = useCallback(() => {
    if (!engine || engine.stepCount <= 0) return;
    setEngine(prev => stepBackward(prev));
  }, [engine]);

  const reset = useCallback(() => {
    if (inputString) load(inputString);
    setRunning(false);
  }, [load, inputString]);

  // ── Auto-run ──
  const savedForward = useRef(forward);
  const savedEngine = useRef(engine);
  useEffect(() => { savedForward.current = forward; }, [forward]);
  useEffect(() => { savedEngine.current = engine; }, [engine]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      const e = savedEngine.current;
      if (e && e.status === 'running') {
        savedForward.current();
      } else {
        setRunning(false);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [isRunning, speed]);

  return {
    pdaDef, setPdaDef,
    inputString, setInput,
    currentConfig,
    forward, backward, reset, load,
    speed, setSpeed,
    isRunning, setRunning,
  };
}
