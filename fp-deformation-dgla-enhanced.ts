// fp-deformation-dgla-enhanced.ts
// Enhanced version with proper additive structure support

import { Degree, Sum, Term, zero, sum, plus, scale, koszul } from './fp-dg-core';

// ============================================================================
// Part 1: Enhanced Interfaces with Additive Structure
// ============================================================================

// Enhanced cooperad-like interface
export interface DgCooperadLike<C> {
  delta(c: C): Sum<[C, C]>;
  degree(c: C): Degree;
  dC(c: C): Sum<C>; // differential on C
}

// Enhanced algebra-like interface with additive structure
export interface DgAlgebraLike<P> {
  // Multiplicative structure
  mul(x: P, y: P): P; // graded-associative product
  unit(): P;
  
  // Additive structure (k-linear)
  add(x: P, y: P): P;
  sub(x: P, y: P): P;
  scale(k: number, x: P): P;
  zero(): P;
  
  // Grading and differential
  degree(p: P): Degree;
  dP(p: P): Sum<P>;   // differential on P
  
  // Equality (for Maurer-Cartan checking)
  equals(x: P, y: P): boolean;
}

// Hom(C,P) object with degree
export interface Hom<C, P> {
  run(c: C): P;
  degree: Degree; // |f|
}

// ============================================================================
// Part 2: Enhanced Convolution Product
// ============================================================================

/**
 * Convolution product on Hom(C,P):
 * (f ⋆ g)(c) = Σ f(c1) ⋆ g(c2) with proper Koszul signs
 */
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
      let acc = P.zero();
      
      for (const { coef, term: [c1, c2] } of pairs) {
        const a = f.run(c1);
        const b = g.run(c2);
        
        // Apply Koszul sign: (-1)^{|g| * |c1|}
        const s = signFromSplit(C.degree(c1), g.degree);
        const piece = P.mul(a, b);
        const scaledPiece = P.scale(coef * s, piece);
        
        acc = P.add(acc, scaledPiece);
      }
      
      return acc;
    }
  };
}

function signFromSplit(leftDeg: Degree, rightMapDeg: Degree): 1 | -1 {
  return koszul(leftDeg, rightMapDeg) as 1 | -1;
}

// ============================================================================
// Part 3: Enhanced Differential
// ============================================================================

/**
 * Differential on Hom(C,P): d(f) = dP ∘ f - (-1)^{|f|} f ∘ dC
 */
export function dHom<C, P>(
  C: DgCooperadLike<C>,
  P: DgAlgebraLike<P>,
  f: Hom<C, P>
): Hom<C, P> {
  return {
    degree: f.degree + 1,
    run(c: C): P {
      // Compute dP(f(c))
      const left: Sum<P> = P.dP(f.run(c));
      const leftSum = sumToAlgebra(P, left);
      
      // Compute (-1)^{|f|} * Σ f(c') where dC(c) = Σ c'
      const rightC: Sum<C> = C.dC(c);
      const s = koszul(f.degree, 1); // (-1)^{|f|}
      
      let rightSum = P.zero();
      for (const { coef, term: cPrime } of rightC) {
        const fcPrime = f.run(cPrime);
        rightSum = P.add(rightSum, P.scale(coef * s, fcPrime));
      }
      
      // Return dP(f(c)) - (-1)^{|f|} * Σ f(c')
      return P.sub(leftSum, rightSum);
    }
  };
}

/**
 * Convert a Sum<P> to a single P using the additive structure
 */
function sumToAlgebra<P>(Palg: DgAlgebraLike<P>, s: Sum<P>): P {
  let acc = Palg.zero();
  for (const { coef, term } of s) {
    const scaled = Palg.scale(coef, term);
    acc = Palg.add(acc, scaled);
  }
  return acc;
}

// ============================================================================
// Part 4: Enhanced Lie Bracket
// ============================================================================

/**
 * Lie bracket on Hom via convolution: [f,g] = f ⋆ g - (-1)^{|f||g|} g ⋆ f
 */
export function bracket<C, P>(
  C: DgCooperadLike<C>,
  P: DgAlgebraLike<P>,
  f: Hom<C, P>,
  g: Hom<C, P>
): Hom<C, P> {
  return {
    degree: f.degree + g.degree,
    run(c: C): P {
      const fg = convProduct(C, P, f, g);
      const gf = convProduct(C, P, g, f);
      const s = koszul(f.degree, g.degree);
      
      const fgResult = fg.run(c);
      const gfResult = gf.run(c);
      const scaledGf = P.scale(s, gfResult);
      
      return P.sub(fgResult, scaledGf);
    }
  };
}

// ============================================================================
// Part 5: Enhanced Maurer-Cartan Checker
// ============================================================================

/**
 * Maurer-Cartan equation: d(α) + 1/2 [α, α] = 0
 */
