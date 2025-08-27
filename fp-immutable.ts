/**
 * Structural Immutability Utilities
 * 
 * This module provides comprehensive immutability utilities for arrays, objects, and tuples
 * with type-level tracking so the Purity System can detect and propagate immutability guarantees.
 * 
 * Features:
 * - Core type-level definitions (Immutable<T>, DeepReadonly<T>, IsImmutable<T>)
 * - Immutable constructors for arrays, objects, and tuples
 * - Safe update utilities that never mutate
 * - Integration with purity system (defaults to Pure)
 * - Typeclass integration (ImmutableFunctor, ImmutableMonad)
 * - Readonly pattern matching support
 * - Compile-time immutability enforcement
 */

import {
  Kind1, Kind2, Kind3,
  Apply, Type, TypeArgs, KindArity, KindResult,
  ArrayK, MaybeK, EitherK, TupleK, FunctionK,
  Maybe, Either
} from './fp-hkt';

import {
  Functor, Applicative, Monad, Bifunctor, Profunctor, Traversable, Foldable,
  deriveFunctor, deriveApplicative, deriveMonad,
  lift2, composeK, sequence, traverse
} from './fp-typeclasses-hkt';

import {
  EffectTag, EffectOf, Pure, IO, Async,
  createPurityInfo, attachPurityMarker, extractPurityMarker, hasPurityMarker
} from './fp-purity';

import { 
  deriveInstances, 
  deriveEqInstance, 
  deriveOrdInstance, 
  deriveShowInstance 
} from './fp-derivation-helpers';
import { assertDefined, isDefined } from './src/util/assert';

/** Unary HKT for readonly arrays (Immutable arrays) */
export interface ImmutableArrayK extends Kind1 {
  readonly type: ReadonlyArray<this['arg0']>; // aka readonly A[]
}

// ============================================================================
// Part 1: Core Type-Level Definitions
// ============================================================================

/**
 * Recursively marks all fields as readonly, ensuring array/tuple elements are immutable too
 * 
 * @example
 * ```typescript
 * type ImmutableUser = Immutable<{
 *   name: string;
 *   age: number;
 *   hobbies: string[];
 *   address: { city: string; country: string; }
 * }>;
 * 
 * // Results in:
 * // {
 * //   readonly name: string;
 * //   readonly age: number;
 * //   readonly hobbies: readonly string[];
 * //   readonly address: {
 * //     readonly city: string;
 * //     readonly country: string;
 * //   };
 * // }
 * ```
 */
export type Immutable<T> = T extends readonly (infer U)[]
  ? readonly Immutable<U>[]
  : T extends readonly [...infer Head, ...infer Tail]
  ? readonly [...Immutable<Head>, ...Immutable<Tail>]
  : T extends readonly [infer First, ...infer Rest]
  ? readonly [Immutable<First>, ...Immutable<Rest>]
  : T extends readonly []
  ? readonly []
  : T extends (infer U)[]
  ? readonly Immutable<U>[]
  : T extends [...infer Head, ...infer Tail]
  ? readonly [...Immutable<Head>, ...Immutable<Tail>]
  : T extends [infer First, ...infer Rest]
  ? readonly [Immutable<First>, ...Immutable<Rest>]
  : T extends []
  ? readonly []
  : T extends object
  ? { readonly [K in keyof T]: Immutable<T[K]> }
  : T;

/**
 * Synonym for Immutable<T>, but keeps naming consistent with TS style
 */
export type DeepReadonly<T> = Immutable<T>;

/**
 * Resolves to true if T is Immutable, false otherwise
 * 
 * @example
 * ```typescript
 * type Check1 = IsImmutable<readonly number[]>; // true
 * type Check2 = IsImmutable<number[]>; // false
 * type Check3 = IsImmutable<{ readonly a: number }>; // true
 * type Check4 = IsImmutable<{ a: number }>; // false
 * ```
 */
export type IsImmutable<T> = T extends Immutable<T> ? true : false;

/**
 * Phantom kind to tag an HKT as producing immutable structures
 */
export interface ImmutableKind<T> {
  readonly __immutableBrand: unique symbol;
  readonly type: Immutable<T>;
}

/**
 * Branded type for immutable values with runtime immutability guarantee
 */
export interface ImmutableBrand {
  readonly __immutableBrand: unique symbol;
}

