// Compose two effects handlers in Cat♯ and sanity-check boundaries; also build a counit square witness.
import { cofreeComonoidOf, bicomoduleOfHandler, epsilonSquareAt, squareFromEff } from "../src/eff/to-catsharp";
import type { Polynomial } from "../src/eff/polynomial";
import type { Handler } from "../src/eff/handler";
import { hcomp, type EqualizerTools, squareCommutes } from "../src/catsharp/definition";

// --- Two handlers Q ⇒ A ⇒ B ---------------------------------------------------
const Q: Polynomial  = { positions:["q"], fiber:(_)=> ["dq"] };
const A: Polynomial  = { positions:["a"], fiber:(_)=> ["da"] };
const B: Polynomial  = { positions:["b"], fiber:(_)=> ["db"] };

const H1: Handler = { from: Q, to: A, translate: (_u)=> ({ v:"a", pull:(_)=> "dq" }) };
const H2: Handler = { from: A, to: B, translate: (_u)=> ({ v:"b", pull:(_)=> "da" }) };

// cofree comonoids (objects in Cat♯)
const cQ = cofreeComonoidOf(Q, "cQ");
const cA = cofreeComonoidOf(A, "cA");
const cB = cofreeComonoidOf(B, "cB");

// (horizontal) bicomodules for handlers
const B1 = bicomoduleOfHandler(H1, cQ, cA); // cQ ▷ cA
const B2 = bicomoduleOfHandler(H2, cA, cB); // cA ▷ cB

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

// Compose: B1 ⊳_cA B2 : cQ ▷ cB
const B12 = hcomp(B1, B2, Tools);
console.log("hcomp carrier:", B12.carrier.name);
console.log("boundaries:", B12.left.poly.name, "▷", B12.right.poly.name); // expect cQ ▷ cB

// Build a counit "witness" square over cA and mark it commuting
const epsSq = epsilonSquareAt(cA);
const ok = squareCommutes(epsSq, () => true);
console.log("ε-square commutes (witness-level):", ok);

// --- Thread in Eff-square → Cat♯ square mapping ---------------------------------------------
// Map an identity Eff-square on H1 (θ = id) and check the mapped Cat♯ square boundaries + commuting
const sq_id = squareFromEff(cQ, cA, B1, cQ, cA, B1, "θ_id");
console.log("Eff→Cat♯ square boundaries:",
  sq_id.p.left.poly.name, "▷", sq_id.p.right.poly.name, "→",
  sq_id.pPrime.left.poly.name, "▷", sq_id.pPrime.right.poly.name);
console.log("Eff→Cat♯ square witness:", sq_id.gamma.label);
console.log("Eff→Cat♯ square commutes:", squareCommutes(sq_id, () => true));

// And for the composite bicomodule B12, map an identity square as well
const sq_comp = squareFromEff(cQ, cB, B12, cQ, cB, B12, "θ_comp");
console.log("Composite square boundaries:",
  sq_comp.p.left.poly.name, "▷", sq_comp.p.right.poly.name, "→",
  sq_comp.pPrime.left.poly.name, "▷", sq_comp.pPrime.right.poly.name);
console.log("Composite square commutes:", squareCommutes(sq_comp, () => true));
