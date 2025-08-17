// ============================================================================
// GADT Unified Recursion-Schemes API
// ============================================================================

/**
 * This module provides a unified, ergonomic API for recursion schemes
 * over GADTs with proper import aliasing to avoid conflicts.
 * 
 * All functions use consistent type parameter naming: <A, Seed, R>
 * - A: The inner type parameter for GADTs
 * - Seed: Initial value for anamorphisms  
 * - R: Result type (avoids 'Result' to prevent shadowing)
 */

// Import base types from GADT module
import {
  GADT,
  Expr, ExprK, MaybeGADT, MaybeGADTK, EitherGADT, EitherGADTK,
  Result as ResultGADT, ResultK
} from './fp-gadt-enhanced';

import {
  Fold as FoldBase,
  fold as foldBase,
  cataExpr as cataExprBase,
  cataExprRecursive as cataExprRecursiveBase,
  FoldExpr,
  cataMaybe as cataMaybeBase,
  FoldMaybe,
  cataEither as cataEitherBase,
  FoldEither,
  cataResult as cataResultBase,
  FoldResult,
} from './fp-catamorphisms';

import {
  Build,
  anaRecursive,
  anaMaybe as anaMaybeBase,
  anaEither as anaEitherBase,
  anaResult as anaResultBase,
} from './fp-anamorphisms';

import {
  hylo as hyloBase, hyloRecursive as hyloRecursiveBase,
  hyloExpr as hyloExprBase, hyloExprRecursive as hyloExprRecursiveBase,
  hyloMaybe as hyloMaybeBase, 
  hyloEither as hyloEitherBase, 
  hyloResult as hyloResultBase, 
  hyloList as hyloListBase
} from './fp-hylomorphisms';

import {
  Kind1, Kind2, Kind3,
  Apply, Type, TypeArgs, KindArity,
  ArrayK, MaybeK, EitherK, TupleK, FunctionK,
  Maybe, Either
} from './fp-hkt';

import {
  Functor, Applicative, Monad, Traversable,
  map, pure, bind, traverse,
  lift2, composeK, sequence
} from './fp-typeclasses-hkt';

// ============================================================================
// Unified Recursion-Schemes API
// ============================================================================

/**
 * Unified recursion-schemes API with aligned type parameters
 * All functions follow the pattern: <A, Seed, R> where applicable
 */

// ============================================================================
// Generic Recursion-Schemes Functions
// ============================================================================

/**
 * Generic catamorphism (fold) with aligned type parameters
 * @param value - The GADT value to fold over
 * @param algebra - The fold algebra
 * @returns The result of applying the algebra
 */
export function cata<A, Seed, R>(
  value: GADT<string, any>,
  algebra: FoldBase<GADT<string, any>, R>
): R {
  return foldBase(value, algebra);
}

/**
 * Generic anamorphism (unfold) with aligned type parameters
 * @param coalgebra - The unfold coalgebra function
 * @param seed - The initial seed
 * @returns The generated GADT
 */
export function ana<A, Seed, R>(
  coalgebra: (seed: Seed) => Build<GADT<string, any>, Seed>,
  seed: Seed
): GADT<string, any> {
  return anaRecursive(coalgebra)(seed);
}

/**
 * Generic hylomorphism with aligned type parameters
 * @param algebra - The fold algebra
 * @param coalgebra - The unfold coalgebra
 * @param seed - The initial seed
 * @returns The result of applying algebra to coalgebra-generated GADT
 */
export function hylo<A, Seed, R>(
  algebra: (g: GADT<string, any>) => R,
  coalgebra: (seed: Seed) => GADT<string, any>,
  seed: Seed
): R {
  return algebra(coalgebra(seed)); // cata ∘ ana without unsafe casts
}

// ============================================================================
// Ergonomic Wrappers for Each GADT Type
// ============================================================================

// ============================================================================
// Expr GADT Wrappers
// ============================================================================

/**
 * Catamorphism for Expr<A> with aligned type parameters
 */
export function cataExpr<A, Seed, R>(
  expr: Expr<A>,
  algebra: FoldExpr<A, R>
): R {
  return cataExprRecursiveBase(expr, algebra);
}

/**
 * Anamorphism for Expr<A> with aligned type parameters
 */
export function anaExpr<A, Seed, R>(
  coalgebra: (seed: Seed) => Build<Expr<A>, Seed>,
  seed: Seed
): Expr<A> {
  return anaRecursive(coalgebra)(seed) as Expr<A>;
}

/**
 * Hylomorphism for Expr<A> with aligned type parameters
 * Ensures type safety by using the specific Expr hylo function
 */
export function hyloExpr<A, Seed, R>(
  algebra: FoldExpr<A, R>,
  coalgebra: (seed: Seed) => Build<Expr<A>, Seed>,
  seed: Seed
): R {
  return hyloExprRecursiveBase(algebra, coalgebra, seed);
}

// ============================================================================
// MaybeGADT Wrappers
// ============================================================================

/**
 * Catamorphism for MaybeGADT<A> with aligned type parameters
 */
export function cataMaybe<A, Seed, R>(
  maybe: MaybeGADT<A>,
  algebra: FoldMaybe<A, R>
): R {
  return cataMaybeBase(maybe, algebra);
}

/**
 * Anamorphism for MaybeGADT<A> with aligned type parameters
 */
export function anaMaybe<A, Seed, R>(
  coalgebra: (seed: Seed) => Build<MaybeGADT<A>, Seed>,
  seed: Seed
): MaybeGADT<A> {
  return anaMaybeBase(coalgebra, seed);
}

