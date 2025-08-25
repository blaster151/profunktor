// examples/operad-2color-algebra-restriction.ts
import {
  bouquet,
  makeOperadFromPolynomialMonadShape,
  representAsInternalFunctor,
  restrictionDeltaStar,
  SymMonCat,
  type Polynomial,
  type Op,
} from "../poly"

// 1) Two colours and a binary bouquet P : A×B → A
type I = "A" | "B"
const Iset: readonly I[] = ["A", "B"]
const P: Polynomial<I> = bouquet(Iset, 2, "A")

// Turn the polynomial "node + fibre" into a primitive operad op shape
const primitiveOps: ReadonlyArray<Op<I>> = P.B.map((b) => ({
  out: P.codB(b.id),
  in: P.fibreE(b.id).map((e) => P.srcE(e.id)),
  arity: P.fibreE(b.id).length,
}))
const O = makeOperadFromPolynomialMonadShape(Iset, primitiveOps)

// 2) A toy symmetric monoidal E (objects carry a size; ⊗ adds sizes)
type Obj = { size: number }
type Mor = (x: Obj) => Obj
const E: SymMonCat<Obj, Mor> = {
  unit: { size: 1 },
  tensor: (x, y) => ({ size: x.size + y.size }),
  hom: () => ((z) => z),
  id: () => (z) => z,
  comp: (g, f) => (z) => g(f(z)),
}

// Algebra "shape" X : I → E
const X: Record<I, Obj> = { A: { size: 2 }, B: { size: 3 } }

// Represent X as an internal functor Ẋ : 𝕋ᵗ → 𝔈^{T*} (shape-level arrow builder)
const arrow = representAsInternalFunctor({ I: Iset, T: P, eta: (x) => x, mu: (x) => x } as any, E, X)

// Inspect the single primitive op f : A×B → A and its induced arrow shape
const [f] = O.ops
console.log("primitive op f:", f)
console.log("Ẋ(f) dom⊗cod sizes:", {
  dom: arrow({ out: f.out, in: f.in }).dom,
  cod: arrow({ out: f.out, in: f.in }).cod,
})

// 3) Restrict the algebra along a colour map δ : {X,Y}→{A,B}
type J = "X" | "Y"
const delta = { onColour: (j: J): I => (j === "X" ? "A" : "B") }
const Xrestricted = restrictionDeltaStar<J, I, Obj>(delta, X)
console.log("δ*X at X:", Xrestricted["X"], " | at Y:", Xrestricted["Y"])
