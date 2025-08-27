// Span(Poly) → Cat♯ (cartesian-left case) — names-only helper matching Prop. 5.5.  :contentReference[oaicite:2]{index=2}
import type { Comonoid, Bicomodule, Poly, PolyHom } from "../catsharp/definition";
const P = (name: string): Poly => ({ name });
const H = (from: Poly, to: Poly, label: string): PolyHom => ({ from, to, label });

/** Given comonoids c?, cB, c@ coming from a cartesian-left span ? ← B → @, return c? ⊳ cB ⊳ c@. */
export function bicomoduleFromCartesianLeftSpan(cQ: Comonoid, cB: Comonoid, cAt: Comonoid): Bicomodule {
  const name = `c${cQ.poly.name}⊳c${cB.poly.name}⊳c${cAt.poly.name}`;
  return {
    left: cQ,
    right: cAt,
    carrier: P(name),
    // Structure maps are the composites shown under "as shown:" in Prop. 5.5 (names-only here).
    coactL: H(P(`${cQ.poly.name}▷${name}`), P(name), `λ_${name}`),
    coactR: H(P(name), P(`${name}▷${cAt.poly.name}`), `ρ_${name}`)
  };
}
