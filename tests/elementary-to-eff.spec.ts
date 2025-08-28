/* @jest-environment node */
import type { Polynomial } from "../src/eff/polynomial";
import { identityElementary, composeElementary, toEffectsHandler } from "../src/eff/elementary";
import { elementaryToCatSharp } from "../src/eff/elementary-to-catsharp";
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

const Q: Polynomial = { positions: ["a","b"], fiber: (_)=> ["*"] };
const At: Polynomial = { positions: ["x","y"], fiber: (_)=> ["*"] };
const A: Polynomial = { positions: ["u","v"], fiber: (_)=> ["*"] };

// Two elementary handlers: Q→@ and @→A
const E1 = { from: Q, to: At, carrier: Q, onPos: (_u:string)=> "x", pull: (d:string)=> d };
const E2 = { from: At, to: A, carrier: At, onPos: (_v:string)=> "u", pull: (d:string)=> d };

test("identity elementary maps to identity-shaped Cat♯ bicomodule (boundaries equal)", () => {
  const I = identityElementary(Q);
  const BI = elementaryToCatSharp(I);
  expect(BI.bicomodule.left).toBeDefined();
  expect(BI.bicomodule.right).toBeDefined();
  // For identity, both left and right should be the same cofree comonoid
  expect(BI.bicomodule.left.poly.name).toBe(BI.bicomodule.right.poly.name);
});

test("composition in Eff_el lifts to composition in Cat♯ (boundaries line up)", () => {
  const E12 = composeElementary(E1, E2);          // Q → A (elem.)
  const B1 = elementaryToCatSharp(E1).bicomodule; // cQ ▷ c@
  const B2 = elementaryToCatSharp(E2).bicomodule; // c@ ▷ cA
  const B12 = hcomp(B1, B2, Tools);               // cQ ▷ cA
  const mappedComposite = elementaryToCatSharp(E12).bicomodule; // also cQ ▷ cA
  expect(B12.left.poly.name).toBe(mappedComposite.left.poly.name);
  expect(B12.right.poly.name).toBe(mappedComposite.right.poly.name);
});
