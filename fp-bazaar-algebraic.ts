/**
 * Bazaar Algebraic Structures
 * 
 * This module provides advanced algebraic structures for Bazaar optics:
 * - Bazaar as Profunctor
 * - Bazaar as Strong Profunctor
 * - Bazaar as Choice Profunctor
 * - Bazaar as Closed Profunctor
 * - Bazaar as Traversing Profunctor
 * - Advanced algebraic patterns and laws
 */

import { Kind1, Apply } from './fp-hkt';
import { Applicative, Functor } from './fp-typeclasses-hkt';
import { Bazaar } from './fp-optics-iso-helpers';

// ============================================================================
// Part 1: Core Algebraic Interfaces
// ============================================================================

/**
 * Profunctor interface for Bazaar optics.
 * Provides dimap, lmap, and rmap operations.
 */
export interface Profunctor<P> {
  dimap<A, B, C, D>(f: (a: A) => B, g: (c: C) => D, pbc: P): P;
  lmap<A, B, C>(f: (a: A) => B, pbc: P): P;
  rmap<B, C, D>(g: (c: C) => D, pbc: P): P;
}

/**
 * Strong Profunctor interface for Bazaar optics.
 * Extends Profunctor with strength operations for product types.
 */
export interface Strong<P> extends Profunctor<P> {
  first<A, B, C>(pab: P): P;
  second<A, B, C>(pab: P): P;
}

/**
 * Choice Profunctor interface for Bazaar optics.
 * Extends Profunctor with choice operations for sum types.
 */
export interface Choice<P> extends Profunctor<P> {
  left<A, B, C>(pab: P): P;
  right<A, B, C>(pab: P): P;
}

/**
 * Closed Profunctor interface for Bazaar optics.
 * Extends Profunctor with closed operations for function types.
 */
export interface Closed<P> extends Profunctor<P> {
  closed<A, B, C>(pab: P): P;
}

/**
 * Traversing Profunctor interface for Bazaar optics.
 * Extends Profunctor with traversing operations for applicative effects.
 */
export interface Traversing<P> extends Profunctor<P> {
  traverse<F extends Kind1, A, B, C>(
    F: Applicative<F>,
    pab: P,
    f: (a: A) => Apply<F, [B]>
  ): Apply<F, [P]>;
}

// ============================================================================
// Part 2: Bazaar as Profunctor
// ============================================================================

/**
 * Bazaar as a Profunctor.
 * Provides dimap, lmap, and rmap operations for Bazaar optics.
 */
export function bazaarProfunctor<A, B, S, T>(): Profunctor<Bazaar<A, B, S, T>> {
  return {
    dimap: <A2, B2>(f: (a2: A2) => A, g: (b: B) => B2) =>
      (baz: Bazaar<A, B, S, T>): Bazaar<A2, B2, S, T> =>
        <F extends Kind1>(F: Applicative<F>, k: (a: A2) => Apply<F, [B2]>) =>
          (s: S) => baz(F, (a: A) => F.map(k(f(a)), g))(s),
    
    lmap: <A2>(f: (a2: A2) => A) =>
      (baz: Bazaar<A, B, S, T>): Bazaar<A2, B, S, T> =>
        <F extends Kind1>(F: Applicative<F>, k: (a: A2) => Apply<F, [B]>) =>
          (s: S) => baz(F, (a: A) => k(f(a)))(s),
    
    rmap: <B2>(g: (b: B) => B2) =>
      (baz: Bazaar<A, B, S, T>): Bazaar<A, B2, S, T> =>
        <F extends Kind1>(F: Applicative<F>, k: (a: A) => Apply<F, [B2]>) =>
          (s: S) => F.map(baz(F, k)(s), g)
  };
}

// ============================================================================
// Part 3: Bazaar as Strong Profunctor
// ============================================================================

/**
 * Bazaar as a Strong Profunctor.
 * Extends Profunctor with strength operations for product types.
 */
export function bazaarStrong<A, B, S, T>(): Strong<Bazaar<A, B, S, T>> {
  return {
    ...bazaarProfunctor<A, B, S, T>(),
    
    first: <C>(baz: Bazaar<A, B, S, T>): Bazaar<A, B, [S, C], [T, C]> =>
      <F extends Kind1>(F: Applicative<F>, k: (a: A) => Apply<F, [B]>) =>
        ([s, c]: [S, C]) => {
          const result = baz(F, k)(s);
          return F.map(result, (t: T) => [t, c]);
        },
    
    second: <C>(baz: Bazaar<A, B, S, T>): Bazaar<A, B, [C, S], [C, T]> =>
      <F extends Kind1>(F: Applicative<F>, k: (a: A) => Apply<F, [B]>) =>
        ([c, s]: [C, S]) => {
          const result = baz(F, k)(s);
          return F.map(result, (t: T) => [c, t]);
        }
  };
}

