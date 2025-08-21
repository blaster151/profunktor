/**
 * Maybe HKT Bridge Module
 * 
 * This module provides HKT-aware typeclass instances for Maybe that delegate
 * to raw methods, following the hybrid pattern:
 * - Raw types for user experience (fp-hkt.ts)
 * - HKT-aware interfaces for composition (this module)
 * - Bridge modules connect the two worlds
 */

import {
  Kind1, Apply, Type,
  MaybeK, Maybe
} from './fp-hkt';

import {
  Functor, Applicative, Monad, Traversable, Foldable,
  deriveFunctor, deriveApplicative, deriveMonad
} from './fp-typeclasses-hkt';

// ============================================================================
// Part 1: HKT Registration for Maybe
// ============================================================================

/**
 * HKT registration for Maybe
 * Note: This is already defined in fp-hkt.ts as MaybeK, but we provide
 * a consistent naming pattern here for bridge modules
 */
export interface MaybeHKT extends Kind1 {
  readonly type: Maybe<this['arg0']>;
}

/**
 * Type-safe HKT application for Maybe
 */
export type ApplyMaybe<A> = Apply<MaybeHKT, [A]>;

// ============================================================================
// Part 2: Typeclass Instances (Delegating to Raw Methods)
// ============================================================================

/**
 * Raw method implementations that delegate to Maybe's actual methods
 */
export const MaybeInstances = {
  map: <A, B>(fa: Apply<MaybeHKT, [A]>, f: (a: A) => B): Apply<MaybeHKT, [B]> => {
    const maybe = fa as Maybe<A>;
    if (maybe === null || maybe === undefined) {
      return maybe as Apply<MaybeHKT, [B]>;
    }
    return f(maybe) as Apply<MaybeHKT, [B]>;
  },
  
  of: <A>(a: A): Apply<MaybeHKT, [A]> => {
    return a as Apply<MaybeHKT, [A]>;
  },
  
  ap: <A, B>(fab: Apply<MaybeHKT, [(a: A) => B]>, fa: Apply<MaybeHKT, [A]>): Apply<MaybeHKT, [B]> => {
    const maybeFn = fab as Maybe<(a: A) => B>;
    const maybeA = fa as Maybe<A>;
    
    if (maybeFn === null || maybeFn === undefined || maybeA === null || maybeA === undefined) {
      return null as Apply<MaybeHKT, [B]>;
    }
    
    return maybeFn(maybeA) as Apply<MaybeHKT, [B]>;
  },
  
  chain: <A, B>(fa: Apply<MaybeHKT, [A]>, f: (a: A) => Apply<MaybeHKT, [B]>): Apply<MaybeHKT, [B]> => {
    const maybe = fa as Maybe<A>;
    if (maybe === null || maybe === undefined) {
      return maybe as Apply<MaybeHKT, [B]>;
    }
    return f(maybe) as Apply<MaybeHKT, [B]>;
  }
};

/**
 * Functor instance for MaybeHKT
 */
export const MaybeFunctor: Functor<MaybeHKT> = {
  map: MaybeInstances.map
};

/**
 * Applicative instance for MaybeHKT
 */
export const MaybeApplicative: Applicative<MaybeHKT> = {
  map: MaybeFunctor.map, // Reuse functor
  of: MaybeInstances.of,
  ap: MaybeInstances.ap
};

/**
 * Monad instance for MaybeHKT
 */
export const MaybeMonad: Monad<MaybeHKT> = {
  map: MaybeFunctor.map, // Reuse functor
  of: MaybeApplicative.of, // Reuse applicative
  ap: MaybeApplicative.ap, // Reuse applicative
  chain: MaybeInstances.chain
};

// ============================================================================
// Part 3: Foldable Instance
// ============================================================================

/**
 * Foldable instance for MaybeHKT
 */
export const MaybeFoldable: Foldable<MaybeHKT> = {
  foldr: <A, B>(fa: Apply<MaybeHKT, [A]>, f: (a: A, b: B) => B, z: B): B => {
    const maybe = fa as Maybe<A>;
    if (maybe === null || maybe === undefined) {
      return z;
    }
    return f(maybe, z);
  },
  
  foldl: <A, B>(fa: Apply<MaybeHKT, [A]>, f: (b: B, a: A) => B, z: B): B => {
    const maybe = fa as Maybe<A>;
    if (maybe === null || maybe === undefined) {
      return z;
    }
    return f(z, maybe);
  }
};

// ============================================================================
// Part 4: Traversable Instance
// ============================================================================

/**
 * Traversable instance for MaybeHKT
 */
