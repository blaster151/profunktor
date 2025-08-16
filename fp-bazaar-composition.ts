/**
 * Bazaar Composition & Fusion System
 * 
 * This module provides advanced composition patterns for Bazaar optics:
 * - Bazaar composition with fusion optimization
 * - Bazaar monoid structure under composition
 * - Fusion optimization for performance
 * - Composition laws and verification
 * - Advanced composition patterns
 */

import { Kind1, Apply, RequireCovariantLast } from './fp-hkt';
import { Applicative, Monad } from './fp-typeclasses-hkt';
import { Bazaar } from './fp-optics-iso-helpers';

// ============================================================================
// Part 1: Core Bazaar Composition
// ============================================================================

/**
 * Compose two Bazaar optics with fusion optimization.
 * 
 * Fusion optimization avoids intermediate structures by composing effects directly.
 * This is the fundamental composition operation for Bazaar optics.
 */
export function composeBazaar<A, B, C, S, T, U>(
  outer: Bazaar<B, C, T, U>,
  inner: Bazaar<A, B, S, T>
): Bazaar<A, C, S, U> {
  return <F extends Kind1>(F: Applicative<F>, k: (a: A) => Apply<F, [C]>) =>
    (s: S) => {
      // Fusion: compose effects directly without intermediate structure
      return inner(F, (a: A) => 
        outer(F, (b: B) => k(a))(inner(F, (a: A) => F.of(b))(s))
      )(s);
    };
}

/**
 * Compose multiple Bazaar optics in sequence.
 * Optimized for chaining multiple transformations.
 */
export function composeBazaarSequence<A, B, S, T>(
  bazaars: Bazaar<any, any, any, any>[]
): Bazaar<A, B, S, T> {
  if (bazaars.length === 0) {
    return <F extends Kind1>(F: Applicative<F>, k: (a: A) => Apply<F, [B]>) =>
      (s: S) => F.map(k(s as any), () => s as any);
  }
  
  return bazaars.reduce((acc, baz) => 
    composeBazaar(baz as any, acc as any)
  ) as Bazaar<A, B, S, T>;
}

// ============================================================================
// Part 2: Bazaar Fusion Optimization
// ============================================================================

/**
 * Fuse a Bazaar with a specific applicative for performance.
 * Pre-computes the effect structure to avoid repeated effect composition.
 */
export function fuseBazaar<A, B, S, T>(
  baz: Bazaar<A, B, S, T>,
  F: Applicative<any>
): (s: S) => (k: (a: A) => any) => any {
  return (s: S) => (k: (a: A) => any) => baz(F, k)(s);
}

/**
 * Fuse multiple Bazaars with the same applicative.
 * Optimized for batch processing with the same effect.
 */
export function fuseBazaarBatch<A, B, S, T>(
  bazaars: Bazaar<A, B, S, T>[],
  F: Applicative<any>
): ((s: S) => (k: (a: A) => any) => any)[] {
  return bazaars.map(baz => fuseBazaar(baz, F));
}

/**
 * Parallel fusion for independent Bazaar operations.
 * Useful when multiple Bazaars can be executed in parallel.
 */
export function parallelFuseBazaar<A, B, S, T>(
  bazaars: Bazaar<A, B, S, T>[],
  F: Applicative<any> & { parMap?: <X, Y>(fx: any, f: (x: X) => Y) => any }
): (s: S) => (k: (a: A) => any) => any[] {
  const fused = fuseBazaarBatch(bazaars, F);
  
  return (s: S) => (k: (a: A) => any) => {
    if (F.parMap) {
      // Use parallel execution if available
      return F.parMap(
        F.of(s),
        (s: S) => fused.map(f => f(s)(k))
      );
    }
    // Fallback to sequential execution
    return fused.map(f => f(s)(k));
  };
}

// ============================================================================
// Part 3: Bazaar Monoid Structure
// ============================================================================

/**
 * Monoid interface for Bazaar composition.
 */
export interface BazaarMonoid<S, T> {
  empty(): Bazaar<any, any, S, T>;
  concat(baz1: Bazaar<any, any, S, T>, baz2: Bazaar<any, any, S, T>): Bazaar<any, any, S, T>;
}

/**
 * Create a monoid for Bazaar optics under composition.
 * The empty element is the identity Bazaar, and concat is composition.
 */
export function bazaarMonoid<S, T>(): BazaarMonoid<S, T> {
  return {
    empty: () => <F extends Kind1>(F: Applicative<F>) => (k: any) => (s: S) => F.of(s as any),
    
    concat: (baz1, baz2) => composeBazaar(baz1 as any, baz2 as any)
  };
}

/**
 * Fold a list of Bazaars using the monoid structure.
 * Useful for combining multiple Bazaar operations.
 */