// ============================================================================
// Part 4: Bazaar as Choice Profunctor
// ============================================================================

/**
 * Bazaar as a Choice Profunctor.
 * Extends Profunctor with choice operations for sum types.
 */
export function bazaarChoice<A, B, S, T>(): Choice<Bazaar<A, B, S, T>> {
  return {
    ...bazaarProfunctor<A, B, S, T>(),
    
    left: <C>(baz: Bazaar<A, B, S, T>): Bazaar<A, B, S | C, T | C> =>
      <F extends Kind1>(F: Applicative<F>, k: (a: A) => Apply<F, [B]>) =>
        (s: S | C) => {
          if (typeof s === 'object' && s !== null && 'left' in s) {
            // Handle Left case
            const result = baz(F, k)(s as S);
            return F.map(result, (t: T) => ({ left: t } as T | C));
          } else {
            // Handle Right case - pass through unchanged
            return F.of(s as C);
          }
        },
    
    right: <C>(baz: Bazaar<A, B, S, T>): Bazaar<A, B, C | S, C | T> =>
      <F extends Kind1>(F: Applicative<F>, k: (a: A) => Apply<F, [B]>) =>
        (s: C | S) => {
          if (typeof s === 'object' && s !== null && 'right' in s) {
            // Handle Right case
            const result = baz(F, k)(s as S);
            return F.map(result, (t: T) => ({ right: t } as C | T));
          } else {
            // Handle Left case - pass through unchanged
            return F.of(s as C);
          }
        }
  };
}

// ============================================================================
// Part 5: Bazaar as Closed Profunctor
// ============================================================================

/**
 * Bazaar as a Closed Profunctor.
 * Extends Profunctor with closed operations for function types.
 */
export function bazaarClosed<A, B, S, T>(): Closed<Bazaar<A, B, S, T>> {
  return {
    ...bazaarProfunctor<A, B, S, T>(),
    
    closed: <C>(baz: Bazaar<A, B, S, T>): Bazaar<A, B, (c: C) => S, (c: C) => T> =>
      <F extends Kind1>(F: Applicative<F>, k: (a: A) => Apply<F, [B]>) =>
        (f: (c: C) => S) => (c: C) => {
          const result = baz(F, k)(f(c));
          return result;
        }
  };
}

// ============================================================================
// Part 6: Bazaar as Traversing Profunctor
// ============================================================================

/**
 * Bazaar as a Traversing Profunctor.
 * Extends Profunctor with traversing operations for applicative effects.
 */
export function bazaarTraversing<A, B, S, T>(): Traversing<Bazaar<A, B, S, T>> {
  return {
    ...bazaarProfunctor<A, B, S, T>(),
    
    traverse: <F extends Kind1, A2, B2>(
      F: Applicative<F>,
      baz: Bazaar<A, B, S, T>,
      f: (a: A2) => Apply<F, [B2]>
    ): Apply<F, [Bazaar<A2, B2, S, T>]> => {
      return F.of(
        <F2 extends Kind1>(F2: Applicative<F2>, k: (a: A2) => Apply<F2, [B2]>) =>
          (s: S) => {
            // This is a simplified implementation
            // In practice, this would need more sophisticated handling
            return F2.of(s as any);
          }
      ) as any;
    }
  };
}

// ============================================================================
// Part 7: Advanced Algebraic Patterns
// ============================================================================

/**
 * Bazaar as a Category.
 * Provides identity and composition operations.
 */
export interface Category<C> {
  id<A>(): C;
  compose<A, B, C>(g: C, f: C): C;
}

/**
 * Bazaar as a Category.
 * Provides identity and composition for Bazaar optics.
 */
export function bazaarCategory<S, T>(): Category<Bazaar<any, any, S, T>> {
  return {
    id: <A>() => 
      <F extends Kind1>(F: Applicative<F>, k: (a: A) => Apply<F, [A]>) =>
        (s: S) => F.map(k(s as any), () => s as any),
    
    compose: <A, B, C>(g: Bazaar<B, C, S, T>, f: Bazaar<A, B, S, T>) =>
      <F extends Kind1>(F: Applicative<F>, k: (a: A) => Apply<F, [C]>) =>
        (s: S) => {
          return f(F, (a: A) => g(F, (b: B) => k(a))(s))(s);
        }
  };
}

/**
 * Bazaar as an Arrow.
 * Extends Category with arr and first operations.
 */
export interface Arrow<A> extends Category<A> {
  arr<B, C>(f: (b: B) => C): A;
  first<B, C, D>(f: A): A;
}

/**
 * Bazaar as an Arrow.
 * Extends Category with arr and first operations for Bazaar optics.
 */
