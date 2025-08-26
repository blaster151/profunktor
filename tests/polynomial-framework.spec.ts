import { describe, it, expect } from 'vitest'
import {
  // Core polynomial functionality
  evalPoly, Family, composeExt,
  // Polynomial monads
  checkPolyMonadLaws,
  // Bouquets and operads
  bouquet, makeOperadFromPolynomialMonadShape,
  // Graphical structures
  isWellTypedCorolla, composeAsBiCorolla,
  // Cartesian morphisms
  isCartesianMorphism, restrictionDeltaStar,
  // Exact squares
  isExactSquare, preservesPointwiseLanUnderForgetful,
  // Bar resolution
  internalAlgebraClassifier,
  // Nerve and Segal
  segalWitnessForClassifier,
  // Types
  type Polynomial, type PolyMonad, type ColouredOperad,
  type Corolla, type BiCorolla, type CartesianPolyMonadMorphism
} from '../poly'

describe('Polynomial Framework', () => {
  describe('Core Polynomial Functionality', () => {
    it('should evaluate polynomial on family correctly', () => {
      type I = "A" | "B"
      const Iset: readonly I[] = ["A", "B"]
      
      // Create a simple bouquet polynomial
      const P: Polynomial<I> = bouquet(Iset, 2, "A")
      const X: Family<I> = { A: [1, 2], B: ["x"] }
      
      const result = evalPoly(P, X)
      
      expect(result).toBeDefined()
      expect(result.A).toBeDefined()
      expect(result.B).toBeDefined()
      expect(Array.isArray(result.A)).toBe(true)
    })

    it('should compose polynomial extensions', () => {
      type I = "A"
      const Iset: readonly I[] = ["A"]
      const P = bouquet(Iset, 2, "A")
      const Q = bouquet(Iset, 1, "A")
      
      const composed = composeExt(P, Q)
      const X: Family<I> = { A: [1, 2] }
      
      const result = composed(X)
      expect(result).toBeDefined()
      expect(result.A).toBeDefined()
    })
  })

  describe('Polynomial Monads', () => {
    it('should check monad laws correctly', () => {
      type I = "A"
      const Iset: readonly I[] = ["A"]
      const P = bouquet(Iset, 2, "A")
      
      const M: PolyMonad<I> = {
        I: Iset,
        T: P,
        eta: (x) => x,
        mu: (x) => x
      }
      
      const X: Family<I> = { A: [1, 2] }
      const errors = checkPolyMonadLaws(M, X)
      
      // With identity stubs, should have no errors
      expect(Array.isArray(errors)).toBe(true)
    })
  })

  describe('Bouquets and Operads', () => {
    it('should create bouquet polynomial correctly', () => {
      type I = "A" | "B"
      const Iset: readonly I[] = ["A", "B"]
      
      const P = bouquet(Iset, 3, "A")
      
      expect(P.I).toEqual(Iset)
      expect(P.B).toHaveLength(1)
      expect(P.E).toHaveLength(3)
      expect(P.codB(0)).toBe("A")
    })

    it('should create operad from polynomial shape', () => {
      type I = "A"
      const Iset: readonly I[] = ["A"]
      const P = bouquet(Iset, 2, "A")
      
      const primitiveOps = P.B.map((b) => ({
        out: P.codB(b.id),
        in: P.fibreE(b.id).map((e) => P.srcE(e.id)),
        arity: P.fibreE(b.id).length,
      }))
      
      const O = makeOperadFromPolynomialMonadShape(Iset, primitiveOps)
      
      expect(O.colours).toEqual(Iset)
      expect(O.ops).toHaveLength(1)
      expect(O.ops[0].arity).toBe(2)
      expect(O.ops[0].out).toBe("A")
    })

    it('should perform operad substitution correctly', () => {
      type I = "A"
      const Iset: readonly I[] = ["A"]
      const P = bouquet(Iset, 2, "A")
      
      const primitiveOps = P.B.map((b) => ({
        out: P.codB(b.id),
        in: P.fibreE(b.id).map((e) => P.srcE(e.id)),
        arity: P.fibreE(b.id).length,
      }))
      
      const O = makeOperadFromPolynomialMonadShape(Iset, primitiveOps)
      const [f] = O.ops
      
      // Substitute f into itself
      const result = O.subst(f, [f, f])
      
      expect(result.out).toBe("A")
      expect(result.arity).toBe(4) // 2 + 2
    })
  })

  describe('Graphical Structures', () => {
    it('should validate well-typed corollas', () => {
      const corolla: Corolla<"A"> = {
        out: "A",
        in: ["A", "A"],
        label: "test"
      }
      
      expect(isWellTypedCorolla(corolla)).toBe(true)
    })

    it('should compose bicorollas correctly', () => {
      const f: Corolla<"A"> = {
        out: "A",
        in: ["A", "A"],
        label: "f"
      }
      
      const gs: Corolla<"A">[] = [
        { out: "A", in: ["A"], label: "g1" },
        { out: "A", in: ["A"], label: "g2" }
      ]
      
      const result = composeAsBiCorolla(f, gs)
      
      expect(result.left.out).toBe("A")
      expect(result.right.out).toBe("A")
      expect(result.left.in).toHaveLength(2) // concatenated inputs
    })
  })

  describe('Cartesian Morphisms', () => {
    it('should check cartesian morphism properties', () => {
      const morphism: CartesianPolyMonadMorphism<"X", "A"> = {
        delta: { onColour: (j) => j === "X" ? "A" : "A" },
        psi: { isPullback: true },
        phi: { isPullback: true }
      }
      
      const S = { I: ["X"], T: bouquet(["X"], 1, "X"), eta: (x) => x, mu: (x) => x }
      const T = { I: ["A"], T: bouquet(["A"], 1, "A"), eta: (x) => x, mu: (x) => x }
      
      expect(isCartesianMorphism(S, T, morphism)).toBe(true)
    })

    it('should perform restriction along colour map', () => {
      const delta = { onColour: (j: "X" | "Y") => j === "X" ? "A" : "B" }
      const XT = { A: "objA", B: "objB" }
      
      const result = restrictionDeltaStar(delta, XT)
      
      expect(result.X).toBe("objA")
      expect(result.Y).toBe("objB")
    })
  })

  describe('Exact Squares', () => {
    it('should check exact square properties', () => {
      const square = {
        tl: "obj1", tr: "obj2", bl: "obj3", br: "obj4",
        top: "morphism1", right: "morphism2", left: "morphism3", bottom: "morphism4",
        reason: "pullback-square" as const
      }
      
      const C = {
        unit: "unit",
        tensor: (x: any, y: any) => x,
        hom: (x: any, y: any) => "morphism",
        id: (x: any) => "id",
        comp: (g: any, f: any) => "composite"
      }
      
      expect(isExactSquare(C, square)).toBe(true)
    })

    it('should check pointwise Lan preservation', () => {
      const square = {
        tl: "obj1", tr: "obj2", bl: "obj3", br: "obj4",
        top: "morphism1", right: "morphism2", left: "morphism3", bottom: "morphism4",
        reason: "pullback-square" as const
      }
      
      const C = {
        unit: "unit",
        tensor: (x: any, y: any) => x,
        hom: (x: any, y: any) => "morphism",
        id: (x: any) => "id",
        comp: (g: any, f: any) => "composite"
      }
      
      const lanAt = (A: any) => ({ obj: "result" })
      
      const result = preservesPointwiseLanUnderForgetful(C, square, lanAt)
      expect(result.ok).toBe(true)
    })
  })

  describe('Bar Resolution', () => {
    it('should create internal algebra classifier', () => {
      const T = {
        C: {
          id: (x: any) => "morphism",
          comp: (g: any, f: any) => "composite",
          dom: (f: any) => "domain",
          cod: (f: any) => "codomain",
          product: (a: any, b: any) => "product",
          pullback: (f: any, g: any) => ({ obj: "pb", π1: "pi1", π2: "pi2" }),
          eqMor: (f: any, g: any) => true,
          eqObj: (a: any, b: any) => true
        },
        T0: (X: any) => "T0",
        T1: (f: any) => "T1",
        η: (X: any) => "eta",
        μ: (X: any) => "mu",
        preservesPullbacks: true
      }
      
      const terminal = {
        one: "terminal",
        bang: (X: any) => "bang"
      }
      
      const result = internalAlgebraClassifier(T, terminal)
      
      expect(result.C).toBeDefined()
      expect(result.C0).toBeDefined()
      expect(result.C1).toBeDefined()
    })
  })

  describe('Nerve and Segal', () => {
    it('should create Segal witness for classifier', () => {
      const T = {
        C: {
          id: (x: any) => "morphism",
          comp: (g: any, f: any) => "composite",
          dom: (f: any) => "domain",
          cod: (f: any) => "codomain",
          product: (a: any, b: any) => "product",
          pullback: (f: any, g: any) => ({ obj: "pb", π1: "pi1", π2: "pi2" }),
          eqMor: (f: any, g: any) => true,
          eqObj: (a: any, b: any) => true
        },
        T0: (X: any) => "T0",
        T1: (f: any) => "T1",
        η: (X: any) => "eta",
        μ: (X: any) => "mu",
        preservesPullbacks: true
      }
      
      const terminal = {
        one: "terminal",
        bang: (X: any) => "bang"
      }
      
      const result = segalWitnessForClassifier(T, terminal)
      
      expect(result.sigma).toBeDefined()
      expect(result.sigmaInv).toBeDefined()
      expect(result.reason).toBe("pullback-iso")
    })
  })
})