/**
 * Type that combines immutability with a branded guarantee
 */
export type ImmutableValue<T> = Immutable<T> & ImmutableBrand;

/**
 * Check if a type is an immutable value (branded)
 */
export type IsImmutableValue<T> = T extends ImmutableBrand ? true : false;

/**
 * Extract the underlying type from an immutable value
 */
export type ExtractImmutableType<T> = T extends ImmutableValue<infer U> ? U : T;

// ============================================================================
// Part 2: Integration with Purity System
// ============================================================================

/**
 * Extend the purity system to recognize immutable types as Pure
 */
declare module './fp-purity' {
  interface EffectKind<Tag extends EffectTag> {
    readonly __immutableBrand?: ImmutableBrand;
  }
}

/**
 * Immutable type with purity integration
 */
export interface ImmutableWithPurity<T, P extends EffectTag = 'Pure'> {
  readonly value: Immutable<T>;
  readonly effect: P;
  readonly __immutableBrand: ImmutableBrand;
}

/**
 * Create an immutable value with purity information
 */
export function createImmutableWithPurity<T, P extends EffectTag = 'Pure'>(
  value: T,
  effect: P = 'Pure' as P
): ImmutableWithPurity<T, P> {
  const immutableValue = deepFreeze(value) as Immutable<T>;
  return {
    value: immutableValue,
    effect,
    __immutableBrand: {} as ImmutableBrand
  };
}

/**
 * Extract the effect from an immutable value
 */
export type EffectOfImmutable<T> = T extends ImmutableWithPurity<any, infer P> ? P : 'Pure';

/**
 * Check if an immutable value is pure
 */
export type IsImmutablePure<T> = EffectOfImmutable<T> extends 'Pure' ? true : false;

// ============================================================================
// Part 3: Immutable Constructors
// ============================================================================

/**
 * Create an immutable array with type safety
 * 
 * @example
 * ```typescript
 * const nums = immutableArray(1, 2, 3);
 * // Type: readonly number[]
 * // No mutation methods like push, pop are available
 * ```
 */
export function immutableArray<T>(...items: Immutable<T>[]): Immutable<T[]> {
  return Object.freeze([...items]) as Immutable<T[]>;
}

/**
 * Create an immutable tuple with type inference
 * 
 * @example
 * ```typescript
 * const tuple = immutableTuple(1, "hello", true);
 * // Type: readonly [number, string, boolean]
 * ```
 */
export function immutableTuple<T extends readonly any[]>(
  ...items: { [K in keyof T]: Immutable<T[K]> }
): Immutable<T> {
  return Object.freeze([...items]) as Immutable<T>;
}

/**
 * Create an immutable object with deep freezing
 * 
 * @example
 * ```typescript
 * const obj = immutableObject({ a: 1, b: { c: 2 } });
 * // Type: { readonly a: number; readonly b: { readonly c: number; } }
 * ```
 */
export function immutableObject<T extends object>(obj: T): Immutable<T> {
  return deepFreeze(obj) as Immutable<T>;
}

/**
 * Create an immutable set
 * 
 * @example
 * ```typescript
 * const set = immutableSet(1, 2, 3);
 * // Type: ReadonlySet<number>
 * ```
 */
export function immutableSet<T>(...items: Immutable<T>[]): ReadonlySet<Immutable<T>> {
  return Object.freeze(new Set(items)) as ReadonlySet<Immutable<T>>;
}

/**
 * Create an immutable map
 * 
 * @example
 * ```typescript
 * const map = immutableMap([["a", 1], ["b", 2]]);
 * // Type: ReadonlyMap<string, number>
 * ```
 */
export function immutableMap<K, V>(
  entries: readonly (readonly [Immutable<K>, Immutable<V>])[]
): ReadonlyMap<Immutable<K>, Immutable<V>> {
  return Object.freeze(new Map(entries)) as ReadonlyMap<Immutable<K>, Immutable<V>>;
}

// ============================================================================
// Part 4: Safe Update Utilities
// ============================================================================

/**
 * Update an immutable array at a specific index
 * Always returns a new array - never mutates
 * 
 * @example
 * ```typescript
 * const nums = immutableArray(1, 2, 3);
 * const updated = updateImmutableArray(nums, 1, 42);
 * // updated: readonly [number, number, number]
 * // nums remains unchanged
 * ```
 */