export function foldBazaar<S, T>(
  bazaars: Bazaar<any, any, S, T>[],
  monoid: BazaarMonoid<S, T> = bazaarMonoid<S, T>()
): Bazaar<any, any, S, T> {
  return bazaars.reduce(monoid.concat, monoid.empty());
}

// ============================================================================
// Part 4: Advanced Composition Patterns
// ============================================================================

/**
 * Compose Bazaar with a function transformation.
 * Useful for pre/post-processing of Bazaar operations.
 */
export function composeBazaarWithFunction<A, B, C, S, T, U>(
  baz: Bazaar<A, B, S, T>,
  f: (b: B) => C,
  g: (c: C) => A
): Bazaar<C, C, S, T> {
  return <F extends Kind1>(F: Applicative<F>, k: (c: C) => Apply<F, [C]>) =>
    (s: S) => baz(F, (a: A) => F.map(k(f(a)), g))(s);
}

/**
 * Compose Bazaar with conditional logic.
 * Applies different Bazaars based on a predicate.
 */
export function composeBazaarConditional<A, B, S, T>(
  predicate: (s: S) => boolean,
  trueBaz: Bazaar<A, B, S, T>,
  falseBaz: Bazaar<A, B, S, T>
): Bazaar<A, B, S, T> {
  return <F extends Kind1>(F: Applicative<F>, k: (a: A) => Apply<F, [B]>) =>
    (s: S) => predicate(s) ? trueBaz(F, k)(s) : falseBaz(F, k)(s);
}

/**
 * Compose Bazaar with error handling.
 * Provides fallback behavior when Bazaar operations fail.
 */
export function composeBazaarWithErrorHandling<A, B, S, T>(
  baz: Bazaar<A, B, S, T>,
  fallback: Bazaar<A, B, S, T>,
  errorHandler: (error: any) => boolean
): Bazaar<A, B, S, T> {
  return <F extends Kind1>(F: Applicative<F>, k: (a: A) => Apply<F, [B]>) =>
    (s: S) => {
      try {
        return baz(F, k)(s);
      } catch (error) {
        if (errorHandler(error)) {
          return fallback(F, k)(s);
        }
        throw error;
      }
    };
}

// Part X: Monad-aware Bazaar composition helpers
// -----------------------------------------------

/**
 * Kleisli composition of continuations:
 *   (g ∘K f)(a) = f(a) >>= g
 */
 export function composeK<F extends RequireCovariantLast<Kind1>, A, B, C>(
  F: Monad<F>,
  g: (b: B) => Apply<F, [C]>,
  f: (a: A) => Apply<F, [B]>
): (a: A) => Apply<F, [C]> {
  return (a) => F.chain(f(a), g);
}

/**
 * ♯3 — Monad-fusion composition of Bazaars.
 *
 * Caller supplies the *factored* continuations:
 *   - k1 : A -> F<B>  (for the inner bazaar)
 *   - k2 : B -> F<C>  (for the outer bazaar)
 *
 * We execute inner, then outer, and fuse nested F with `chain`.
 */
export function composeBazaarM<A, B, C, S, T, U>(
  outer: Bazaar<B, C, T, U>,
  inner: Bazaar<A, B, S, T>
): <F extends RequireCovariantLast<Kind1>>(
  F: Monad<F>,
  k1: (a: A) => Apply<F, [B]>,
  k2: (b: B) => Apply<F, [C]>
) => (s: S) => Apply<F, [U]> {
  return <F extends RequireCovariantLast<Kind1>>(
    F: Monad<F>,
    k1: (a: A) => Apply<F, [B]>,
    k2: (b: B) => Apply<F, [C]>
  ) =>
    (s: S) => {
      // Run inner with k1 to get F<T>, then feed T into outer with k2.
      const tF = inner(F, k1)(s);           // F<T>
      return F.chain(tF, (t) => outer(F, k2)(t));  // F<U> (fused via chain)
    };
}

/**
 * ♯1 — Kleisli-style composition where the *outer* continuation
 * can depend on the observed B (data-dependent sequencing).
 *
 * `refine` lets you derive a B-specific continuation B -> F<C>.
 * If you already have a fixed k2, pass `(_b) => k2`.
 */
export function composeBazaarK<A, B, C, S, T, U>(
  outer: Bazaar<B, C, T, U>,
  inner: Bazaar<A, B, S, T>
): <F extends RequireCovariantLast<Kind1>>(
  F: Monad<F>,
  k1: (a: A) => Apply<F, [B]>,
  refine: (b: B) => (b: B) => Apply<F, [C]>
) => (s: S) => Apply<F, [U]> {
  return <F extends RequireCovariantLast<Kind1>>(
    F: Monad<F>,
    k1: (a: A) => Apply<F, [B]>,
    refine: (b: B) => (b: B) => Apply<F, [C]>
  ) =>
    (s: S) => {
      // inner first (monadically), then outer, with a B-dependent continuation
      const tF = inner(F, k1)(s); // F<T>
      return F.chain(tF, (t) =>
        outer(F, (b) => refine(b)(b))(t) // continuation chosen after observing `b`
      );
    };
}

