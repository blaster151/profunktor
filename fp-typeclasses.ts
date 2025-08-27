// fp-typeclasses.ts

// Use the shared HKT encoding only.
import type { Kindish1 } from './fp-hkt';
import {
  Kind1, Kind2, Apply, ApplyLeft,
  ArrayK, TupleK, FunctionK, EitherK,
} from './fp-hkt';

// Re-export requested HKT symbols for downstream modules
export type { Kind1, Type, Apply } from './fp-hkt';

// ============================================================================
// Core Typeclass Definitions (Kind1/Kind2-based)
// ============================================================================



// ...existing code...


// Functor interface (Kind1)
export interface Functor<F extends Kindish1> {
  map<A, B>(fa: Apply<F, [A]>, f: (a: A) => B): Apply<F, [B]>;
}

export interface Applicative<F extends Kindish1> extends Functor<F> {
  of<A>(a: A): Apply<F, [A]>;
  ap<A, B>(fab: Apply<F, [(a: A) => B]>, fa: Apply<F, [A]>): Apply<F, [B]>;
}

export interface Monad<F extends Kindish1> extends Applicative<F> {
  chain<A, B>(fa: Apply<F, [A]>, f: (a: A) => Apply<F, [B]>): Apply<F, [B]>;
}

export interface Bifunctor<F extends Kind2> {
  bimap<A, B, C, D>(
    fab: Apply<F, [A, B]>,
    f: (a: A) => C,
    g: (b: B) => D
  ): Apply<F, [C, D]>;

  mapLeft<A, B, C>(fab: Apply<F, [A, B]>, f: (a: A) => C): Apply<F, [C, B]>;
  mapRight<A, B, D>(fab: Apply<F, [A, B]>, g: (b: B) => D): Apply<F, [A, D]>;
}

export interface Profunctor<F extends Kind2> {
  dimap<A, B, C, D>(
    p: Apply<F, [A, B]>,
    f: (c: C) => A,
    g: (b: B) => D
  ): Apply<F, [C, D]>;

  lmap<A, B, C>(p: Apply<F, [A, B]>, f: (c: C) => A): Apply<F, [C, B]>;
  rmap<A, B, D>(p: Apply<F, [A, B]>, g: (b: B) => D): Apply<F, [A, D]>;
}

// ============================================================================
// Instances
// ============================================================================

// Array (Kind1)
export const ArrayFunctor: Functor<ArrayK> = {
  map: (fa, f) => (fa as unknown as Array<any>).map(f) as any
};

export const ArrayApplicative: Applicative<ArrayK> = {
  ...ArrayFunctor,
  of: (a) => [a] as any,
  ap: (fab, fa) =>
    (fab as unknown as Array<(x: any) => any>)
      .flatMap(f => (fa as unknown as Array<any>).map(f)) as any
};

export const ArrayMonad: Monad<ArrayK> = {
  ...ArrayApplicative,
  chain: (fa, f) =>
    (fa as unknown as Array<any>).flatMap((a) => f(a) as unknown as Array<any>) as any
};


// Tuple (Kind2) - Bifunctor instance
export const TupleBifunctor = <L>() => ({
  bimap: (fab, f, g) => {
    const [a, b] = fab as unknown as [any, any];
    return [f(a), g(b)] as any;
  },
  mapLeft: (fab, f) => {
    const [a, b] = fab as unknown as [any, any];
    return [f(a), b] as any;
  },
  mapRight: (fab, g) => {
    const [a, b] = fab as unknown as [any, any];
    return [a, g(b)] as any;
  },
  __arity: 1
});

// Tuple (Kind2) with left fixed: Functor/Applicative/Monad for ApplyLeft<TupleK, L>
export const TupleFunctor = <L>() : Functor<ApplyLeft<TupleK, L>> => ({
  map: (fa, f) => {
    const [, b] = fa as [L, any];
    return [((fa as [L, any])[0]), f(b)] as any;
  }
});

export const TupleApplicative = <L>() : Applicative<ApplyLeft<TupleK, L>> => ({
  ...TupleFunctor<L>(),
  of: (b) => [undefined as any as L, b] as any, // L must be provided externally for lawful instance
  ap: (fab, fa) => {
    const [l, f] = fab as [L, (b: any) => any];
    const [, b] = fa as [L, any];
    return [l, f(b)] as any;
  }
});

export const TupleMonad = <L>() : Monad<ApplyLeft<TupleK, L>> => ({
  ...TupleApplicative<L>(),
  chain: (fa, f) => {
    const [l, b] = fa as [L, any];
    const [l2, c] = f(b) as [L, any];
    return [l, c] as any; // ignores l2, classic WriterT
  }
});


// Function (Kind2) - Profunctor instance
export const FunctionProfunctor = <L>() => ({
  dimap: <A, B, C, D>(p: (a: A) => B, f: (c: C) => A, g: (b: B) => D) => ((c: C) => g(p(f(c)))) as any,
  lmap: <A, B, C>(p: (a: A) => B, f: (c: C) => A) => ((c: C) => p(f(c))) as any,
  rmap: <A, B, D>(p: (a: A) => B, g: (b: B) => D) => ((a: A) => g(p(a))) as any,
  __arity: 1
});

