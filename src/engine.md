# PDA Engine — Implementation Specification for Web Visualizer

## Overview

This document describes the design and implementation of a **Pushdown Automaton (PDA) engine** intended to power an interactive web-based visualizer. The engine is responsible for all computation — parsing, stepping, accepting/rejecting — while the UI layer handles rendering, animation, and user interaction.

---

## 1. Core Data Model

### 1.1 PDA Definition Object

The entire PDA is represented as a single serialisable JSON object:

```ts
interface PDA {
  states: State[];
  inputAlphabet: string[];       // Σ — e.g. ["a", "b"]
  stackAlphabet: string[];       // Γ — e.g. ["a", "b", "Z0"]
  transitions: Transition[];
  startState: string;            // ID of q0
  startStackSymbol: string;      // Z0
  acceptStates: string[];        // IDs of accepting states
  acceptMode: "finalState" | "emptyStack" | "both";
}
```

### 1.2 State

```ts
interface State {
  id: string;          // Unique identifier — e.g. "q1"
  label: string;       // Display name
  isStart: boolean;
  isAccept: boolean;
  position: { x: number; y: number };  // Canvas coordinates for rendering
}
```

### 1.3 Transition

```ts
interface Transition {
  id: string;
  from: string;        // Source state ID
  to: string;          // Target state ID
  input: string;       // Input symbol read, or "ε" for epsilon
  stackPop: string;    // Symbol popped from stack, or "ε"
  stackPush: string;   // Symbol(s) pushed, or "ε" (push nothing)
                       // Multiple symbols: "ab" means push b then a (a on top)
}
```

> **Stack push convention:** The string is pushed right-to-left so the leftmost character ends up on top. E.g. `stackPush = "XY"` → X is on top of Y after push.

---

## 2. Computation Model

### 2.1 Configuration

A **configuration** (also called an instantaneous description, ID) captures the complete state of the machine at any point:

```ts
interface Configuration {
  stateId: string;
  remainingInput: string;    // Unread portion of input
  stack: string[];           // Index 0 = top of stack
  stepNumber: number;
  parentId: string | null;   // For building the execution tree
  id: string;                // Unique ID for this node
  isAccepted: boolean | null;
  isRejected: boolean | null;
}
```

### 2.2 Non-Determinism & Execution Tree

PDAs are **non-deterministic** — multiple transitions may apply at any configuration. The engine must explore **all** branches simultaneously (breadth-first) or lazily (on-demand for step-through mode).

```
                    [initial config]
                    /       |       \
             [branch A]  [branch B]  [branch C]
              /    \         |
           [A1]   [A2]     [B1]
```

The full execution is a **tree of configurations**, not a linear path. The visualizer should render this tree so users can see all live branches.

---

## 3. Engine API

The engine exposes a clean functional interface — no side effects, no global state. Every function returns a new value.

### 3.1 Initialise

```ts
function initEngine(pda: PDA, input: string): EngineState
```

Creates the root configuration. Pushes `startStackSymbol` onto the stack, places the machine in `startState`, and sets `remainingInput` to the full input string.

```ts
interface EngineState {
  pda: PDA;
  input: string;
  configurations: Configuration[];   // All currently live (non-terminated) branches
  history: Configuration[][];        // Snapshot at each step for rewind
  stepCount: number;
  status: "running" | "accepted" | "rejected" | "stuck";
}
```

### 3.2 Step Forward

```ts
function stepForward(state: EngineState): EngineState
```

Advances **all live configurations** by one step:

1. For each live configuration, find all applicable transitions.
2. For each applicable transition, produce a new child configuration.
3. Mark configurations with no applicable transitions and non-empty input as **rejected** (dead branch).
4. Mark configurations that satisfy the accept condition as **accepted**.
5. Return the new engine state with updated `configurations` and appended `history`.

### 3.3 Step Backward (Rewind)

```ts
function stepBackward(state: EngineState): EngineState
```

Pops the last snapshot from `history` and restores it. Enables the step-back button in the UI.

### 3.4 Run to Completion

```ts
function runToEnd(state: EngineState, maxSteps?: number): EngineState
```

Repeatedly calls `stepForward` until the machine halts (all branches accepted or rejected) or `maxSteps` is reached (default: 1000, guards against infinite loops).

### 3.5 Check Acceptance

```ts
function isAccepted(config: Configuration, pda: PDA): boolean
```

