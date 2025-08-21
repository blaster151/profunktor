// Accept both legacy Kind1 and new KindType (kindArity: 1)
export type Kindish1 = Kind1 | { kindArity: 1 };
// Export utility types and interfaces for external use
// ...existing code...
// Projectwide arity-bridges for Kind2 bifunctors

// Forward declaration for Kind to allow its use in utility types
// (actual definition is below)
interface Kind<Args extends readonly Type[]> {
  readonly type: Type;
}
import { __KindBrand, __HKIn, __HKOut } from './kind-branding';
import type { Functor, Monad } from './fp-typeclasses';
import { getTypeclassInstance } from './fp-registry-init';

/**
 * Given a binary kind F and fixed L, return Functor<ApplyLeft<F, L>>
 */
export function getFunctorForKind2<F extends Kind2, L>(typeName: string): Functor<ApplyLeft<F, L>> {
  return getTypeclassInstance(typeName, 'Functor') as Functor<ApplyLeft<F, L>>;
}

/**
 * Given a binary kind F and fixed L, return Monad<ApplyLeft<F, L>>
 */
export function getMonadForKind2<F extends Kind2, L>(typeName: string): Monad<ApplyLeft<F, L>> {
  return getTypeclassInstance(typeName, 'Monad') as Monad<ApplyLeft<F, L>>;
}
/**
 * Higher-Kinded Types (HKTs) for TypeScript
 * 
 * This module provides the foundational utilities for treating type constructors
 * as first-class values, enabling type-safe higher-order type operations.
 * 
 * Enhanced with Higher-Order Kinds (HOKs) support for representing functions
 * from one kind to another.
 */

// ============================================================================
// Core HKT System
// ============================================================================

/**
 * Base type for HKT system
 */
export type Type = unknown;

// BEGIN PATCH: normalize helpers to Apply

// A small helper to express "list of types" in our arity-dispatch world.
export type TypeArgs = readonly Type[];

// Arity helper: 1|2|3, inferred by the number of args the ADT expects.
// You likely already have this; keep the existing export name/signature if so.
export type KindArity = 1 | 2 | 3;

// Generic arity extractor
export type ArityOf<F> = F extends Kind3 ? 3 : F extends Kind2 ? 2 : 1;

// Map (F, Args) -> F applied to Args. This is now just Apply.
export type KindResult<F extends Kind<any>, Args extends TypeArgs> = Apply<F, Args>;

// END PATCH

/**
 * Type-level application: plug Args into F's slots and read `type`
 */

// BEGIN PATCH: precise Apply for Kind1/2/3 by arity
// Apply detects new kind path by kindArity, otherwise falls back to legacy slot encoding
export type Apply<F, Args extends readonly Type[]> =
  F extends { kindArity: number }
    // Avoid importing TS-internal kind factory during library builds; treat as opaque application.
    ? unknown
    : F extends { type: unknown }
      ? (
          Args extends [infer A]
            ? (F & { arg0: A })['type']
            : Args extends [infer A, infer B]
              ? (F & { arg0: A; arg1: B })['type']
              : Args extends [infer A, infer B, infer C]
                ? (F & { arg0: A; arg1: B; arg2: C })['type']
                : Args extends [infer A, infer B, infer C, ...infer Rest]
                  ? (F & { arg0: A; arg1: B; arg2: C } & Record<`arg${number}`, unknown>)['type']
                  : never
        )
      : never;
// END PATCH
// END PATCH

// ============================================================================
// Data Type Definitions
// ============================================================================

/**
 * Maybe/Option type - represents optional values
 */
export type Maybe<A> = A | null | undefined;

/**
 * Either type - represents values that can be one of two types
 */
export type Either<L, R> = { left: L } | { right: R };

/**
 * Result ADT (Ok | Err) as a type alias (type-level only)
 */
export type Result<T, E> =
  | { readonly tag: 'Ok';  readonly value: T }
  | { readonly tag: 'Err'; readonly error: E };

/**
 * List type - represents sequences of values
 */
export type List<A> = A[];

/**
 * Reader type - represents computations that depend on an environment
 */
export type Reader<E, A> = (e: E) => A;

/**
 * Writer type - represents computations that produce a value and a log
 */
export type Writer<A, W> = [A, W];

/**
 * State type - represents stateful computations
 */
export type State<S, A> = (s: S) => [A, S];

