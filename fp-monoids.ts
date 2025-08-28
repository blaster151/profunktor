/**
 * Monoid Typeclass System with HKT + Purity Integration
 * 
 * This module provides a comprehensive Monoid typeclass system with common
 * built-in monoids for numbers, booleans, strings, and arrays, ensuring
 * seamless integration with the HKT and purity tracking systems.
 */

import {
  Kind1, Kind2, Kind3,
  Apply, Type, TypeArgs, KindArity, KindResult,
  ArrayK, MaybeK, EitherK, TupleK, FunctionK, PromiseK, SetK, MapK, ListK,
  ReaderK, WriterK, StateK,
  List, Reader, Writer, State
} from './fp-hkt';

import { Maybe, Just, Nothing, matchMaybe } from './fp-maybe-unified';
import { Either, Left, Right, matchEither } from './fp-either-unified';

import {
  EffectTag, EffectOf, Pure, IO, Async,
  createPurityInfo, attachPurityMarker, extractPurityMarker, hasPurityMarker
} from './fp-purity';

import { assertDefined, isDefined } from './src/util/assert';

// ============================================================================
// Part 1: Monoid Typeclass Definition
// ============================================================================

/**
 * Monoid typeclass - provides empty value and associative binary operation
 * A monoid is a semigroup with an identity element
 */
export interface Monoid<A> {
  readonly empty: A;
  readonly concat: (a: A, b: A) => A;
}

/**
 * Monoid with HKT support for higher-order contexts
 */
export interface MonoidK<F extends Kind1> {
  readonly empty: Apply<F, [any]>;
  readonly concat: <A>(a: Apply<F, [A]>, b: Apply<F, [A]>) => Apply<F, [A]>;
}

/**
 * Monoid with purity tracking
 */
export interface MonoidWithEffect<A, E extends EffectTag = 'Pure'> extends Monoid<A> {
  readonly __effect: E;
}

// ============================================================================
// Part 2: Common Built-in Monoids
// ============================================================================

/**
 * Sum Monoid for numbers
 * empty: 0, concat: addition
 */
export const SumMonoid: MonoidWithEffect<number, 'Pure'> = {
  empty: 0,
  concat: (a: number, b: number) => a + b,
  __effect: 'Pure'
};

/**
 * Product Monoid for numbers
 * empty: 1, concat: multiplication
 */
export const ProductMonoid: MonoidWithEffect<number, 'Pure'> = {
  empty: 1,
  concat: (a: number, b: number) => a * b,
  __effect: 'Pure'
};

/**
 * Any Monoid for booleans (OR operation)
 * empty: false, concat: logical OR
 */
export const AnyMonoid: MonoidWithEffect<boolean, 'Pure'> = {
  empty: false,
  concat: (a: boolean, b: boolean) => a || b,
  __effect: 'Pure'
};

/**
 * All Monoid for booleans (AND operation)
 * empty: true, concat: logical AND
 */
export const AllMonoid: MonoidWithEffect<boolean, 'Pure'> = {
  empty: true,
  concat: (a: boolean, b: boolean) => a && b,
  __effect: 'Pure'
};

/**
 * String Monoid for string concatenation
 * empty: "", concat: string concatenation
 */
export const StringMonoid: MonoidWithEffect<string, 'Pure'> = {
  empty: "",
  concat: (a: string, b: string) => a + b,
  __effect: 'Pure'
};

/**
 * Array Monoid for array concatenation
 * empty: [], concat: array concatenation
 */
export function ArrayMonoid<T>(): MonoidWithEffect<T[], 'Pure'> {
  return {
    empty: [],
    concat: (a: T[], b: T[]) => [...a, ...b],
    __effect: 'Pure'
  };
}

/**
 * Maybe Monoid - combines Maybe values using inner monoid
 */
export function MaybeMonoid<A>(innerMonoid: Monoid<A>): MonoidWithEffect<Maybe<A>, 'Pure'> {
  return {
    empty: Just(innerMonoid.empty),
    concat: (a: Maybe<A>, b: Maybe<A>) => {
      return matchMaybe(a, {
        Just: (aVal: A) => matchMaybe(b, {
          Just: (bVal: A) => Just(innerMonoid.concat(aVal, bVal)),
          Nothing: () => a
        }),
        Nothing: () => b
      });
    },
    __effect: 'Pure'
  };
}

/**
 * Either Monoid - combines Either values using inner monoids
 */
export function EitherMonoid<L, R>(
  leftMonoid: Monoid<L>,
  rightMonoid: Monoid<R>
): MonoidWithEffect<Either<L, R>, 'Pure'> {
  return {
    empty: Right(rightMonoid.empty),
    concat: (a: Either<L, R>, b: Either<L, R>) => {
      return matchEither(a, {
        Left: (aVal: L) => matchEither(b, {
          Left: (bVal: L) => Left(leftMonoid.concat(aVal, bVal)),
          Right: () => a
        }),
        Right: (aVal: R) => matchEither(b, {
          Left: () => b,
          Right: (bVal: R) => Right(rightMonoid.concat(aVal, bVal))
        })
      });
    },
    __effect: 'Pure'
  };
}

// ============================================================================
// Part 3: Monoid Laws and Validation
// ============================================================================

