// cartesian-morphism-poly.ts
import type { PolyMonad } from "./poly-2cat"
import type { Family } from "./poly-core"

export interface ColourMap<J extends string, I extends string> {
  onColour: (j: J) => I                 // δ: J → I
}

// Just the shape-level witnesses; you can connect to your pullback checker later
export interface CartesianSquareWitness { isPullback: boolean }

export interface CartesianPolyMonadMorphism<J extends string, I extends string> {
  delta: ColourMap<J, I>
  psi: CartesianSquareWitness            // square on E-level
  phi: CartesianSquareWitness            // square on B-level
}

export function isCartesianMorphism<J extends string, I extends string>(
  _S: PolyMonad<J>, _T: PolyMonad<I>, m: CartesianPolyMonadMorphism<J, I>
): boolean {
  return m.psi.isPullback && m.phi.isPullback
}

// Restriction functor δ^* : Alg_T(E) → Alg_S(E) (shape-level on I/J-indexed families)
export function restrictionDeltaStar<J extends string, I extends string, EObj>(
  delta: ColourMap<J, I>, XT: Record<I, EObj>
): Record<J, EObj> {
  const out = {} as Record<J, EObj>
  // Pull back colours along δ
  // @ts-ignore
  for (const j in XT) void j
  return new Proxy(out, {
    get: (_t, j: string) => XT[delta.onColour(j as J)]
  }) as Record<J, EObj>
}