// ============================================================================
// Higher-Order Kinds (HOKs) Support
// ============================================================================

/**
 * KindAny - represents a kind of any arity
 * This is the base type for Higher-Order Kinds
 */
export interface KindAny extends Kind<readonly Type[]> {
  readonly type: Type;
}

/**
 * Kind1Any - represents a unary kind (for compatibility)
 */
export interface Kind1Any extends KindAny {
  readonly arg0: Type;
}

/**
 * Kind2Any - represents a binary kind (for compatibility)
 */
export interface Kind2Any extends KindAny {
  readonly arg0: Type;
  readonly arg1: Type;
}

/**
 * HigherKind - nominally brands domain/codomain kinds for safe composition
 */
export interface HigherKind<In extends KindAny, Out extends KindAny> {
  readonly [__HKIn]: In;
  readonly [__HKOut]: Out;
  readonly __input?: In;
  readonly __output?: Out;
  readonly type: Type;
}

export type HKInput<F extends HigherKind<any, any>> = F[typeof __HKIn];
export type HKOutput<F extends HigherKind<any, any>> = F[typeof __HKOut];

export interface ComposeHOK<
  F extends HigherKind<any, any>,
  G extends HigherKind<HKOutput<F>, any>
> extends HigherKind<HKInput<F>, HKOutput<G>> {
  readonly __composed: [F, G];
}

type EnsureComposable<F extends HigherKind<any, any>, G extends HigherKind<any, any>> =
  HKOutput<F> extends HKInput<G> ? unknown : ["HOK composition mismatch", { left: HKOutput<F> }, { right: HKInput<G> }];

export type Compose<F extends HigherKind<any, any>, G extends HigherKind<any, any>> =
  EnsureComposable<F, G> & ComposeHOK<F, G>;

export type ApplyHigherKind<F extends HigherKind<any, any>, Args extends readonly Type[]> = 
  F extends HigherKind<infer In, infer Out> 
    ? In extends Kind<Args> 
      ? Out 
      : never 
    : never;

export type IsKindCompatible<F extends KindAny, G extends KindAny> = 
  F extends Kind<infer ArgsF> 
    ? G extends Kind<infer ArgsG> 
      ? ArgsF['length'] extends ArgsG['length'] 
        ? true 
        : false 
      : false 
    : false;

export type IsHigherKindCompatible<F extends HigherKind<any, any>, In extends KindAny> =
  IsKindCompatible<HKInput<F>, In>;

export interface IdentityHOK<In extends KindAny> extends HigherKind<In, In> {
  readonly __identity: true;
}

export interface ConstHOK<In extends KindAny, Out extends KindAny> extends HigherKind<In, Out> {
  readonly __const: Out;
}

// ============================================================================
// Kind Shorthands for Common Arities
// ============================================================================

export interface Kind1 extends Kind<[Type]> {
  readonly arg0: Type;
  readonly type: Type;
}

export interface Kind2 extends Kind<[Type, Type]> {
  readonly arg0: Type;
  readonly arg1: Type;
  readonly type: Type;
}

export interface Kind3 extends Kind<[Type, Type, Type]> {
  readonly arg0: Type;
  readonly arg1: Type;
  readonly arg2: Type;
  readonly type: Type;
}

// ============================================================================
// Variance Tags and Kind Metadata
// ============================================================================

export type VarianceTag = 'Out' | 'In' | 'Phantom' | 'Invariant';

export type Out = { readonly _v: 'Out' };
export type In = { readonly _v: 'In' };
export type Ph = { readonly _v: 'Phantom' };
export type Iv = { readonly _v: 'Invariant' };

export interface KindInfo {
  readonly arity: number;
  readonly variance: ReadonlyArray<VarianceTag>;
}

export type VarianceOf<F extends Kind<any>> =
  F extends ArrayK | MaybeK | PromiseK | SetK | ListK | ObservableLiteK
    ? ['Out']
    : F extends FunctionK
      ? ['In', 'Out']
      : F extends ReaderK
        ? ['In', 'Out']
        : F extends WriterK
          ? ['Out', 'Out']
          : F extends StateK
            ? ['In', 'Out']
            : F extends EitherK | TupleK | TaskEitherK
              ? ['Out', 'Out']
              : F extends MapK
                ? ['Invariant', 'Out']
                : F extends Kind<infer Args>
                  ? { [K in keyof Args]: 'Invariant' } & ReadonlyArray<VarianceTag>
                  : ReadonlyArray<VarianceTag>;

