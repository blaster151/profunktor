/**
 * doM-style Syntax for Monadic Chaining
 * 
 * This module provides doM-style syntax for chaining monads with improved readability
 * and purity safety. Inspired by Haskell's do notation.
 * 
 * Features:
 * - Generator-based monadic chaining with explicit Monad instances
 * - Automatic purity inference and propagation
 * - Support for Kind1, Kind2, Kind3 via currying
 * - Type-safe effect composition
 */

import {
  Kind1, Kind2, Kind3,
  Apply, Type, TypeArgs, KindArity, KindResult,
  ArrayK, MaybeK, EitherK, TupleK, FunctionK, PromiseK, SetK, MapK, ListK,
  ReaderK, WriterK, StateK,
  Maybe, Either, ObservableLiteK,
  Fix2Right, ApplyLeft, Fix3Left
} from './fp-hkt';

import {
  Functor, Applicative, Monad, Bifunctor, Profunctor, Traversable, Foldable,
  deriveFunctor, deriveApplicative, deriveMonad
} from './fp-typeclasses-hkt';

import {
  EffectTag, EffectOf, Pure, IO, Async,
  createPurityInfo, attachPurityMarker, extractPurityMarker, hasPurityMarker
} from './fp-purity';

// ============================================================================
// Part 1: Type Definitions
// ============================================================================

/**
 * Generator function type for doM with proper Apply tuple
 */
export type DoGen1<F extends Kind1, A> = Generator<Apply<F, [any]>, A, any>;

/**
 * Generator function type for doM2 (Kind2)
 */
export type DoGen2<F extends Kind2, Fixed, A> = Generator<Apply<Fix2Right<F, Fixed>, [any]>, A, any>;

/**
 * Generator function type for doM3 (Kind3)
 */
export type DoGen3<F extends Kind3, A, B, C> = Generator<Apply<Fix3To1<F, A, B>, [any]>, C, any>;

/**
 * Helper type for fixing Kind3 to Kind1
 */
type Fix3To1<F extends Kind3, A, B> = Fix2Right<Fix3Left<F, A>, B>;

/**
 * Monadic value with effect tag
 */
export type MonadicValue<F extends Kind1, A, E extends EffectTag = 'Pure'> = 
  Apply<F, [A]> & { readonly __effect: E };

/**
 * Monadic value with effect tag for binary type constructors
 */
export type MonadicValue2<F extends Kind2, A, B, E extends EffectTag = 'Pure'> = 
  Apply<F, [A, B]> & { readonly __effect: E };

/**
 * Monadic value with effect tag for ternary type constructors
 */
export type MonadicValue3<F extends Kind3, A, B, C, E extends EffectTag = 'Pure'> = 
  Apply<F, [A, B, C]> & { readonly __effect: E };

/**
 * Effect composition result
 */
export type ComposedEffect<T extends readonly EffectTag[]> = 
  T extends readonly [infer First extends EffectTag, ...infer Rest]
    ? Rest extends readonly EffectTag[]
      ? First | ComposedEffect<Rest>
      : First
    : 'Pure';

// ============================================================================
// Part 2: Core doM Implementation with Monad Instances
// ============================================================================

/**
 * doM for Kind1 with explicit Monad instance
 * Chains monadic values using generator syntax
 */
export function doM<F extends Kind1, A>(
  M: Monad<F>,
  gen: () => DoGen1<F, A>
): Apply<F, [A]> {
  const it = gen();

  const step = (last?: any): Apply<F, [A]> => {
    const r = it.next(last);
    if (r.done) {
      // Lift the final pure value into the monad
      return M.of(r.value as A);
    }
    // r.value :: Apply<F, [any]>
    return M.chain(r.value as Apply<F, [any]>, step);
  };

  return step();
}

/**
 * doM2 for Kind2 where the right param is the value (Either-like): F<X, A>
 */
export function doM2Right<F extends Kind2, X, A>(
  M: Monad<Fix2Right<F, X>>,
  gen: () => DoGen2<F, X, A>
): Apply<Fix2Right<F, X>, [A]> {
  return doM(M, gen);
}

/**
 * doM2 for Kind2 where the left param is the value (Reader-like): F<A, X>
 */
export function doM2Left<F extends Kind2, A, X>(
  M: Monad<ApplyLeft<F, X>>,
  gen: () => Generator<Apply<ApplyLeft<F, X>, [any]>, A, any>
): Apply<ApplyLeft<F, X>, [A]> {
  return doM(M, gen);
}

/**
 * doM3 for Kind3 - fix two params and reuse doM
 */
export function doM3<F extends Kind3, A, B, C>(
  M: Monad<Fix3To1<F, A, B>>,
  gen: () => DoGen3<F, A, B, C>
): Apply<Fix3To1<F, A, B>, [C]> {
  return doM(M, gen);
}

// ============================================================================
// Part 3: Convenience Helpers for Common Types
// ============================================================================

/**
 * doM specifically for Either<E, A>
 */
export function doMEither<E, A>(
  gen: () => Generator<Apply<Fix2Right<EitherK, E>, [any]>, A, any>
): Apply<Fix2Right<EitherK, E>, [A]> {
  // Note: This requires EitherMonad to be available
  // For now, we'll use a placeholder - you'll need to import the actual EitherMonad
  const M = {} as Monad<Fix2Right<EitherK, E>>; // Placeholder
  return doM(M, gen);
}

