// Compose two Org coalgebras (linear), map to Cat♯, and check boundaries + equalizer-ish carrier name.
import type { Polynomial } from "../src/eff/polynomial";
import type { ClosureCoalgebra } from "../src/eff/org";
import { yOf } from "../src/eff/linear";
import { orgLinearToCatSharp } from "../src/eff/org-to-catsharp";
import { hcomp, type EqualizerTools } from "../src/catsharp/definition";
import { behaviorTree } from "../src/eff/org-behavior";

// Polynomials
const Q: Polynomial  = { positions:["q"],  fiber:(_)=> ["dq"] };
const At: Polynomial = { positions:["@"],  fiber:(_)=> ["d@"] };
const A: Polynomial  = { positions:["a"],  fiber:(_)=> ["da"] };

// Linear carriers y(S)
const yS1 = yOf(["s0","s1"]);
const yS2 = yOf(["t0"]);

// Two tiny Org coalgebras: Q→@ and @→A
const C1: ClosureCoalgebra = {
  at: At, q: Q, S: yS1.positions,
  step: (s: string) => ({ atPos: "@", toPosInQ: "q", dirInQ: "dq", cont: (_)=> (s==="s0"?"s1":"s0") })
};
const C2: ClosureCoalgebra = {
  at: A, q: At, S: yS2.positions,
  step: (t: string) => ({ atPos: "a", toPosInQ: "@", dirInQ: "d@", cont: (_)=> t })
};

// Map each Org coalgebra straight to Cat♯
const B1 = orgLinearToCatSharp(C1).bicomodule; // c? ▷ c@
const B2 = orgLinearToCatSharp(C2).bicomodule; // c@ ▷ cA

// Equalizer tools (name-level)
const Tools: EqualizerTools = {
  equalizeTopRow: ({ c, d, e, p, q }) => {
    const carrier = { name: `${p.carrier.name}⋉_${d.poly.name}${q.carrier.name}` };
    const intoMid = { from: carrier, to: { name: `${p.carrier.name}⋉${q.carrier.name}` }, label: "ι" } as any;
    return { carrier, intoMid };
  },
  induceCoactions: ({ c, e, carrier }) => ({
    coactL: { from: { name: `${c.poly.name}▷${carrier.name}` }, to: carrier, label: "λ" } as any,
    coactR: { from: carrier, to: { name: `${carrier.name}▷${e.poly.name}` }, label: "ρ" } as any
  })
};

const B12 = hcomp(B1, B2, Tools); // expect c? ▷ cA
console.log("Org→Cat♯ compose boundaries:", B12.left.poly.name, "▷", B12.right.poly.name);
console.log("Org→Cat♯ compose carrier:", B12.carrier.name); // should include ⋉_c@

// Tiny behavior tree from C1
const tree = behaviorTree(C1, "s0", 3);
console.log("behaviorTree depth=3 root:", tree.state, "child:", tree.children[0]?.state);
