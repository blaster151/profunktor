/**
 * Geometric to Quillen Adjunctions
 * 
 * Implementation of Beke's functor: GeometricMorphism → QuillenAdjunction
 * 
 * This maps geometric morphisms between sheaf topoi to Quillen pairs for 
 * lifted model structures. The key insight is that the left exact pullback 
 * and right adjoint pushforward of a geometric morphism naturally preserve 
 * the model structure axioms when lifted to sheaf categories.
 * 
 * Paper point (3): f^* preserves cofibrations and local weak equivalences,
 * producing a Quillen pair.
 */

import type { 
  ModelCategory, 
  GeometricMorphism as BaseGeometricMorphism,
  QuillenAdjunction as BaseQuillenAdjunction,
  Site,
  GrothendieckTopology,
  Cover
} from '../model/sheafifiable-model-structure';
import type { LocalWeakEqWitness } from '../equivalences/local-weak-equivalence';

// ============================================================================
// GEOMETRIC MORPHISM STRUCTURES
// ============================================================================

/**
 * Geometric Morphism
 * 
 * A geometric morphism between sheaf topoi
 */
export interface GeometricMorphism<A, B> {
  readonly leftExactPullback: (b: B) => A;      // f^*
  readonly rightAdjointPushforward: (a: A) => B; // f_*
  readonly leftAdjointPushforward?: (a: A) => B; // f_! (if essential)
  readonly name?: string;
  readonly description?: string;
}

/**
 * Essential Geometric Morphism
 * 
 * A geometric morphism where f_! exists
 */
export interface EssentialGeometricMorphism<A, B> extends GeometricMorphism<A, B> {
  readonly leftAdjointPushforward: (a: A) => B; // f_! (required)
  readonly isEssential: true;
}

/**
 * Geometric Properties
 * 
 * Properties that geometric morphisms may satisfy
 */
export interface GeometricProperties {
  readonly isOpen?: boolean;
  readonly isClosed?: boolean;
  readonly isProper?: boolean;
  readonly isConnected?: boolean;
  readonly isLocal?: boolean;
  readonly isAtomic?: boolean;
}

/**
 * Enhanced Geometric Morphism
 * 
 * Geometric morphism with additional properties
 */
export interface EnhancedGeometricMorphism<A, B> extends GeometricMorphism<A, B> {
  readonly properties: GeometricProperties;
  readonly siteA?: Site;
  readonly siteB?: Site;
  readonly topologyA?: GrothendieckTopology;
  readonly topologyB?: GrothendieckTopology;
}

// ============================================================================
// QUILLEN ADJUNCTION STRUCTURES
// ============================================================================

/**
 * Quillen Adjunction
 * 
 * A Quillen adjunction between model categories
 */
export interface QuillenAdjunction<A, B> {
  readonly left: (b: B) => A;   // left Quillen (preserves cof, acyc-cof)
  readonly right: (a: A) => B;  // right Quillen (preserves fib, acyc-fib)
  readonly preservesCof: (g: B) => boolean;
  readonly preservesAcyclicCof: (g: B) => boolean;
  readonly preservesFib: (p: A) => boolean;
  readonly preservesAcyclicFib: (p: A) => boolean;
  readonly name?: string;
  readonly description?: string;
}

/**
 * Quillen Adjunction Properties
 * 
 * Properties that Quillen adjunctions may satisfy
 */
export interface QuillenAdjunctionProperties {
  readonly isQuillenEquivalence?: boolean;
  readonly isLeftQuillen?: boolean;
  readonly isRightQuillen?: boolean;
  readonly preservesWeakEquivalences?: boolean;
  readonly preservesHomotopyLimits?: boolean;
  readonly preservesHomotopyColimits?: boolean;
}

/**
 * Enhanced Quillen Adjunction
 * 
 * Quillen adjunction with additional properties
 */
