/* @jest-environment node */
import { composeSpans } from "../src/eff/spans";
import { bicomoduleFromCartesianLeftSpan } from "../src/eff/span-to-catsharp";
import { cofreeComonoidOf } from "../src/eff/to-catsharp";
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

test("Span→Cat♯: composing mapped bicomodules matches mapped composed span on boundaries", () => {
  // Two spans: Q ← B → @   and   @ ← C → A
  const Q = { name: "Q" }, B = { name: "B" }, At = { name: "@" }, C = { name: "C" }, A = { name: "A" };
  const X = { left: { id: "r1", src: Q,  dst: B,  cartesian: true }, right: { id: "s1", src: B,  dst: At } };
  const Y = { left: { id: "r2", src: At, dst: C,  cartesian: true }, right: { id: "s2", src: C,  dst: A  } };
  const Z = composeSpans(X as any, Y as any);
  const PBname = `PB(${X.right.id},${Y.left.id})`;

  // Map objects via cofree
  const cQ  = cofreeComonoidOf({ positions: ["•"], fiber: () => ["d"] }, "cQ");
  const cB  = cofreeComonoidOf({ positions: ["•"], fiber: () => ["d"] }, "cB");
  const cAt = cofreeComonoidOf({ positions: ["•"], fiber: () => ["d"] }, "c@");
  const cC  = cofreeComonoidOf({ positions: ["•"], fiber: () => ["d"] }, "cC");
  const cA  = cofreeComonoidOf({ positions: ["•"], fiber: () => ["d"] }, "cA");
  const cPB = cofreeComonoidOf({ positions: ["•"], fiber: () => ["d"] }, `c${PBname}`);

  // Map spans → bicomodules and compose in Cat♯
  const BX = bicomoduleFromCartesianLeftSpan(cQ,  cB,  cAt); // cQ ▷ c@
  const BY = bicomoduleFromCartesianLeftSpan(cAt, cC,  cA);  // c@ ▷ cA
  const BX_then_BY = hcomp(BX, BY, Tools);                    // cQ ▷ cA

  // Map composed span → bicomodule (expected boundary)
  const BZ = bicomoduleFromCartesianLeftSpan(cQ, cPB, cA);    // cQ ▷ cA

  expect(BX_then_BY.left).toBe(cQ);
  expect(BX_then_BY.right).toBe(cA);
  expect(BZ.left).toBe(cQ);
  expect(BZ.right).toBe(cA);
  // Equalizer-style carrier name should mention the middle object c@.
  expect(BX_then_BY.carrier.name).toContain("⋉_c@");
  // Mapped composed span should carry the PB(r1,l2) name.
  expect(BZ.carrier.name).toContain("PB(s1,r2)");
});