export function updateImmutableArray<T>(
  arr: Immutable<T[]>,
  index: number,
  value: Immutable<T>
): Immutable<T[]> {
  if (index < 0 || index >= arr.length) {
    throw new Error(`Index ${index} out of bounds for array of length ${arr.length}`);
  }
  
  const newArray = [...arr];
  newArray[index] = value;
  return Object.freeze(newArray) as Immutable<T[]>;
}

/**
 * Update an immutable object at a specific key
 * Always returns a new object - never mutates
 * 
 * @example
 * ```typescript
 * const obj = immutableObject({ a: 1, b: 2 });
 * const updated = updateImmutableObject(obj, 'a', 42);
 * // updated: { readonly a: number; readonly b: number }
 * // obj remains unchanged
 * ```
 */
export function updateImmutableObject<T extends object, K extends keyof T>(
  obj: Immutable<T>,
  key: K,
  value: Immutable<T[K]>
): Immutable<T> {
  return Object.freeze({
    ...obj,
    [key]: value
  }) as Immutable<T>;
}

/**
 * Update an immutable tuple at a specific index
 * Always returns a new tuple - never mutates
 * 
 * @example
 * ```typescript
 * const tuple = immutableTuple(1, "hello", true);
 * const updated = updateImmutableTuple(tuple, 1, "world");
 * // updated: readonly [number, string, boolean]
 * // tuple remains unchanged
 * ```
 */
// helper to make a writable copy of a readonly tuple
type Mutable<T extends readonly any[]> = { -readonly [K in keyof T]: T[K] };

export function updateImmutableTuple<T extends readonly any[]>(
  tuple: Immutable<T>,
  index: number,                        // ① use a number
  value: Immutable<T[number]>           // ③ accept immutable element
): Immutable<T> {
  if (index < 0 || index >= tuple.length) {
    throw new Error(`Index ${index} out of bounds for tuple of length ${tuple.length}`);
  }

  // make a mutable clone to perform the write
  const clone = [...tuple] as Mutable<T>; // ② writable view of the tuple

  // write the value, coerce back to the element type
  clone[index] = value as unknown as T[number]; // ③ reconcile types

  return Object.freeze(clone) as Immutable<T>;
}

/**
 * Deep merge two immutable objects
 * Always returns a new object - never mutates
 * 
 * @example
 * ```typescript
 * const obj1 = immutableObject({ a: 1, b: { c: 2 } });
 * const obj2 = immutableObject({ b: { d: 3 }, e: 4 });
 * const merged = mergeImmutableObjects(obj1, obj2);
 * // merged: { readonly a: number; readonly b: { readonly c: number; readonly d: number; }; readonly e: number; }
 * ```
 */
type PlainObject = Record<string, unknown>;