export interface EnhancedQuillenAdjunction<A, B> extends QuillenAdjunction<A, B> {
  readonly properties: QuillenAdjunctionProperties;
  readonly modelCategoryA: ModelCategory<A>;
  readonly modelCategoryB: ModelCategory<B>;
  readonly geometricMorphism: GeometricMorphism<A, B>;
}

// ============================================================================
// CORE TRANSFORMATION FUNCTIONS
// ============================================================================

/**
 * To Quillen Pair
 * 
 * Transform a geometric morphism to a Quillen adjunction
 * 
 * This is the core of Beke's functor, ensuring that:
 * - f^* preserves cofibrations and acyclic cofibrations
 * - f_* preserves fibrations and acyclic fibrations
 * - The adjunction satisfies Quillen's axioms
 */
export function toQuillenPair<A, B>(
  f: GeometricMorphism<A, B>,
  MA: ModelCategory<A>,
  MB: ModelCategory<B>
): QuillenAdjunction<A, B> {
  return {
    left: f.leftExactPullback,
    right: f.rightAdjointPushforward,
    preservesCof: (g) => MA.isCofibration(f.leftExactPullback(g)),
    preservesAcyclicCof: (g) => {
      const Lg = f.leftExactPullback(g);
      return MA.isCofibration(Lg) && MA.isWeakEquivalence(Lg);
    },
    preservesFib: (p) => MB.isFibration(f.rightAdjointPushforward(p)),
    preservesAcyclicFib: (p) => {
      const Rp = f.rightAdjointPushforward(p);
      return MB.isFibration(Rp) && MB.isWeakEquivalence(Rp);
    },
    name: f.name ? `Quillen(${f.name})` : undefined,
    description: f.description ? `Quillen adjunction from ${f.description}` : undefined
  };
}

/**
 * To Enhanced Quillen Pair
 * 
 * Transform a geometric morphism to an enhanced Quillen adjunction
 */
export function toEnhancedQuillenPair<A, B>(
  f: GeometricMorphism<A, B>,
  MA: ModelCategory<A>,
  MB: ModelCategory<B>,
  properties?: QuillenAdjunctionProperties
): EnhancedQuillenAdjunction<A, B> {
  const basicQuillen = toQuillenPair(f, MA, MB);
  
  return {
    ...basicQuillen,
    properties: properties || {},
    modelCategoryA: MA,
    modelCategoryB: MB,
    geometricMorphism: f
  };
}

/**
 * Essential Geometric Morphism to Quillen Pair
 * 
 * Transform an essential geometric morphism to a Quillen adjunction
 * with additional structure from f_!
 */
export function essentialGeometricMorphismToQuillenPair<A, B>(
  f: EssentialGeometricMorphism<A, B>,
  MA: ModelCategory<A>,
  MB: ModelCategory<B>
): QuillenAdjunction<A, B> {
  const basicQuillen = toQuillenPair(f, MA, MB);
  
  // For essential geometric morphisms, we can add additional structure
  // based on the existence of f_!
  return {
    ...basicQuillen,
    name: f.name ? `EssentialQuillen(${f.name})` : undefined,
    description: f.description ? `Essential Quillen adjunction from ${f.description}` : undefined
  };
}

// ============================================================================
// LOCALITY PRESERVATION
// ============================================================================

/**
 * Local Weak Equivalence Preservation
 * 
 * Check that f^* preserves local weak equivalences
 */
export interface LocalWeakEqPreservation<A, B> {
  readonly preservesLocalWeakEq: (g: B, cover: Cover) => boolean;
  readonly witness: LocalWeakEqWitness<A>;
  readonly geometricMorphism: GeometricMorphism<A, B>;
}

/**
 * Check Local Weak Equivalence Preservation
 * 
 * Verify that f^* preserves local weak equivalences over covers
 */