// Function (Kind2) with left fixed: Functor/Applicative/Monad for ApplyLeft<FunctionK, L>
export const FunctionFunctor = <L>() : Functor<ApplyLeft<FunctionK, L>> => ({
  map: <A, B>(fa: (x: L) => A, f: (a: A) => B) => ((x: L) => f(fa(x))) as any
});

export const FunctionApplicative = <L>() : Applicative<ApplyLeft<FunctionK, L>> => ({
  ...FunctionFunctor<L>(),
  of: (b) => (_: L) => b,
  ap: (fab, fa) => (x: any) => (fab as any)(x)((fa as any)(x))
});

export const FunctionMonad = <L>() : Monad<ApplyLeft<FunctionK, L>> => ({
  ...FunctionApplicative<L>(),
  chain: (fa, f) => (x: any) => (f((fa as any)(x)) as any)(x)
});

// Maybe (tagged ADT – consistent with your other modules)
export type Maybe<A> = { tag: 'Just'; value: A } | { tag: 'Nothing' };
export const Just = <A>(a: A): Maybe<A> => ({ tag: 'Just', value: a });
export const Nothing = <A = never>(): Maybe<A> => ({ tag: 'Nothing' });

interface MaybeK extends Kind1 { readonly type: Maybe<this['arg0']>; }

export const MaybeFunctor: Functor<MaybeK> = {
  map: (fa, f) => (fa as Maybe<any>).tag === 'Just' ? Just(f((fa as any).value)) : fa as any
};

export const MaybeApplicative: Applicative<MaybeK> = {
  ...MaybeFunctor,
  of: Just,
  ap: (fab, fa) =>
    (fab as Maybe<(x: any) => any>).tag === 'Just' && (fa as Maybe<any>).tag === 'Just'
      ? Just((fab as any).value((fa as any).value))
      : Nothing()
};

export const MaybeMonad: Monad<MaybeK> = {
  ...MaybeApplicative,
  chain: (fa, f) => (fa as Maybe<any>).tag === 'Just' ? f((fa as any).value) : Nothing()
};

// Either (tagged ADT)
export type Either<L, R> = { tag: 'Left'; left: L } | { tag: 'Right'; right: R };
export const Left = <L, R = never>(l: L): Either<L, R> => ({ tag: 'Left', left: l });
export const Right = <R, L = never>(r: R): Either<L, R> => ({ tag: 'Right', right: r });



// Either (Kind2) - Bifunctor instance
export const EitherBifunctor = <L>() => ({
  bimap: <A, B, C, D>(e: Either<A, B>, f: (a: A) => C, g: (b: B) => D) =>
    e.tag === 'Left'
      ? Left(f(e.left))
      : Right(g(e.right)),
  mapLeft: <A, B, C>(e: Either<A, B>, f: (a: A) => C) =>
    e.tag === 'Left'
      ? Left(f(e.left))
      : e as any,
  mapRight: <A, B, D>(e: Either<A, B>, g: (b: B) => D) =>
    e.tag === 'Right'
      ? Right(g(e.right))
      : e as any,
  __arity: 1
});

// Either (Kind2) with left fixed: Functor/Applicative/Monad for ApplyLeft<EitherK, L>
export const EitherFunctor = <L>() : Functor<ApplyLeft<EitherK, L>> => ({
  map: (fa, f) => (fa as any).tag === 'Right' ? Right(f((fa as any).right)) : fa as any
});

export const EitherApplicative = <L>() : Applicative<ApplyLeft<EitherK, L>> => ({
  ...EitherFunctor<L>(),
  of: Right,
  ap: (fab, fa) => {
    if ((fab as any).tag === 'Left') return fab as any;
    if ((fa as any).tag === 'Left') return fa as any;
    // Both are Right
    return Right(((fab as any).right as (a: any) => any)((fa as any).right));
  }
});

export const EitherMonad = <L>() : Monad<ApplyLeft<EitherK, L>> => ({
  ...EitherApplicative<L>(),
  chain: (fa, f) => (fa as any).tag === 'Right' ? f((fa as any).right) : fa as any
});

// ============================================================================
// Generic helpers (renamed to avoid collisions with optics exports)
// ============================================================================

export function mapT<F extends Kind1, A, B>(
  F: Functor<F>,
  fa: Apply<F, [A]>,
  f: (a: A) => B
): Apply<F, [B]> {
  return F.map(fa, f);
}

export function liftT<F extends Kind1, A>(
  F: Applicative<F>,
  a: A
): Apply<F, [A]> {
  return F.of(a);
}

export function chainT<F extends Kind1, A, B>(
  F: Monad<F>,
  fa: Apply<F, [A]>,
  f: (a: A) => Apply<F, [B]>
): Apply<F, [B]> {
  return F.chain(fa, f);
}