function isPlainObject(x: unknown): x is PlainObject {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

export function mergeImmutableObjects<T extends object, U extends object>(
  obj1: Immutable<T>,
  obj2: Immutable<U>
): Immutable<T & U> {
  // start from a shallow clone we can write into
  const out: PlainObject = { ...(obj1 as unknown as PlainObject) };

  // iterate string keys (what JS actually gives us)
  for (const k of Object.keys(obj2 as unknown as PlainObject)) {
    const v = (obj2 as unknown as PlainObject)[k];
    const a = out[k];

    if (isPlainObject(a) && isPlainObject(v)) {
      // recurse on plain objects only
      out[k] = mergeImmutableObjects(a as Immutable<PlainObject>, v as Immutable<PlainObject>);
    } else {
      // replace (arrays & scalars just overwrite)
      out[k] = v;
    }
  }

  // freeze result and coerce once at the boundary
  return Object.freeze(out) as unknown as Immutable<T & U>;
}

/**
 * Append to an immutable array
 * Always returns a new array - never mutates
 * 
 * @example
 * ```typescript
 * const nums = immutableArray(1, 2, 3);
 * const appended = appendImmutableArray(nums, 4);
 * // appended: readonly [number, number, number, number]
 * // nums remains unchanged
 * ```
 */
export function appendImmutableArray<T>(
  arr: Immutable<T[]>,
  item: Immutable<T>
): Immutable<T[]> {
  return Object.freeze([...arr, item]) as Immutable<T[]>;
}

/**
 * Prepend to an immutable array
 * Always returns a new array - never mutates
 * 
 * @example
 * ```typescript
 * const nums = immutableArray(1, 2, 3);
 * const prepended = prependImmutableArray(nums, 0);
 * // prepended: readonly [number, number, number, number]
 * // nums remains unchanged
 * ```
 */
export function prependImmutableArray<T>(
  arr: Immutable<T[]>,
  item: Immutable<T>
): Immutable<T[]> {
  return Object.freeze([item, ...arr]) as Immutable<T[]>;
}

/**
 * Remove an item from an immutable array by index
 * Always returns a new array - never mutates
 * 
 * @example
 * ```typescript
 * const nums = immutableArray(1, 2, 3);
 * const removed = removeImmutableArray(nums, 1);
 * // removed: readonly [number, number]
 * // nums remains unchanged
 * ```
 */
export function removeImmutableArray<T>(
  arr: Immutable<T[]>,
  index: number
): Immutable<T[]> {
  if (index < 0 || index >= arr.length) {
    throw new Error(`Index ${index} out of bounds for array of length ${arr.length}`);
  }
  
  const newArray = [...arr];
  newArray.splice(index, 1);
  return Object.freeze(newArray) as Immutable<T[]>;
}

// ============================================================================
// Part 5: Deep Freeze Utility
// ============================================================================

/**
 * Deep freeze an object, making it and all nested objects immutable
 * 
 * @example
 * ```typescript
 * const obj = { a: 1, b: { c: 2, d: [3, 4] } };
 * const frozen = deepFreeze(obj);
 * // frozen and all nested objects are now immutable
 * ```
 */
export function deepFreeze<T>(obj: T): Immutable<T> {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj as Immutable<T>;
  }
  
  // Freeze the object itself
  Object.freeze(obj);
  
  // Freeze all properties
  for (const key of Object.getOwnPropertyNames(obj)) {
    const value = (obj as any)[key];
    if (value && typeof value === 'object') {
      deepFreeze(value);
    }
  }
  
  return obj as Immutable<T>;
}

/**
 * Check if an object is deeply frozen
 * 
 * @example
 * ```typescript
 * const obj = { a: 1, b: { c: 2 } };
 * const frozen = deepFreeze(obj);
 * const isFrozen = isDeeplyFrozen(frozen); // true
 * ```
 */
export function isDeeplyFrozen<T>(obj: T): obj is T & Immutable<T> {
  const seen = new WeakSet<object>();

  const check = (x: unknown): boolean => {
    if (x === null) return true;
    const t = typeof x;
    if (t !== "object" && t !== "function") return true; // primitives
    const o = x as Record<string, unknown>;

    // avoid cycles
    if (typeof o === "object") {
      if (seen.has(o)) return true;
      if (!Object.isFrozen(o)) return false;
      seen.add(o);
    }

    // Arrays
    if (Array.isArray(o)) {
      for (const v of o) if (!check(v)) return false;
      return true;
    }

    // Map
    if (o instanceof Map) {
      let ok = true;
      o.forEach((v, k) => {
        if (ok && (!check(k) || !check(v))) ok = false;
      });
      return ok;
    }

    // Set
    if (o instanceof Set) {
      let ok = true;
      o.forEach((v) => {
        if (ok && !check(v)) ok = false;
      });
      return ok;
    }

    // Plain objects (and functions: no own enumerable children typically)
    for (const key of Object.getOwnPropertyNames(o)) {
      if (!check((o as any)[key])) return false;
    }
    return true;
  };

  return check(obj);
}

// ============================================================================
// Part 6: Typeclass Integration (Derived)
// ============================================================================

/**
 * ImmutableArray derived instances
 */
// 1) Define a Kind for readonly/immutable arrays
export interface ImmutableArrayK extends Kind1 {
  readonly type: ReadonlyArray<this['arg0']>; // aka Immutable<this['arg0'][]> 
}

// 2) Primitive ops (no mutation; always return frozen copies)
const imap = <A = unknown, B = unknown>(fa: ReadonlyArray<A>, f: (a: A) => B): ReadonlyArray<B> =>
  Object.freeze(fa.map(f));

const iof = <A = unknown>(a: A): ReadonlyArray<A> =>
  Object.freeze([a]);

