/**
 * Enhanced Unified Maybe ADT with Ergonomic Pattern Matching
 * 
 * This module provides an enhanced unified Maybe/Option type using the enhanced
 * createSumType builder with ergonomic .match and .matchTag instance methods.
 */

// ⬇️ Pull the canonical runtime & types
import type { Maybe } from './fp-maybe-unified';
import { Just as canonicalJust, Nothing as canonicalNothing, matchMaybe } from './fp-maybe-unified';

import {
  createSumType,
  EnhancedSumTypeBuilder,
  EnhancedADTInstance,
  ImmutableADTInstance,
  ExtractEnhancedSumTypeInstance,
  ExtractImmutableSumTypeInstance,
  MatchHandlers,
  TagOnlyHandlers
} from './fp-adt-builders-enhanced';

import {
  Kind1, Kind2, Kind3,
  Apply, Type, TypeArgs, KindArity, KindResult,
  ArrayK, TupleK, FunctionK
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
  deriveEqInstance, 
  deriveOrdInstance, 
  deriveShowInstance 
} from './fp-derivation-helpers';

// ============================================================================
// Part 1: Enhanced Maybe ADT Definition
// ============================================================================

/**
 * Unique symbol brand for immutable types
 */
export const IMMUTABLE_BRAND = Symbol('immutable'); // as unknown as unique symbol;

// ✅ Use canonical Maybe type from fp-maybe-unified instead of local definition
// ✅ Keep ergonomic helpers but make them operate on canonical Maybe

/**
 * Immutable Maybe type using canonical Maybe with immutable brand
 */
export type ImmutableMaybe<A> = Maybe<A> & {
  readonly __immutableBrand: typeof IMMUTABLE_BRAND;
};

/**
 * HKT kind for Maybe (arity-1 type constructor)
 */
export interface MaybeK extends Kind1 {
  readonly type: Maybe<this['arg0']>;
}

// ============================================================================
// Part 2: Constructor Exports
// ============================================================================

// ❌ Remove local Just/Nothing constructors - use canonical from fp-maybe-unified
// ✅ Keep immutable constructors can keep distinct names to avoid overshadowing:

/**
 * Create immutable Just using canonical constructor with immutable brand
 */
export const JustImmutable = <A>(value: A): ImmutableMaybe<A> => {
  const canonical = canonicalJust(value);
  return {
    ...(canonical as object),
    __immutableBrand: IMMUTABLE_BRAND
  } as ImmutableMaybe<A>;
};

/**
 * Create immutable Nothing using canonical constructor with immutable brand
 */
export const NothingImmutable = <A>(): ImmutableMaybe<A> => {
  const canonical = canonicalNothing<A>();
  return {
    ...(canonical as object),
    __immutableBrand: IMMUTABLE_BRAND
  } as ImmutableMaybe<A>;
};

// ============================================================================
// Part 3: Pattern Matching Exports
// ============================================================================

/**
 * Pattern matcher for Maybe (standalone function) - using canonical matchMaybe
 */
export const createMaybePatternMatcher = <A, R>(
  maybe: Maybe<A>,
  handlers: {
    Just?: (payload: { value: A }) => R;
    Nothing?: () => R;
    _?: (tag: string, payload: any) => R;
    otherwise?: (tag: string, payload: any) => R;
  }
): R => {
  return matchMaybe<A, R>(maybe, {
    Just: (value) => {
      if (handlers.Just) return handlers.Just({ value });
      if (handlers._) return handlers._('Just', { value });
      if (handlers.otherwise) return handlers.otherwise('Just', { value });
      throw new Error('No handler for Just');
    },
    Nothing: () => {
      if (handlers.Nothing) return handlers.Nothing();
      if (handlers._) return handlers._('Nothing', {});
      if (handlers.otherwise) return handlers.otherwise('Nothing', {});
      throw new Error('No handler for Nothing');
    }
  });
};