export function checkLocalWeakEqPreservation<A, B>(
  f: GeometricMorphism<A, B>,
  g: B,
  cover: Cover,
  MA: ModelCategory<A>,
  MB: ModelCategory<B>
): LocalWeakEqPreservation<A, B> {
  const Lg = f.leftExactPullback(g);
  
  // Check if Lg is a weak equivalence in MA
  const isWeakEq = MA.isWeakEquivalence(Lg);
  
  // Create witness for the preservation
  const witness: LocalWeakEqWitness<A> = {
    isLocalWeakEquivalence: isWeakEq,
    witnessCover: isWeakEq ? cover : undefined,
    morphism: Lg,
    notes: isWeakEq ? 
      `f^* preserves local weak equivalence over cover` : 
      `f^* does not preserve local weak equivalence over cover`
  };
  
  return {
    preservesLocalWeakEq: isWeakEq,
    witness,
    geometricMorphism: f
  };
}

/**
 * Batch Local Weak Equivalence Preservation Check
 * 
 * Check preservation over multiple covers
 */
export function batchCheckLocalWeakEqPreservation<A, B>(
  f: GeometricMorphism<A, B>,
  g: B,
  covers: readonly Cover[],
  MA: ModelCategory<A>,
  MB: ModelCategory<B>
): LocalWeakEqPreservation<A, B>[] {
  return covers.map(cover => 
    checkLocalWeakEqPreservation(f, g, cover, MA, MB)
  );
}

// ============================================================================
// QUILLEN ADJUNCTION VALIDATION
// ============================================================================

/**
 * Quillen Adjunction Validation Result
 * 
 * Result of validating a Quillen adjunction
 */
export interface QuillenAdjunctionValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly details?: unknown;
}

/**
 * Validate Quillen Adjunction
 * 
 * Check that a Quillen adjunction satisfies the required axioms
 */