const iap = <A = unknown, B = unknown>(ff: ReadonlyArray<(a: A) => B>, fa: ReadonlyArray<A>): ReadonlyArray<B> => {
  const out: B[] = [];
  for (const f of ff) for (const a of fa) out.push(f(a));
  return Object.freeze(out);
};

const ichain = <A = unknown, B = unknown>(fa: ReadonlyArray<A>, f: (a: A) => ReadonlyArray<B>): ReadonlyArray<B> => {
  const out: B[] = [];
  for (const a of fa) for (const b of f(a)) out.push(b);
  return Object.freeze(out);
};

// 3) Actual instances (same export names as before)
export const ImmutableArrayFunctor = deriveFunctor<ImmutableArrayK>(imap);
export const ImmutableArrayApplicative = deriveApplicative<ImmutableArrayK>(iof, iap);
export const ImmutableArrayMonad = deriveMonad<ImmutableArrayK>(iof, ichain);



/**
 * ImmutableArray standard typeclass instances
 */
export const ImmutableArrayEq = deriveEqInstance({
  customEq: <A = unknown>(a: Immutable<A[]>, b: Immutable<A[]>): boolean => {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => val === b[idx]);
  }
});

export const ImmutableArrayOrd = deriveOrdInstance({
  customOrd: <A = unknown>(a: Immutable<A[]>, b: Immutable<A[]>): number => {
    const minLength = Math.min(a.length, b.length);
    for (let i = 0; i < minLength; i++) {
      const aItem = assertDefined(a[i], `ImmutableArrayOrd: a[${i}] must be defined`);
      const bItem = assertDefined(b[i], `ImmutableArrayOrd: b[${i}] must be defined`);
      if (aItem < bItem) return -1;
      if (aItem > bItem) return 1;
    }
    return a.length - b.length;
  }
});

export const ImmutableArrayShow = deriveShowInstance({
  customShow: <A = unknown>(a: Immutable<A[]>): string => 
    `ImmutableArray(${JSON.stringify(a)})`
});

// HKT for readonly arrays
export interface ImmutableArrayK extends Kind1 {
  readonly type: ReadonlyArray<this['arg0']>;
}

// Foldable that matches the interface

// Promise-only specialization (works if your code uses G = PromiseK)
export const ImmutableArrayTraversable: Traversable<ImmutableArrayK> = {
  ...ImmutableArrayFunctor,

  traverse: <G extends Kind1, A, B>(
    fa: Apply<ImmutableArrayK,[A]>,
    f: (a:A) => Apply<G,[B]>
  ): Apply<G,[Apply<ImmutableArrayK,[B]>]> => {
    // Treat G as PromiseK at runtime; TS sees Apply<G,[...]>.
    const ps = (fa as ReadonlyArray<A>).map(a => f(a) as unknown as Promise<B>);
    return Promise.all(ps).then(xs => Object.freeze(xs) as ReadonlyArray<B>) as unknown as
      Apply<G,[Apply<ImmutableArrayK,[B]>]>;
  },
};
// Switch to this when you can update your Traversable interface in hk-typeclasses
// Traversable that takes an Applicative<G>
// export const ImmutableArrayTraversable: Traversable<ImmutableArrayK> = {
//   ...ImmutableArrayFunctor,
//   traverse: <G extends Kind1, A, B>(
//     App: Applicative<G>,
//     fa: Apply<ImmutableArrayK, [A]>,
//     f: (a: A) => Apply<G, [B]>
//   ): Apply<G, [Apply<ImmutableArrayK, [B]>]> => {
//     const arr = fa as ReadonlyArray<A>;
//     // classic list traverse via Applicative
//     // start with G.of([])
//     let acc = App.of(Object.freeze([]) as ReadonlyArray<B>) as Apply<G, [ReadonlyArray<B>]>;

//     // acc <*> f(a), accumulating immutably
//     for (const a of arr) {
//       acc = App.ap(
//         App.map(acc, (bs: ReadonlyArray<B>) => (b: B) =>
//           Object.freeze([...bs, b]) as ReadonlyArray<B>
//         ),
//         f(a)
//       );
//     }

//     // acc already has type Apply<G, [ReadonlyArray<B>]>, which is Apply<G, [Apply<ImmutableArrayK, [B]>]>
//     return acc as Apply<G, [Apply<ImmutableArrayK, [B]>]>;
//   },
// };



/**
 * Immutable Foldable instance (manual due to complexity)
 */
