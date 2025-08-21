/**
 * Unified Either ADT using createSumType
 * 
 * This module provides a unified Either type using the createSumType builder
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
  ArrayK, TupleK, FunctionK, EitherK
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
// Part 1: Unified Either ADT Definition
// ============================================================================

/**
 * Create unified Either ADT with full integration
 */
export const EitherUnified = createSumType({
  Left: <L>(value: L) => ({ value }),
  Right: <R>(value: R) => ({ value })
}, {
  name: 'Either',
  effect: 'Pure',
  enableHKT: true,
  enableDerivableInstances: true,
  enableRuntimeMarkers: false,
  derive: ['Eq', 'Ord', 'Show']
});

/**
 * Extract the HKT kind from the unified Either
 */
export type EitherUnifiedHKT = ExtractSumTypeHKT<typeof EitherUnified>;

/**
 * Extract the instance type from the unified Either
 */
export type EitherUnifiedInstance<L, R> = ExtractSumTypeInstance<typeof EitherUnified>;

/**
 * Type alias for Either<L, R> using the unified definition
 */
export type Either<L, R> = EitherUnifiedInstance<L, R>;

/**
 * HKT kind for Either (arity-2 type constructor)
 */
// Kind symbol centralized in fp-hkt

// ============================================================================
// Part 2: Constructor Exports
// ============================================================================

/**
 * Left constructor for Either
 */
export const Left = <L>(value: L): Either<L, never> => {
  return EitherUnified.constructors.Left(value) as Either<L, never>;
};

/**
 * Right constructor for Either
 */
export const Right = <R>(value: R): Either<never, R> => {
  return EitherUnified.constructors.Right(value) as Either<never, R>;
};

/**
 * Pattern matcher for Either
 */
export const matchEither = <L, R, T>(
  either: Either<L, R>,
  patterns: {
    Left: (value: L) => T;
    Right: (value: R) => T;
  }
): T => {
  return (EitherUnified as any).matchValues(either as any, {
    Left: (v: unknown) => patterns.Left(v as L),
    Right: (v: unknown) => patterns.Right(v as R)
  });
};

/**
 * Curryable pattern matcher for Either
 */
export const createEitherMatcher = <T>(
  patterns: {
    Left: <L>(value: L) => T;
    Right: <R>(value: R) => T;
  }
) => (either: Either<any, any>): T => {
  return (EitherUnified as any).matchValues(either as any, {
    Left: (v: unknown) => patterns.Left(v as any),
    Right: (v: unknown) => patterns.Right(v as any)
  });
};

// ============================================================================
// Part 3: Utility Functions
// ============================================================================

/**
 * Check if an Either is Left
 */
export const isLeft = <L, R>(either: Either<L, R>): either is Either<L, R> & { tag: 'Left'; value: L } => {
  return EitherUnified.isVariant(either as any, 'Left');
};

/**
 * Check if an Either is Right
 */
export const isRight = <L, R>(either: Either<L, R>): either is Either<L, R> & { tag: 'Right'; value: R } => {
  return EitherUnified.isVariant(either as any, 'Right');
};

/**
 * Get the value from a Right, or throw if Left
 */
export const fromRight = <L, R>(either: Either<L, R>): R => {
  return matchEither(either, {
    Left: (value: L) => {
      throw new Error(`fromRight: Left(${value})`);
    },
    Right: (value: R) => value
  });
};

/**
 * Get the value from a Left, or throw if Right
 */
export const fromLeft = <L, R>(either: Either<L, R>): L => {
  return matchEither(either, {
    Left: (value: L) => value,
    Right: (value: R) => {
      throw new Error(`fromLeft: Right(${value})`);
    }
  });
};

/**
 * Get the value from a Right, or return default if Left
 */
export const fromEither = <L, R>(defaultValue: R, either: Either<L, R>): R => {
  return matchEither(either, {
    Left: () => defaultValue,
    Right: (value: R) => value
  });
};

/**
 * Map over the Right value of an Either
 */
export const mapEither = <L, R, S>(f: (r: R) => S, either: Either<L, R>): Either<L, S> => {
  return matchEither(either, {
    Left: (value: L) => Left(value),
    Right: (value: R) => Right(f(value))
  });
};

/**
 * Map over the Left value of an Either
 */
export const mapLeft = <L, R, M>(f: (l: L) => M, either: Either<L, R>): Either<M, R> => {
  return matchEither(either, {
    Left: (value: L) => Left(f(value)),
    Right: (value: R) => Right(value)
  });
};

/**
 * Bimap over both sides of an Either
 */
export const bimapEither = <L, R, M, S>(
  f: (l: L) => M,
  g: (r: R) => S,
  either: Either<L, R>
): Either<M, S> => {
  return matchEither(either, {
    Left: (value: L) => Left(f(value)),
    Right: (value: R) => Right(g(value))
  });
};

/**
 * Apply a function in an Either to a value in an Either
 */
export const apEither = <L, R, S>(
  eitherF: Either<L, (r: R) => S>,
  eitherA: Either<L, R>
): Either<L, S> => {
  return matchEither(eitherF, {
    Left: (value: L) => Left(value),
    Right: (f: (r: R) => S) => mapEither(f, eitherA)
  });
};

/**
 * Chain operations on Either
 */
export const chainEither = <L, R, S>(
  f: (r: R) => Either<L, S>,
  either: Either<L, R>
): Either<L, S> => {
  return matchEither(either, {
    Left: (value: L) => Left(value),
    Right: (value: R) => f(value)
  });
};

/**
 * Fold over an Either
 */
export const foldEither = <L, R, T>(
  onLeft: (l: L) => T,
  onRight: (r: R) => T,
  either: Either<L, R>
): T => {
  return matchEither(either, {
    Left: (value: L) => onLeft(value),
    Right: (value: R) => onRight(value)
  });
};