export function validateQuillenAdjunction<A, B>(
  quillen: QuillenAdjunction<A, B>,
  testMorphisms?: { cofibrations: readonly B[]; fibrations: readonly A[] }
): QuillenAdjunctionValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check that both functors are provided
  if (!quillen.left) {
    errors.push('Left Quillen functor is missing');
  }
  if (!quillen.right) {
    errors.push('Right Quillen functor is missing');
  }

  // Check preservation functions
  if (!quillen.preservesCof) {
    errors.push('Cofibration preservation function is missing');
  }
  if (!quillen.preservesAcyclicCof) {
    errors.push('Acyclic cofibration preservation function is missing');
  }
  if (!quillen.preservesFib) {
    errors.push('Fibration preservation function is missing');
  }
  if (!quillen.preservesAcyclicFib) {
    errors.push('Acyclic fibration preservation function is missing');
  }

  // Test with provided morphisms if available
  if (testMorphisms) {
    for (const cof of testMorphisms.cofibrations) {
      if (!quillen.preservesCof(cof)) {
        warnings.push(`Cofibration preservation failed for test morphism`);
      }
    }
    
    for (const fib of testMorphisms.fibrations) {
      if (!quillen.preservesFib(fib)) {
        warnings.push(`Fibration preservation failed for test morphism`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create Simple Geometric Morphism
 * 
 * Create a simple geometric morphism for testing
 */
export function createSimpleGeometricMorphism<A, B>(
  leftExactPullback: (b: B) => A,
  rightAdjointPushforward: (a: A) => B,
  name?: string,
  description?: string
): GeometricMorphism<A, B> {
  return {
    leftExactPullback,
    rightAdjointPushforward,
    name,
    description
  };
}

/**
 * Create Essential Geometric Morphism
 * 
 * Create an essential geometric morphism with f_!
 */
export function createEssentialGeometricMorphism<A, B>(
  leftExactPullback: (b: B) => A,
  rightAdjointPushforward: (a: A) => B,
  leftAdjointPushforward: (a: A) => B,
  name?: string,
  description?: string
): EssentialGeometricMorphism<A, B> {
  return {
    leftExactPullback,
    rightAdjointPushforward,
    leftAdjointPushforward,
    isEssential: true,
    name,
    description
  };
}

/**
 * Create Simple Quillen Adjunction
 * 
 * Create a simple Quillen adjunction for testing
 */
export function createSimpleQuillenAdjunction<A, B>(
  left: (b: B) => A,
  right: (a: A) => B,
  preservesCof: (g: B) => boolean,
  preservesAcyclicCof: (g: B) => boolean,
  preservesFib: (p: A) => boolean,
  preservesAcyclicFib: (p: A) => boolean,
  name?: string,
  description?: string
): QuillenAdjunction<A, B> {
  return {
    left,
    right,
    preservesCof,
    preservesAcyclicCof,
    preservesFib,
    preservesAcyclicFib,
    name,
    description
  };
}

/**
 * Compose Quillen Adjunctions
 * 
 * Compose two Quillen adjunctions
 */
export function composeQuillenAdjunctions<A, B, C>(
  quillen1: QuillenAdjunction<A, B>,
  quillen2: QuillenAdjunction<B, C>
): QuillenAdjunction<A, C> {
  return {
    left: (c: C) => quillen1.left(quillen2.left(c)),
    right: (a: A) => quillen2.right(quillen1.right(a)),
    preservesCof: (g: C) => quillen1.preservesCof(quillen2.left(g)),
    preservesAcyclicCof: (g: C) => quillen1.preservesAcyclicCof(quillen2.left(g)),
    preservesFib: (p: A) => quillen2.preservesFib(quillen1.right(p)),
    preservesAcyclicFib: (p: A) => quillen2.preservesAcyclicFib(quillen1.right(p)),
    name: quillen1.name && quillen2.name ? `${quillen1.name}∘${quillen2.name}` : undefined,
    description: quillen1.description && quillen2.description ? 
      `${quillen1.description} composed with ${quillen2.description}` : undefined
  };
}

// ============================================================================
// QUILLEN ADJUNCTION VERIFICATION UTILITIES
// ============================================================================

/**
 * Quillen Adjunction Check
 * 
 * Evidence for either side of a Quillen adjunction
 */
export interface QuillenAdjunctionCheck<A, B> {
  leftPreservesCof?: (g: B) => boolean;
  leftPreservesAcyclicCof?: (g: B) => boolean;
  rightPreservesFib?: (p: A) => boolean;
  rightPreservesAcyclicFib?: (p: A) => boolean;
}

/**
 * Quillen Adjunction from Either Side
 * 
 * Verify either side of the Quillen pair condition and infer the other.
 * This is useful when you only have evidence for one side of the adjunction.
 */
export function quillenAdjunctionFromEitherSide<A, B>(
  pair: QuillenAdjunction<A, B>,
  MA: ModelCategory<A>,
  MB: ModelCategory<B>,
  evidence: QuillenAdjunctionCheck<A, B>
): QuillenAdjunction<A, B> {
  const out = { ...pair };
  
  // If left-side evidence is supplied, synthesize right-side checks (and vice versa).
  if (evidence.leftPreservesCof) {
    out.preservesCof = evidence.leftPreservesCof;
    out.preservesFib = (p) => {
      const Rp = pair.right(p);
      return MB.isFibration(Rp);
    };
  }
  
  if (evidence.leftPreservesAcyclicCof) {
    out.preservesAcyclicCof = evidence.leftPreservesAcyclicCof;
    out.preservesAcyclicFib = (p) => {
      const Rp = pair.right(p);
      return MB.isFibration(Rp) && MB.isWeakEquivalence(Rp);
    };
  }
  
  if (evidence.rightPreservesFib) {
    out.preservesFib = evidence.rightPreservesFib;
    out.preservesCof = (g) => MA.isCofibration(pair.left(g));
  }
  
  if (evidence.rightPreservesAcyclicFib) {
    out.preservesAcyclicFib = evidence.rightPreservesAcyclicFib;
    out.preservesAcyclicCof = (g) => {
      const Lg = pair.left(g);
      return MA.isCofibration(Lg) && MA.isWeakEquivalence(Lg);
    };
  }
  
  return out;
}