export const ImmutableArrayFoldable: Foldable<ImmutableArrayK> = {
  foldr: <A, B>(fa: ReadonlyArray<A>, f: (a: A, b: B) => B, z: B): B =>
    fa.reduceRight((acc, a) => f(a, acc), z),

  foldl: <A, B>(fa: ReadonlyArray<A>, f: (b: B, a: A) => B, z: B): B =>
    fa.reduce((acc, a) => f(acc, a), z),
};

// ============================================================================
// Part 7: Readonly Pattern Matching
// ============================================================================

/**
 * Pattern matching for immutable arrays that preserves immutability
 * 
 * @example
 * ```typescript
 * const arr = immutableArray(1, 2, 3);
 * const result = matchImmutableArray(arr, {
 *   Empty: () => 0,
 *   NonEmpty: ([head, ...tail]) => head // tail remains immutable
 * });
 * ```
 */
export function matchImmutableArray<T, R>(
  arr: Immutable<T[]>,
  patterns: {
    Empty: () => R;
    NonEmpty: (head: Immutable<T>, tail: Immutable<T[]>) => R;
  }
): R {
  if (arr.length === 0) {
    return patterns.Empty();
  } else {
    const [head, ...tail] = arr;
    return patterns.NonEmpty(assertDefined(head, "matchImmutableArray: head must be defined"), Object.freeze(tail) as Immutable<T[]>);
  }
}

/**
 * Pattern matching for immutable objects that preserves immutability
 * 
 * @example
 * ```typescript
 * const obj = immutableObject({ a: 1, b: 2 });
 * const result = matchImmutableObject(obj, {
 *   HasA: (a, rest) => a, // rest remains immutable
 *   NoA: (rest) => 0
 * });
 * ```
 */
function omitImmutableKey<T extends object, K extends keyof T>(
  obj: Immutable<T>,
  key: K
): Immutable<Omit<T, K>> {
  const out: Partial<Record<keyof T, unknown>> = {};
  for (const k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k) && k !== (key as any)) {
      (out as any)[k] = (obj as any)[k];
    }
  }
  return Object.freeze(out) as unknown as Immutable<Omit<T, K>>; // single, quarantined cast
}

export function matchImmutableObject<T extends object, K extends keyof T, R>(
  obj: Immutable<T>,
  key: K,
  patterns: {
    Has: (value: Immutable<T[K]>, rest: Immutable<Omit<T, K>>) => R;
    Missing: (rest: Immutable<T>) => R;
  }
): R {
  if (Object.prototype.hasOwnProperty.call(obj, key)) {
    const value = (obj as any)[key] as Immutable<T[K]>;
    const rest = omitImmutableKey(obj, key);
    return patterns.Has(value, rest);
  }
  return patterns.Missing(obj);
}

/**
 * Pattern matching for immutable tuples that preserves immutability
 * 
 * @example
 * ```typescript
 * const tuple = immutableTuple(1, "hello", true);
 * const result = matchImmutableTuple(tuple, {
 *   Single: (item) => item,
 *   Multiple: (first, rest) => first // rest remains immutable
 * });
 * ```
 */
export function matchImmutableTuple<T extends readonly any[], R>(
  tuple: Immutable<T>,
  patterns: {
    Single: (item: T[0]) => R;
    Multiple: (first: T[0], rest: Immutable<Tail<T>>) => R;
  }
): R {
  if (tuple.length === 1) {
    return patterns.Single(tuple[0]);
  } else {
    const [first, ...rest] = tuple;
    return patterns.Multiple(first, Object.freeze(rest) as Immutable<Tail<T>>);
  }
}

// Helper type for tuple tail
type Tail<T extends readonly any[]> = T extends readonly [any, ...infer Rest] ? Rest : never;

// ============================================================================
// Part 8: Utility Types and Functions
// ============================================================================

/**
 * Convert a mutable type to immutable
 */
export type ToImmutable<T> = Immutable<T>;

/**
 * Convert an immutable type back to mutable (use with caution)
 */
export type ToMutable<T> = T extends Immutable<infer U> ? U : T;

/**
 * Check if two immutable types are equal
 */
export type ImmutableEqual<T, U> = Immutable<T> extends Immutable<U>
  ? Immutable<U> extends Immutable<T>
    ? true
    : false
  : false;