export type RequireCovariantLast<F extends Kind<any>> =
  VarianceOf<F> extends [...infer _Init, infer Last]
    ? Last extends 'Out' ? F : never
    : never;

export type RequireContravariantFirst<F extends Kind<any>> =
  VarianceOf<F> extends [infer First, ...infer _Rest]
    ? First extends 'In' ? F : never
    : never;

export type ExtractTailVarianceOf<F extends Kind<any>> =
  VarianceOf<F> extends [any, ...infer Tail] ? Tail : [];

export type ExtractHeadVarianceOf<F extends Kind<any>> =
  VarianceOf<F> extends [infer Head, ...any[]] ? Head : never;

// ============================================================================
// Higher-Order Kind Shorthands
// ============================================================================

export interface HOK1<In extends Kind1, Out extends Kind1> extends HigherKind<In, Out> {
  readonly __arity: 1;
}

export interface HOK2<In extends Kind2, Out extends Kind2> extends HigherKind<In, Out> {
  readonly __arity: 2;
}

export interface HOK1to2<In extends Kind1, Out extends Kind2> extends HigherKind<In, Out> {
  readonly __arity: '1to2';
}

export interface HOK2to1<In extends Kind2, Out extends Kind1> extends HigherKind<In, Out> {
  readonly __arity: '2to1';
}

// ============================================================================
// Partial Application Helpers for Higher Arity Kinds
// ============================================================================

export interface Fix2Left<F extends Kind2, E> extends Kind1 {
  readonly type: Apply<F, [E, this['arg0']]>;
}

export interface Fix2Right<F extends Kind2, A> extends Kind1 {
  readonly type: Apply<F, [this['arg0'], A]>;
}

export interface CurryKind2<F extends Kind2> extends Kind1 {
  readonly type: {
    <E>(): { new <A>(): Apply<F, [E, A]> };
  };
}

export type UncurryKind2<F extends Kind2, E, A> = Apply<F, [E, A]>;
export type ApplyLeft<F extends Kind2, E> = Fix2Left<F, E>;
export type ApplyRight<F extends Kind2, A> = Fix2Right<F, A>;

export interface Flip2<F extends Kind2> extends Kind2 {
  readonly type: Apply<F, [this['arg1'], this['arg0']]>;
}
export type Flip<F extends Kind2> = Flip2<F>;

export interface Fix3Left<F extends Kind3, A> extends Kind2 {
  readonly type: Apply<F, [A, this['arg0'], this['arg1']]>
}

export interface Fix3Mid<F extends Kind3, B> extends Kind2 {
  readonly type: Apply<F, [this['arg0'], B, this['arg1']]>
}

export interface Fix3Right<F extends Kind3, C> extends Kind2 {
  readonly type: Apply<F, [this['arg0'], this['arg1'], C]>;
}

export interface Apply12<F extends Kind3, A, B> extends Kind1 {
  readonly type: Apply<F, [A, B, this['arg0']]>
}

export interface Apply23<F extends Kind3, B, C> extends Kind1 {
  readonly type: Apply<F, [this['arg0'], B, C]>;
}

export interface Apply13<F extends Kind3, A, C> extends Kind1 {
  readonly type: Apply<F, [A, this['arg0'], C]>;
}

// ============================================================================
// MapArgs: map argument(s) through a unary kind before applying `F`
// ============================================================================

export interface MapArg1<F extends Kind1, M extends Kind1> extends Kind1 {
  readonly type: Apply<F, [Apply<M, [this['arg0']]>]>;
}

export interface MapArg2Left<F extends Kind2, ML extends Kind1> extends Kind2 {
  readonly type: Apply<F, [Apply<ML, [this['arg0']]> , this['arg1']]>;
}

export interface MapArg2Right<F extends Kind2, MR extends Kind1> extends Kind2 {
  readonly type: Apply<F, [this['arg0'], Apply<MR, [this['arg1']]>]>;
}

export interface MapArgs2<F extends Kind2, ML extends Kind1, MR extends Kind1> extends Kind2 {
  readonly type: Apply<F, [Apply<ML, [this['arg0']]> , Apply<MR, [this['arg1']]>]>;
}

type _SameLen<A extends readonly any[], B extends readonly any[]> =
  A['length'] extends B['length'] ? (B['length'] extends A['length'] ? true : false) : false;