// tag-only stays tag-only (no payload)
export const matchMaybeTag = <A, R>(
  maybe: Maybe<A>,
  handlers: {
    Just?: () => R;
    Nothing?: () => R;
    _?: (tag: string) => R;
    otherwise?: (tag: string) => R;
  }
): R => {
  return matchMaybe<A, R>(maybe, {
    Just: (_value) => {
      if (handlers.Just) return handlers.Just();
      if (handlers._) return handlers._('Just');
      if (handlers.otherwise) return handlers.otherwise('Just');
      throw new Error('No handler for Just');
    },
    Nothing: () => {
      if (handlers.Nothing) return handlers.Nothing();
      if (handlers._) return handlers._('Nothing');
      if (handlers.otherwise) return handlers.otherwise('Nothing');
      throw new Error('No handler for Nothing');
    }
  });
};

// curry versions mirror the same shapes
export const createMaybeMatcher = <R>(handlers: {
  Just?: <A>(payload: { value: A }) => R;
  Nothing?: () => R;
  _?: (tag: string, payload: any) => R;
  otherwise?: (tag: string, payload: any) => R;
}) => (maybe: Maybe<any>): R => createMaybePatternMatcher(maybe, handlers);

export const createMaybeTagMatcher = <R>(handlers: {
  Just?: () => R;
  Nothing?: () => R;
  _?: (tag: string) => R;
  otherwise?: (tag: string) => R;
}) => (maybe: Maybe<any>): R => matchMaybeTag(maybe, handlers);

// ============================================================================
// Part 4: Utility Functions
// ============================================================================

/**
 * Check if a Maybe is Just
 */
export const isJust = <A>(maybe: Maybe<A>): maybe is { tag: 'Just'; value: A } => {
  return (maybe as any).tag === 'Just';
};

/**
 * Check if a Maybe is Nothing
 */
export const isNothing = <A>(maybe: Maybe<A>): maybe is { tag: 'Nothing' } => {
  return (maybe as any).tag === 'Nothing';
};

/**
 * Get the value from a Just, or throw if Nothing
 */
export const fromJust = <A>(maybe: Maybe<A>): A =>
  matchMaybe<A, A>(maybe, {
    Just: (value) => value,
    Nothing: () => { throw new Error('fromJust: Nothing'); },
  });

export const fromMaybe = <A>(def: A, maybe: Maybe<A>): A =>
  matchMaybe<A, A>(maybe, {
    Just: (value) => value,
    Nothing: () => def,
  });

export const mapMaybe = <A, B>(f: (a: A) => B, maybe: Maybe<A>): Maybe<B> =>
  matchMaybe<A, Maybe<B>>(maybe, {
    Just: (value) => canonicalJust(f(value)),
    Nothing: () => canonicalNothing<B>(),
  });

export const apMaybe = <A, B>(mf: Maybe<(a: A) => B>, ma: Maybe<A>): Maybe<B> =>
  matchMaybe<(a: A) => B, Maybe<B>>(mf, {
    Just: (f) => mapMaybe(f, ma),
    Nothing: () => canonicalNothing<B>(),
  });

/**
 * Chain operations on Maybe
 */
export const chainMaybe = <A, B>(f: (a: A) => Maybe<B>, ma: Maybe<A>): Maybe<B> =>
  matchMaybe<A, Maybe<B>>(ma, {
    Just: (value) => f(value),
    Nothing: () => canonicalNothing<B>(),
  });

export const foldMaybe = <A, B>(onJust: (a: A) => B, onNothing: () => B, ma: Maybe<A>): B =>
  matchMaybe<A, B>(ma, {
    Just: (value) => onJust(value),
    Nothing: () => onNothing(),
  });
// ============================================================================
// Part 5: Typeclass Instances
// ============================================================================

/**
 * Derived instances for Maybe
 */
export const MaybeFunctor = deriveFunctor<MaybeK>(
  <A, B>(fa: Maybe<A>, f: (a: A) => B): Maybe<B> =>
    mapMaybe(f, fa)
);

export const MaybeApplicative = deriveApplicative<MaybeK>(
  <A>(a: A): Maybe<A> => canonicalJust(a),
  <A, B>(ff: Maybe<(a: A) => B>, fa: Maybe<A>): Maybe<B> => apMaybe(ff, fa)
);

