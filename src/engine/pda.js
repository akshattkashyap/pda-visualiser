/**
 * pda.js — Pure PDA simulation engine.
 *
 * Implements the spec from engine.md:
 *  - BFS exploration of all non-deterministic branches
 *  - Configuration tree with parent links
 *  - ε-cycle detection
 *  - Accept modes: finalState / emptyStack / both
 *  - Epsilon uses the literal string "ε"
 */

export const EPSILON = "ε";

let _idCounter = 0;
function generateId() {
  return `cfg-${++_idCounter}`;
}

/**
 * Tokenize a stack push string into individual stack symbols
 * using greedy matching against the PDA's stack alphabet.
 * E.g. "Z0" with alphabet ["a","b","Z0"] → ["Z0"] (not ["Z","0"])
 *      "AZ"  with alphabet ["A","Z"]     → ["A","Z"]
 */
function tokenizeStackString(str, stackAlphabet) {
  if (!str || str === EPSILON) return [];

  // Sort by length descending so longer symbols match first (greedy)
  const sorted = [...stackAlphabet].sort((a, b) => b.length - a.length);
  const tokens = [];
  let remaining = str;

  while (remaining.length > 0) {
    let matched = false;
    for (const sym of sorted) {
      if (sym !== EPSILON && remaining.startsWith(sym)) {
        tokens.push(sym);
        remaining = remaining.slice(sym.length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Fallback: treat next character as a single symbol
      tokens.push(remaining[0]);
      remaining = remaining.slice(1);
    }
  }

  return tokens;
}

// ─── 3.1 Initialise ───────────────────────────────────────────

export function initEngine(pda, input) {
  _idCounter = 0;

  const rootConfig = {
    stateId: pda.startState,
    remainingInput: input,
    stack: pda.startStackSymbol && pda.startStackSymbol !== EPSILON
      ? [pda.startStackSymbol]
      : [],
    stepNumber: 0,
    parentId: null,
    id: generateId(),
    isAccepted: null,
    isRejected: null,
    transitionUsed: null,
  };

  if (checkAcceptance(rootConfig, pda)) {
    rootConfig.isAccepted = true;
  }

  const allConfigs = new Map([[rootConfig.id, rootConfig]]);

  return {
    pda,
    input,
    configurations: [rootConfig],
    history: [[rootConfig]],
    allConfigs,
    stepCount: 0,
    status: rootConfig.isAccepted ? "accepted" : "running",
  };
}

// ─── 3.2 Step Forward ─────────────────────────────────────────

export function stepForward(engineState) {
  if (engineState.status !== "running") return engineState;

  const { pda } = engineState;
  const nextConfigs = [];
  const newAllConfigs = new Map(engineState.allConfigs);

  for (const config of engineState.configurations) {
    // Already terminated — carry forward unchanged
    if (config.isAccepted || config.isRejected) {
      nextConfigs.push(config);
      continue;
    }

    let applicable = getApplicableTransitions(config, pda.transitions);

    // ── Deterministic mode: force single path based on midpoint ──
    if (pda.deterministic) {
      const inputLen = engineState.input.length;
      const midpoint = Math.floor(inputLen / 2);
      const consumed = inputLen - config.remainingInput.length;
      const inStartState = config.stateId === pda.startState;

      if (inStartState && consumed < midpoint) {
        // Push phase: only take input-consuming transitions
        const filtered = applicable.filter(t => t.input !== EPSILON);
        if (filtered.length > 0) applicable = filtered;
      } else if (inStartState && consumed >= midpoint) {
        // At/past midpoint while still in start state: switch via ε
        const filtered = applicable.filter(t => t.input === EPSILON && t.to !== config.stateId);
        if (filtered.length > 0) applicable = filtered;
      }
      // If already past start state (q_pop, q_acc): let normal transitions apply

      // In deterministic mode, only take the first applicable transition
      if (applicable.length > 1) {
        applicable = [applicable[0]];
      }
    }

    if (applicable.length === 0) {
      // Dead branch
      const rejected = { ...config, isRejected: true };
      newAllConfigs.set(rejected.id, rejected);
      nextConfigs.push(rejected);
      continue;
    }

    for (const t of applicable) {
      const child = applyTransition(config, t, pda);

      // Cycle detection — check ancestor chain
      const ancestors = getAncestors(config.id, newAllConfigs);
      if (hasCycle(child, [...ancestors, config])) {
        child.isRejected = true;
      } else if (checkAcceptance(child, pda)) {
        child.isAccepted = true;
      }

      newAllConfigs.set(child.id, child);
      nextConfigs.push(child);
    }
  }

  const newStepCount = engineState.stepCount + 1;

  // Determine overall status
  const anyAccepted = nextConfigs.some(c => c.isAccepted);
  const allTerminated = nextConfigs.every(c => c.isAccepted || c.isRejected);

  let status;
  if (anyAccepted) status = "accepted";
  else if (allTerminated) status = "rejected";
  else status = "running";

  return {
    ...engineState,
    configurations: nextConfigs,
    history: [...engineState.history, nextConfigs],
    allConfigs: newAllConfigs,
    stepCount: newStepCount,
    status,
  };
}

// ─── 3.3 Step Backward ───────────────────────────────────────

export function stepBackward(engineState) {
  if (engineState.stepCount <= 0) return engineState;

  const newHistory = engineState.history.slice(0, -1);
  const prevConfigs = newHistory[newHistory.length - 1];

  return {
    ...engineState,
    configurations: prevConfigs,
    history: newHistory,
    stepCount: engineState.stepCount - 1,
    status: "running",
  };
}

// ─── 3.4 Run to Completion ───────────────────────────────────

export function runToEnd(engineState, maxSteps = 1000) {
  let state = engineState;
  let steps = 0;
  while (state.status === "running" && steps < maxSteps) {
    state = stepForward(state);
    steps++;
  }
  if (steps >= maxSteps && state.status === "running") {
    state = { ...state, status: "stuck" };
  }
  return state;
}

// ─── 4. Transition Matching ──────────────────────────────────

export function getApplicableTransitions(config, transitions) {
  const { stateId, remainingInput, stack } = config;
  const inputChar = remainingInput.length > 0 ? remainingInput[0] : null;

  return transitions.filter(t => {
    if (t.from !== stateId) return false;

    // Input match: ε always matches; otherwise must match first char
    const inputOk = t.input === EPSILON || (inputChar !== null && t.input === inputChar);
    if (!inputOk) return false;

    // Stack match: ε always matches; otherwise must match top and stack non-empty
    if (t.stackPop !== EPSILON) {
      if (stack.length === 0 || stack[0] !== t.stackPop) return false;
    }

    return true;
  });
}

// ─── Applying a Transition ───────────────────────────────────

export function applyTransition(config, t, pda) {
  const newInput = t.input === EPSILON
    ? config.remainingInput
    : config.remainingInput.slice(1);

  const poppedStack = t.stackPop === EPSILON
    ? [...config.stack]
    : config.stack.slice(1);

  const pushSymbols = tokenizeStackString(t.stackPush, pda ? pda.stackAlphabet : []);
  const pushedStack = pushSymbols.length > 0
    ? [...pushSymbols, ...poppedStack]
    : poppedStack;

  return {
    stateId: t.to,
    remainingInput: newInput,
    stack: pushedStack,
    stepNumber: config.stepNumber + 1,
    parentId: config.id,
    id: generateId(),
    isAccepted: null,
    isRejected: null,
    transitionUsed: t,
  };
}

// ─── 3.5 Acceptance ──────────────────────────────────────────

export function checkAcceptance(config, pda) {
  if (config.remainingInput.length > 0) return false;

  const mode = pda.acceptMode || "finalState";
  switch (mode) {
    case "finalState":
      return pda.acceptStates.includes(config.stateId);
    case "emptyStack":
      return config.stack.length === 0;
    case "both":
      return pda.acceptStates.includes(config.stateId) || config.stack.length === 0;
    default:
      return pda.acceptStates.includes(config.stateId);
  }
}

// ─── 5. Cycle Detection ─────────────────────────────────────

function getAncestors(configId, allConfigs) {
  const ancestors = [];
  let current = allConfigs.get(configId);
  while (current && current.parentId) {
    current = allConfigs.get(current.parentId);
    if (current) ancestors.push(current);
  }
  return ancestors;
}

export function hasCycle(config, ancestors) {
  return ancestors.some(a =>
    a.stateId === config.stateId &&
    a.remainingInput === config.remainingInput &&
    arraysEqual(a.stack, config.stack)
  );
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// ─── Utility: walk the tree from root to a config ────────────

export function getConfigPath(configId, allConfigs) {
  const path = [];
  let current = allConfigs.get(configId);
  while (current) {
    path.unshift(current);
    current = current.parentId ? allConfigs.get(current.parentId) : null;
  }
  return path;
}