export function bazaarArrow<S, T>(): Arrow<Bazaar<any, any, S, T>> {
  return {
    ...bazaarCategory<S, T>(),
    
    arr: <B, C>(f: (b: B) => C) =>
      <F extends Kind1>(F: Applicative<F>, k: (a: B) => Apply<F, [C]>) =>
        (s: S) => F.map(k(s as any), f),
    
    first: <B, C, D>(baz: Bazaar<B, C, S, T>) =>
      <F extends Kind1>(F: Applicative<F>, k: (a: B) => Apply<F, [C]>) =>
        ([s, d]: [S, D]) => {
          const result = baz(F, k)(s);
          return F.map(result, (c: C) => [c, d]);
        }
  };
}

// ============================================================================
// Part 8: Algebraic Law Verification
// ============================================================================

/**
 * Test Profunctor laws for Bazaar.
 * Verifies that Bazaar satisfies profunctor laws.
 */
export function testBazaarProfunctorLaws<A, B, S, T>(
  baz: Bazaar<A, B, S, T>,
  testData: S[],
  F: Applicative<any>
): {
  dimapIdentity: boolean;
  dimapComposition: boolean;
  lmapIdentity: boolean;
  rmapIdentity: boolean;
} {
  const profunctor = bazaarProfunctor<A, B, S, T>();
  
  return {
    // dimap id id = id
    dimapIdentity: testData.every(s => {
      const id = <X>(x: X) => x;
      const dimapped = profunctor.dimap(id, id, baz);
      const k = (a: A) => F.of(a.toString());
      
      const original = baz(F, k)(s);
      const transformed = dimapped(F, k)(s);
      
      return deepEqual(original, transformed);
    }),
    
    // dimap (f . g) (h . i) = dimap g h . dimap f i
    dimapComposition: testData.every(s => {
      const f = (x: any) => x.toString();
      const g = (x: any) => x.length;
      const h = (x: any) => x * 2;
      const i = (x: any) => x + 1;
      
      const left = profunctor.dimap(
        (x: any) => f(g(x)),
        (x: any) => h(i(x)),
        baz
      );
      const right = profunctor.dimap(g, h, profunctor.dimap(f, i, baz));
      
      const k = (a: A) => F.of(a.toString());
      const leftResult = left(F, k)(s);
      const rightResult = right(F, k)(s);
      
      return deepEqual(leftResult, rightResult);
    }),
    
    // lmap id = id
    lmapIdentity: testData.every(s => {
      const id = <X>(x: X) => x;
      const lmapId = profunctor.lmap(id, baz);
      const k = (a: A) => F.of(a.toString());
      
      const original = baz(F, k)(s);
      const transformed = lmapId(F, k)(s);
      
      return deepEqual(original, transformed);
    }),
    
    // rmap id = id
    rmapIdentity: testData.every(s => {
      const id = <X>(x: X) => x;
      const rmapId = profunctor.rmap(id, baz);
      const k = (a: A) => F.of(a.toString());
      
      const original = baz(F, k)(s);
      const transformed = rmapId(F, k)(s);
      
      return deepEqual(original, transformed);
    })
  };
}

/**
 * Test Strong Profunctor laws for Bazaar.
 * Verifies that Bazaar satisfies strong profunctor laws.
 */
export function testBazaarStrongLaws<A, B, S, T>(
  baz: Bazaar<A, B, S, T>,
  testData: S[],
  F: Applicative<any>
): {
  firstIdentity: boolean;
  secondIdentity: boolean;
  firstComposition: boolean;
  secondComposition: boolean;
} {
  const strong = bazaarStrong<A, B, S, T>();
  
  return {
    // first (arr id) = arr id
    firstIdentity: testData.every(s => {
      const id = <X>(x: X) => x;
      const arrId = strong.arr(id);
      const firstArrId = strong.first(arrId);
      
      const k = (a: A) => F.of(a.toString());
      const original = arrId(F, k)(s);
      const transformed = firstArrId(F, k)([s, 'test']);
      
      return deepEqual(original, transformed[0]);
    }),
    
    // second (arr id) = arr id
    secondIdentity: testData.every(s => {
      const id = <X>(x: X) => x;
      const arrId = strong.arr(id);
      const secondArrId = strong.second(arrId);
      
      const k = (a: A) => F.of(a.toString());
      const original = arrId(F, k)(s);
      const transformed = secondArrId(F, k)(['test', s]);
      
      return deepEqual(original, transformed[1]);
    }),
    
    // first (f >>> g) = first f >>> first g
    firstComposition: testData.every(s => {
      const f = (x: any) => x.toString();
      const g = (x: any) => x.length;
      
      const left = strong.first(strong.compose(
        strong.arr(g),
        strong.arr(f)
      ));
      const right = strong.compose(
        strong.first(strong.arr(f)),
        strong.first(strong.arr(g))
      );
      
      const k = (a: A) => F.of(a.toString());
      const leftResult = left(F, k)([s, 'test']);
      const rightResult = right(F, k)([s, 'test']);
      
      return deepEqual(leftResult, rightResult);
    }),
    
    // second (f >>> g) = second f >>> second g
    secondComposition: testData.every(s => {
      const f = (x: any) => x.toString();
      const g = (x: any) => x.length;
      
      const left = strong.second(strong.compose(
        strong.arr(g),
        strong.arr(f)
      ));
      const right = strong.compose(
        strong.second(strong.arr(f)),
        strong.second(strong.arr(g))
      );
      
      const k = (a: A) => F.of(a.toString());
      const leftResult = left(F, k)(['test', s]);
      const rightResult = right(F, k)(['test', s]);
      
      return deepEqual(leftResult, rightResult);
    })
  };
}