type _VarianceOK<FV extends VarianceTag, GV extends VarianceTag> =
  GV extends 'Out' ? (FV extends 'Out' | 'Invariant' | 'Phantom' ? true : false)
  : GV extends 'In' ? (FV extends 'In' | 'Invariant' | 'Phantom' ? true : false)
  : GV extends 'Invariant' ? (FV extends 'Invariant' ? true : false)
  : true;

type _ZipVarianceOK<FV extends readonly VarianceTag[], GV extends readonly VarianceTag[]> =
  FV extends readonly [infer F0, ...infer FRest]
    ? GV extends readonly [infer G0, ...infer GRest]
      ? _VarianceOK<Extract<F0, VarianceTag>, Extract<G0, VarianceTag>> extends true
        ? _ZipVarianceOK<Extract<FRest, readonly VarianceTag[]>, Extract<GRest, readonly VarianceTag[]>>
        : false
      : false
    : true;

export type IsSubkind<F extends KindAny, G extends KindAny> =
  _SameLen<VarianceOf<F>, VarianceOf<G>> extends true
    ? _ZipVarianceOK<VarianceOf<F>, VarianceOf<G>>
    : false;

export type NT<F extends Kind1, G extends Kind1> =
  <A>(fa: Apply<F, [A]>) => Apply<G, [A]>;

export type NT2<F extends Kind2, G extends Kind2> =
  <E, A>(fa: Apply<F, [E, A]>) => Apply<G, [E, A]>;

export type NT2Left<F extends Kind2, G extends Kind2, E> =
  <A>(fa: Apply<F, [E, A]>) => Apply<G, [E, A]>;

export type NT2Right<F extends Kind2, G extends Kind2, A> =
  <E>(fa: Apply<F, [E, A]>) => Apply<G, [E, A]>;

export interface ComposeK1<F extends Kind1, G extends Kind1> extends Kind1 {
  readonly type: Apply<G, [Apply<F, [this['arg0']]>]>;
}

export interface ComposeK2Left<F extends Kind1, G extends Kind2> extends Kind2 {
  readonly type: Apply<G, [Apply<F, [this['arg0']]> , this['arg1']]>;
}

export interface ComposeK2Right<F extends Kind1, G extends Kind2> extends Kind2 {
  readonly type: Apply<G, [this['arg0'], Apply<F, [this['arg1']]>]>;
}

export interface ArrayK extends Kind1 {
  readonly type: Array<this['arg0']>;
}

export interface MaybeK extends Kind1 {
  readonly type: Maybe<this['arg0']>;
}

export interface EitherK extends Kind2 {
  readonly type: Either<this['arg0'], this['arg1']>;
}

export interface ResultK extends Kind2 {
  readonly type: Result<this['arg0'], this['arg1']>;
}

export interface TupleK extends Kind2 {
  readonly type: [this['arg0'], this['arg1']];
}

export interface FunctionK extends Kind2 {
  readonly tag: 'FunctionK';
  readonly type: (arg: this['arg0']) => this['arg1'];
}

export interface KleisliK<M extends Kind1> extends Kind2 {
  readonly tag: 'KleisliK';
  readonly monad: M;
  readonly type: (a: this['arg0']) => Apply<M, [this['arg1']]>;
}

export interface PromiseK extends Kind1 {
  readonly type: Promise<this['arg0']>;
}

export interface SetK extends Kind1 {
  readonly type: Set<this['arg0']>;
}

export interface MapK extends Kind2 {
  readonly type: Map<this['arg0'], this['arg1']>;
}

export interface ListK extends Kind1 {
  readonly type: List<this['arg0']>;
}

export interface ReaderK extends Kind2 {
  readonly type: Reader<this['arg0'], this['arg1']>;
}

export interface WriterK extends Kind2 {
  readonly type: Writer<this['arg0'], this['arg1']>;
}

export interface StateK extends Kind2 {
  readonly type: State<this['arg0'], this['arg1']>;
}

export interface IOK extends Kind1 {
  readonly type: any;
}

export interface TaskK extends Kind1 {
  readonly type: any;
}

export interface ObservableLiteK extends Kind1 {
  readonly type: any;
  readonly __effect: 'Async';
}

export interface TaskEitherK extends Kind2 {
  readonly type: any;
  readonly __effect: 'Async';
}