/**
 * Swap the sides of an Either
 */
export const swapEither = <L, R>(either: Either<L, R>): Either<R, L> => {
  return matchEither(either, {
    Left: (value: L) => Right(value),
    Right: (value: R) => Left(value)
  });
};

// ============================================================================
// Part 4: Typeclass Instances (Derived)
// ============================================================================

/**
 * Either derived instances
 */
export const EitherInstances = deriveInstances({
  functor: true,
  applicative: true,
  monad: true,
  bifunctor: true,
  customMap: <L, R, S>(fa: Either<L, R>, f: (r: R) => S): Either<L, S> => 
    matchEither(fa, {
      Left: (value: L) => Left(value),
      Right: (value: R) => Right(f(value))
    }),
  customChain: <L, R, S>(fa: Either<L, R>, f: (r: R) => Either<L, S>): Either<L, S> => 
    matchEither(fa, {
      Left: (value: L) => Left(value),
      Right: (value: R) => f(value)
    }),
  customBimap: <L, R, M, S>(
    fab: Either<L, R>,
    f: (l: L) => M,
    g: (r: R) => S
  ): Either<M, S> => 
    matchEither(fab, {
      Left: (value: L) => Left(f(value)),
      Right: (value: R) => Right(g(value))
    })
});

export const EitherFunctor = EitherInstances.functor;
export const EitherApplicative = EitherInstances.applicative;
export const EitherMonad = EitherInstances.monad;
export const EitherBifunctor = EitherInstances.bifunctor;

/**
 * Either standard typeclass instances
 */
export const EitherEq = deriveEqInstance({
  customEq: <L, R>(a: Either<L, R>, b: Either<L, R>): boolean => {
    return matchEither(a, {
      Left: aValue => matchEither(b, {
        Left: bValue => aValue === bValue,
        Right: () => false
      }),
      Right: aValue => matchEither(b, {
        Left: () => false,
        Right: bValue => aValue === bValue
      })
    });
  }
});

export const EitherOrd = deriveOrdInstance({
  customOrd: <L, R>(a: Either<L, R>, b: Either<L, R>): number => {
    return matchEither(a, {
      Left: (aValue: L) => matchEither(b, {
        Left: (bValue: L) => {
          const av: any = aValue as any;
          const bv: any = bValue as any;
          if (av < bv) return -1;
          if (av > bv) return 1;
          return 0;
        },
        Right: () => -1 // Left < Right
      }),
      Right: (aValue: R) => matchEither(b, {
        Left: () => 1, // Right > Left
        Right: (bValue: R) => {
          const av: any = aValue as any;
          const bv: any = bValue as any;
          if (av < bv) return -1;
          if (av > bv) return 1;
          return 0;
        }
      })
    });
  }
});

export const EitherShow = deriveShowInstance({
  customShow: <L, R>(a: Either<L, R>): string => 
    matchEither(a, {
      Left: value => `Left(${JSON.stringify(value)})`,
      Right: value => `Right(${JSON.stringify(value)})`
    })
});

/**
 * Foldable instance for Either (manual due to complexity)
 */
// Foldable instance omitted for now

/**
 * Traversable instance for Either (manual due to complexity)
 */
// Traversable instance omitted for now

// ============================================================================
// Part 5: Purity Integration
// ============================================================================

/**
 * Either with purity information
 */
export interface EitherWithPurity<L, R, P extends EffectTag = 'Pure'> {
  readonly value: Either<L, R>;
  readonly effect: P;
  readonly __immutableBrand: symbol;
}

/**
 * Create Either with purity information
 */
export function createEitherWithPurity<L, R, P extends EffectTag = 'Pure'>(
  value: Either<L, R>,
  effect: P = 'Pure' as P
): EitherWithPurity<L, R, P> {
  return {
    value,
    effect,
    __immutableBrand: Symbol()
  };
}

/**
 * Extract effect from Either with purity
 */
export type EffectOfEither<T> = T extends EitherWithPurity<any, any, infer P> ? P : 'Pure';

/**
 * Check if Either is pure
 */
export type IsEitherPure<T> = EffectOfEither<T> extends 'Pure' ? true : false;

// ============================================================================
// Part 6: HKT Integration
// ============================================================================

/**
 * Apply Either HKT to type arguments
 */
// Removed problematic HKT helper aliases; use `Either<L, R>` and `EitherK` directly.

// ============================================================================
// Part 7: Laws Documentation
// ============================================================================

/**
 * Either Laws:
 * 
 * Functor Laws:
 * 1. Identity: map(id) = id
 * 2. Composition: map(f ∘ g) = map(f) ∘ map(g)
 * 
 * Bifunctor Laws:
 * 1. Identity: bimap(id, id) = id
 * 2. Composition: bimap(f ∘ h, g ∘ i) = bimap(f, g) ∘ bimap(h, i)
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
 * 1. Effect Consistency: Either defaults to Pure effect
 * 2. Runtime Marker Law: Runtime markers match compile-time effects
 * 3. Default Purity: Either types default to Pure unless explicitly configured
 * 
 * HKT Integration Laws:
 * 1. Kind Correctness: EitherK is correctly typed as Kind2
 * 2. Apply Law: Apply<EitherK, [L, R]> works correctly
 * 3. Typeclass Law: typeclasses work with EitherK
 */ 

// ============================================================================
// Part 8: Additional Exports
// ============================================================================

export const mapLeftEither = mapLeft;

export const getOrElse = <L, R>(onLeft: (l: L) => R, either: Either<L, R>): R =>
  matchEither(either, {
    Left: (l: L) => onLeft(l),
    Right: (r: R) => r
  });

export type { EitherK } from './fp-hkt';