export function isMaurerCartan<C, P>(
  C: DgCooperadLike<C>,
  P: DgAlgebraLike<P>,
  alpha: Hom<C, P>,
  testTerms: C[] = []
): { isMC: boolean; details: string[] } {
  const details: string[] = [];
  let allPassed = true;
  
  for (const c of testTerms) {
    // Compute d(α)(c)
    const dAlpha = dHom(C, P, alpha);
    const dAlphaC = dAlpha.run(c);
    
    // Compute 1/2 [α, α](c)
    const bracketResult = bracket(C, P, alpha, alpha);
    const bracketC = bracketResult.run(c);
    const halfBracket = P.scale(0.5, bracketC);
    
    // Check: d(α)(c) + 1/2 [α, α](c) = 0
    const mcTerm = P.add(dAlphaC, halfBracket);
    const isZero = P.equals(mcTerm, P.zero());
    
    if (!isZero) {
      allPassed = false;
      details.push(`MC failed for term ${c}: result not zero`);
    }
  }
  
  return {
    isMC: allPassed,
    details
  };
}

// ============================================================================
// Part 6: Utility Functions
// ============================================================================

/**
 * Create a constant homomorphism
 */
export function constantHom<C, P>(
  P: DgAlgebraLike<P>,
  value: P,
  degree: Degree = 0
): Hom<C, P> {
  return {
    degree,
    run: (_: C) => value
  };
}

/**
 * Create the zero homomorphism
 */
export function zeroHom<C, P>(P: DgAlgebraLike<P>): Hom<C, P> {
  return constantHom(P, P.zero(), 0);
}

/**
 * Create the identity homomorphism (for degree 0)
 */
export function identityHom<C, P>(
  C: DgCooperadLike<C>,
  P: DgAlgebraLike<P>,
  embedding: (c: C) => P
): Hom<C, P> {
  return {
    degree: 0,
    run: embedding
  };
}

/**
 * Compose two homomorphisms
 */
export function composeHom<C, P>(
  P: DgAlgebraLike<P>,
  f: Hom<C, P>,
  g: Hom<C, P>
): Hom<C, P> {
  return {
    degree: f.degree + g.degree,
    run: (c: C) => P.mul(f.run(c), g.run(c))
  };
}

/**
 * Add two homomorphisms
 */
export function addHom<C, P>(
  P: DgAlgebraLike<P>,
  f: Hom<C, P>,
  g: Hom<C, P>
): Hom<C, P> {
  return {
    degree: f.degree, // Assuming same degree for addition
    run: (c: C) => P.add(f.run(c), g.run(c))
  };
}

/**
 * Scale a homomorphism
 */
export function scaleHom<C, P>(
  P: DgAlgebraLike<P>,
  k: number,
  f: Hom<C, P>
): Hom<C, P> {
  return {
    degree: f.degree,
    run: (c: C) => P.scale(k, f.run(c))
  };
}

// ============================================================================
// Part 7: Deformation Theory Utilities
// ============================================================================

/**
 * Compute the deformation complex (convolution dg-Lie algebra)
 */
export function deformationComplex<C, P>(
  C: DgCooperadLike<C>,
  P: DgAlgebraLike<P>
) {
  return {
    // Differential
    d: (f: Hom<C, P>) => dHom(C, P, f),
    
    // Lie bracket
    bracket: (f: Hom<C, P>, g: Hom<C, P>) => bracket(C, P, f, g),
    
    // Maurer-Cartan checker
    isMaurerCartan: (alpha: Hom<C, P>, testTerms: C[] = []) => 
      isMaurerCartan(C, P, alpha, testTerms),
    
    // Utility constructors
    zero: () => zeroHom<C, P>(P),
    constant: (value: P, degree: Degree = 0) => constantHom(P, value, degree),
    identity: (embedding: (c: C) => P) => identityHom(C, P, embedding),
    
    // Operations
    add: (f: Hom<C, P>, g: Hom<C, P>) => addHom(P, f, g),
    scale: (k: number, f: Hom<C, P>) => scaleHom(P, k, f),
    compose: (f: Hom<C, P>, g: Hom<C, P>) => composeHom(P, f, g)
  };
}

/**
 * Check if a homomorphism is a chain map
 */
export function isChainMap<C, P>(
  C: DgCooperadLike<C>,
  P: DgAlgebraLike<P>,
  f: Hom<C, P>,
  testTerms: C[] = []
): { isChainMap: boolean; details: string[] } {
  const details: string[] = [];
  let allPassed = true;
  
  for (const c of testTerms) {
    // Check: dP(f(c)) = f(dC(c))
    const left = P.dP(f.run(c));
    const rightC = C.dC(c);
    
    let rightSum = P.zero();
    for (const { coef, term: cPrime } of rightC) {
      rightSum = P.add(rightSum, P.scale(coef, f.run(cPrime)));
    }
    
    const leftSum = sumToAlgebra(P, left);
    const isEqual = P.equals(leftSum, rightSum);
    
    if (!isEqual) {
      allPassed = false;
      details.push(`Chain map failed for term ${c}`);
    }
  }
  
  return {
    isChainMap: allPassed,
    details
  };
}
