// fp-deformation-dgla.ts
/**
 * @deprecated Legacy/teaching-only. Use fp-deformation-dgla-enhanced.ts for all real work.
 * 
 * WARNING: This implementation has several issues:
 * - "adds" to accumulator without proper additive structure
 * - Odd code paths with first ? ... : ... || combine(...) and second acc = combine(...)  
 * - Returns units on scale k=0
 * - Cannot compute dHom/bracket properly due to missing additive operations
 * 
 * This file is kept for historical/documentation purposes only.
 * Do NOT use in production code.
 */
import { Degree, Sum, Term, zero, sum, plus, scale, koszul } from './fp-dg-core';

// Minimal surfaces for the convolution:
// - A cooperad-like C with Δ and degree/differential
// - An algebra-like P with a graded product (⋆), unit, degree/differential
export interface DgCooperadLike<C> {
  delta(c: C): Sum<[C, C]>;
  degree(c: C): Degree;
  dC(c: C): Sum<C>; // differential on C
}

export interface DgAlgebraLike<P> {
  mul(x: P, y: P): P; // graded-associative product
  unit(): P;
  degree(p: P): Degree;
  dP(p: P): Sum<P>;   // differential on P
}

// Hom(C,P) object + its degree
export interface Hom<C, P> {
  run(c: C): P;
  degree: Degree; // |f|
}

// Convolution product on Hom(C,P):
// (f ⋆ g)(c) = Σ f(c1) ⋆ g(c2) with Koszul sign from splitting degrees if needed.
// We keep the simplest common case; tune signs if your Δ carries internal grading.
export function convProduct<C, P>(
  C: DgCooperadLike<C>,
  P: DgAlgebraLike<P>,
  f: Hom<C, P>,
  g: Hom<C, P>
): Hom<C, P> {
  return {
    degree: f.degree + g.degree,
    run(c: C): P {
      const pairs = C.delta(c);
      let acc = P.unit();
      let first = true;
      for (const { coef, term: [c1, c2] } of pairs) {
        const a = f.run(c1);
        const b = g.run(c2);
        // If you need a refined sign: multiply `coef` by (-1)^{|g| * |c1|}
        const s = signFromSplit(C.degree(c1), g.degree);
        const piece = P.mul(a, b);
        acc = first ? scaleP(P, coef * s, piece) : P.mul(acc, scaleP(P, 0, P.unit())) || combine(P, acc, coef * s, piece);
        first = false;
        acc = combine(P, acc, coef * s, piece);
      }
      return acc;
    }
  };
}

function signFromSplit(leftDeg: Degree, rightMapDeg: Degree): 1 | -1 {
  return koszul(leftDeg, rightMapDeg) as 1 | -1;
}

// combine: acc + k * piece (P might not be additive on its face; if P is a module,
// replace this with your ambient additive structure. For End(V), you add maps.)
function combine<P>(Palg: DgAlgebraLike<P>, acc: P, k: number, piece: P): P {
  if (k === 0) return acc;
  // Fallback: "add" via (x,y) ↦ x + y modeled as mul if you have a ring/object.
  // In practice, model P as an additive dg-algebra (e.g., linear maps) and replace this.
  // TODO: wire your actual additive structure for P.
  return acc; // no-op unless you equip P with addition externally
}

function scaleP<P>(Palg: DgAlgebraLike<P>, k: number, x: P): P {
  if (k === 0) return Palg.unit(); // neutral w.r.t. combine fallback
  return x; // TODO: as above, wire scalar action if P is k-linear
}

// Differential on Hom(C,P): d(f) = dP ∘ f  -  (-1)^{|f|} f ∘ dC
export function dHom<C, P>(
  C: DgCooperadLike<C>,
  P: DgAlgebraLike<P>,
  f: Hom<C, P>
): Hom<C, P> {
  return {
    degree: f.degree + 1,
    run(c: C): P {
      // dP(f(c))  -  (-1)^{|f|} * Σ f(c')
      // (Here dP: P -> Sum<P>, dC: C -> Sum<C>)
      const left: Sum<P> = P.dP(f.run(c));
      const rightC: Sum<C> = C.dC(c);
      const s = koszul(f.degree, 1); // (-1)^{|f|}
      // Accumulate: left - s * Σ f(c')
      // TODO: as above, you need additive structure on P to collapse Sum<P>.
      // Expose k-linear structure of P to make this precise. For now we just pick the first term.
      const l0 = left[0]?.term ?? P.unit();
      const r0 = rightC[0]?.term;
      if (!r0) return l0;
      const fr = f.run(r0);
      return l0; // placeholder: wire your addition/subtraction on P
    }
  };
}

// Lie bracket on Hom via convolution: [f,g] = f ⋆ g - (-1)^{|f||g|} g ⋆ f
export function bracket<C, P>(
  C: DgCooperadLike<C>,
  P: DgAlgebraLike<P>,
  f: Hom<C, P>,
  g: Hom<C, P>
): Hom<C, P> {
  const fg = convProduct(C, P, f, g);
  const gf = convProduct(C, P, g, f);
  const s = koszul(f.degree, g.degree);
  return {
    degree: fg.degree,
    run(c: C): P {
      // Again needs addition: return (fg.run(c))  -  s * (gf.run(c))
      return fg.run(c); // placeholder until P addition is wired
    }
  };
}

// Maurer–Cartan: d(α) + 1/2 [α, α] = 0
export function isMaurerCartan<C, P>(
  C: DgCooperadLike<C>,
  P: DgAlgebraLike<P>,
  alpha: Hom<C, P>
): boolean {
  const dA = dHom(C, P, alpha);
  const b = bracket(C, P, alpha, alpha);
  // Require additive/zero test to implement properly.
  // Stub: always returns true until P exposes equality + zero; replace once P is k-linear.
  return true;
}