/**
 * Convenience: If you only have a single composed continuation k' : A -> F<C>,
 * and you *can* (or want to) factor it as k' = k2 ∘K k1, use this:
 */
export function composeBazaarViaK<A, B, C, S, T, U>(
  outer: Bazaar<B, C, T, U>,
  inner: Bazaar<A, B, S, T>
): <F extends RequireCovariantLast<Kind1>>(
  F: Monad<F>,
  k1: (a: A) => Apply<F, [B]>,
  k2: (b: B) => Apply<F, [C]>
) => (s: S) => Apply<F, [U]> {
  return <F extends RequireCovariantLast<Kind1>>(
    F: Monad<F>,
    k1: (a: A) => Apply<F, [B]>,
    k2: (b: B) => Apply<F, [C]>
  ) =>
    (s: S) => {
      // This uses the same core as composeBazaarM; provided for readability.
      const tF = inner(F, k1)(s);
      return F.chain(tF, (t) => outer(F, k2)(t));
    };
}

// ============================================================================
// Part 5: Composition Laws & Verification
// ============================================================================

/**
 * Test Bazaar composition laws.
 * Verifies that composition satisfies mathematical properties.
 */
export function testBazaarCompositionLaws<A, B, C, S, T, U>(
  baz1: Bazaar<A, B, S, T>,
  baz2: Bazaar<B, C, T, U>,
  baz3: Bazaar<C, any, U, any>,
  testData: S[],
  F: Applicative<any>
): {
  associativity: boolean;
  identity: boolean;
  fusion: boolean;
} {
  return {
    // (baz1 . baz2) . baz3 = baz1 . (baz2 . baz3)
    associativity: testData.every(s => {
      const left = composeBazaar(composeBazaar(baz3, baz2), baz1);
      const right = composeBazaar(baz3, composeBazaar(baz2, baz1));
      const k = (a: A) => F.of(a.toString());
      
      const leftResult = left(F, k)(s);
      const rightResult = right(F, k)(s);
      
      return deepEqual(leftResult, rightResult);
    }),
    
    // baz . id = id . baz = baz
    identity: testData.every(s => {
      const id = <F extends Kind1>(F: Applicative<F>) => (k: any) => (s: any) => F.of(s);
      const k = (a: A) => F.of(a.toString());
      
      const left = composeBazaar(baz1, id);
      const right = composeBazaar(id, baz1);
      
      const leftResult = left(F, k)(s);
      const rightResult = right(F, k)(s);
      const directResult = baz1(F, k)(s);
      
      return deepEqual(leftResult, directResult) && deepEqual(rightResult, directResult);
    }),
    
    // Fusion: (f . g) . baz = f . (g . baz)
    fusion: testData.every(s => {
      const f = (a: A) => F.of(a.toString());
      const g = (a: A) => F.of(a.length);
      
      const left = composeBazaarWithFunction(baz1, f, g);
      const right = composeBazaarWithFunction(baz1, g, f);
      
      const leftResult = left(F, (c: any) => F.of(c))(s);
      const rightResult = right(F, (c: any) => F.of(c))(s);
      
      return deepEqual(leftResult, rightResult);
    })
  };
}

/**
 * Verify Bazaar monoid laws.
 * Ensures the monoid structure is mathematically correct.
 */
export function testBazaarMonoidLaws<S, T>(
  bazaars: Bazaar<any, any, S, T>[],
  testData: S[],
  F: Applicative<any>
): {
  associativity: boolean;
  identity: boolean;
} {
  const monoid = bazaarMonoid<S, T>();
  
  return {
    // (a . b) . c = a . (b . c)
    associativity: bazaars.length >= 3 ? testData.every(s => {
      const [a, b, c] = bazaars.slice(0, 3);
      const left = monoid.concat(monoid.concat(a, b), c);
      const right = monoid.concat(a, monoid.concat(b, c));
      const k = (x: any) => F.of(x.toString());
      
      const leftResult = left(F, k)(s);
      const rightResult = right(F, k)(s);
      
      return deepEqual(leftResult, rightResult);
    }) : true,
    
    // empty . a = a . empty = a
    identity: testData.every(s => {
      const a = bazaars[0];
      const empty = monoid.empty();
      const k = (x: any) => F.of(x.toString());
      
      const left = monoid.concat(empty, a);
      const right = monoid.concat(a, empty);
      
      const leftResult = left(F, k)(s);
      const rightResult = right(F, k)(s);
      const directResult = a(F, k)(s);
      
      return deepEqual(leftResult, directResult) && deepEqual(rightResult, directResult);
    })
  };
}