export const MaybeTraversable: Traversable<MaybeHKT> = {
  ...MaybeFunctor,
  traverse: <G extends Kind1, A, B>(
    fa: Apply<MaybeHKT, [A]>,
    f: (a: A) => Apply<G, [B]>
  ): Apply<G, [Apply<MaybeHKT, [B]>]> => {
    const maybe = fa as Maybe<A>;
    if (maybe === null || maybe === undefined) {
      // Return G.of(null) - we need to lift null into the G context
      // This is a simplified implementation - in practice, you'd need
      // the Applicative instance for G to do this properly
      return null as Apply<G, [Apply<MaybeHKT, [B]>]>;
    }
    
    // Apply f to the value and map the result to wrap in Maybe
    const gb = f(maybe);
    // This is a simplified implementation - in practice, you'd need
    // to use the Applicative instance for G to lift the value
    return gb as Apply<G, [Apply<MaybeHKT, [B]>]>;
  }
};

// ============================================================================
// Part 5: Type-Safe FP Operations
// ============================================================================

/**
 * Type-safe map operation for MaybeHKT
 */
export function mapMaybe<A, B>(
  fa: Apply<MaybeHKT, [A]>,
  f: (a: A) => B
): Apply<MaybeHKT, [B]> {
  return MaybeFunctor.map(fa, f);
}

/**
 * Type-safe chain operation for MaybeHKT
 */
export function chainMaybe<A, B>(
  fa: Apply<MaybeHKT, [A]>,
  f: (a: A) => Apply<MaybeHKT, [B]>
): Apply<MaybeHKT, [B]> {
  return MaybeMonad.chain(fa, f);
}

/**
 * Type-safe ap operation for MaybeHKT
 */
export function apMaybe<A, B>(
  fab: Apply<MaybeHKT, [(a: A) => B]>,
  fa: Apply<MaybeHKT, [A]>
): Apply<MaybeHKT, [B]> {
  return MaybeApplicative.ap(fab, fa);
}

/**
 * Type-safe of operation for MaybeHKT
 */
export function ofMaybe<A>(a: A): Apply<MaybeHKT, [A]> {
  return MaybeApplicative.of(a);
}

// ============================================================================
// Part 6: Utility Functions
// ============================================================================

/**
 * Convert Maybe to array (for compatibility with other collections)
 */
export function maybeToArray<A>(maybe: Apply<MaybeHKT, [A]>): A[] {
  const m = maybe as Maybe<A>;
  if (m === null || m === undefined) {
    return [];
  }
  return [m];
}

/**
 * Convert array to Maybe (first element or null)
 */
export function arrayToMaybe<A>(array: A[]): Apply<MaybeHKT, [A]> {
  if (array.length === 0) {
    return null as Apply<MaybeHKT, [A]>;
  }
  return array[0] as Apply<MaybeHKT, [A]>;
}

/**
 * Safe getter with default value
 */
export function fromMaybe<A>(defaultValue: A, maybe: Apply<MaybeHKT, [A]>): A {
  const m = maybe as Maybe<A>;
  if (m === null || m === undefined) {
    return defaultValue;
  }
  return m;
}

/**
 * Maybe constructor that handles null/undefined
 */
export function just<A>(value: A): Apply<MaybeHKT, [A]> {
  return value as Apply<MaybeHKT, [A]>;
}

/**
 * Maybe constructor for null/undefined
 */
export function nothing<A>(): Apply<MaybeHKT, [A]> {
  return null as Apply<MaybeHKT, [A]>;
}

// ============================================================================
// Part 7: Laws and Properties
// ============================================================================

/**
 * Maybe HKT Bridge Laws:
 * 
 * 1. Delegation Law: All HKT operations delegate to raw methods
 * 2. Identity Law: map(fa, x => x) = fa
 * 3. Composition Law: map(map(fa, f), g) = map(fa, x => g(f(x)))
 * 4. Left Identity: chain(of(a), f) = f(a)
 * 5. Right Identity: chain(ma, of) = ma
 * 6. Associativity: chain(chain(ma, f), g) = chain(ma, x => chain(f(x), g))
 * 
 * Runtime Laws:
 * 
 * 1. Null Safety: Operations on null/undefined return null/undefined
 * 2. Value Preservation: Operations on values preserve the value structure
 * 3. Delegation: All operations delegate to raw Maybe methods
 * 
 * Type-Level Laws:
 * 
 * 1. HKT Law: Apply<MaybeHKT, [A]> = Maybe<A>
 * 2. Safety Law: All operations maintain type safety
 * 3. Bridge Law: HKT operations are zero-cost abstractions over raw methods
 */