Evaluates acceptance based on `pda.acceptMode`:
- **`finalState`**: machine is in an accept state regardless of stack contents.
- **`emptyStack`**: stack is empty regardless of current state.
- **`both`**: either condition suffices.

---

## 4. Transition Matching Logic

```ts
function getApplicableTransitions(
  config: Configuration,
  transitions: Transition[]
): Transition[]
```

A transition `t` applies to configuration `c` if and only if **all three** conditions hold:

| Condition | Rule |
|-----------|------|
| Input match | `t.input === "ε"` OR `t.input === c.remainingInput[0]` |
| Stack match | `t.stackPop === "ε"` OR `t.stackPop === c.stack[0]` |
| Stack non-empty | If `t.stackPop !== "ε"`, stack must not be empty |

### Applying a Transition

```ts
function applyTransition(config: Configuration, t: Transition): Configuration {
  const newInput = t.input === "ε"
    ? config.remainingInput
    : config.remainingInput.slice(1);                  // consume one symbol

  const poppedStack = t.stackPop === "ε"
    ? [...config.stack]
    : config.stack.slice(1);                           // pop top

  const pushedStack = t.stackPush === "ε"
    ? poppedStack
    : [...t.stackPush.split(""), ...poppedStack];      // push new symbols

  return {
    stateId: t.to,
    remainingInput: newInput,
    stack: pushedStack,
    stepNumber: config.stepNumber + 1,
    parentId: config.id,
    id: generateId(),
    isAccepted: null,
    isRejected: null,
  };
}
```

---

## 5. Infinite Loop / Cycle Detection

Non-deterministic PDAs can enter **ε-cycles** — infinite chains of ε-transitions that never consume input. The engine must detect and prune these.

**Strategy:** Before adding a new configuration to the live set, check if an identical `(stateId, remainingInput, stack)` triple has already been seen **on the same branch** (i.e., in the ancestor chain). If yes, mark it rejected as a cycle.

```ts
function hasCycle(config: Configuration, ancestors: Configuration[]): boolean {
  return ancestors.some(a =>
    a.stateId === config.stateId &&
    a.remainingInput === config.remainingInput &&
    arraysEqual(a.stack, config.stack)
  );
}
```

---

## 6. PDA Builder API (Editor Support)

The visualizer needs an editor for building PDAs. These helpers keep the PDA valid at all times.

```ts
function addState(pda: PDA, state: State): PDA
function removeState(pda: PDA, stateId: string): PDA          // also removes incident transitions
function updateState(pda: PDA, stateId: string, patch: Partial<State>): PDA

function addTransition(pda: PDA, t: Transition): PDA
function removeTransition(pda: PDA, tId: string): PDA
function updateTransition(pda: PDA, tId: string, patch: Partial<Transition>): PDA

function setStartState(pda: PDA, stateId: string): PDA
function toggleAcceptState(pda: PDA, stateId: string): PDA
function setAcceptMode(pda: PDA, mode: PDA["acceptMode"]): PDA
```

### Validation

```ts
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  type: "NO_START_STATE" | "UNDEFINED_STATE_REF" | "SYMBOL_NOT_IN_ALPHABET" | ...;
  message: string;
  affectedId?: string;
}

function validatePDA(pda: PDA): ValidationResult
```

Common checks:
- Exactly one start state defined.
- All state IDs in transitions exist in `states`.
- All input symbols in transitions exist in `inputAlphabet` (or are `"ε"`).
- All stack symbols in transitions exist in `stackAlphabet` (or are `"ε"`).
- `startStackSymbol` is in `stackAlphabet`.

---

## 7. Serialisation & Presets

### JSON Import / Export

```ts
function exportPDA(pda: PDA): string         // JSON.stringify with schema version
function importPDA(json: string): PDA        // validates schema before returning
```

Include a `"version"` field in the exported JSON to allow future migrations.

### Built-in Presets

Ship the visualizer with these ready-to-load PDAs:

| Preset Name | Language |
|------------|----------|
| `palindromes` | { ww^R \| w ∈ {a,b}* } |
| `equal_ab` | { aⁿbⁿ \| n ≥ 1 } |
| `balanced_parens` | Balanced parentheses |
| `a_n_b_n_c_n` | (Rejected — not CFL, shows PDA limitation) |
| `empty_language` | PDA that rejects everything |

---

## 8. Visualizer Integration Contract

