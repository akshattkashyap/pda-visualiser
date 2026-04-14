# PDA Simulator — Project Documentation

A web-based tool for defining, visualising, and stepping through **Pushdown Automata (PDAs)** to help learners understand how context-free languages are recognised.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [What is a Pushdown Automaton?](#2-what-is-a-pushdown-automaton)
3. [Application Architecture](#3-application-architecture)
4. [UI Layout & Panels](#4-ui-layout--panels)
5. [State Transition Diagram Canvas](#5-state-transition-diagram-canvas)
6. [Core Features](#6-core-features)
7. [PDA Data Model](#7-pda-data-model)
8. [Simulation Engine](#8-simulation-engine)
9. [Stack Visualisation](#9-stack-visualisation)
10. [Transition Table Editor](#10-transition-table-editor)
11. [Step Log & History](#11-step-log--history)
12. [Built-in Examples](#12-built-in-examples)
13. [Tech Stack & File Structure](#13-tech-stack--file-structure)
14. [Component Breakdown](#14-component-breakdown)
15. [State Management](#15-state-management)
16. [Non-Determinism Handling](#16-non-determinism-handling)
17. [Edge Cases & Validation](#17-edge-cases--validation)
18. [Accessibility](#18-accessibility)
19. [Extending the Project](#19-extending-the-project)
20. [Glossary](#20-glossary)

---

## 1. Project Overview

The PDA Simulator is a single-page web application that lets students:

- **Define** a PDA by entering states, alphabets, and transition rules through a form-based editor.
- **Load** an input string onto a visual tape.
- **Step** through execution one transition at a time, or run the full simulation at a chosen speed.
- **Watch** the stack update in real time, with colour-coded push and pop animations.
- **Read** a plain-English step log that narrates every move the automaton makes.

The project targets undergraduate students studying formal languages and automata theory. No installation is required — everything runs in the browser.

---

## 2. What is a Pushdown Automaton?

A **Pushdown Automaton** is a finite automaton augmented with an unbounded stack. It is more powerful than a plain finite automaton and can recognise exactly the class of **context-free languages** (CFLs).

### Formal Definition

A PDA is a 7-tuple:

```
M = (Q, Σ, Γ, δ, q₀, Z₀, F)
```

| Symbol | Meaning |
|--------|---------|
| `Q` | Finite set of states |
| `Σ` | Input alphabet (symbols on the tape) |
| `Γ` | Stack alphabet (symbols that can appear on the stack) |
| `δ` | Transition function: `Q × (Σ ∪ {ε}) × Γ → P(Q × Γ*)` |
| `q₀` | Start state (`q₀ ∈ Q`) |
| `Z₀` | Initial stack symbol (`Z₀ ∈ Γ`) |
| `F` | Set of accepting states (`F ⊆ Q`) |

### Acceptance Modes

A PDA can accept a string in two ways:

- **By final state** — the input is fully consumed and the current state is in `F`.
- **By empty stack** — the input is fully consumed and the stack is empty.

This simulator uses **acceptance by final state**, which is the most common convention in textbooks.

### How a Transition Works

Each transition rule takes the form:

```
(currentState, inputSymbol, stackTop) → (nextState, stackPush)
```

- `inputSymbol` can be `ε` (epsilon), meaning the transition consumes no input.
- `stackPush` can be `ε`, meaning the top of the stack is popped and nothing is pushed (a net pop).
- `stackPush` can be a string like `AB`, meaning pop one symbol and push `B` then `A` (left-to-right in the string becomes top-to-bottom on the stack).

### Classic Example — Balanced Parentheses

The language `{ (ⁿ )ⁿ | n ≥ 0 }` (strings with matched opening and closing brackets) is context-free but not regular. A PDA for it:

| From | Input | Pop | To | Push |
|------|-------|-----|----|------|
| q0 | ε | — | q1 | Z |
| q1 | ( | Z | q1 | (Z |
| q1 | ( | ( | q1 | (( |
| q1 | ) | ( | q1 | ε |
| q1 | ε | Z | q2 | Z |

State `q2` is the accepting state. If all brackets are matched, the stack returns to just `Z` when the input ends, and the machine transitions to `q2`.

---

## 3. Application Architecture

```
pda-simulator/
├── index.html          ← Entry point, mounts the React app
├── src/
│   ├── App.jsx         ← Root component, global layout
│   ├── engine/
│   │   ├── pda.js      ← Pure PDA logic (no UI)
│   │   └── examples.js ← Pre-built PDA definitions
│   ├── components/
│   │   ├── DefinitionPanel.jsx   ← Left panel: state/transition editor
│   │   ├── SimulationPanel.jsx   ← Right panel: tape, stack, log
│   │   ├── TransitionTable.jsx   ← Editable table of rules
│   │   ├── Tape.jsx              ← Input tape with read-head
│   │   ├── Stack.jsx             ← Animated stack visualiser
│   │   ├── StateCircle.jsx       ← Current-state indicator
│   │   ├── StepLog.jsx           ← Scrollable step history
│   │   └── Controls.jsx          ← Playback buttons and speed slider
│   ├── store/
│   │   └── usePDA.js   ← Custom hook: all simulation state
│   └── styles/
│       └── app.css     ← Global styles and CSS variables
├── package.json
└── vite.config.js
```

The application has **no backend**. All logic runs in the browser. The PDA engine (`engine/pda.js`) is a pure JavaScript module with no React dependency, making it easy to test in isolation.

---

## 4. UI Layout & Panels

The interface is split into two side-by-side panels separated by a 1px border, with a shared top bar and a shared control bar at the bottom.

```
┌─────────────────────────────────────────────────────┐
│  PDA Simulator                    [Load example] [Clear] │  ← Top bar
├──────────────────────┬──────────────────────────────┤
│                      │                              │
│  DEFINITION PANEL    │   SIMULATION PANEL           │
│                      │                              │
│  • States editor     │   • Input tape               │
│  • Transition form   │   • Stack visualiser         │
│  • Transition table  │   • Current state circle     │
│  • Input string      │   • Step log                 │
│                      │                              │
├──────────────────────┴──────────────────────────────┤
│  [⏮ Reset]  [← Back]  [Forward →]  [▶ Run all]  Speed: ─○─ │  ← Controls
└─────────────────────────────────────────────────────┘
```

### Responsive behaviour

On screens narrower than 768 px, the two panels stack vertically (definition on top, simulation below). The tape scrolls horizontally if the input string is long.

---

## 5. State Transition Diagram Canvas

The centrepiece of the simulation view is a **live state transition diagram** — a graphical rendering of the PDA drawn in the style used by every formal languages textbook: circles for states, arrows for transitions, self-loops for rules that return to the same state, and transition labels written directly on the edges.

### Visual conventions

| Element | Appearance |
|---------|-----------|
| Regular state | Single circle with state name inside |
| Start state | Single circle with a short inbound arrow (no source) |
| Accepting state | Double-ringed circle (inner and outer ring) |
| Active state | Circle filled in amber/highlight colour during simulation |
| Transition arrow | Directed line between circles, label above the midpoint |
| Self-loop | Curved arc departing and returning to the same circle, label above |
| Dead/rejected path | Arrow and source state dim to low opacity |

### Transition label format

Each edge is labelled using the standard notation:

```
input, stackTop → stackPush
```

Where `ε` is used for the empty string. For example:

- `a, ε → a` — read `a`, push `a` (no pop required)
- `b, b → ε` — read `b`, pop `b` (net pop)
- `ε, Z₀ → ε` — consume nothing, pop Z₀ (transition to accept)

When multiple rules share the same source and target states, they are stacked as multiple label lines on a single arrow rather than drawing duplicate arrows.

### Live highlighting during simulation

As the simulation steps forward, the diagram updates in sync:

- The **current state** circle is filled with an amber highlight.
- The **transition that just fired** — its arrow — is drawn thicker and in a contrasting colour for one step, then fades back to normal.
- **Accepted state** circles fill green when the machine halts in an accepting state.
- **Rejected state** circles fill red on rejection.

This means a student watching the "Run all" mode sees the machine literally moving through the diagram in real time, which is the primary learning affordance of the tool.

### Diagram layout algorithm

States are laid out automatically using a simple **left-to-right linear layout** for chains (the most common textbook PDA shape), with self-loops drawn as arcs above their node. For more complex graphs with branching, a **force-directed layout** (using a lightweight spring simulation) spaces nodes to minimise arrow crossings.

The `StateDiagram.jsx` component handles rendering. It receives the PDA definition and the current active state from `usePDA`, and redraws using SVG on every state change.

```
StateDiagram.jsx
  props:
    pdaDef        — full PDA definition object
    activeState   — string, the current state during simulation
    firedRule     — the transition rule object that just fired (or null)
    accepted      — boolean | null
```

### Diagram canvas interactions

- **Click a state** to highlight all transitions entering and leaving it in the transition table.
- **Click an arrow** to highlight that rule's row in the transition table editor.
- **Drag states** to reposition them manually if the auto-layout is not ideal.
- **Zoom and pan** via scroll wheel and drag on the canvas background.

### SVG rendering approach

The diagram is rendered as an inline SVG element. Key geometry is computed in JavaScript before rendering:

- State circle positions are stored as `{ x, y }` in component state.
- Straight arrows use `<line>` elements; self-loops use `<path>` with a cubic Bézier arc.
- Arrow labels are `<text>` elements anchored to the midpoint of the edge, offset 12px above the line.
- The arrowhead is a reusable SVG `<marker>` defined in `<defs>`.

For self-loops specifically, the arc is drawn as:

```js
// Self-loop arc above a circle centred at (cx, cy) with radius r
const loopPath = `M ${cx - r*0.6} ${cy - r*0.3}
  C ${cx - r*1.4} ${cy - r*2.2},
    ${cx + r*1.4} ${cy - r*2.2},
    ${cx + r*0.6} ${cy - r*0.3}`;
```

This produces the characteristic upward teardrop arc seen in textbook automaton diagrams.

---

## 6. Core Features

### 5.1 PDA Definition Editor

- Add states by typing a name and clicking `+ State`.
- Mark any state as the **start state** (only one allowed) or as an **accepting state** (multiple allowed) using toggle chips.
- Add transitions via a five-field form: `From`, `Input` (or `ε`), `Pop`, `To`, `Push` (or `ε`).
- Delete any transition by clicking the × on its table row.
- All fields are validated before a rule is accepted (see [Edge Cases](#16-edge-cases--validation)).

### 5.2 Input Tape

- Type any string into the input field and click `Load`.
- The tape renders each character as a cell.
- The **read-head** (▲ pointer) sits under the current character.
- Already-consumed characters are dimmed.
- The current character being read is highlighted in amber.

### 5.3 Stack Visualiser

- The stack grows downward visually (top of stack = topmost cell).
- **Push**: a new cell slides in at the top with a green flash animation (~300 ms).
- **Pop**: the top cell turns red and fades out (~300 ms).
- The bottom-of-stack marker `⊥` is always visible.
- Stack depth is shown as a numeric badge.

### 5.4 Step-by-Step Execution

- **Step forward**: applies the next valid transition, updates tape head, stack, and current state.
- **Step backward**: restores the previous snapshot (tape position, stack, state, log).
- **Run all**: repeatedly steps forward at the chosen speed (100 ms – 2000 ms per step).
- **Reset**: returns to the initial configuration (q₀, full tape, empty stack except Z₀).

### 5.5 Step Log

Each step appends a row showing:
- The tag type (`PUSH`, `POP`, `MOVE`, `ε-MOVE`, `REJECT`)
- The transition rule that fired
- The resulting stack top and current state

### 5.6 Acceptance Display

When the simulation ends:
- **Accepted**: state circle turns green, a banner reads "String accepted ✓"
- **Rejected**: state circle turns red, a banner explains why (no valid transition, or wrong state at end of input)

---

## 7. PDA Data Model

The PDA definition is stored as a plain JavaScript object:

```js
{
  states: ['q0', 'q1', 'q2'],          // all state names
  inputAlphabet: ['(', ')'],            // Σ
  stackAlphabet: ['(', 'Z'],            // Γ
  startState: 'q0',
  initialStackSymbol: 'Z',             // Z₀
  acceptStates: ['q2'],
  transitions: [
    {
      from:  'q1',
      input: '(',   // use '' for ε
      pop:   'Z',
      to:    'q1',
      push:  '(Z'   // left char = new top; use '' for ε (net pop)
    },
    // ...
  ]
}
```

This object is serialisable to JSON, so users can copy it out or load it back in via a "Import / Export" panel (see [Extending the Project](#18-extending-the-project)).

---

## 8. Simulation Engine

The engine (`engine/pda.js`) exposes three functions:

### `initialConfig(pda, inputString)`

Returns the starting configuration:

```js
{
  state: pda.startState,
  tape: inputString.split(''),
  head: 0,
  stack: [pda.initialStackSymbol],
  accepted: null,   // null = in progress, true = accepted, false = rejected
  log: []
}
```

### `step(pda, config)`

Returns a **new** configuration (immutable — the old one is kept for undo). Looks up `δ(config.state, tape[head], stack[0])` and applies the first matching rule. Returns `{ ...config, accepted: false }` if no rule matches.

```js
function step(pda, config) {
  const { state, tape, head, stack } = config;
  const inputSymbol = head < tape.length ? tape[head] : '';

  // Find a matching transition (prefer non-ε input over ε)
  const rule = pda.transitions.find(t =>
    t.from === state &&
    (t.input === inputSymbol || t.input === '') &&
    t.pop === stack[0]
  );

  if (!rule) return { ...config, accepted: false };

  const newStack = [...stack.slice(1), ...rule.push.split('').reverse()];
  const newHead  = rule.input !== '' ? head + 1 : head;
  const newState = rule.to;

  const done = newHead >= tape.length;
  const accepted = done ? pda.acceptStates.includes(newState) : null;

  return {
    state:    newState,
    tape,
    head:     newHead,
    stack:    newStack,
    accepted,
    log: [...config.log, { rule, stackBefore: stack, stackAfter: newStack }]
  };
}
```

### `runAll(pda, config)`

Calls `step` repeatedly until `accepted !== null` or a step limit (default 1000) is reached. Returns an array of all intermediate configurations — used to build the full playback history.

---

## 9. Stack Visualisation

The `Stack` component receives the current stack array and the previous stack array and computes a diff to drive animations.

```
Stack array:  ['(', '(', 'Z']   ← index 0 is top of stack
Rendered as:
  ┌───────┐  ← top (highlighted blue)
  │   (   │
  ├───────┤
  │   (   │
  ├───────┤
  │   Z   │
  └───────┘
     ⊥
```

### Animation states

| Class | Trigger | Visual |
|-------|---------|--------|
| `pushed` | Cell appeared at top | Green background, fades to normal after 300 ms |
| `popped` | Cell absent that was present | Red background, shrinks to 0 height over 300 ms |
| `top` | Index 0 of current stack | Blue border and text |

Animations use CSS `@keyframes` on `opacity` and `max-height` only — no layout-triggering properties.

---

## 10. Transition Table Editor

The table has five columns: **From**, **Input**, **Pop**, **To**, **Push**, plus a delete button column.

- The currently-firing transition row is highlighted in amber during simulation.
- Clicking any row in edit mode focuses the form fields with that row's values.
- The `Input` and `Push` fields accept `ε` (or the user can leave them blank — the app normalises to `''` internally).
- Rows are sorted: ε-transitions last, then alphabetically by `from` state.

---

## 11. Step Log & History

The step log renders at the bottom of the simulation panel. Each entry shows:

```
[PUSH]  q1, (, Z  →  q1, (Z        stack: [(, Z]
[POP]   q1, ), (  →  q1, ε         stack: [Z]
[ε]     q1, ε, Z  →  q2, Z         stack: [Z]
```

Tag colours:
- `PUSH` — green
- `POP` — red/danger
- `MOVE` — blue/info
- `ε-MOVE` — purple
- `REJECT` — red

The log scrolls automatically to the latest entry. Stepping backward removes the last log entry so the log always matches the current config.

---

## 12. Built-in Examples

Five example PDAs ship with the app and are accessible from the `Load example` dropdown:

| Name | Language | Description |
|------|----------|-------------|
| Balanced parentheses | `{ (ⁿ )ⁿ \| n ≥ 0 }` | Classic matching brackets |
| Equal a's and b's | `{ aⁿ bⁿ \| n ≥ 1 }` | Simple push/pop on a single symbol |
| Palindromes over {a,b} | `{ w \| w = wᴿ }` | Requires non-determinism (guess the middle) |
| Nested brackets `{[()]}` | Mixed bracket types | Three stack symbols |
| `aⁿ bⁿ cⁿ`? | Attempted — rejected | Demonstrates PDA limitation (not CFL) |

Each example loads the full PDA definition and a sample input string so students can observe execution immediately.

---

## 13. Tech Stack & File Structure

| Tool | Purpose |
|------|---------|
| React 18 | Component model and state |
| Vite | Dev server and bundler |
| CSS custom properties | Theming (light/dark auto via `prefers-color-scheme`) |
| No CSS framework | Keeps the bundle minimal; all styles in `app.css` |

### Why no Redux / Zustand?

All simulation state lives in a single custom hook `usePDA` (see [State Management](#14-state-management)). The state tree is small and co-located with the components that use it, so a global store would add complexity without benefit.

### Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
```

No external UI library, no animation library, no router. The project intentionally stays self-contained so it can be reviewed, submitted, and understood without external documentation.

---

## 14. Component Breakdown

### `App.jsx`

Root layout. Renders `TopBar`, `DefinitionPanel`, `SimulationPanel`, and `Controls` in a CSS Grid. Passes the `usePDA` hook result down as props.

### `DefinitionPanel.jsx`

- Renders state chips with start/accept toggles.
- Renders the transition form with five controlled inputs.
- Renders `TransitionTable`.
- Renders the input string field and `Load` button.

### `SimulationPanel.jsx`

- Renders `Tape`, `Stack`, `StateCircle`, and `StepLog` side by side.
- Shows the currently-applied rule in a monospace badge.
- Shows the acceptance banner when `accepted !== null`.

### `Tape.jsx`

Props: `tape: string[]`, `head: number`

Maps each character to a `<div class="tape-cell">`, adding `read` to the cell at `head`, `done` to cells before it.

### `Stack.jsx`

Props: `stack: string[]`, `prevStack: string[]`

Computes `pushed` (items in `stack` not in `prevStack` at same index) and `popped` (items in `prevStack` not carried over) to apply animation classes.

### `StateCircle.jsx`

Props: `state: string`, `accepted: boolean | null`

Renders a circle with the state name. Class: `active` (yellow), `accepted` (green), `rejected` (red).

### `StepLog.jsx`

Props: `log: LogEntry[]`

Renders a scrollable list. Uses `useEffect` to scroll to the bottom on each update.

### `Controls.jsx`

Props: callbacks for reset, back, forward, run; `speed: number`; `isRunning: boolean`

Renders five buttons and a range slider. Disables `back` when `historyIndex === 0`, disables `forward` when at the latest config.

---

## 15. State Management

All simulation state is managed in `usePDA.js`:

```js
function usePDA() {
  const [pdaDef, setPdaDef]       = useState(defaultPDA);
  const [inputString, setInput]   = useState('');
  const [history, setHistory]     = useState([]);   // array of configs
  const [historyIndex, setIdx]    = useState(-1);   // -1 = not started
  const [speed, setSpeed]         = useState(500);  // ms per step
  const [isRunning, setRunning]   = useState(false);

  const currentConfig = history[historyIndex] ?? null;

  function load(str) {
    const config = initialConfig(pdaDef, str);
    setHistory([config]);
    setIdx(0);
  }

  function forward() {
    if (historyIndex < history.length - 1) {
      setIdx(i => i + 1);
    } else {
      const next = step(pdaDef, currentConfig);
      setHistory(h => [...h.slice(0, historyIndex + 1), next]);
      setIdx(i => i + 1);
    }
  }

  function backward() {
    if (historyIndex > 0) setIdx(i => i - 1);
  }

  function reset() {
    setHistory([history[0]]);
    setIdx(0);
  }

  // useEffect to drive auto-run via setInterval at `speed` ms
  // ...

  return { pdaDef, setPdaDef, inputString, setInput,
           currentConfig, forward, backward, reset,
           speed, setSpeed, isRunning, setRunning };
}
```

Key design decisions:
- The `history` array stores every config ever computed, so stepping backward is instant (no re-computation).
- Editing the PDA definition calls `setPdaDef` and resets the simulation.
- `isRunning` drives a `useInterval` effect that calls `forward` every `speed` ms and stops when `accepted !== null`.

---

## 16. Non-Determinism Handling

PDAs can be **non-deterministic** — a configuration `(state, inputSymbol, stackTop)` may match multiple transition rules. The simulator handles this with a **depth-first backtracking** strategy:

1. When multiple rules match, pick the first one (ordered as entered).
2. If that path leads to rejection, automatically try the next matching rule.
3. If all rules from a configuration lead to rejection, mark the string as rejected.

In the UI, non-deterministic branching is indicated by a small `N-D` badge on the step log entry. A future enhancement could render the full computation tree.

---

## 17. Edge Cases & Validation

| Situation | Behaviour |
|-----------|-----------|
| Transition references undefined state | Form error: "State X does not exist" |
| Transition references undefined stack symbol | Warning: symbol added to `Γ` automatically |
| Two transitions with identical `(from, input, pop)` | Allowed — triggers ND mode |
| Empty input string | Valid — ε-transitions may still lead to acceptance |
| Stack grows beyond 500 entries | Simulation halts with "Possible infinite loop" warning |
| Step count exceeds 1000 | Simulation halts with "Step limit reached" |
| No start state defined | Load button disabled with tooltip |
| No accepting states defined | Allowed but warned — PDA will never accept |

---

## 18. Accessibility

- All interactive controls have `aria-label` attributes.
- The tape and stack use `role="list"` and `role="listitem"`.
- The step log uses `aria-live="polite"` so screen readers announce new entries.
- Keyboard navigation: Tab through controls, Enter to activate buttons.
- Animations respect `prefers-reduced-motion` — if set, push/pop animations are replaced with instant colour changes.
- Colour is never the only indicator of state — each status also shows a text label.

---

## 19. Extending the Project

### Add an AI narration button

Each step log entry can include a "Explain this step" button that calls the Anthropic API with the current transition and stack state:

```js
const res = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Explain this PDA step in one sentence for a student:
        Rule fired: (${rule.from}, ${rule.input || 'ε'}, ${rule.pop}) → (${rule.to}, ${rule.push || 'ε'})
        Stack before: [${stackBefore.join(', ')}]
        Stack after: [${stackAfter.join(', ')}]`
    }]
  })
});
```

### Add Import / Export

A `JSON.stringify(pdaDef, null, 2)` export button and a file-input import allow students to save and share their PDAs.

### Add a computation tree view

For non-deterministic PDAs, render a tree where each node is a configuration. Accepted paths are green, rejected paths are red. Useful for visualising why a string is accepted or rejected.

### Add a CFL quiz mode

Generate random strings from the defined language (or from its complement) and ask the student to predict acceptance before running the simulation.

### Convert to a NPDA / DPDA distinguisher

Add a button that analyses the transition table and reports whether the PDA is deterministic (DPDA) or non-deterministic (NPDA), with an explanation.

---

## 20. Glossary

| Term | Definition |
|------|------------|
| **PDA** | Pushdown Automaton — a finite automaton with a stack |
| **CFL** | Context-Free Language — the class of languages recognised by PDAs |
| **CFG** | Context-Free Grammar — an equivalent formalism to PDAs |
| **Configuration** | A snapshot of the PDA: current state, remaining input, and stack contents |
| **ε (epsilon)** | The empty string; an ε-transition consumes no input |
| **δ (delta)** | The transition function mapping configurations to next configurations |
| **Stack top** | The symbol currently on top of the stack (first to be read/popped) |
| **Z₀** | The initial stack symbol, placed on the stack before computation begins |
| **Accepting state** | A state in `F`; if the machine is in this state when input ends, the string is accepted |
| **DPDA** | Deterministic PDA — at most one transition per `(state, input, stackTop)` triple |
| **NPDA** | Non-deterministic PDA — multiple transitions may apply; accepts if any path accepts |
| **Instantaneous description (ID)** | Another name for configuration: `(q, remaining input, stack)` |

---

*Built as a student project for formal languages and automata theory coursework.*
