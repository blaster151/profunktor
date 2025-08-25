// examples/operad-segal-from-poly.ts
import { bouquet } from "../poly"
import { makeOperadFromPolynomialMonadShape, ColouredOperad, Op } from "../operad-core"
import type { Polynomial } from "../poly-core"
import type { PolyMonad } from "../poly-2cat"

// ----- 1) A tiny 1-colour polynomial: binary operation on A
type I = "A"
const Iset: readonly I[] = ["A"]

// One-node bouquet of arity 2 landing in A
const P: Polynomial<I> = bouquet(Iset, 2, "A")

// Helper: read primitive ops (shape) directly from the polynomial's (B,E)
// Each b ∈ B gives an op with out=codB(b) and inputs = sources of its fibre Eb
function opsFromPolynomial<I extends string>(P: Polynomial<I>): ReadonlyArray<Op<I>> {
  const ops: Op<I>[] = []
  for (const b of P.B) {
    const Eb = P.fibreE(b.id)
    const inp: I[] = Eb.map(e => P.srcE(e.id))
    ops.push({ out: P.codB(b.id), in: inp, arity: inp.length })
  }
  return ops
}

// ----- 2) Operad from polynomial monad "shape"
const primitiveOps = opsFromPolynomial(P) // here: exactly one op f: A×A -> A
const O: ColouredOperad<I> = makeOperadFromPolynomialMonadShape(Iset, primitiveOps)
const [f] = O.ops // binary op at colour A

// Build a "monad shell" so file is self-contained (laws are irrelevant for this demo)
const M: PolyMonad<I> = {
  I: Iset,
  T: P,
  eta: x => x,
  mu:  x => x,
}

// ----- 3) Segal-style composition witness
// Two-level tree: top = f, children = [f, f]  ⇒ composite op h = f ∘ [f, f]
// Segal says: depth-2 tree ↔ pair of composable 1-cells. We check arity/out colour.
const g1 = f
const g2 = f
const h = O.subst(f, [g1, g2]) // shape-only composite

// A tiny "Segal isomorphism" checker on shapes
function segalWitness<I extends string>(
  O: ColouredOperad<I>,
  top: Op<I>,
  children: ReadonlyArray<Op<I>>,
  composite: Op<I>
): string[] {
  const errs: string[] = []
  const sumArity = children.reduce((n, g) => n + g.arity, 0)
  if (composite.out !== top.out) errs.push("output colour mismatch")
  if (composite.arity !== sumArity) errs.push("arity not additive under substitution")
  // Optional: check the input-colour sequence equals concatenation of child inputs
  const flatInputs = children.flatMap(g => g.in)
  if (JSON.stringify(composite.in) !== JSON.stringify(flatInputs)) {
    errs.push("input profile mismatch under substitution")
  }
  return errs
}

console.log("primitive ops:", O.ops)
console.log("composite h = f ∘ [f,f]:", h)
console.log("Segal witness:", segalWitness(O, f, [g1, g2], h))

// ----- 4) Associativity sanity ( (f∘[f,f])∘[f,f,f,f]  ==  f∘[f∘[f,f], f∘[f,f]] at shape level )
const hLeft  = O.subst(h, [f, f, f, f])                   // flatten in one go
const hRight = O.subst(f, [O.subst(f, [f, f]), O.subst(f, [f, f])])

const sameShape =
  hLeft.out === hRight.out &&
  hLeft.arity === hRight.arity &&
  JSON.stringify(hLeft.in) === JSON.stringify(hRight.in)

console.log("Associativity (shape-level) equal?", sameShape)