// ============================================================================
// Part 9: Utility Functions
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
 * Create a simple Bazaar for testing.
 */
export function simpleBazaar<A, B, S, T>(
  transform: (a: A) => B,
  extract: (s: S) => A,
  construct: (b: B, s: S) => T
): Bazaar<A, B, S, T> {
  return <F extends Kind1>(F: Applicative<F>, k: (a: A) => Apply<F, [B]>) =>
    (s: S) => {
      const a = extract(s);
      const b = transform(a);
      return F.map(k(a), () => construct(b, s));
    };
}

// ============================================================================
// Part 10: Examples & Usage
// ============================================================================

/**
 * Example: Using Bazaar as Profunctor.
 */
export function profunctorExample() {
  // Create a simple Bazaar
  const baz = simpleBazaar<number, string, number[], string[]>(
    (n: number) => n.toString(),
    (arr: number[]) => arr[0] || 0,
    (s: string, arr: number[]) => [s, ...arr.slice(1).map(n => n.toString())]
  );
  
  // Apply profunctor operations
  const profunctor = bazaarProfunctor<number, string, number[], string[]>();
  
  // lmap: transform input
  const doubled = profunctor.lmap((n: number) => n * 2, baz);
  
  // rmap: transform output
  const uppercased = profunctor.rmap((s: string) => s.toUpperCase(), baz);
  
  // dimap: transform both input and output
  const transformed = profunctor.dimap(
    (n: number) => n * 2,  // input transformation
    (s: string) => s.toUpperCase(),  // output transformation
    baz
  );
  
  const IdApplicative: Applicative<any> = {
    of: <T>(x: T) => x,
    map: <T, U>(x: T, f: (t: T) => U) => f(x),
    ap: <T, U>(f: (t: T) => U, x: T) => f(x)
  };
  
  const input = [1, 2, 3];
  const result1 = doubled(IdApplicative, (n: number) => n.toString())(input);
  const result2 = uppercased(IdApplicative, (n: number) => n.toString())(input);
  const result3 = transformed(IdApplicative, (n: number) => n.toString())(input);
  
  console.log('Original:', input);
  console.log('Doubled input:', result1);
  console.log('Uppercased output:', result2);
  console.log('Transformed both:', result3);
  
  return { baz, doubled, uppercased, transformed, result1, result2, result3 };
}

/**
 * Example: Using Bazaar as Strong Profunctor.
 */
export function strongExample() {
  const baz = simpleBazaar<number, string, number[], string[]>(
    (n: number) => n.toString(),
    (arr: number[]) => arr[0] || 0,
    (s: string, arr: number[]) => [s, ...arr.slice(1).map(n => n.toString())]
  );
  
  const strong = bazaarStrong<number, string, number[], string[]>();
  
  // first: apply to first component of pair
  const firstBaz = strong.first(baz);
  
  // second: apply to second component of pair
  const secondBaz = strong.second(baz);
  
  const IdApplicative: Applicative<any> = {
    of: <T>(x: T) => x,
    map: <T, U>(x: T, f: (t: T) => U) => f(x),
    ap: <T, U>(f: (t: T) => U, x: T) => f(x)
  };
  
  const input: [number[], string] = [[1, 2, 3], "hello"];
  const firstResult = firstBaz(IdApplicative, (n: number) => n.toString())(input);
  const secondResult = secondBaz(IdApplicative, (n: number) => n.toString())(input);
  
  console.log('Input pair:', input);
  console.log('First applied:', firstResult);
  console.log('Second applied:', secondResult);
  
  return { baz, firstBaz, secondBaz, firstResult, secondResult };
}

// Export all the main functions
export {
  Profunctor,
  Strong,
  Choice,
  Closed,
  Traversing,
  Category,
  Arrow,
  bazaarProfunctor,
  bazaarStrong,
  bazaarChoice,
  bazaarClosed,
  bazaarTraversing,
  bazaarCategory,
  bazaarArrow,
  testBazaarProfunctorLaws,
  testBazaarStrongLaws,
  simpleBazaar,
  profunctorExample,
  strongExample
};