/**
 * Create an immutable copy of a value
 */
export function toImmutable<T extends readonly any[]>(value: T): Immutable<T>;
export function toImmutable<T extends object>(value: T): Immutable<T>;
export function toImmutable<T>(value: T): Immutable<T>;
export function toImmutable(value: any): any {
  if (Array.isArray(value)) {
    // Ensure elements are immutable before passing to immutableArray
    return immutableArray(...(value as any[]).map(toImmutable)) as Immutable<typeof value>;
  }
  if (value !== null && typeof value === 'object') {
    return immutableObject(value) as Immutable<typeof value>;
  }
  return value as Immutable<typeof value>;
}

/**
 * Create a mutable copy of an immutable value (use with caution)
 */
export function toMutable<T>(value: Immutable<T>): T {
  if (Array.isArray(value)) {
    return [...value] as T;
  } else if (value && typeof value === 'object') {
    return { ...value } as T;
  } else {
    return value as T;
  }
}

/**
 * Check if a value is immutable at runtime
 */
export function isImmutable<T>(value: T): value is T & Immutable<T> {
  if (value === null || value === undefined || typeof value !== 'object') {
    return true;
  }
  
  return isDeeplyFrozen(value);
}

/**
 * Create an immutable value with purity tracking
 */
export function createImmutable<T>(
  value: T
): ImmutableWithPurity<T, 'Pure'>;
export function createImmutable<T, P extends EffectTag>(
  value: T,
  effect: P
): ImmutableWithPurity<T, P>;

// Implementation
export function createImmutable<T, P extends EffectTag = 'Pure'>(
  value: T,
  effect?: P
): ImmutableWithPurity<T, P> {
  const eff = (effect ?? 'Pure') as P;
  return createImmutableWithPurity<T, P>(value, eff);
}

/**
 * Extract the value from an immutable with purity
 */
export function extractImmutableValue<T, P extends EffectTag>(
  immutable: ImmutableWithPurity<T, P>
): Immutable<T> {
  return immutable.value;
}

/**
 * Extract the effect from an immutable with purity
 */
export function extractImmutableEffect<T, P extends EffectTag>(
  immutable: ImmutableWithPurity<T, P>
): P {
  return immutable.effect;
}

// ============================================================================
// Part 9: Laws Documentation
// ============================================================================

/**
 * Immutability Laws:
 * 
 * 1. **Immutability Law**: Immutable values cannot be mutated
 *    - No mutation methods available on immutable arrays
 *    - Object properties cannot be reassigned
 *    - Tuple elements cannot be modified
 * 
 * 2. **Identity Law**: Immutable values maintain identity under operations
 *    - updateImmutableArray(arr, i, v) !== arr
 *    - updateImmutableObject(obj, k, v) !== obj
 *    - updateImmutableTuple(tuple, i, v) !== tuple
 * 
 * 3. **Purity Law**: Immutable values default to Pure effect
 *    - EffectOf<Immutable<T>> = "Pure"
 *    - IsImmutablePure<Immutable<T>> = true
 * 
 * 4. **Composition Law**: Immutable operations compose
 *    - updateImmutableArray(updateImmutableArray(arr, i, v1), j, v2) = updateImmutableArray(arr, i, v1, j, v2)
 *    - updateImmutableObject(updateImmutableObject(obj, k1, v1), k2, v2) = updateImmutableObject(obj, k1, v1, k2, v2)
 * 
 * 5. **Type Safety Law**: Type-level immutability is enforced
 *    - IsImmutable<Immutable<T>> = true
 *    - IsImmutable<T> = false (for mutable T)
 * 
 * 6. **Deep Freeze Law**: Deep freeze makes all nested structures immutable
 *    - isDeeplyFrozen(deepFreeze(obj)) = true
 *    - All nested objects and arrays are also frozen
 * 
 * 7. **Pattern Matching Law**: Pattern matching preserves immutability
 *    - matchImmutableArray preserves tail immutability
 *    - matchImmutableObject preserves rest immutability
 *    - matchImmutableTuple preserves rest immutability
 * 
 * 8. **Typeclass Law**: Immutable typeclasses respect immutability
 *    - ImmutableArrayFunctor.map returns immutable array
 *    - ImmutableArrayMonad.chain returns immutable array
 *    - All operations preserve immutability guarantees
 */ 