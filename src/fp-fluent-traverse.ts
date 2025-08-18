/**
 * Fluent Traverse - Traversable helpers using free functions
 * 
 * Provides traversable operations that delegate to free functions rather than
 * assuming methods exist on Traversable<F>. This avoids errors like
 * ".sequence does not exist on Traversable<F>".
 */

// ============================================================================
// Type Imports
// ============================================================================

import type { 
  Applicative, 
  Traversable
} from '../fp-typeclasses-hkt';

import type {
  Kind1,
  Apply,
  RequireCovariantLast
} from '../fp-hkt';

// Import free functions with aliases to avoid naming conflicts
import { 
  traverse as traverseFree_, 
  sequence as sequenceFree_ 
} from '../fp-typeclasses-hkt';

// ============================================================================
// Traversable Helper Functions
// ============================================================================

/**
 * Traverse operation using free functions
 * 
 * Transforms each element of a traversable structure and collects the results
 * in the applicative functor context.
 * 
 * @param F_ - Traversable instance for the structure F
 * @param G_ - Applicative instance for the context G  
 * @param f - Function that transforms elements and lifts them into context G
 * @param fa - The traversable structure to transform
 * @returns The transformed structure wrapped in context G
 */
export function traverseF<
  F extends Kind1, 
  G extends RequireCovariantLast<Kind1>, 
  A, 
  B
>(
  F_: Traversable<F>,
  G_: Applicative<G>,
  f: (a: A) => Apply<G, [B]>,
  fa: Apply<F, [A]>
): Apply<G, [Apply<F, [B]>]> {
  // Try to use the traversable instance's traverse method
  if (typeof (F_ as any).traverse === 'function') {
    return (F_ as any).traverse(fa, f);
  }
  
  // Fallback: try to delegate to free traverse function if available
  // Note: the free traverse function is curried and array-specific
  // This is a best-effort fallback for arrays
  if (Array.isArray(fa)) {
    const arrayTraverse = traverseFree_(G_ as any);
    return arrayTraverse(f, fa as any) as any;
  }
  
  // Ultimate fallback: manual traverse for simple structures
  return manualTraverse(F_, G_, f, fa);
}

/**
 * Sequence operation using free functions
 * 
 * Swaps the order of two nested contexts, collecting all inner values
 * into the outer applicative context.
 * 
 * @param F_ - Traversable instance for the structure F
 * @param G_ - Applicative instance for the context G
 * @param fga - Structure F containing values in context G
 * @returns Structure F wrapped in context G
 */
export function sequenceF<
  F extends Kind1, 
  G extends RequireCovariantLast<Kind1>, 
  A
>(
  F_: Traversable<F>,
  G_: Applicative<G>,
  fga: Apply<F, [Apply<G, [A]>]>
): Apply<G, [Apply<F, [A]>]> {
  // Sequence is just traverse with identity function
  return traverseF(F_, G_, (ga: Apply<G, [A]>) => ga, fga);
}

// ============================================================================
// Manual Traverse Implementation
// ============================================================================

/**
 * Manual traverse implementation for when no traverse method exists
 * 
 * This handles basic cases by duck-typing the structure
 */
function manualTraverse<
  F extends Kind1, 
  G extends RequireCovariantLast<Kind1>, 
  A, 
  B