/**
 * Hylomorphism for MaybeGADT<A> with aligned type parameters
 */
export function hyloMaybe<A, Seed, R>(
  algebra: FoldMaybe<A, R>,
  coalgebra: (seed: Seed) => Build<MaybeGADT<A>, Seed>,
  seed: Seed
): R {
  return hyloMaybeBase(algebra, coalgebra, seed);
}

// ============================================================================
// EitherGADT Wrappers
// ============================================================================

/**
 * Catamorphism for EitherGADT<L, R> with aligned type parameters
 */
export function cataEither<L, R_inner, Seed, R>(
  either: EitherGADT<L, R_inner>,
  algebra: FoldEither<L, R_inner, R>
): R {
  return cataEitherBase(either, algebra);
}

/**
 * Anamorphism for EitherGADT<L, R> with aligned type parameters
 */
export function anaEither<L, R_inner, Seed, R>(
  coalgebra: (seed: Seed) => Build<EitherGADT<L, R_inner>, Seed>,
  seed: Seed
): EitherGADT<L, R_inner> {
  return anaEitherBase(coalgebra, seed);
}

/**
 * Hylomorphism for EitherGADT<L, R> with aligned type parameters
 */
export function hyloEither<L, R_inner, Seed, R>(
  algebra: FoldEither<L, R_inner, R>,
  coalgebra: (seed: Seed) => Build<EitherGADT<L, R_inner>, Seed>,
  seed: Seed
): R {
  return hyloEitherBase(algebra, coalgebra, seed);
}

// ============================================================================
// Result GADT Wrappers
// ============================================================================

/**
 * Catamorphism for Result<A, E> with aligned type parameters
 */
export function cataResult<A, E, Seed, R>(
  result: ResultGADT<A, E>,
  algebra: FoldResult<A, E, R>
): R {
  return cataResultBase(result, algebra);
}

/**
 * Anamorphism for Result<A, E> with aligned type parameters
 */
export function anaResult<A, E, Seed, R>(
  coalgebra: (seed: Seed) => Build<ResultGADT<A, E>, Seed>,
  seed: Seed
): ResultGADT<A, E> {
  return anaResultBase(coalgebra, seed);
}

/**
 * Hylomorphism for Result<A, E> with aligned type parameters
 */
export function hyloResult<A, E, Seed, R>(
  algebra: FoldResult<A, E, R>,
  coalgebra: (seed: Seed) => Build<ResultGADT<A, E>, Seed>,
  seed: Seed
): R {
  return hyloResultBase(algebra, coalgebra, seed);
}

// ============================================================================
// List GADT Wrappers
// ============================================================================

/**
 * Catamorphism for ListGADT<A> with aligned type parameters
 */
export function cataList<A, Seed, R>(
  list: ListGADT<A>,
  algebra: { Nil: () => R; Cons: (head: A, tail: R) => R }
): R {
  return list.tag === 'Nil' 
    ? algebra.Nil()
    : algebra.Cons(list.head, cataList(list.tail, algebra));
}

/**
 * Anamorphism for ListGADT<A> with aligned type parameters
 */
export function anaList<A, Seed, R>(
  coalgebra: (seed: Seed) => Build<ListGADT<A>, Seed>,
  seed: Seed
): ListGADT<A> {
  return anaRecursive(coalgebra)(seed) as ListGADT<A>;
}

/**
 * Hylomorphism for ListGADT<A> with aligned type parameters
 */
export function hyloList<A, Seed, R>(
  algebra: { Nil: () => R; Cons: (head: A, tail: R) => R },
  coalgebra: (seed: Seed) => Build<ListGADT<A>, Seed>,
  seed: Seed
): R {
  return hyloListBase(algebra, coalgebra, seed);
}

// ============================================================================
// Convenience Objects for Each GADT Type
// ============================================================================

/**
 * Convenience object grouping all Expr recursion schemes
 */
export const exprRecSchemes = {
  cata: cataExpr,
  ana: anaExpr,
  hylo: hyloExpr
} as const;

/**
 * Convenience object grouping all MaybeGADT recursion schemes
 */
export const maybeRecSchemes = {
  cata: cataMaybe,
  ana: anaMaybe,
  hylo: hyloMaybe
} as const;

/**
 * Convenience object grouping all EitherGADT recursion schemes
 */
export const eitherRecSchemes = {
  cata: cataEither,
  ana: anaEither,
  hylo: hyloEither
} as const;

/**
 * Convenience object grouping all Result recursion schemes
 */
export const resultRecSchemes = {
  cata: cataResult,
  ana: anaResult,
  hylo: hyloResult
} as const;

/**
 * Convenience object grouping all ListGADT recursion schemes
 */
export const listRecSchemes = {
  cata: cataList,
  ana: anaList,
  hylo: hyloList
} as const;

// ============================================================================
// Global unified interface
// ============================================================================

/**
 * Main unified interface providing access to all recursion schemes
 */
export const recSchemes = {
  // Generic schemes
  cata,
  ana,
  hylo,
  
  // Type-specific schemes  
  expr: exprRecSchemes,
  maybe: maybeRecSchemes,
  either: eitherRecSchemes,
  result: resultRecSchemes,
  list: listRecSchemes
} as const;

// Export all types for convenience
export type {
  GADT, Expr, MaybeGADT, EitherGADT, ResultGADT, ListGADT,
  FoldBase, FoldExpr, FoldMaybe, FoldEither, FoldResult,
  Build
};
