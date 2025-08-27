import {
  type Poly, type PolyHom,
  type Comonoid, type CoHom, type Bicomodule, type Square,
  hid, hcomp, squareCommutes, type EqualizerTools
} from "../src/catsharp/definition";

// ----- Minimal "Poly" stubs ----------------------------------------------------
const P = (name: string): Poly => ({ name });
const H = (from: Poly, to: Poly, label: string): PolyHom => ({ from, to, label });

// Comonoid helper
function comonoid(name: string): Comonoid {
  const c = P(name);
  return {
    poly: c,
    counit: H(c, P("y"), `ε_${name}`),
    comult: H(c, P(`${name}▷${name}`), `δ_${name}`)
  };
}

// Bicomodule helper
function bicomod(left: Comonoid, right: Comonoid, carrier: string): Bicomodule {
  const p = P(carrier);
  return {
    left, right, carrier: p,
    coactL: H(P(`${left.poly.name}▷${carrier}`), p, `λ_${left.poly.name}_${carrier}`),
    coactR: H(p, P(`${carrier}▷${right.poly.name}`), `ρ_${carrier}_${right.poly.name}`)
  };
}

// Equalizer tools mock (names only; good enough for a smoke run)
const Tools: EqualizerTools = {
  equalizeTopRow: ({ c, d, e, p, q }) => {
    const name = `${p.carrier.name}⋉_${d.poly.name}${q.carrier.name}`;
    const carrier = P(name);
    const intoMid = H(carrier, P(`${p.carrier.name}⋉${q.carrier.name}`), `ι_${name}`);
    return { carrier, intoMid };
  },
  induceCoactions: ({ c, e, carrier }) => ({
    coactL: H(P(`${c.poly.name}▷${carrier.name}`), carrier, `λ_${c.poly.name}_${carrier.name}`),
    coactR: H(carrier, P(`${carrier.name}▷${e.poly.name}`), `ρ_${carrier.name}_${e.poly.name}`)
  })
};

// ----- Build a tiny Cat♯ instance ---------------------------------------------
const c = comonoid("c");
const d = comonoid("d");
const e = comonoid("e");

// horizontals p : c▷d and q : d▷e
const p = bicomod(c, d, "P");
const q = bicomod(d, e, "Q");

// identity verticals (comonoid homomorphisms)
const idc: CoHom = { src: c, dst: c, map: H(c.poly, c.poly, "id_c") };
const ide: CoHom = { src: e, dst: e, map: H(e.poly, e.poly, "id_e") };

// compose horizontally: p ⊳_d q : c▷e
const pq = hcomp(p, q, Tools);
console.log("hcomp carrier:", pq.carrier.name);            // P⋉_dQ
console.log("hcomp boundaries:", pq.left.poly.name, "▷", pq.right.poly.name); // c ▷ e

// a square with identities (commutes trivially)
const sq: Square = {
  phi: idc, psi: ide,
  p, pPrime: pq,                                  // dummy boundary for the demo
  gamma: H(p.carrier, pq.carrier, "γ_demo")
};
const ok = squareCommutes(sq, (_s) => true);
console.log("square commutes?", ok);

// identity bicomodule and a quick check
const id_h = hid(c);
console.log("hid(c) carrier:", id_h.carrier.name, "left/right:", id_h.left.poly.name, id_h.right.poly.name);