>(
  F_: Traversable<F>,
  G_: Applicative<G>,
  f: (a: A) => Apply<G, [B]>,
  fa: Apply<F, [A]>
): Apply<G, [Apply<F, [B]>]> {
  // Handle arrays
  if (Array.isArray(fa)) {
    return fa.reduce(
      (acc: Apply<G, [Apply<F, [B]>]>, a: A) => {
        const gb = f(a);
        return G_.ap(
          G_.map(acc, (fb: Apply<F, [B]>) => (b: B) => [...(fb as any), b]),
          gb
        );
      },
      G_.of([] as any)
    ) as any;
  }
  
  // Handle Maybe-like structures  
  if (isTaggedUnion(fa, 'Some')) {
    const gb = f((fa as any).value);
    return G_.map(gb, (b: B) => ({ tag: 'Some', value: b } as any));
  }
  
  if (isTaggedUnion(fa, 'None')) {
    return G_.of({ tag: 'None' } as any);
  }
  
  // Handle Either-like structures
  if (isTaggedUnion(fa, 'Right')) {
    const gb = f((fa as any).value);
    return G_.map(gb, (b: B) => ({ tag: 'Right', value: b } as any));
  }
  
  if (isTaggedUnion(fa, 'Left')) {
    return G_.of(fa as any);
  }
  
  // Handle Result-like structures  
  if (isTaggedUnion(fa, 'Ok')) {
    const gb = f((fa as any).value);
    return G_.map(gb, (b: B) => ({ tag: 'Ok', value: b } as any));
  }
  
  if (isTaggedUnion(fa, 'Err')) {
    return G_.of(fa as any);
  }
  
  // If we can't handle it, try to use map if available
  if (typeof (F_ as any).map === 'function') {
    const fb = (F_ as any).map(fa, f);
    return G_.of(fb);
  }
  
  // Final fallback - wrap the original value
  return G_.of(fa as any);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a value is a tagged union with a specific tag
 */
function isTaggedUnion(value: any, tag: string): boolean {
  return (
    value !== null &&
    typeof value === 'object' &&
    value.tag === tag
  );
}

/**
 * Traverse with effect collection (no result transformation)
 * 
 * Like traverse but ignores the results, useful for side effects.
 */
export function traverse_<
  F extends Kind1, 
  G extends RequireCovariantLast<Kind1>, 
  A
>(
  F_: Traversable<F>,
  G_: Applicative<G>,
  f: (a: A) => Apply<G, [any]>,
  fa: Apply<F, [A]>
): Apply<G, [void]> {
  return G_.map(traverseF(F_, G_, f, fa), () => undefined as any);
}

/**
 * For-each style traverse with better ergonomics
 */
export function forF<
  F extends Kind1, 
  G extends RequireCovariantLast<Kind1>, 
  A, 
  B
>(
  F_: Traversable<F>,
  G_: Applicative<G>,
  fa: Apply<F, [A]>,
  f: (a: A) => Apply<G, [B]>
): Apply<G, [Apply<F, [B]>]> {
  return traverseF(F_, G_, f, fa);
}

/**
 * Map each element and sequence the results
 * 
 * Convenience function that combines map and sequence operations.
 */
export function mapSequenceF<
  F extends Kind1, 
  G extends RequireCovariantLast<Kind1>, 
  A, 
  B
>(
  F_: Traversable<F>,
  G_: Applicative<G>,
  f: (a: A) => Apply<G, [B]>,
  fa: Apply<F, [A]>
): Apply<G, [Apply<F, [B]>]> {
  // This is just traverse
  return traverseF(F_, G_, f, fa);
}

/**
 * Traverse with validation/filtering
 * 
 * Only processes elements that satisfy the predicate.
 */
export function traverseWithF<
  F extends Kind1, 
  G extends RequireCovariantLast<Kind1>, 
  A, 
  B
>(
  F_: Traversable<F>,
  G_: Applicative<G>,
  predicate: (a: A) => boolean,
  f: (a: A) => Apply<G, [B]>,
  fa: Apply<F, [A]>
): Apply<G, [Apply<F, [A | B]>]> {
  const conditionalF = (a: A): Apply<G, [A | B]> => {
    if (predicate(a)) {
      return f(a);
    }
    // Return the value wrapped in the applicative context
    return G_.of(a as A | B);
  };
  
  return traverseF(F_, G_, conditionalF, fa);
}

// ============================================================================
// Type Utilities
// ============================================================================

/**
 * Helper to check if a value has traversable structure
 */
export function isTraversable(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === 'object' &&
    (
      Array.isArray(value) ||
      (typeof value === 'object' && 'tag' in value)
    )
  );
}

/**
 * Helper to check if a value has applicative structure
 */
export function isApplicative(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === 'object' &&
    (
      Array.isArray(value) ||
      (typeof value === 'object' && 'tag' in value)
    )
  );
}
