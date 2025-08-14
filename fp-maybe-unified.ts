/**
 * Unified Maybe ADT using createSumType
 * 
 * This module provides a unified Maybe/Option type using the createSumType builder
 * with full integration with HKTs, purity tracking, and derivable instances.
 */

import {
  createSumType,
  SumTypeBuilder,
  ExtractSumTypeHKT,
  ExtractSumTypeInstance
} from './fp-adt-builders';

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
  deriveInstances, 
  deriveEqInstance, 
  deriveOrdInstance, 
  deriveShowInstance 
} from './fp-derivation-helpers';

// ============================================================================
// Part 1: Unified Maybe ADT Definition
// ============================================================================

/**
 * Create unified Maybe ADT with full integration
 */
export const MaybeUnified = createSumType({
  Just: <A>(value: A) => ({ value }),
  Nothing: () => ({})
}, {
  name: 'Maybe',
  effect: 'Pure',
  enableHKT: true,
  enableDerivableInstances: true,
  enableRuntimeMarkers: false,
  derive: ['Eq', 'Ord', 'Show']
});

/**
 * Extract the HKT kind from the unified Maybe
 */
export type MaybeUnifiedHKT = ExtractSumTypeHKT<typeof MaybeUnified>;

/**
 * Extract the instance type from the unified Maybe
 */
export type MaybeUnifiedInstance<A> = ExtractSumTypeInstance<typeof MaybeUnified>;

/**
 * Type alias for Maybe<A> using the unified definition
 */
export type Maybe<A> = MaybeUnifiedInstance<A>;

/**
 * HKT kind for Maybe (arity-1 type constructor)
 */
export interface MaybeK extends Kind1 {
  readonly type: Maybe<this['arg0']>;
}

// ============================================================================
// Part 2: Constructor Exports
// ============================================================================

/**
 * Just constructor for Maybe
 */
export const Just = <A>(value: A): Maybe<A> => {
  return MaybeUnified.constructors.Just(value) as Maybe<A>;
};

/**
 * Nothing constructor for Maybe
 */
export const Nothing = <A>(): Maybe<A> => {
  return MaybeUnified.constructors.Nothing() as Maybe<A>;
};

/**
 * Pattern matcher for Maybe
 */
export const matchMaybe = <A, R>(
  maybe: Maybe<A>,
  patterns: {
    Just: (value: A) => R;
    Nothing: () => R;
  }
): R => {
  return (MaybeUnified as any).matchValues(maybe as any, {
    Just: (v: unknown) => patterns.Just(v as A),
    Nothing: () => patterns.Nothing()
  });
};

/**
 * Curryable pattern matcher for Maybe
 */
export const createMaybeMatcher = <R>(
  patterns: {
    Just: <A>(value: A) => R;
    Nothing: () => R;
  }
) => (maybe: Maybe<any>): R => {
  return (MaybeUnified as any).matchValues(maybe as any, {
    Just: (v: unknown) => patterns.Just(v as any),
    Nothing: () => patterns.Nothing()
  });
};

// ============================================================================
// Part 3: Utility Functions
// ============================================================================

/**
 * Check if a Maybe is Just
 */
export const isJust = <A>(maybe: Maybe<A>): maybe is Maybe<A> & { tag: 'Just'; value: A } => {
  return MaybeUnified.isVariant(maybe as any, 'Just');
};

/**
 * Check if a Maybe is Nothing
 */
export const isNothing = <A>(maybe: Maybe<A>): maybe is Maybe<A> & { tag: 'Nothing' } => {
  return MaybeUnified.isVariant(maybe as any, 'Nothing');
};

/**
 * Get the value from a Just, or throw if Nothing
 */
export const fromJust = <A>(maybe: Maybe<A>): A => {
  return matchMaybe(maybe, {
    Just: (value: A) => value,
    Nothing: () => {
      throw new Error('fromJust: Nothing');
    }
  });
};

/**
 * Get the value from a Just, or return default if Nothing
 */
export const fromMaybe = <A>(defaultValue: A, maybe: Maybe<A>): A => {
  return matchMaybe(maybe, {
    Just: (value: A) => value,
    Nothing: () => defaultValue
  });
};

/**
 * Map over a Maybe
 */
export const mapMaybe = <A, B>(f: (a: A) => B, maybe: Maybe<A>): Maybe<B> => {
  return matchMaybe(maybe, {
    Just: (value: A) => Just(f(value)),
    Nothing: () => Nothing()
  });
};

/**
 * Apply a function in a Maybe to a value in a Maybe
 */
export const apMaybe = <A, B>(maybeF: Maybe<(a: A) => B>, maybeA: Maybe<A>): Maybe<B> => {
  return matchMaybe(maybeF, {
    Just: (f: (a: A) => B) => mapMaybe(f, maybeA),
    Nothing: () => Nothing()
  });
};

