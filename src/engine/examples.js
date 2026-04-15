const E = "ε";

export const examples = [
  {
    id: "balanced_parens",
    name: "Balanced Parentheses",
    description: "{ (ⁿ )ⁿ | n ≥ 0 } — Classic matching brackets",
    defaultInput: "((()))",
    pda: {
      states: [
        { id: "q0", label: "q₀", isStart: true, isAccept: false },
        { id: "q1", label: "q₁", isStart: false, isAccept: false },
        { id: "q2", label: "q₂", isStart: false, isAccept: true },
      ],
      inputAlphabet: ["(", ")"],
      stackAlphabet: ["(", "Z"],
      startState: "q0",
      startStackSymbol: "Z",
      acceptStates: ["q2"],
      acceptMode: "finalState",
      transitions: [
        { id: "t1", from: "q0", to: "q1", input: E, stackPop: "Z",  stackPush: "Z" },
        { id: "t2", from: "q1", to: "q1", input: "(", stackPop: "Z", stackPush: "(Z" },
        { id: "t3", from: "q1", to: "q1", input: "(", stackPop: "(", stackPush: "((" },
        { id: "t4", from: "q1", to: "q1", input: ")", stackPop: "(", stackPush: E },
        { id: "t5", from: "q1", to: "q2", input: E, stackPop: "Z",  stackPush: "Z" },
      ],
    },
  },
  {
    id: "equal_ab",
    name: "aⁿ bⁿ",
    description: "{ aⁿ bⁿ | n ≥ 1 } — Simple push/pop on a single symbol",
    defaultInput: "aaabbb",
    pda: {
      states: [
        { id: "q0", label: "q₀", isStart: true, isAccept: false },
        { id: "q1", label: "q₁", isStart: false, isAccept: false },
        { id: "q2", label: "q₂", isStart: false, isAccept: false },
        { id: "q3", label: "q₃", isStart: false, isAccept: true },
      ],
      inputAlphabet: ["a", "b"],
      stackAlphabet: ["A", "Z"],
      startState: "q0",
      startStackSymbol: "Z",
      acceptStates: ["q3"],
      acceptMode: "finalState",
      transitions: [
        { id: "t1", from: "q0", to: "q1", input: "a", stackPop: "Z", stackPush: "AZ" },
        { id: "t2", from: "q1", to: "q1", input: "a", stackPop: "A", stackPush: "AA" },
        { id: "t3", from: "q1", to: "q2", input: "b", stackPop: "A", stackPush: E },
        { id: "t4", from: "q2", to: "q2", input: "b", stackPop: "A", stackPush: E },
        { id: "t5", from: "q2", to: "q3", input: E,   stackPop: "Z", stackPush: "Z" },
      ],
    },
  },
  {
    id: "palindromes",
    name: "Even Palindromes over {a,b}",
    description: "{ w | w = wᴿ } — Pushes first half, pops second half",
    defaultInput: "abba",
    pda: {
      states: [
        { id: "q_push", label: "q_push", isStart: true, isAccept: false },
        { id: "q_pop",  label: "q_pop",  isStart: false, isAccept: false },
        { id: "q_acc",  label: "q_acc",  isStart: false, isAccept: true },
      ],
      inputAlphabet: ["a", "b"],
      stackAlphabet: ["A", "B", "Z"],
      startState: "q_push",
      startStackSymbol: "Z",
      acceptStates: ["q_acc"],
      acceptMode: "finalState",
      deterministic: true,
      transitions: [
        // Push phase — read input, pop top, push two symbols (top stays, new symbol on top)
        { id: "t1",  from: "q_push", to: "q_push", input: "a", stackPop: "Z", stackPush: "AZ" },
        { id: "t2",  from: "q_push", to: "q_push", input: "a", stackPop: "A", stackPush: "AA" },
        { id: "t3",  from: "q_push", to: "q_push", input: "a", stackPop: "B", stackPush: "AB" },
        { id: "t4",  from: "q_push", to: "q_push", input: "b", stackPop: "Z", stackPush: "BZ" },
        { id: "t5",  from: "q_push", to: "q_push", input: "b", stackPop: "A", stackPush: "BA" },
        { id: "t6",  from: "q_push", to: "q_push", input: "b", stackPop: "B", stackPush: "BB" },
        // Guess middle — ε transition to pop phase (keep stack unchanged)
        { id: "t7",  from: "q_push", to: "q_pop",  input: E,   stackPop: "Z", stackPush: "Z" },
        { id: "t8",  from: "q_push", to: "q_pop",  input: E,   stackPop: "A", stackPush: "A" },
        { id: "t9",  from: "q_push", to: "q_pop",  input: E,   stackPop: "B", stackPush: "B" },
        // Pop phase — match input against stack top
        { id: "t10", from: "q_pop",  to: "q_pop",  input: "a", stackPop: "A", stackPush: E },
        { id: "t11", from: "q_pop",  to: "q_pop",  input: "b", stackPop: "B", stackPush: E },
        // Accept — stack bottom marker reached
        { id: "t12", from: "q_pop",  to: "q_acc",  input: E,   stackPop: "Z", stackPush: "Z" },
      ],
    },
  },
  {
    id: "custom",
    name: "Custom (Empty PDA)",
    description: "Define your own states and transition functions.",
    defaultInput: "",
    pda: {
      states: [
        { id: "q0", label: "q0", isStart: true, isAccept: false },
      ],
      inputAlphabet: ["a", "b"],
      stackAlphabet: ["Z"],
      startState: "q0",
      startStackSymbol: "Z",
      acceptStates: [],
      acceptMode: "finalState",
      transitions: [],
    },
  },
];

export const defaultExample = examples[1]; // aⁿbⁿ
export const defaultPDA = defaultExample.pda;
