// operad-nerve.ts
import type { Polynomial } from "./poly-core"
import type { PolyMonad } from "./poly-2cat"

// Collections (I-coloured symmetric sequences) as arity-indexed families
export type Coll<I extends string> = Record<I, ReadonlyArray<{ arity: number }>>

// Monoidal "substitution" ∘ on Coll is large; we expose just the interface
export interface CollMonoidal<I extends string> {
  subst: (F: Coll<I>, G: Coll<I>) => Coll<I> // (F ∘ G)
  unit: Coll<I>
}

// Nerve functor O : Poly(I) -> Coll(I) (Def. 6.6), here as a placeholder map
export function nerveToCollections<I extends string>(P: Polynomial<I>): Coll<I> {
  // Minimal shape: for each i, record one generator per b∈B_i with arity = |E_b|
  const out: any = {}
  for (const i of P.I) out[i] = []
  for (const b of P.B) {
    const ar = P.fibreE(b.id).length
    out[P.codB(b.id)].push({ arity: ar })
  }
  return out as Coll<I>
}

// From a polynomial monad T, build the coloured symmetric operad O_T (shape only)
export function operadFromPolyMonad<I extends string>(
  M: PolyMonad<I>, mon: CollMonoidal<I>
): { O: Coll<I> } {
  const O = nerveToCollections(M.T)
  // In a full impl., enforce monoid law in (Coll(I), ∘) via M.eta/M.mu images.
  void mon
  return { O }
}
