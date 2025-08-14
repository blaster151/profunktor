/**
 * Maybe ADT with Unified Fluent API
 * 
 * Provides a unified fluent API (.map, .chain, .filter, etc.) for Maybe,
 * enabling consistent operations across all FP types with seamless
 * conversion to other types.
 */

import { applyFluentOps, FluentImpl, toObservableLite, toStatefulStream, toEither, toResult } from './fp-fluent-api';

// ============================================================================
// Part 1: Maybe ADT Definition
// ============================================================================

/**
 * Maybe type - represents optional values
 */
export type Maybe<A> = Just<A> | Nothing<A>;

/**
 * Just constructor - represents a value
 */
export class Just<A> {
  readonly _tag = 'Just' as const;
  readonly value: A;

  constructor(value: A) {
    this.value = value;
  }

  /**
   * Pattern matching for Maybe
   */
  match<B>(patterns: { Just: (value: { value: A }) => B; Nothing: () => B }): B {
    return patterns.Just({ value: this.value });
  }

  /**
   * Get the value or throw an error
   */
  getOrElse(defaultValue: A): A {
    return this.value;
  }

  /**
   * Get the value or throw an error
   */
  getOrThrow(error?: string): A {
    return this.value;
  }

  /**
   * Check if this is a Just
   */
  isJust(): this is Just<A> {
    return true;
  }

  /**
   * Check if this is a Nothing
   */
  isNothing(): this is Nothing<A> {
    return false;
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    return `Just(${this.value})`;
  }
}

/**
 * Nothing constructor - represents absence of a value
 */
export class Nothing<A> {
  readonly _tag = 'Nothing' as const;

  /**
   * Pattern matching for Maybe
   */
  match<B>(patterns: { Just: (value: { value: A }) => B; Nothing: () => B }): B {
    return patterns.Nothing();
  }

  /**
   * Get the value or return default
   */
  getOrElse(defaultValue: A): A {
    return defaultValue;
  }

  /**
   * Get the value or throw an error
   */
  getOrThrow(error: string = 'Expected Just but got Nothing'): never {
    throw new Error(error);
  }

  /**
   * Check if this is a Just
   */
  isJust(): this is Just<A> {
    return false;
  }

  /**
   * Check if this is a Nothing
   */
  isNothing(): this is Nothing<A> {
    return true;
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    return 'Nothing';
  }
}

// ============================================================================
// Part 2: Maybe Constructors
// ============================================================================

/**
 * Create a Just value
 */
export function just<A>(value: A): Just<A> {
  return new Just(value);
}

/**
 * Create a Nothing value
 */
export function nothing<A>(): Nothing<A> {
  return new Nothing();
}

/**
 * Create a Maybe from a nullable value
 */
export function fromNullable<A>(value: A | null | undefined): Maybe<A> {
  return value == null ? nothing() : just(value);
}

/**
 * Create a Maybe from a predicate
 */
export function fromPredicate<A>(predicate: (value: A) => boolean, value: A): Maybe<A> {
  return predicate(value) ? just(value) : nothing();
}

// ============================================================================
// Part 3: Maybe Operations
// ============================================================================

/**
 * Map over a Maybe
 */
export function map<A, B>(f: (a: A) => B, ma: Maybe<A>): Maybe<B> {
  return ma.match<Maybe<B>>({
    Just: ({ value }: { value: A }) => just(f(value)),
    Nothing: (): Maybe<B> => nothing()
  });
}

/**
 * Chain/flatMap over a Maybe
 */
export function chain<A, B>(f: (a: A) => Maybe<B>, ma: Maybe<A>): Maybe<B> {
  return ma.match<Maybe<B>>({
    Just: ({ value }: { value: A }) => f(value),
    Nothing: (): Maybe<B> => nothing()
  });
}

/**
 * Filter a Maybe
 */
export function filter<A>(predicate: (a: A) => boolean, ma: Maybe<A>): Maybe<A> {
  return ma.match<Maybe<A>>({
    Just: ({ value }: { value: A }) => predicate(value) ? ma : nothing<A>(),
    Nothing: (): Maybe<A> => ma
  });
}

/**
 * Filter and map a Maybe
 */
export function filterMap<A, B>(f: (a: A) => Maybe<B>, ma: Maybe<A>): Maybe<B> {
  return ma.match<Maybe<B>>({
    Just: ({ value }: { value: A }) => f(value),
    Nothing: (): Maybe<B> => nothing()
  });
}

/**
 * Apply a Maybe function to a Maybe value
 */
export function ap<A, B>(fab: Maybe<(a: A) => B>, fa: Maybe<A>): Maybe<B> {
  return fab.match<Maybe<B>>({
    Just: ({ value: f }: { value: (a: A) => B }) => map(f, fa),
    Nothing: (): Maybe<B> => nothing()
  });
}

/**
 * Fold over a Maybe
 */
export function fold<A, B>(onNothing: () => B, onJust: (a: A) => B, ma: Maybe<A>): B {
  return ma.match({
    Just: ({ value }) => onJust(value),
    Nothing: () => onNothing()
  });
}

/**
 * Get value or default
 */
export function getOrElse<A>(defaultValue: A, ma: Maybe<A>): A {
  return ma.getOrElse(defaultValue);
}

/**
 * Alternative Maybe
 */
export function orElse<A>(alternative: Maybe<A>, ma: Maybe<A>): Maybe<A> {
  return ma.match({
    Just: () => ma,
    Nothing: () => alternative
  });
}

// ============================================================================
// Part 4: Maybe Typeclass Instances
// ============================================================================

/**
 * Maybe Functor instance
 */
export const MaybeFunctorInstance = {
  map: <A, B>(fa: Maybe<A>, f: (a: A) => B): Maybe<B> => map(f, fa)
};

/**
 * Maybe Applicative instance
 */
export const MaybeApplicativeInstance = {
  ...MaybeFunctorInstance,
  of: <A>(a: A): Maybe<A> => just(a),
  ap: <A, B>(fab: Maybe<(a: A) => B>, fa: Maybe<A>): Maybe<B> => ap(fab, fa)
};

/**
 * Maybe Monad instance
 */
export const MaybeMonadInstance = {
  ...MaybeApplicativeInstance,
  chain: <A, B>(fa: Maybe<A>, f: (a: A) => Maybe<B>): Maybe<B> => chain(f, fa)
};

// Fluent API integration removed for now; union type alias `Maybe` is a type, not a runtime value

// ============================================================================
// Part 6: Registration
// ============================================================================

/**
 * Register Maybe typeclass instances
 */
export function registerMaybeInstances(): void {
  if (typeof globalThis !== 'undefined' && (globalThis as any).__FP_REGISTRY) {
    const registry = (globalThis as any).__FP_REGISTRY;
    
    registry.register('MaybeFunctor', MaybeFunctorInstance);
    registry.register('MaybeApplicative', MaybeApplicativeInstance);
    registry.register('MaybeMonad', MaybeMonadInstance);
  }
}

// Auto-register instances
registerMaybeInstances(); 