/**
 * doM specifically for Promise<A>
 */
export function doMPromise<A>(
  gen: () => Generator<Promise<any>, A, any>
): Promise<A> {
  const M = {
    of: <T>(a: T): Promise<T> => Promise.resolve(a),
    chain: <T, U>(fa: Promise<T>, f: (a: T) => Promise<U>): Promise<U> => fa.then(f)
  } as Monad<PromiseK>;
  return doM(M, gen);
}

/**
 * doM specifically for Maybe<A>
 */
export function doMMaybe<A>(
  gen: () => Generator<Apply<MaybeK, [any]>, A, any>
): Apply<MaybeK, [A]> {
  // Note: This requires MaybeMonad to be available
  const M = {} as Monad<MaybeK>; // Placeholder
  return doM(M, gen);
}

// ============================================================================
// Part 4: Purity Integration
// ============================================================================

/**
 * Mark doM result with purity information
 */
export function markDoMResult<F extends Kind1, A, E extends EffectTag>(
  value: Apply<F, [A]>,
  effect: E
): MonadicValue<F, A, E> {
  return (attachPurityMarker as any)(value as any, effect) as any;
}

/**
 * Infer effect from monadic value
 */
export function inferEffect<F extends Kind1, A>(value: Apply<F, [A]>): EffectTag {
  if (hasPurityMarker(value as any)) {
    return (extractPurityMarker as any)(value as any) as EffectTag;
  }
  
  // Default effect inference based on type
  if (value && typeof value === 'object') {
    if ('subscribe' in (value as any)) return 'Async'; // ObservableLite
    if ('then' in (value as any)) return 'Async'; // Promise
    if ('run' in (value as any)) return 'IO'; // IO
    if ('execute' in (value as any)) return 'IO'; // Task
  }
  
  return 'Pure';
}

/**
 * Compose effects from multiple monadic values
 */
export function composeMonadicEffects<Effects extends readonly EffectTag[]>(
  effects: Effects
): ComposedEffect<Effects> {
  // Simplified runtime combiner: prefer 'Async' > 'IO' > 'Impure' > 'State' > 'Pure'
  const order: Record<EffectTag, number> = { Pure: 0, State: 1, Impure: 2, IO: 3, Async: 4 } as const;
  const result = effects.reduce<EffectTag>((acc, effect) =>
    (order[effect] > order[acc] ? effect : acc), 'Pure');
  return result as ComposedEffect<Effects>;
}

// ============================================================================
// Part 5: Legacy Compatibility (Looser Runtime Duck-Typed Version)
// ============================================================================

/**
 * Looser version: relies on .chain/.flatMap/.then existing at runtime
 * Note: This isn't fully generic and won't type-check strongly
 */
export function doMLoose<A>(
  gen: () => Generator<any, A, any>
): any {
  const it = gen();
  let lastYield: any;

  const step = (last?: any): any => {
    const r = it.next(last);
    if (r.done) {
      // Best effort: if lastYield has .of, use it; if it's a Promise-like, wrap; else return as-is
      if (lastYield && lastYield.constructor && lastYield.constructor.of) return lastYield.constructor.of(r.value);
      if (typeof Promise !== 'undefined') return Promise.resolve(r.value);
      return r.value;
    }
    lastYield = r.value;
    const mv = r.value;
    if (mv?.chain)   return mv.chain(step);
    if (mv?.flatMap) return mv.flatMap(step);
    if (mv?.then)    return mv.then(step);
    throw new Error('Yielded value is not chainable');
  };

  return step();
}

// ============================================================================
// Part 6: Utility Functions
// ============================================================================

/**
 * Check if a value has a chain method
 */
function hasChain(value: any): value is { chain: (f: (a: any) => any) => any } {
  return value && typeof value.chain === 'function';
}

/**
 * Check if a value has a flatMap method
 */
function hasFlatMap(value: any): value is { flatMap: (f: (a: any) => any) => any } {
  return value && typeof value.flatMap === 'function';
}

/**
 * Check if a value has a map method
 */
function hasMap(value: any): value is { map: (f: (a: any) => any) => any } {
  return value && typeof value.map === 'function';
}

/**
 * Check if a value has a then method (Promise-like)
 */
function hasThen(value: any): value is { then: (f: (a: any) => any) => any } {
  return value && typeof value.then === 'function';
}

// ============================================================================
// Part 7: Examples and Usage
// ============================================================================

/**
 * Example usage with Promise
 */
export function examplePromise(): Promise<number> {
  return doMPromise(function* () {
    const a: number = yield Promise.resolve(2);
    const b: number = yield Promise.resolve(10);
    return a + b; // <- lifted with M.of
  });
}

/**
 * Example usage with Either (when EitherMonad is available)
 */
export function exampleEither(): Apply<Fix2Right<EitherK, string>, [number]> {
  return doMEither<string, number>(function* () {
    const a: number = yield { right: 2 } as any;
    const b: number = yield { right: 3 } as any;
    return a + b;
  });
}

// All exports are already declared individually throughout the file 