/* @jest-environment node */
import type { Polynomial } from "../src/eff/polynomial";
import { yOf, duoidalIsoLeft, polySetHomCount_S_to_Q } from "../src/eff/linear";
import { identityElementary, composeElementary } from "../src/eff/elementary";
import { orgFromLinearElementary, linearElementaryFromOrg } from "../src/eff/org";

const Q: Polynomial  = { positions:["q0","q1"], fiber:(u)=> u==="q0"? ["a","b"] : ["c"] };
const At: Polynomial = { positions:["@0","@1"], fiber:(_)=> ["*"] };
const yS = yOf(["s0","s1"]);

test("duoidal isomorphism size check (Lemma 5.17)", () => {
  expect(duoidalIsoLeft(yS.positions, Q)).toBe(0);
});

test("poly/set hom count proxy (Lemmas 5.18/5.19) is finite and consistent on tiny inputs", () => {
  expect(polySetHomCount_S_to_Q(yS.positions, Q)).toBeGreaterThan(0);
});

test("Org ⟷ linear-Elementary (round-trip preserves boundaries)", () => {
  const E = { from: Q, to: At, carrier: yS, onPos: (_)=> "@0", pull: (_)=> "a" };
  const C = orgFromLinearElementary(E);
  const E2 = linearElementaryFromOrg(C);
  expect(E2.from).toBe(E.from);
  expect(E2.to).toBe(E.to);
});

test("Composition on linear elementary side stays intact through Org packing", () => {
  const E = { from: Q, to: At, carrier: yS, onPos: (_)=> "@0", pull: (_)=> "a" };
  const I = identityElementary(Q);
  const comp = composeElementary(E, { from: At, to: At, carrier: yS, onPos: (_)=> "@1", pull: (_)=> "*" });
  const EPrime = linearElementaryFromOrg(orgFromLinearElementary(comp));
  expect(EPrime.to.positions.includes("@1")).toBe(true);
});