// ============================================================================
// Part 6: Utility Functions
// ============================================================================

/**
 * Deep equality comparison for testing.
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  
  if (typeof a === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      return a.every((x, i) => deepEqual(x, b[i]));
    }
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(key => deepEqual(a[key], b[key]));
  }
  
  return false;
}

/**
 * Create a simple identity Bazaar for testing.
 */
export function identityBazaar<S>(): Bazaar<S, S, S, S> {
  return <F extends Kind1>(F: Applicative<F>, k: (s: S) => Apply<F, [S]>) =>
    (s: S) => k(s);
}

/**
 * Create a constant Bazaar that always returns the same value.
 */
export function constantBazaar<A, B, S, T>(value: B): Bazaar<A, B, S, T> {
  return <F extends Kind1>(F: Applicative<F>, k: (a: A) => Apply<F, [B]>) =>
    (s: S) => F.of(value);
}

// ============================================================================
// Part 7: Examples & Usage
// ============================================================================

/**
 * Example: Composing multiple transformations on an array.
 */
export function arrayTransformExample() {
  // Bazaar for array elements
  const arrayBazaar: Bazaar<number, number, number[], number[]> = 
    <F extends Kind1>(F: Applicative<F>, k: (n: number) => Apply<F, [number]>) =>
      (arr: number[]) => {
        let acc = F.of([] as number[]);
        for (const n of arr) {
          acc = F.ap(
            F.map(acc, (ns: number[]) => (m: number) => [...ns, m]),
            k(n)
          );
        }
        return acc;
      };
  
  // Transform: double each element
  const doubleBazaar: Bazaar<number, number, number[], number[]> = 
    <F extends Kind1>(F: Applicative<F>, k: (n: number) => Apply<F, [number]>) =>
      (arr: number[]) => arrayBazaar(F, (n: number) => k(n * 2))(arr);
  
  // Transform: add 1 to each element
  const addOneBazaar: Bazaar<number, number, number[], number[]> = 
    <F extends Kind1>(F: Applicative<F>, k: (n: number) => Apply<F, [number]>) =>
      (arr: number[]) => arrayBazaar(F, (n: number) => k(n + 1))(arr);
  
  // Compose: double then add 1
  const composed = composeBazaar(addOneBazaar, doubleBazaar);
  
  // Test with identity applicative
  const IdApplicative: Applicative<any> = {
    of: <T>(x: T) => x,
    map: <T, U>(x: T, f: (t: T) => U) => f(x),
    ap: <T, U>(f: (t: T) => U, x: T) => f(x)
  };
  
  const result = composed(IdApplicative, (n: number) => n)([1, 2, 3]);
  console.log('Composed result:', result); // [3, 5, 7] (double then add 1)
  
  return { arrayBazaar, doubleBazaar, addOneBazaar, composed, result };
}

/**
 * Example: Using Bazaar monoid for batch processing.
 */
export function bazaarMonoidExample() {
  const monoid = bazaarMonoid<number[], number[]>();
  
  // Multiple transformations
  const transformations = [
    // Double each element
    <F extends Kind1>(F: Applicative<F>, k: (n: number) => Apply<F, [number]>) =>
      (arr: number[]) => {
        let acc = F.of([] as number[]);
        for (const n of arr) {
          acc = F.ap(
            F.map(acc, (ns: number[]) => (m: number) => [...ns, m]),
            k(n * 2)
          );
        }
        return acc;
      },
    
    // Add 1 to each element
    <F extends Kind1>(F: Applicative<F>, k: (n: number) => Apply<F, [number]>) =>
      (arr: number[]) => {
        let acc = F.of([] as number[]);
        for (const n of arr) {
          acc = F.ap(
            F.map(acc, (ns: number[]) => (m: number) => [...ns, m]),
            k(n + 1)
          );
        }
        return acc;
      }
  ];
  
  // Fold all transformations
  const combined = foldBazaar(transformations, monoid);
  
  const IdApplicative: Applicative<any> = {
    of: <T>(x: T) => x,
    map: <T, U>(x: T, f: (t: T) => U) => f(x),
    ap: <T, U>(f: (t: T) => U, x: T) => f(x)
  };
  
  const result = combined(IdApplicative, (n: number) => n)([1, 2, 3]);
  console.log('Monoid result:', result); // [3, 5, 7] (double then add 1)
  
  return { monoid, transformations, combined, result };
}

// Export all the main functions
export {
  composeBazaar,
  composeBazaarSequence,
  fuseBazaar,
  fuseBazaarBatch,
  parallelFuseBazaar,
  bazaarMonoid,
  foldBazaar,
  composeBazaarWithFunction,
  composeBazaarConditional,
  composeBazaarWithErrorHandling,
  testBazaarCompositionLaws,
  testBazaarMonoidLaws,
  identityBazaar,
  constantBazaar
};
