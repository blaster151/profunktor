/**
 * Fluent Traverse Methods for Traversable ADTs
 * 
 * This module adds fluent `.traverse` methods to all ADTs that implement
 * the Traversable typeclass, following the fp-ts style signature:
 * 
 * traverse<G extends Kind1, A, B>(
 *   this: Traversable<A>,
 *   applicative: Applicative<G>,
 *   f: (a: A) => Apply<G, [B]>
 * ): Apply<G, [Traversable<B>]>
 * 
 * Supported ADTs:
 * - Maybe
 * - Either  
 * - Result
 * - PersistentList
 */

import {
  Kind1,
  Apply,
  Type,
  ArrayK, MaybeK, EitherK, ResultK, ListK,
  Maybe, Either, Result,
  RequireCovariantLast
} from './fp-hkt';

import {
  Functor, Applicative, Monad, Bifunctor, Traversable,
  deriveFunctor, deriveApplicative, deriveMonad,
  traverse, sequence
} from './fp-typeclasses-hkt';

// ============================================================================
// Part 1: Type Definitions for Fluent Traverse
// ============================================================================

/**
 * Fluent traverse method signature for Traversable ADTs
 */
export interface FluentTraverse<F extends Kind1> {
  traverse<G extends Kind1, A, B>(
    this: Apply<F, [A]>,
    applicative: Applicative<G>,
    f: (a: A) => Apply<G, [B]>
  ): Apply<G, [Apply<F, [B]>]>;
}

/**
 * Fluent traverse method signature for Traversable ADTs (simplified)
 */
export interface FluentTraverseSimple<A> {
  traverse<G extends Kind1, B>(
    applicative: Applicative<G>,
    f: (a: A) => Apply<G, [B]>
  ): Apply<G, [any]>;
}

// ============================================================================
// Part 2: HKT-style traverse helpers that work with the alias shapes in fp-hkt.ts (no prototypes)
// ============================================================================

// Maybe = A | null | undefined  (from fp-hkt.ts)
export function traverseMaybe<G extends Kind1, A, B>(
  G: Applicative<G>,
  f: (a: A) => Apply<G, [B]>
): (ma: Maybe<A>) => Apply<G, [Maybe<B>]> {
  return (ma) =>
    (ma === null || ma === undefined)
      ? G.of(ma as Maybe<B>)
      : G.map(f(ma as A), (b) => b as Maybe<B>);
}

// Either = {left:L} | {right:R}
const isLeft = <L, R>(e: Either<L, R>): e is { readonly left: L } =>
  (e as any).left !== undefined;

export function traverseEither<G extends Kind1, L, A, B>(
  G: Applicative<G>,
  f: (a: A) => Apply<G, [B]>
): (ea: Either<L, A>) => Apply<G, [Either<L, B>]> {
  return (ea) =>
    isLeft(ea)
      ? G.of(ea as Either<L, B>)
      : G.map(f((ea as any).right as A), (b) => ({ right: b } as Either<L, B>));
}

// Result = {tag:'Ok', value:T} | {tag:'Err', error:E}
const isErr = <T, E>(r: Result<T, E>): r is { readonly tag: 'Err'; readonly error: E } =>
  (r as any).tag === 'Err';

export function traverseResult<G extends Kind1, T, E, U>(
  G: Applicative<G>,
  f: (t: T) => Apply<G, [U]>
): (r: Result<T, E>) => Apply<G, [Result<U, E>]> {
  return (r) =>
    isErr(r)
      ? G.of(r as Result<U, E>)
      : G.map(f((r as any).value as T), (u) => ({ tag: 'Ok', value: u } as Result<U, E>));
}

// ============================================================================
// Part 3: Type-Level Tests (Optional - retained for compatibility)
// ============================================================================

/**
 * Type-level tests for traverse functions
 */
export namespace FluentTraverseTypeTests {
  
  // Test that traverseMaybe preserves type inference
  export type MaybeTraverseTest = typeof traverseMaybe extends 
    <G extends Kind1, A, B>(
      G: Applicative<G>,
      f: (a: A) => Apply<G, [B]>
    ) => (ma: Maybe<A>) => Apply<G, [Maybe<B>]> ? true : false;
  
  // Test that traverseEither preserves type inference
  export type EitherTraverseTest = typeof traverseEither extends
    <G extends Kind1, L, A, B>(
      G: Applicative<G>,
      f: (a: A) => Apply<G, [B]>
    ) => (ea: Either<L, A>) => Apply<G, [Either<L, B>]> ? true : false;
  
  // Test that traverseResult preserves type inference
  export type ResultTraverseTest = typeof traverseResult extends
    <G extends Kind1, T, E, U>(
      G: Applicative<G>,
      f: (t: T) => Apply<G, [U]>
    ) => (r: Result<T, E>) => Apply<G, [Result<U, E>]> ? true : false;
}

// ============================================================================
// Part 4: Generic Helper Functions from src version
// ============================================================================

/**
 * Manual traverse implementation as fallback
 */
function manualTraverse<F extends Kind1, G extends Kind1, A, B>(
  F_: Traversable<F>,
  G_: Applicative<G>,
  f: (a: A) => Apply<G, [B]>,
  fa: Apply<F, [A]>
): Apply<G, [Apply<F, [B]>]> {
  // This is a simplified fallback - in practice would need
  // more sophisticated traversal based on the structure
  try {
    if (Array.isArray(fa)) {
      return (fa as any[]).reduce(
        (acc: any, a: A) => G_.ap(G_.map(acc, (bs: B[]) => (b: B) => [...bs, b]), f(a)),
        G_.of([])
      ) as any;
    }
    // For other structures, delegate to existing specific traversers
    return G_.of(fa as any);
  } catch {
    return G_.of(fa as any);
  }
}

/**
 * Traverse operation using free functions
 * 
 * Transforms each element of a traversable structure and collects the results
 * in the applicative functor context.
 * Ported from src version.
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
    const arrayTraverse = traverse(G_ as any);
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
 * Ported from src version.
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

/**
 * Traverse with discard of results
 * Ported from src version.
 */
export function traverse_<
  F extends Kind1, 
  G extends RequireCovariantLast<Kind1>, 
  A, 
  B
>(
  F_: Traversable<F>,
  G_: Applicative<G>,
  f: (a: A) => Apply<G, [B]>,
  fa: Apply<F, [A]>
): Apply<G, [void]> {
  return G_.map(traverseF(F_, G_, f, fa), () => undefined as any);
}

/**
 * For-each style traverse with better ergonomics
 * Ported from src version.
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
 * Ported from src version.
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
 * Ported from src version.
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

/**
 * Helper to check if a value has traversable structure
 * Ported from src version.
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
 * Ported from src version.
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
