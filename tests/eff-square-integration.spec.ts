/* @jest-environment node */
import type { Polynomial } from "../src/eff/polynomial";
import type { Handler } from "../src/eff/handler";
import { cofreeComonoidOf, bicomoduleOfHandler, squareFromEff } from "../src/eff/to-catsharp";
import { hcomp, type EqualizerTools, squareCommutes } from "../src/catsharp/definition";

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

test("Mapped Eff-squares commute alongside composed Cat♯ bicomodules", () => {
  // Q ─H1→ A and A ─H2→ B
  const Q: Polynomial = { positions:["q"], fiber:(_)=>["dq"] };
  const A: Polynomial = { positions:["a"], fiber:(_)=>["da"] };
  const B: Polynomial = { positions:["b"], fiber:(_)=>["db"] };
  const H1: Handler = { from: Q, to: A, translate: (_)=> ({ v:"a", pull:(_)=> "dq" }) };
  const H2: Handler = { from: A, to: B, translate: (_)=> ({ v:"b", pull:(_)=> "da" }) };

  const cQ = cofreeComonoidOf(Q, "cQ");
  const cA = cofreeComonoidOf(A, "cA");
  const cB = cofreeComonoidOf(B, "cB");

  const B1 = bicomoduleOfHandler(H1, cQ, cA);
  const B2 = bicomoduleOfHandler(H2, cA, cB);
  const B12 = hcomp(B1, B2, Tools); // cQ ▷ cB

  // Map identity Eff-squares on H1 and on the composite (B12) and assert commuting
  const sq1 = squareFromEff(cQ, cA, B1, cQ, cA, B1, "θ_id");
  const sqComp = squareFromEff(cQ, cB, B12, cQ, cB, B12, "θ_comp");

  expect(sq1.p.left).toBe(cQ);
  expect(sq1.p.right).toBe(cA);
  expect(squareCommutes(sq1, () => true)).toBe(true);

  expect(sqComp.p.left).toBe(cQ);
  expect(sqComp.p.right).toBe(cB);
  expect(squareCommutes(sqComp, () => true)).toBe(true);
});
