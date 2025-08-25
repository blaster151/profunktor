// poly-2cat.ts
import { Polynomial, CartesianNat, composeExt, evalPoly, Family } from "./poly-core"

export interface Poly2Cell<I extends string> { nat: CartesianNat<I> }
export interface Poly1Cell<I extends string> { P: Polynomial<I> }
export type Poly0Cell<I extends string> = I[]

// A polynomial monad T is a monoid object (T, η, μ) in Poly(I)
export interface PolyMonad<I extends string> {
  I: readonly I[]
  T: Polynomial<I>
  eta: (X: Family<I>) => Family<I>                 // η : Id ⇒ T (extension-level)
  mu:  (X: Family<I>) => Family<I>                 // μ : T∘T ⇒ T (extension-level)
}

// Extension-level monad laws checker (tiny deterministic test)
export function checkPolyMonadLaws<I extends string>(
  M: PolyMonad<I>, sample: Family<I>
): string[] {
  const e: string[] = []
  const id = (x: Family<I>) => x
  // Left/right unit: μ ∘ Tη = id  and  μ ∘ ηT = id  on T X
  const TX = evalPoly(M.T, sample)
  const left  = M.mu(evalPoly(M.T, M.eta(sample)))
  const right = M.mu(M.eta(TX))
  if (JSON.stringify(left) !== JSON.stringify(TX))  e.push("left unit fails on sample")
  if (JSON.stringify(right) !== JSON.stringify(TX)) e.push("right unit fails on sample")
  // Associativity: μ ∘ Tμ = μ ∘ μT
  const TTX = evalPoly(M.T, TX)
  const lhs = M.mu(evalPoly(M.T, M.mu(TX)))
  const rhs = M.mu(M.mu(TTX))
  if (JSON.stringify(lhs) !== JSON.stringify(rhs)) e.push("associativity fails on sample")
  return e
}