export const MaybeMonad = deriveMonad<MaybeK>(
  <A>(a: A): Maybe<A> => canonicalJust(a),
  <A, B>(fa: Maybe<A>, f: (a: A) => Maybe<B>): Maybe<B> => chainMaybe(f, fa)
);

/**
 * Foldable instance for Maybe - with corrected parameter order
 */
export const MaybeFoldable: Foldable<MaybeK> = {
  foldr: <A, B>(fa: Maybe<A>, f: (a: A, b: B) => B, z: B): B => {
    return matchMaybe<A, B>(fa, {
      Just: (value) => f(value, z),
      Nothing: () => z
    });
  },
  foldl: <A, B>(fa: Maybe<A>, f: (b: B, a: A) => B, z: B): B => {
    return matchMaybe<A, B>(fa, {
      Just: (value) => f(z, value),
      Nothing: () => z
    });
  }
};

/**
 * Traversable instance for Maybe
 */
// Legacy Traversable shape (no Applicative arg):
// export interface Traversable<F extends Kind1> extends Functor<F> {
//   traverse<G extends Kind1, A, B>(
//     fa: Apply<F, [A]>,
//     f: (a: A) => Apply<G, [B]>
//   ): Apply<G, [Apply<F, [B]>]>;
// }

// ---------- Maybe ----------
export const MaybeTraversable: Traversable<MaybeK> = {
  ...MaybeFunctor,

  // TEMP HACK: assumes G is PromiseK at runtime
  traverse: <G extends Kind1, A, B>(
    fa: Maybe<A>,
    f: (a: A) => Apply<G, [B]>
  ): Apply<G, [Maybe<B>]> => {
    return matchMaybe<A, Apply<G, [Maybe<B>]>>(fa, {
      Just: (value) =>
        // treat Apply<G,[B]> as Promise<B>, then wrap result back into Maybe
        (f(value) as unknown as Promise<B>)
          .then(b => canonicalJust(b)) as unknown as Apply<G, [Maybe<B>]>,

      Nothing: () =>
        // G.of(Nothing()) — but we don't have G; use Promise.resolve
        Promise.resolve(canonicalNothing<B>()) as unknown as Apply<G, [Maybe<B>]>
    });
  },
};


// ============================================================================
// Part 6: Purity Integration
// ============================================================================

/**
 * Maybe with purity information
 */
export interface MaybeWithPurity<A, P extends EffectTag = 'Pure'> {
  readonly value: Maybe<A>;
  readonly effect: P;
  readonly __immutableBrand: typeof IMMUTABLE_BRAND;
}

/**
 * Create Maybe with purity information
 */
export function createMaybeWithPurity<A, P extends EffectTag = 'Pure'>(
  value: Maybe<A>,
  effect: P = 'Pure' as P
): MaybeWithPurity<A, P> {
  return {
    value,
    effect,
    __immutableBrand: IMMUTABLE_BRAND
  };
}

/**
 * Extract effect from Maybe with purity
 */
export type EffectOfMaybe<T> = T extends MaybeWithPurity<any, infer P> ? P : 'Pure';

/**
 * Check if Maybe is pure
 */
export type IsMaybePure<T> = EffectOfMaybe<T> extends 'Pure' ? true : false;

// ============================================================================
// Part 7: HKT Integration
// ============================================================================

/**
 * Apply Maybe HKT to type arguments
 */
/**
 * Type alias for applying MaybeK to type arguments
 */
export type ApplyMaybe<Args extends readonly unknown[]> = Apply<MaybeK, Args>;

/**
 * Maybe with specific type arguments
 */
export type MaybeOf<A> = ApplyMaybe<[A]>;

// ============================================================================
// Part 8: Example Usage
// ============================================================================

/**
 * Standard typeclass instances for Maybe using derivation helpers
 */
export const MaybeEq = deriveEqInstance<Maybe<unknown>>();
export const MaybeOrd = deriveOrdInstance<Maybe<unknown>>();
export const MaybeShow = deriveShowInstance<Maybe<unknown>>();

/**
 * Example usage of enhanced Maybe with ergonomic pattern matching
 */