The engine is **pure logic** — it returns data and the UI renders it. The boundary is:

### Engine → UI (data the UI consumes)

| Data | Used for |
|------|----------|
| `configurations[]` | Draw all live branches; highlight active states |
| `history[][]` | Enable rewind slider |
| `status` | Show accept/reject banner |
| Each `Configuration.stack` | Render animated stack panel |
| `Transition` being applied | Animate the arrow / edge being traversed |

### UI → Engine (events the UI fires)

| Event | Triggers |
|-------|----------|
| User types input string | `initEngine(pda, input)` |
| "Step Forward" button | `stepForward(state)` |
| "Step Backward" button | `stepBackward(state)` |
| "Run" button | `runToEnd(state)` |
| "Reset" button | `initEngine(pda, input)` (re-init) |
| User edits PDA graph | Builder API calls + `validatePDA` |

---

## 9. Suggested Implementation Stack

| Concern | Recommendation |
|---------|---------------|
| Language | TypeScript (strict mode) |
| Framework | React + Zustand for engine state |
| Graph rendering | React Flow (nodes/edges) or D3 |
| Stack animation | Framer Motion |
| Serialisation | Zod for schema validation on import |
| Testing | Vitest — unit test every engine function |

---

## 10. Example: Encoding the Diagram from the Image

The PDA in the uploaded image (recognising palindromes ww^R) encodes as:

```json
{
  "version": "1.0",
  "states": [
    { "id": "q1", "label": "q1", "isStart": true,  "isAccept": false },
    { "id": "q2", "label": "q2", "isStart": false, "isAccept": false },
    { "id": "q3", "label": "q3", "isStart": false, "isAccept": false },
    { "id": "q4", "label": "q4", "isStart": false, "isAccept": true  }
  ],
  "inputAlphabet": ["a", "b"],
  "stackAlphabet": ["a", "b", "Z0"],
  "startState": "q1",
  "startStackSymbol": "Z0",
  "acceptStates": ["q4"],
  "acceptMode": "finalState",
  "transitions": [
    { "id": "t1", "from": "q1", "to": "q2", "input": "ε", "stackPop": "ε",  "stackPush": "Z0" },
    { "id": "t2", "from": "q2", "to": "q2", "input": "a", "stackPop": "ε",  "stackPush": "a"  },
    { "id": "t3", "from": "q2", "to": "q2", "input": "b", "stackPop": "ε",  "stackPush": "b"  },
    { "id": "t4", "from": "q2", "to": "q3", "input": "ε", "stackPop": "ε",  "stackPush": "ε"  },
    { "id": "t5", "from": "q3", "to": "q3", "input": "a", "stackPop": "a",  "stackPush": "ε"  },
    { "id": "t6", "from": "q3", "to": "q3", "input": "b", "stackPop": "b",  "stackPush": "ε"  },
    { "id": "t7", "from": "q3", "to": "q4", "input": "ε", "stackPop": "Z0", "stackPush": "ε"  }
  ]
}
```

---

## 11. File & Module Structure (Suggested)

```
src/
├── engine/
│   ├── types.ts           # All interfaces (PDA, State, Transition, Configuration, EngineState)
│   ├── init.ts            # initEngine()
│   ├── step.ts            # stepForward(), stepBackward()
│   ├── transitions.ts     # getApplicableTransitions(), applyTransition()
│   ├── acceptance.ts      # isAccepted()
│   ├── cycleDetection.ts  # hasCycle()
│   ├── validation.ts      # validatePDA()
│   ├── serialise.ts       # exportPDA(), importPDA()
│   └── presets.ts         # Built-in example PDAs
│
├── store/
│   └── engineStore.ts     # Zustand store wrapping engine state
│
├── components/
│   ├── GraphCanvas.tsx    # State diagram (nodes + edges)
│   ├── StackPanel.tsx     # Animated stack display
│   ├── InputBar.tsx       # Input string entry + tape view
│   ├── ControlBar.tsx     # Step / Run / Reset / Rewind
│   ├── BranchTree.tsx     # Non-deterministic branch explorer
│   ├── TransitionTable.tsx
│   └── Editor/
│       ├── StateEditor.tsx
│       └── TransitionEditor.tsx
│
└── App.tsx
```

---

*This specification is framework-agnostic at the engine layer. The engine functions are pure and can be ported to any JS/TS environment.*