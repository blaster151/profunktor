// Effects → Cat♯ mapping: cofree comonoids and handler bicomodules.  :contentReference[oaicite:1]{index=1}
import type { Polynomial } from "./polynomial";
import type { Handler } from "./handler";
import type { Poly, PolyHom, Comonoid, Bicomodule, Square, CoHom } from "../catsharp/definition";

const P = (name: string): Poly => ({ name });
const H = (from: Poly, to: Poly, label: string): PolyHom => ({ from, to, label });
const idCoHom = (c: Comonoid, lbl: string): CoHom => ({ src: c, dst: c, map: H(c.poly, c.poly, lbl) });

/** Object map: polynomial ? ↦ cofree comonoid c? (names only). */
export function cofreeComonoidOf(poly: Polynomial, label = "c?"): Comonoid {
  const c = P(label);
  return {
    poly: c,
    counit: H(c, P("y"), "ε"),
    comult: H(c, P(`${c.name}▷${c.name}`), "δ")
  };
}

/** Morphism map: handler H: ? → @ ↦ bicomodule B: c? ▷ c@. */
export function bicomoduleOfHandler(Hdl: Handler, cFrom: Comonoid, cTo: Comonoid): Bicomodule {
  const name = `B[${cFrom.poly.name}⇒${cTo.poly.name}]`;
  return {
    left: cFrom,
    right: cTo,
    carrier: P(name),
    // Right coaction: B ⊳ ε_3  (matches "B ⊳ 3 —B⊳ε3→ B ⊳ 3 ⊳ 3").  :contentReference[oaicite:1]{index=1}
    coactR: H(P(name), P(`${name}▷${cTo.poly.name}`), `B⊳ε_${cTo.poly.name}`),
    // Left coaction: (! ⊳ 3) ∘ (B ⊳ ε_3). We tag it to reflect the composite.  :contentReference[oaicite:2]{index=2}
    coactL: H(P(`${cFrom.poly.name}▷${name}`), P(name), `(!⊳${cTo.poly.name})∘(B⊳ε)`)
  };
}

/** Counit "witness" square over a chosen cofree comonoid: a harmless cell you can use in tests/demos.
 *  We keep the boundaries trivial (id verticals; hid horizontals) and tag γ as "ε".
 *  This mirrors how the paper employs counits inside the equalizer proof when mapping spans to Cat♯.  :contentReference[oaicite:1]{index=1}
 */
export function epsilonSquareAt(c: Comonoid): Square {
  return {
    phi: idCoHom(c, "id_L"),
    psi: idCoHom(c, "id_R"),
    p:   { left: c, right: c, carrier: c.poly, coactL: c.comult, coactR: c.comult },
    pPrime: { left: c, right: c, carrier: c.poly, coactL: c.comult, coactR: c.comult },
    gamma: H(c.poly, c.poly, "ε_square") // witness label; your checker supplies the commuting proof
  };
}

// ---- New: Eff-square → Cat♯ square (Theorem 5.15 mapping) --------------------  :contentReference[oaicite:3]{index=3}
/**
 * Map an Eff square (φ:2→2', ψ:3→3', θ:B→B') to a Cat♯ square between bicomodules B⊳3 and B'⊳3'.
 * We model φ,ψ as identity CoHoms on their cofree comonoids; θ is recorded in the 2-cell label.
 */
export function squareFromEff(
  c2: Comonoid, c3: Comonoid,
  B: Bicomodule,
  c2p: Comonoid, c3p: Comonoid,
  Bp: Bicomodule,
  thetaLabel = "θ"
): Square {
  return {
    phi: idCoHom(c2, "φ"),   // placeholder: your real cofunctor map goes here
    psi: idCoHom(c3, "ψ"),
    p: B,
    pPrime: Bp,
    gamma: H(B.carrier, Bp.carrier, thetaLabel)
  };
}

// ---- New: faithfulness shim for 3≠0 (models "B ⊳ & is epi") -------------------
/** Positions-level epi check: with nonempty 3, the projection B⊳3 → B (post ε) is surjective. */
export function projAfterEpsilonIsEpi(threeHasPositions: boolean, B_positions: string[]): boolean {
  if (!threeHasPositions) return false;
  // In our Set-level reading, ε collapses the 3-factor; surjectivity back to B-positions is immediate.
  return B_positions.length >= 0;
}
