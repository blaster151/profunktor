// t-algebras-in-E.ts
import type { SymMonCat } from "./poly-algebras"     // you added earlier
import type { PolyMonad } from "./poly-2cat"

export interface PseudoTStar<E extends SymMonCat, I extends string> {
  E: E
  colours: readonly I[]
  // Constant collection functor 𝔈^{T*}: sends each i to the same object E.unit (shape-level)
  objAt: (i: I) => E["unit"]
}

// Build the constant pseudo-T-algebra 𝔈^{T*}
export function buildPseudoTStar<E extends SymMonCat, I extends string>(
  E: E, colours: readonly I[]
): PseudoTStar<E, I> {
  return { E, colours, objAt: (_i) => E.unit }
}

// A T-algebra "shape" in E: just an I-indexed family (shape-level)
export type TAlgebraShape<I extends string, EObj> = Record<I, EObj>

// Represent X : I→E as an internal functor Ẋ : 𝕋^T → 𝔈^{T*} (shape-only mapping)
export function representAsInternalFunctor<E extends SymMonCat, I extends string>(
  M: PolyMonad<I>, E: E, X: TAlgebraShape<I, E["unit"]>
): (bOp: { out: I; in: I[] }) => { dom: E["unit"]; cod: E["unit"] } {
  // For each basic op b with out=i and inputs j1..jk, produce a morphism ⊗_m X_{jm} -> X_i (shape stub)
  return (b) => ({
    dom: b.in.reduce((acc, j) => E.tensor(acc, X[j]), E.unit), // ⊗ inputs (start at unit)
    cod: X[b.out]
  })
}