export type { EitherRightK, ResultOkK } from './fp-hkt-either-result-kinds';

export const ARRAY_K_ID = 'ArrayK' as const;
export const MAYBE_K_ID = 'MaybeK' as const;
export const EITHER_K_ID = 'EitherK' as const;
export const TUPLE_K_ID = 'TupleK' as const;
export const LIST_GADT_K_ID = 'ListGADTK' as const;
export const MAYBE_GADT_K_ID = 'MaybeGADTK' as const;
export const EITHER_GADT_K_ID = 'EitherGADTK' as const;
export const PERSISTENT_LIST_K_ID = 'PersistentListK' as const;
export const PERSISTENT_MAP_K_ID = 'PersistentMapK' as const;
export const PERSISTENT_SET_K_ID = 'PersistentSetK' as const;
export const OBSERVABLE_LITE_K_ID = 'ObservableLiteK' as const;
export const TASK_EITHER_K_ID = 'TaskEitherK' as const;

export interface Phantom<T> {
  readonly __phantom: T;
}

export interface KindWithPhantom<Args extends readonly Type[], PhantomType> extends Kind<Args> {
  readonly __phantom: PhantomType;
}

export type IsKind1<F extends Kind<any>> = F extends Kind1 ? true : false;
export type IsKind2<F extends Kind<any>> = F extends Kind2 ? true : false;
export type IsKind3<F extends Kind<any>> = F extends Kind3 ? true : false;
export type FirstArg<F extends Kind<any>> = F extends Kind<[infer A, ...any[]]> ? A : never;
export type SecondArg<F extends Kind<any>> = F extends Kind<[any, infer B, ...any[]]> ? B : never;
export type ThirdArg<F extends Kind<any>> = F extends Kind<[any, any, infer C, ...any[]]> ? C : never;

export function isTypeConstructor(value: any): boolean {
  return typeof value === 'function' && value.prototype && value.prototype.constructor === value;
}

export function hasArity(constructor: any, expectedArity: number): boolean {
  if (!isTypeConstructor(constructor)) return false;
  const source = constructor.toString();
  const typeParamMatch = source.match(/<[^>]*>/);
  if (!typeParamMatch) return expectedArity === 0;
  const typeParams = typeParamMatch[0].slice(1, -1).split(',').length;
  return typeParams === expectedArity;
}

// ============================================================================
// Documentation and Examples
// ============================================================================

/**
 * Example usage:
 *
 * // ...existing code...
 */

// ============================================================================
// Laws and Properties
// ============================================================================

/**
 * HKT Laws:
 *
 * 1. Identity: Apply<F, [A]> should be well-formed for any valid F and A
 * 2. Composition: Apply<Compose<F, G>, [A]> = Apply<F, [Apply<G, [A]>]>
 * 3. Naturality: Nat<F, G> should preserve structure
 *
 * Kind Laws:
 *
 * 1. Kind1: Takes exactly one type argument
 * 2. Kind2: Takes exactly two type arguments
 * 3. Kind3: Takes exactly three type arguments
 *
 * Apply Laws:
 *
 * 1. Apply<F, Args> should be a concrete type when F is a valid kind and Args match
 * 2. Apply should be distributive over composition
 * 3. Apply should preserve kind arity
 */

/**
 * HKT Laws:
 *
 * 1. Identity: Apply<F, [A]> should be well-formed for any valid F and A
 * 2. Composition: Apply<Compose<F, G>, [A]> = Apply<F, [Apply<G, [A]>]>
 * 3. Naturality: Nat<F, G> should preserve structure
 *
 * Kind Laws:
 *
 * 1. Kind1: Takes exactly one type argument
 * 2. Kind2: Takes exactly two type arguments
 * 3. Kind3: Takes exactly three type arguments
 *
 * Apply Laws:
 *
 * 1. Apply<F, Args> should be a concrete type when F is a valid kind and Args match
 * 2. Apply should be distributive over composition
 * 3. Apply should preserve kind arity
 */

export interface IdK extends Kind1 {
  readonly type: this['arg0'];
}

export interface Lift1<F extends Kind1> extends HOK1<Kind1, Kind1>  { readonly [__HKOut]: F; }
export interface Lift2<F extends Kind2> extends HOK2<Kind2, Kind2>  { readonly [__HKOut]: F; }
// (You can add Lift3 similarly if you need it.)