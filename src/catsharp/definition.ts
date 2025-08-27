// Cat♯ as Comod(Poly): witness-level interfaces you can use today.
// Matches Defs. 2.3–2.5 and diagrams (1)–(2).  :contentReference[oaicite:1]{index=1}

/** Bare polynomial witness (we keep it abstract; you can swap in a real Poly later). */
export interface Poly { name: string }
export interface PolyHom { from: Poly; to: Poly; label: string }

/** Comonoid in Poly: ε : c→y and δ : c→ c ▷ c (▷ = polynomial composition ⊳ in the paper). */
export interface Comonoid {
  poly: Poly;
  counit: PolyHom;       // ε : c → y
  comult: PolyHom;       // δ : c → c ▷ c
}

/** Comonoid homomorphism (vertical 1-cell). */
export interface CoHom {
  src: Comonoid; dst: Comonoid; map: PolyHom; // map : c → c' commuting with ε, δ
}

/** (c,d)-bicomodule (horizontal 1-cell) with commuting coactions. */
export interface Bicomodule {
  left: Comonoid; right: Comonoid;
  carrier: Poly;
  coactL: PolyHom;   // c ▷ p  ←  p
  coactR: PolyHom;   // p  →  p ▷ d
}

/** Square (2-cell): γ : p → p' such that (1) commutes with φ, ψ. */
export interface Square {
  phi: CoHom; psi: CoHom;
  p: Bicomodule; pPrime: Bicomodule;
  gamma: PolyHom; // polynomial morphism
}

/** Horizontal identity at c: the comultiplication bicomodule. */
export function hid(c: Comonoid): Bicomodule {
  return {
    left: c, right: c,
    carrier: c.poly,
    coactL: c.comult,   // δ used on the left
    coactR: c.comult    // δ used on the right
  };
}

// ---- Composition via the equalizer in diagram (2) (witness-level) -------------------------
// We don't compute equalizers here; instead we accept a small "toolbox" so you can plug in
// whichever concrete Poly implementation (or mock) you like.

export interface EqualizerTools {
  /** Build c ▷ (p ⋉_d q)  ←  p ⋉ q  →  (p ⋉ q) ▷ e and return the chosen equalizer carrier. */
  equalizeTopRow(args: {
    c: Comonoid; d: Comonoid; e: Comonoid;
    p: Bicomodule; q: Bicomodule;
  }): { carrier: Poly, intoMid: PolyHom };
  /** Induce coactions on the equalizer object by whiskering (these preserve connected limits). */
  induceCoactions(args: {
    c: Comonoid; e: Comonoid; carrier: Poly;
  }): { coactL: PolyHom; coactR: PolyHom };
}

/** Horizontal composition p : c▷d and q : d▷e → p ⋉_d q : c▷e (diagram (2)). */
export function hcomp(p: Bicomodule, q: Bicomodule, T: EqualizerTools): Bicomodule {
  if (p.right !== q.left) throw new Error("bicomodule boundary mismatch (d must agree).");
  const { carrier } = T.equalizeTopRow({ c: p.left, d: p.right, e: q.right, p, q });
  const { coactL, coactR } = T.induceCoactions({ c: p.left, e: q.right, carrier });
  return { left: p.left, right: q.right, carrier, coactL, coactR };
}

/** Check square commutativity of (1) given a helper that compares the two composite legs. */
export function squareCommutes(
  sq: Square,
  commuteChecker: (sq: Square) => boolean
): boolean {
  return commuteChecker(sq);
}

// Pseudo-double-category shell (objects, vertical/horizontal 1-cells, squares).
export interface CatSharp {
  objects: Comonoid[];
  v: CoHom[];           // vertical
  h: Bicomodule[];      // horizontal
  cells: Square[];      // squares
}
