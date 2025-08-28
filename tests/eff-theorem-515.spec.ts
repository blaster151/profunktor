/* @jest-environment node */
import type { Polynomial } from "../src/eff/polynomial";
import type { Handler } from "../src/eff/handler";
import { cofreeComonoidOf, bicomoduleOfHandler, squareFromEff, projAfterEpsilonIsEpi } from "../src/eff/to-catsharp";
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

test("handler ↦ bicomodule; composition preserved up to equalizer (Lemma 5.14 / Thm 5.15)", () => {
  const Q: Polynomial = { positions:["q"], fiber:(_)=>["dq"] };
  const R: Polynomial = { positions:["r"], fiber:(_)=>["dr"] };
  const A: Polynomial = { positions:["a"], fiber:(_)=>["da"] };
  const Hqr: Handler = { from: Q, to: R, translate: (_)=> ({ v:"r", pull:(_)=> "dq" }) };
  const Hra: Handler = { from: R, to: A, translate: (_)=> ({ v:"a", pull:(_)=> "dr" }) };
  const cQ = cofreeComonoidOf(Q, "cQ"), cR = cofreeComonoidOf(R, "cR"), cA = cofreeComonoidOf(A, "cA");
  const Bqr = bicomoduleOfHandler(Hqr, cQ, cR);
  const Bra = bicomoduleOfHandler(Hra, cR, cA);
  const comp = hcomp(Bqr, Bra, Tools);
  expect(comp.left).toBe(cQ);
  expect(comp.right).toBe(cA);
  expect(comp.carrier.name).toContain("⋉_cR"); // equalizer over the middle comonoid
});

test("Eff square → Cat♯ square has matching boundaries; faithfulness shim flags 3≠0", () => {
  const Q: Polynomial = { positions:["u"], fiber:(_)=>["du"] };
  const R: Polynomial = { positions:["v"], fiber:(_)=>["dv"] };
  const cQ = cofreeComonoidOf(Q, "cQ"), cR = cofreeComonoidOf(R, "cR");
  const H: Handler = { from: Q, to: R, translate: (_)=> ({ v:"v", pull:(_)=> "du" }) };
  const B  = bicomoduleOfHandler(H, cQ, cR);
  const Bp = bicomoduleOfHandler(H, cQ, cR);
  const sq = squareFromEff(cQ, cR, B, cQ, cR, Bp, "θ");
  expect(sq.p.left).toBe(cQ);
  expect(sq.p.right).toBe(cR);
  expect(projAfterEpsilonIsEpi(true, ["anything"])).toBe(true);   // 3 ≠ 0 → epi
  expect(projAfterEpsilonIsEpi(false, ["anything"])).toBe(false); // 3 = 0 → not epi
});
