/* @jest-environment node */
import type { Polynomial } from "../src/eff/polynomial";
import type { ClosureCoalgebra } from "../src/eff/org";
import { yOf } from "../src/eff/linear";
import { orgLinearToCatSharp } from "../src/eff/org-to-catsharp";
import { behaviorTree } from "../src/eff/org-behavior";
import { hcomp, type EqualizerTools } from "../src/catsharp/definition";

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

test("Org (linear) → Cat♯ respects composition boundaries and shows ⋉_middle", () => {
  const Q: Polynomial  = { positions:["q"],  fiber:(_)=> ["dq"] };
  const At: Polynomial = { positions:["@"],  fiber:(_)=> ["d@"] };
  const A: Polynomial  = { positions:["a"],  fiber:(_)=> ["da"] };
  const yS1 = yOf(["s0","s1"]), yS2 = yOf(["t0"]);
  const C1: ClosureCoalgebra = { at: At, q: Q, S: yS1.positions,
    step: (s)=> ({ atPos:"@", toPosInQ:"q", dirInQ:"dq", cont:(_)=> (s==="s0"?"s1":"s0") }) };
  const C2: ClosureCoalgebra = { at: A,  q: At, S: yS2.positions,
    step: (t)=> ({ atPos:"a", toPosInQ:"@", dirInQ:"d@", cont:(_)=> t }) };

  const B1 = orgLinearToCatSharp(C1).bicomodule; // c? ▷ c@
  const B2 = orgLinearToCatSharp(C2).bicomodule; // c@ ▷ cA
  const B12 = hcomp(B1, B2, Tools);              // c? ▷ cA

  expect(B12.left.poly.name).toContain("c?");
  expect(B12.right.poly.name).toContain("c@") || expect(B12.right.poly.name).toContain("cA");
  expect(B12.carrier.name).toContain("⋉_c@");
});

test("behaviorTree produces a depth-limited state-labeled unfolding", () => {
  const Q: Polynomial  = { positions:["q"], fiber:(_)=> ["dq"] };
  const At: Polynomial = { positions:["@"], fiber:(_)=> ["d@"] };
  const yS = yOf(["s0","s1"]);
  const C: ClosureCoalgebra = { at: At, q: Q, S: yS.positions,
    step: (s)=> ({ atPos:"@", toPosInQ:"q", dirInQ:"dq", cont:(_)=> (s==="s0"?"s1":"s0") }) };
  const T = behaviorTree(C, "s0", 2);
  expect(T.state).toBe("s0");
  expect(T.children[0].state).toBe("s1");
});