/**
 * Chain operations on Maybe
 */
export const chainMaybe = <A, B>(f: (a: A) => Maybe<B>, maybe: Maybe<A>): Maybe<B> => {
  return matchMaybe(maybe, {
    Just: (value: A) => f(value),
    Nothing: () => Nothing()
  });
};

/**
 * Fold over a Maybe
 */
export const foldMaybe = <A, B>(onJust: (a: A) => B, onNothing: () => B, maybe: Maybe<A>): B => {
  return matchMaybe(maybe, {
    Just: (value: A) => onJust(value),
    Nothing: () => onNothing()
  });
};

// ============================================================================
// Part 4: Typeclass Instances (Derived)
// ============================================================================

/**
 * Maybe derived instances
 */
export const MaybeInstances = deriveInstances({
  functor: true,
  applicative: true,
  monad: true,
  customMap: <A, B>(fa: Maybe<A>, f: (a: A) => B): Maybe<B> => 
    matchMaybe(fa, {
      Just: (value: A) => Just(f(value)),
      Nothing: () => Nothing()
    }),
  customChain: <A, B>(fa: Maybe<A>, f: (a: A) => Maybe<B>): Maybe<B> => 
    matchMaybe(fa, {
      Just: (value: A) => f(value),
      Nothing: () => Nothing()
    })
});

export const MaybeFunctor = MaybeInstances.functor;
export const MaybeApplicative = MaybeInstances.applicative;
export const MaybeMonad = MaybeInstances.monad;

/**
 * Maybe standard typeclass instances
 */
export const MaybeEq = deriveEqInstance({
  customEq: <A>(a: Maybe<A>, b: Maybe<A>): boolean => {
    return matchMaybe(a, {
      Just: aValue => matchMaybe(b, {
        Just: bValue => aValue === bValue,
        Nothing: () => false
      }),
      Nothing: () => matchMaybe(b, {
        Just: () => false,
        Nothing: () => true
      })
    });
  }
});

export const MaybeOrd = deriveOrdInstance({
  customOrd: <A>(a: Maybe<A>, b: Maybe<A>): number => {
    return matchMaybe(a, {
      Just: (aValue: A) => matchMaybe(b, {
        Just: (bValue: A) => {
          if (aValue < bValue) return -1;
          if (aValue > bValue) return 1;
          return 0;
        },
        Nothing: () => 1 // Just > Nothing
      }),
      Nothing: () => matchMaybe(b, {
        Just: () => -1, // Nothing < Just
        Nothing: () => 0
      })
    });
  }
});

export const MaybeShow = deriveShowInstance({
  customShow: <A>(a: Maybe<A>): string => 
    matchMaybe(a, {
      Just: value => `Just(${JSON.stringify(value)})`,
      Nothing: () => 'Nothing'
    })
});

/**
 * Foldable instance for Maybe (manual due to complexity)
 */
export const MaybeFoldable: Foldable<MaybeK> = {
  foldr: <A, B>(maybe: Maybe<A>, f: (a: A, b: B) => B, z: B): B => {
    return matchMaybe(maybe, {
      Just: (value: A) => f(value as A, z),
      Nothing: () => z
    });
  },
  foldl: <A, B>(maybe: Maybe<A>, f: (b: B, a: A) => B, z: B): B => {
    return matchMaybe(maybe, {
      Just: (value: A) => f(z, value as A),
      Nothing: () => z
    });
  }
};

/**
 * Traversable instance for Maybe (manual due to complexity)
 */
// Traversable instance omitted for now

// ============================================================================
// Part 5: Purity Integration
// ============================================================================

/**
 * Maybe with purity information
 */
export interface MaybeWithPurity<A, P extends EffectTag = 'Pure'> {
  readonly value: Maybe<A>;
  readonly effect: P;
  readonly __immutableBrand: symbol;
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
    __immutableBrand: Symbol()
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
// Part 6: HKT Integration
// ============================================================================

/**
 * Apply Maybe HKT to type arguments
 */
// Removed problematic HKT helper aliases; use `Maybe<A>` and `MaybeK` directly.

// ============================================================================
// Part 7: Laws Documentation
// ============================================================================

/**
 * Maybe Laws:
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
 * 
 * Purity Laws:
 * 1. Effect Consistency: Maybe defaults to Pure effect
 * 2. Runtime Marker Law: Runtime markers match compile-time effects
 * 3. Default Purity: Maybe types default to Pure unless explicitly configured
 * 
 * HKT Integration Laws:
 * 1. Kind Correctness: MaybeK is correctly typed as Kind1
 * 2. Apply Law: Apply<MaybeK, [A]> works correctly
 * 3. Typeclass Law: typeclasses work with MaybeK
 */ 