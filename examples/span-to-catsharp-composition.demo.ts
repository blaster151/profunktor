// Span→Cat♯ composition sanity: compose spans, map to bicomodules, compose again.
import { composeSpans } from "../src/eff/spans";
import { bicomoduleFromCartesianLeftSpan } from "../src/eff/span-to-catsharp";
import { cofreeComonoidOf } from "../src/eff/to-catsharp";
import { hcomp, type EqualizerTools } from "../src/catsharp/definition";

// ---- Two cartesian-left spans:  Q ← B → @    and    @ ← C → A
const Q = { name: "Q" }, B = { name: "B" }, At = { name: "@" }, C = { name: "C" }, A = { name: "A" };
const X = { left: { id: "l1", src: Q,  dst: B,  cartesian: true }, right: { id: "r1", src: B,  dst: At } };
const Y = { left: { id: "l2", src: At, dst: C,  cartesian: true }, right: { id: "r2", src: C,  dst: A  } };

// Compose in Span(Poly):  Q ← PB(r1,l2) → A
const Z = composeSpans(X as any, Y as any);
const PBname = `PB(${X.right.id},${Y.left.id})`; // PB(r1,l2)

// ---- Map to Cat♯ via c− (names-only cofree comonoids)
const cQ  = cofreeComonoidOf({ positions: ["•"], fiber: () => ["d"] }, "cQ");
const cB  = cofreeComonoidOf({ positions: ["•"], fiber: () => ["d"] }, "cB");
const cAt = cofreeComonoidOf({ positions: ["•"], fiber: () => ["d"] }, "c@");
const cC  = cofreeComonoidOf({ positions: ["•"], fiber: () => ["d"] }, "cC");
const cA  = cofreeComonoidOf({ positions: ["•"], fiber: () => ["d"] }, "cA");
const cPB = cofreeComonoidOf({ positions: ["•"], fiber: () => ["d"] }, `c${PBname}`);

// Span→Cat♯ on each piece; then compose horizontally in Cat♯
const BX  = bicomoduleFromCartesianLeftSpan(cQ,  cB,  cAt);  // cQ ▷ c@
const BY  = bicomoduleFromCartesianLeftSpan(cAt, cC,  cA);   // c@ ▷ cA
const BZ  = bicomoduleFromCartesianLeftSpan(cQ,  cPB, cA);   // cQ ▷ cA (via PB middle)

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

const BX_then_BY = hcomp(BX, BY, Tools);

console.log("Span compose mid:", PBname);
console.log("Cat♯ compose carrier:", BX_then_BY.carrier.name);
console.log("Cat♯ compose boundaries:", BX_then_BY.left.poly.name, "▷", BX_then_BY.right.poly.name);
console.log("Mapped composed span carrier (name-only):", BZ.carrier.name);
