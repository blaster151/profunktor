import { evalPoly, Family } from "../poly-core"
import { bouquet } from "../poly-bouquet"
import { checkPolyMonadLaws } from "../poly-2cat"

type I = "A" | "B"
const Iset: readonly I[] = ["A","B"]

// Bouquet at arity 2 landing in A
const P = bouquet(Iset, 2, "A")
// Sample family X
const X: Family<I> = { A: [1,2], B: ["x"] }

console.log("P(X):", JSON.stringify(evalPoly(P, X)))

// Dummy monad on I via P (eta/mu = identity-shaped placeholders)
const M = {
  I: Iset,
  T: P,
  eta: (Y: Family<I>) => Y,
  mu:  (Y: Family<I>) => Y
}
console.log("monad laws:", checkPolyMonadLaws(M as any, X))