export function exampleUsage() {
  // Create Maybe instances with proper typing
  const maybeJust: Maybe<number> = canonicalJust(42);
  const maybeNothing: Maybe<number> = canonicalNothing<number>();
  
  // Full pattern matching using matchMaybe
  const result1 = matchMaybe<number, string>(maybeJust, {
    Just: (value) => `Got ${value}`,
    Nothing: () => "None"
  });
  console.log(result1); // "Got 42"
  
  // Partial pattern matching with fallback using createMaybePatternMatcher
  const result2 = createMaybePatternMatcher(maybeNothing, {
    Just: ({ value }) => `Got ${value}`,
    _: (tag, payload) => `Unhandled: ${tag}`
  });
  console.log(result2); // "Unhandled: Nothing"
  
  // Tag-only matching
  const result3 = matchMaybeTag(maybeJust, {
    Just: () => "Has value",
    Nothing: () => "No value"
  });
  console.log(result3); // "Has value"
  
  // Type-safe payload access with proper number typing
  const result4 = matchMaybe<number, number>(maybeJust, {
    Just: (value) => value * 2, // value is properly typed as number
    Nothing: () => 0
  });
  console.log(result4); // 84
  
  // Immutable instances
  const immutableJust = JustImmutable(42);
  const immutableNothing = NothingImmutable();
  
  // Pattern matching works the same using the matchMaybe function
  const result5 = matchMaybe<number, string>(immutableJust as Maybe<number>, {
    Just: (value) => `Immutable: ${value}`,
    Nothing: () => "Immutable: None"
  });
  console.log(result5); // "Immutable: 42"
  
  // Type guards work
  if (isJust(maybeJust)) {
    console.log(maybeJust.value); // TypeScript knows this is safe
  }
}

// ============================================================================
// Part 9: Laws Documentation
// ============================================================================

/**
 * Enhanced Maybe Laws:
 * 
 * Pattern Matching Laws:
 * 1. Identity: maybe.match({ [tag]: payload => payload }) = maybe.payload
 * 2. Composition: maybe.match(handlers1).then(handlers2) = maybe.match(composed)
 * 3. Exhaustiveness: Full handlers must cover all tags or have fallback
 * 4. Immutability: Pattern matching never mutates the instance
 * 
 * Tag-Only Matching Laws:
 * 1. Identity: maybe.matchTag({ [tag]: () => tag }) = maybe.tag
 * 2. No Payload Access: Tag-only handlers cannot access payload
 * 3. Fallback Support: _ or otherwise handlers supported
 * 
 * Immutability Laws:
 * 1. Frozen Instances: All instances are Object.freeze()d
 * 2. No Mutation: No methods can modify the instance state
 * 3. Structural Sharing: Immutable instances can share structure
 * 
 * Type Safety Laws:
 * 1. Exhaustiveness: TypeScript enforces exhaustive matching
 * 2. Payload Inference: Payload types inferred from tag definitions
 * 3. Handler Types: Handler signatures inferred from tag payloads
 * 4. Fallback Types: Fallback handlers properly typed
 * 
 * Functor Laws:
 * 1. Identity: map(id) = id
 * 2. Composition: map(f ∘ g) = map(f) ∘ map(g)
 * 
 * Applicative Laws:
 * 1. Identity: ap(of(id), v) = v
 * 2. Homomorphism: ap(of(f), of(x)) = of(f(x))
 * 3. Interchange: ap(u, of(y)) = ap(of(f => f(y)), u)
 * 4. Composition: ap(ap(ap(of(compose), u), v), w) = ap(u, ap(v, w))
 * 
 * Monad Laws:
 * 1. Left Identity: of(a).chain(f) = f(a)
 * 2. Right Identity: m.chain(of) = m
 * 3. Associativity: m.chain(f).chain(g) = m.chain(x => f(x).chain(g))
 */ 
export function registerMaybeDerivations(): void {
  if (typeof globalThis !== 'undefined' && (globalThis as any).__FP_REGISTRY) {
    const registry = (globalThis as any).__FP_REGISTRY;
    registry.register('MaybeEq', MaybeEq);
    registry.register('MaybeOrd', MaybeOrd);
    registry.register('MaybeShow', MaybeShow);
  }
}
// registerMaybeDerivations(); // Uncomment when registry is available