/**
 * Monoid laws for validation
 */
export interface MonoidLaws<A> {
  readonly leftIdentity: (a: A) => boolean;
  readonly rightIdentity: (a: A) => boolean;
  readonly associativity: (a: A, b: A, c: A) => boolean;
}

/**
 * Validate monoid laws
 */
export function validateMonoidLaws<A>(monoid: Monoid<A>, testValues: A[]): MonoidLaws<A> {
  return {
    leftIdentity: (a: A) => {
      return monoid.concat(monoid.empty, a) === a;
    },
    rightIdentity: (a: A) => {
      return monoid.concat(a, monoid.empty) === a;
    },
    associativity: (a: A, b: A, c: A) => {
      const left = monoid.concat(monoid.concat(a, b), c);
      const right = monoid.concat(a, monoid.concat(b, c));
      return left === right;
    }
  };
}

/**
 * Test monoid laws with sample values
 */
export function testMonoidLaws<A>(monoid: Monoid<A>, testValues: A[]): boolean {
  const laws = validateMonoidLaws(monoid, testValues);
  
  // Test identity laws
  for (const value of testValues) {
    if (!laws.leftIdentity(value) || !laws.rightIdentity(value)) {
      return false;
    }
  }
  
  // Test associativity law
  for (let i = 0; i < testValues.length - 2; i++) {
    const a = testValues[i];
    const b = testValues[i + 1];
    const c = testValues[i + 2];
    if (!laws.associativity(a, b, c)) {
      return false;
    }
  }
  
  return true;
}

// ============================================================================
// Part 4: Monoid Utilities
// ============================================================================

/**
 * Create a monoid from a semigroup by providing an empty value
 */
export function monoidFromSemigroup<A>(empty: A, concat: (a: A, b: A) => A): MonoidWithEffect<A, 'Pure'> {
  return {
    empty,
    concat,
    __effect: 'Pure'
  };
}

/**
 * Create a monoid that always returns the first value
 */
export function FirstMonoid<A>(): MonoidWithEffect<A, 'Pure'> {
  return {
    empty: undefined as any, // First monoid doesn't have a meaningful empty value
    concat: (a: A, b: A) => {
      if (a === undefined) throw new Error("monoid: lhs required");
      if (b === undefined) throw new Error("monoid: rhs required");
      return a;
    },
    __effect: 'Pure'
  };
}

/**
 * Create a monoid that always returns the last value
 */
export function LastMonoid<A>(): MonoidWithEffect<A, 'Pure'> {
  return {
    empty: undefined as any, // Last monoid doesn't have a meaningful empty value
    concat: (a: A, b: A) => b,
    __effect: 'Pure'
  };
}

/**
 * Create a monoid for min values
 */
export function MinMonoid(): MonoidWithEffect<number, 'Pure'> {
  return {
    empty: Infinity,
    concat: (a: number, b: number) => Math.min(a, b),
    __effect: 'Pure'
  };
}

/**
 * Create a monoid for max values
 */
export function MaxMonoid(): MonoidWithEffect<number, 'Pure'> {
  return {
    empty: -Infinity,
    concat: (a: number, b: number) => Math.max(a, b),
    __effect: 'Pure'
  };
}

// ============================================================================
// Part 5: HKT Integration
// ============================================================================

/**
 * MonoidK for Array
 */
export const ArrayMonoidK: MonoidK<ArrayK> = {
  empty: [] as any,
  concat: <A>(a: A[], b: A[]): A[] => [...a, ...b]
};

/**
 * MonoidK for Maybe
 */
export const MaybeMonoidK: MonoidK<MaybeK> = {
  empty: Nothing() as Apply<MaybeK, [any]>,
    concat: <A>(a: Apply<MaybeK, [A]>, b: Apply<MaybeK, [A]>): Apply<MaybeK, [A]> => {
      const maybeA = a as Maybe<A>;
      const maybeB = b as Maybe<A>;
      return matchMaybe(maybeA, {
        Just: () => maybeA,
        Nothing: () => maybeB
      }) as Apply<MaybeK, [A]>;
    }
};

// ============================================================================
// Part 6: Purity Integration
// ============================================================================

/**
 * Extract effect tag from a monoid
 */
export type EffectOfMonoid<T> = T extends MonoidWithEffect<any, infer E> ? E : 'Pure';

/**
 * Check if a monoid is pure
 */
export type IsMonoidPure<T> = EffectOfMonoid<T> extends 'Pure' ? true : false;

/**
 * Check if a monoid is impure
 */
export type IsMonoidImpure<T> = EffectOfMonoid<T> extends 'Pure' ? false : true;

/**
 * Attach purity marker to a monoid
 */
export function attachMonoidPurityMarker<A, E extends EffectTag>(
  monoid: Monoid<A>,
  effect: E
): MonoidWithEffect<A, E> {
  return {
    ...monoid,
    __effect: effect
  };
}

/**
 * Extract purity marker from a monoid
 */
export function extractMonoidPurityMarker<A, E extends EffectTag>(
  monoid: MonoidWithEffect<A, E>
): E {
  return monoid.__effect;
}

// ============================================================================
// Part 7: All exports are already inline above
// ============================================================================ 