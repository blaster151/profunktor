/**
 * Functional Programming Typeclasses with Higher-Kinded Types (HKTs)
 * 
 * This module provides typeclass definitions and instances using the HKT system
 * for type-safe higher-order type operations.
 */

import {
  Kind1, Kind2, Kind3,
  Apply, Type, TypeArgs, KindArity,
  ArrayK, MaybeK, EitherK, TupleK, FunctionK, PromiseK, SetK, MapK, ListK,
  ReaderK, WriterK, StateK,
  Maybe, Either, List, Reader, Writer, State,
  RequireCovariantLast
} from './fp-hkt';

import { attachPurityMarker } from './fp-purity';

// ============================================================================
// Core Typeclass Definitions
// ============================================================================

/**
 * Functor - represents types that can be mapped over
 * 
 * Laws:
 * 1. Identity: map(fa, x => x) = fa
 * 2. Composition: map(fa, f) |> map(_, g) = map(fa, x => g(f(x)))
 */
export interface Functor<F extends RequireCovariantLast<Kind1>> {
  map<A, B>(fa: Apply<F, [A]>, f: (a: A) => B): Apply<F, [B]>;
}

/**
 * Applicative - represents types that can lift values and apply functions
 * 
 * Laws:
 * 1. Identity: ap(pure(x => x), v) = v
 * 2. Homomorphism: ap(pure(f), pure(x)) = pure(f(x))
 * 3. Interchange: ap(u, pure(y)) = ap(pure(f => f(y)), u)
 * 4. Composition: ap(ap(ap(pure(f => g => x => f(g(x))), u), v), w) = ap(u, ap(v, w))
 */
export interface Applicative<F extends RequireCovariantLast<Kind1>> extends Functor<F> {
  of<A>(a: A): Apply<F, [A]>;
  ap<A, B>(fab: Apply<F, [(a: A) => B]>, fa: Apply<F, [A]>): Apply<F, [B]>;
}

/**
 * Monad - represents types that can sequence computations
 * 
 * Laws:
 * 1. Left Identity: chain(of(a), f) = f(a)
 * 2. Right Identity: chain(ma, of) = ma
 * 3. Associativity: chain(chain(ma, f), g) = chain(ma, x => chain(f(x), g))
 */
export interface Monad<F extends RequireCovariantLast<Kind1>> extends Applicative<F> {
  chain<A, B>(fa: Apply<F, [A]>, f: (a: A) => Apply<F, [B]>): Apply<F, [B]>;
}

/**
 * Bifunctor - represents types with two type parameters that can be mapped over
 * 
 * Laws:
 * 1. Identity: bimap(fa, x => x, y => y) = fa
 * 2. Composition: bimap(bimap(fa, f1, g1), f2, g2) = bimap(fa, x => f2(f1(x)), y => g2(g1(y)))
 */
export interface Bifunctor<F extends Kind2> {
  bimap<A, B, C, D>(
    fab: Apply<F, [A, B]>,
    f: (a: A) => C,
    g: (b: B) => D
  ): Apply<F, [C, D]>;
  
  mapLeft<A, B, C>(fab: Apply<F, [A, B]>, f: (a: A) => C): Apply<F, [C, B]>;
  mapRight<A, B, D>(fab: Apply<F, [A, B]>, g: (b: B) => D): Apply<F, [A, D]>;
}

/**
 * Profunctor - represents types that are contravariant in first parameter, covariant in second
 * 
 * Laws:
 * 1. Identity: dimap(p, x => x, y => y) = p
 * 2. Composition: dimap(dimap(p, f1, g1), f2, g2) = dimap(p, x => f1(f2(x)), y => g2(g1(y)))
 */
export interface Profunctor<F extends Kind2> {
  dimap<A, B, C, D>(
    p: Apply<F, [A, B]>,
    f: (c: C) => A,
    g: (b: B) => D
  ): Apply<F, [C, D]>;
  
  lmap<A, B, C>(p: Apply<F, [A, B]>, f: (c: C) => A): Apply<F, [C, B]>;
  rmap<A, B, D>(p: Apply<F, [A, B]>, g: (b: B) => D): Apply<F, [A, D]>;
}

/**
 * Traversable - represents types that can be traversed with an Applicative
 * 
 * Laws:
 * 1. Naturality: t(traverse(fa, f)) = traverse(t(fa), t(f))
 * 2. Identity: traverse(fa, of) = of(fa)
 * 3. Composition: traverse(fa, x => compose(f, g)) = compose(traverse(fa, f), traverse(fa, g))
 */
export interface Traversable<F extends Kind1> extends Functor<F> {
  traverse<G extends Kind1, A, B>(
    fa: Apply<F, [A]>,
    f: (a: A) => Apply<G, [B]>
  ): Apply<G, [Apply<F, [B]>]>;
}

/**
 * Foldable - represents types that can be folded
 * 
 * Laws:
 * 1. foldr(f, z, xs) = foldl((acc, x) => f(x, acc), z, reverse(xs))
 * 2. foldl(f, z, xs) = foldr((x, acc) => f(acc, x), z, reverse(xs))
 */
export interface Foldable<F extends Kind1> {
  foldr<A, B>(fa: Apply<F, [A]>, f: (a: A, b: B) => B, z: B): B;
  foldl<A, B>(fa: Apply<F, [A]>, f: (b: B, a: A) => B, z: B): B;
}

// ============================================================================
// Derived Instances
// ============================================================================

import { 
  deriveInstances, 
  deriveEqInstance, 
  deriveOrdInstance, 
  deriveShowInstance 
} from './fp-derivation-helpers';

/**
 * Array derived instances
 */
export const ArrayInstances = deriveInstances({
  functor: true,
  applicative: true,
  monad: true,
  customMap: <A, B>(fa: Array<A>, f: (a: A) => B): Array<B> => fa.map(f),
  customChain: <A, B>(fa: Array<A>, f: (a: A) => Array<B>): Array<B> => fa.flatMap(f)
});
attachPurityMarker(ArrayInstances, 'Pure');

export const ArrayFunctor = ArrayInstances.functor;
export const ArrayApplicative = ArrayInstances.applicative;
export const ArrayMonad = ArrayInstances.monad;

/**
 * Array Traversable instance (manual due to complexity)
 */
export const ArrayTraversable: Traversable<ArrayK> = {
  ...ArrayFunctor!,
  traverse: <G extends Kind1, A, B>(
    fa: Array<A>,
    f: (a: A) => Apply<G, [B]>
  ): Apply<G, [Array<B>]> => {
    // This is a simplified implementation
    // In practice, we'd need the Applicative instance for G
    return fa.map(f) as any;
  }
};

/**
 * Array Foldable instance (manual due to complexity)
 */
export const ArrayFoldable: Foldable<ArrayK> = {
  foldr: <A, B>(fa: Array<A>, f: (a: A, b: B) => B, z: B): B => 
    fa.reduceRight((acc, a) => f(a, acc), z),
  foldl: <A, B>(fa: Array<A>, f: (b: B, a: A) => B, z: B): B => 
    fa.reduce(f, z)
};

/**
 * Array standard typeclass instances
 */
export const ArrayEq = deriveEqInstance({
  customEq: <A>(a: Array<A>, b: Array<A>): boolean => {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => val === b[idx]);
  }
});

export const ArrayOrd = deriveOrdInstance({
  customOrd: <A>(a: Array<A>, b: Array<A>): number => {
    const minLength = Math.min(a.length, b.length);
    for (let i = 0; i < minLength; i++) {
      if (a[i] < b[i]) return -1;
      if (a[i] > b[i]) return 1;
    }
    return a.length - b.length;
  }
});

export const ArrayShow = deriveShowInstance({
  customShow: <A>(a: Array<A>): string => `[${a.map(x => JSON.stringify(x)).join(', ')}]`
});

/**
 * Maybe derived instances
 */
export const MaybeInstances = deriveInstances({
  functor: true,
  applicative: true,
  monad: true,
  customMap: <A, B>(fa: Maybe<A>, f: (a: A) => B): Maybe<B> => 
    fa === null || fa === undefined ? (fa as unknown as Maybe<B>) : f(fa),
  customChain: <A, B>(fa: Maybe<A>, f: (a: A) => Maybe<B>): Maybe<B> => 
    fa === null || fa === undefined ? (fa as unknown as Maybe<B>) : f(fa)
});

export const MaybeFunctor = MaybeInstances.functor;
export const MaybeApplicative = MaybeInstances.applicative;
export const MaybeMonad = MaybeInstances.monad;

/**
 * Maybe standard typeclass instances
 */
export const MaybeEq = deriveEqInstance({
  customEq: <A>(a: Maybe<A>, b: Maybe<A>): boolean => {
    if (a === null && b === null) return true;
    if (a === undefined && b === undefined) return true;
    if (a === null || a === undefined || b === null || b === undefined) return false;
    return a === b;
  }
});

export const MaybeOrd = deriveOrdInstance({
  customOrd: <A>(a: Maybe<A>, b: Maybe<A>): number => {
    if (a === null && b === null) return 0;
    if (a === null) return -1;
    if (b === null) return 1;
    if (a === undefined && b === undefined) return 0;
    if (a === undefined) return -1;
    if (b === undefined) return 1;
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }
});

export const MaybeShow = deriveShowInstance({
  customShow: <A>(a: Maybe<A>): string => 
    a === null || a === undefined ? 'Nothing' : `Just(${JSON.stringify(a)})`
});

/**
 * Either derived instances
 */
export const EitherInstances = deriveInstances({
  bifunctor: true,
  customBimap: <A, B, C, D>(
    fab: Either<A, B>,
    f: (a: A) => C,
    g: (b: B) => D
  ): Either<C, D> => 
    'left' in fab ? { left: f(fab.left) } : { right: g(fab.right) }
});

export const EitherBifunctor = EitherInstances.bifunctor;

/**
 * Either standard typeclass instances
 */
export const EitherEq = deriveEqInstance({
  customEq: <A, B>(a: Either<A, B>, b: Either<A, B>): boolean => {
    if ('left' in a && 'left' in b) return a.left === b.left;
    if ('right' in a && 'right' in b) return a.right === b.right;
    return false;
  }
});

export const EitherOrd = deriveOrdInstance({
  customOrd: <A, B>(a: Either<A, B>, b: Either<A, B>): number => {
    if ('left' in a && 'left' in b) {
      if (a.left < b.left) return -1;
      if (a.left > b.left) return 1;
      return 0;
    }
    if ('right' in a && 'right' in b) {
      if (a.right < b.right) return -1;
      if (a.right > b.right) return 1;
      return 0;
    }
    return 'left' in a ? -1 : 1;
  }
});

export const EitherShow = deriveShowInstance({
  customShow: <A, B>(a: Either<A, B>): string => 
    'left' in a ? `Left(${JSON.stringify(a.left)})` : `Right(${JSON.stringify(a.right)})`
});

/**
 * Tuple derived instances
 */
export const TupleInstances = deriveInstances({
  bifunctor: true,
  customBimap: <A, B, C, D>(
    fab: [A, B],
    f: (a: A) => C,
    g: (b: B) => D
  ): [C, D] => [f(fab[0]), g(fab[1])]
});

export const TupleBifunctor = TupleInstances.bifunctor;

/**
 * Tuple standard typeclass instances
 */
export const TupleEq = deriveEqInstance({
  customEq: <A, B>(a: [A, B], b: [A, B]): boolean => 
    a[0] === b[0] && a[1] === b[1]
});

export const TupleOrd = deriveOrdInstance({
  customOrd: <A, B>(a: [A, B], b: [A, B]): number => {
    const first = a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
    if (first !== 0) return first;
    return a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0;
  }
});

export const TupleShow = deriveShowInstance({
  customShow: <A, B>(a: [A, B]): string => 
    `(${JSON.stringify(a[0])}, ${JSON.stringify(a[1])})`
});

/**
 * Function Profunctor instance (kept manual due to complexity)
 */
export const FunctionProfunctor: Profunctor<FunctionK> = {
  dimap: <A, B, C, D>(
    p: (a: A) => B,
    f: (c: C) => A,
    g: (b: B) => D
  ): (c: C) => D => 
    (c: C) => g(p(f(c))),
  
  lmap: <A, B, C>(p: (a: A) => B, f: (c: C) => A): (c: C) => B => 
    (c: C) => p(f(c)),
  
  rmap: <A, B, D>(p: (a: A) => B, g: (b: B) => D): (a: A) => D =>
    (a: A) => g(p(a))
};


// =============================================================================
// PromiseK instances
// =============================================================================

export const PromiseFunctor: Functor<PromiseK> = {
  map: <A, B>(fa: Promise<A>, f: (a: A) => B): Promise<B> => fa.then(f)
};

// Sequential (lawful w.r.t. Monad) Applicative
export const PromiseApplicativeSeq: Applicative<PromiseK> = {
  ...PromiseFunctor,
  of: <A>(a: A): Promise<A> => Promise.resolve(a),
  ap: <A, B>(pfab: Promise<(a: A) => B>, pfa: Promise<A>): Promise<B> =>
    pfab.then(f => pfa.then(a => f(a)))
};

// Parallel Applicative (not coherent with the Monad; useful for `traverse`)
export const PromiseApplicativePar: Applicative<PromiseK> = {
  ...PromiseFunctor,
  of: <A>(a: A): Promise<A> => Promise.resolve(a),
  ap: <A, B>(pfab: Promise<(a: A) => B>, pfa: Promise<A>): Promise<B> =>
    Promise.all([pfab, pfa]).then(([f, a]) => f(a))
};

export const PromiseMonad: Monad<PromiseK> = {
  ...PromiseApplicativeSeq,
  chain: <A, B>(fa: Promise<A>, f: (a: A) => Promise<B>): Promise<B> =>
    fa.then(f)
};


// =============================================================================
/** Fix the environment of ReaderK to get a unary HKT: ReaderFix<R>[A] = Reader<R, A> */
export interface ReaderFix<R> extends Kind1 {
  readonly type: Apply<ReaderK, [R, this['arg0']]>;
}

// Instances parameterized by R
export const ReaderFunctor = <R>(): Functor<ReaderFix<R>> => ({
  map: <A, B>(fa: (r: R) => A, f: (a: A) => B): (r: R) => B =>
    (r: R) => f(fa(r))
});

export const ReaderApplicative = <R>(): Applicative<ReaderFix<R>> => ({
  ...ReaderFunctor<R>(),
  of: <A>(a: A): ((r: R) => A) => (_r: R) => a,
  ap: <A, B>(ff: (r: R) => (a: A) => B, fa: (r: R) => A): (r: R) => B =>
    (r: R) => ff(r)(fa(r))
});

export const ReaderMonad = <R>(): Monad<ReaderFix<R>> => ({
  ...ReaderApplicative<R>(),
  chain: <A, B>(fa: (r: R) => A, f: (a: A) => (r: R) => B): (r: R) => B =>
    (r: R) => f(fa(r))(r)
});

// Reader helpers
export const ask = <R>(): ((r: R) => R) => (r: R) => r;
export const asks = <R, A>(f: (r: R) => A): ((r: R) => A) => (r: R) => f(r);
/** Modify the environment for a sub-computation */
export const local = <R>(modify: (r: R) => R) =>
  <A>(ma: (r: R) => A): ((r: R) => A) =>
    (r: R) => ma(modify(r));



// =============================================================================
// Trifunctor for Kind3 + helpers
// =============================================================================

export interface Trifunctor<F extends Kind3> {
  trimap<A, B, C, A2, B2, C2>(
    fabc: Apply<F, [A, B, C]>,
    f: (a: A) => A2,
    g: (b: B) => B2,
    h: (c: C) => C2
  ): Apply<F, [A2, B2, C2]>;

  map1?<A, B, C, A2>(fabc: Apply<F, [A, B, C]>, f: (a: A) => A2): Apply<F, [A2, B, C]>;
  map2?<A, B, C, B2>(fabc: Apply<F, [A, B, C]>, g: (b: B) => B2): Apply<F, [A, B2, C]>;
  map3?<A, B, C, C2>(fabc: Apply<F, [A, B, C]>, h: (c: C) => C2): Apply<F, [A, B, C2]>;
}

export function defaultTrifunctor<F extends Kind3>(T: {
  trimap: Trifunctor<F>['trimap']
}): Trifunctor<F> {
  return {
    trimap: T.trimap,
    map1: (x, f) => T.trimap(x, f, (b: any) => b, (c: any) => c),
    map2: (x, g) => T.trimap(x, (a: any) => a, g, (c: any) => c),
    map3: (x, h) => T.trimap(x, (a: any) => a, (b: any) => b, h)
  };
}

// =============================================================================
// “Map the last covariant position” helpers by arity
// =============================================================================

export function mapLast1<F extends RequireCovariantLast<Kind1>>(
  F: Functor<F>
): <A, B>(fa: Apply<F, [A]>, f: (a: A) => B) => Apply<F, [B]> {
  return (fa, f) => F.map(fa, f);
}

export function mapLast2<F extends Kind2>(
  F: Bifunctor<F>
): <A, B, C>(fab: Apply<F, [A, B]>, f: (b: B) => C) => Apply<F, [A, C]> {
  return (fab, f) => F.mapRight(fab, f);
}

export function mapLast3<F extends Kind3>(
  F: Trifunctor<F>
): <A, B, C, D>(fabc: Apply<F, [A, B, C]>, f: (c: C) => D) => Apply<F, [A, B, D]> {
  const map3 = F.map3 ?? ((x: any, h: any) => F.trimap(x, (a: any) => a, (b: any) => b, h));
  return (fabc, f) => map3(fabc, f);
}



// ============================================================================
// Generic Algorithms
// ============================================================================

/**
 * lift2 - lifts a binary function into an Applicative context
 */
export function lift2<F extends Kind1>(
  F: Applicative<F>
): <A, B, C>(f: (a: A, b: B) => C) => (fa: Apply<F, [A]>, fb: Apply<F, [B]>) => Apply<F, [C]> {
  return function<A, B, C>(f: (a: A, b: B) => C) {
    return function(fa: Apply<F, [A]>, fb: Apply<F, [B]>): Apply<F, [C]> {
      return F.ap(F.map(fa, (a: A) => (b: B) => f(a, b)), fb);
    };
  };
}

/**
 * lift3 - lifts a ternary function into an Applicative context
 */
export function lift3<F extends Kind1>(
  F: Applicative<F>
): <A, B, C, D>(
  f: (a: A, b: B, c: C) => D
) => (fa: Apply<F, [A]>, fb: Apply<F, [B]>, fc: Apply<F, [C]>) => Apply<F, [D]> {
  return function<A, B, C, D>(f: (a: A, b: B, c: C) => D) {
    return function(
      fa: Apply<F, [A]>,
      fb: Apply<F, [B]>,
      fc: Apply<F, [C]>
    ): Apply<F, [D]> {
      return F.ap(
        F.ap(
          F.map(fa, (a: A) => (b: B) => (c: C) => f(a, b, c)),
          fb
        ),
        fc
      );
    };
  };
}

/**
 * composeK - composes two monadic functions
 */
export function composeK<F extends Kind1>(
  M: Monad<F>
): <A, B, C>(
  f: (b: B) => Apply<F, [C]>,
  g: (a: A) => Apply<F, [B]>
) => (a: A) => Apply<F, [C]> {
  return function<A, B, C>(
    f: (b: B) => Apply<F, [C]>,
    g: (a: A) => Apply<F, [B]>
  ) {
    return (a: A) => M.chain(g(a), f);
  };
}

/**
 * sequence - sequences a list of monadic values
 */
export function sequence<F extends Kind1>(
  M: Monad<F>
): <A>(fas: Array<Apply<F, [A]>>) => Apply<F, [Array<A>]> {
  return function<A>(fas: Array<Apply<F, [A]>>): Apply<F, [Array<A>]> {
    let acc: Apply<F, [Array<A>]> = M.of([] as Array<A>);
    for (const fa of fas) {
      acc = M.chain<Array<A>, Array<A>>(acc, (as) =>
        M.map(fa, (a) => [...as, a])
      );
    }
    return acc;
  };
}

/**
 * traverse - traverses a list with a monadic function
 */
export function traverse<F extends Kind1>(
  M: Monad<F>
): <A, B>(f: (a: A) => Apply<F, [B]>, as: Array<A>) => Apply<F, [Array<B>]> {
  return function<A, B>(f: (a: A) => Apply<F, [B]>, as: Array<A>): Apply<F, [Array<B>]> {
    return M.chain(M.of(as), (asArray: Array<A>) => sequence(M)(asArray.map(f)));
  };
}

// ============================================================================
// Derivable Instances Integration
// ============================================================================

/**
 * Derive Functor from map
 */
export function deriveFunctor<F extends Kind1>(
  map: <A, B>(fa: Apply<F, [A]>, f: (a: A) => B) => Apply<F, [B]>
): Functor<F> {
  return { map };
}

/**
 * Derive Applicative from of and ap
 */
export function deriveApplicative<F extends Kind1>(
  of: <A>(a: A) => Apply<F, [A]>,
  ap: <A, B>(fab: Apply<F, [(a: A) => B]>, fa: Apply<F, [A]>) => Apply<F, [B]>
): Applicative<F> {
  return {
    of,
    ap,
    map: <A, B>(fa: Apply<F, [A]>, f: (a: A) => B): Apply<F, [B]> => 
      ap(of(f), fa)
  };
}

/**
 * Derive Monad from of and chain
 */
export function deriveMonad<F extends Kind1>(
  of: <A>(a: A) => Apply<F, [A]>,
  chain: <A, B>(fa: Apply<F, [A]>, f: (a: A) => Apply<F, [B]>) => Apply<F, [B]>
): Monad<F> {
  return {
    of,
    chain,
    map: <A, B>(fa: Apply<F, [A]>, f: (a: A) => B): Apply<F, [B]> => 
      chain(fa, a => of(f(a))),
    ap: <A, B>(fab: Apply<F, [(a: A) => B]>, fa: Apply<F, [A]>): Apply<F, [B]> => 
      chain(fab, f => chain(fa, a => of(f(a))))
  };
}



// =============================================================================
// EitherK instances (right-biased)
// =============================================================================

// Fix the left side to expose a unary HKT for instances
export interface EitherFix<E> extends Kind1 {
  readonly type: Apply<EitherK, [E, this['arg0']]>;
}

// Minimal algebra for optional accumulating applicative
export interface Semigroup<T> { concat: (x: T, y: T) => T; }

// Functor maps the Right; Left is untouched
export const EitherFunctor = <E>(): Functor<EitherFix<E>> => ({
  map: <A, B>(fa: Either<E, A>, f: (a: A) => B): Either<E, B> =>
    ('right' in fa) ? { right: f(fa.right) } : fa as any
});

// Short-circuiting Applicative (coherent with Monad)
export const EitherApplicative = <E>(): Applicative<EitherFix<E>> => ({
  ...EitherFunctor<E>(),
  of: <A>(a: A): Either<E, A> => ({ right: a }),
  ap: <A, B>(ff: Either<E, (a: A) => B>, fa: Either<E, A>): Either<E, B> => {
    if ('left' in ff) return ff;
    if ('left' in fa) return fa as any;
    return { right: ff.right(fa.right) };
  }
});

// Accumulating Applicative (requires Semigroup<E>)
export const EitherApplicativeAcc = <E>(S: Semigroup<E>): Applicative<EitherFix<E>> => ({
  ...EitherFunctor<E>(),
  of: <A>(a: A): Either<E, A> => ({ right: a }),
  ap: <A, B>(ff: Either<E, (a: A) => B>, fa: Either<E, A>): Either<E, B> => {
    if ('right' in ff && 'right' in fa) return { right: ff.right(fa.right) };
    if ('left' in ff && 'left' in fa)   return { left: S.concat(ff.left, fa.left) };
    return 'left' in ff ? ff : fa as any;
  }
});

// Right-biased Monad
export const EitherMonad = <E>(): Monad<EitherFix<E>> => ({
  ...EitherApplicative<E>(),
  chain: <A, B>(fa: Either<E, A>, f: (a: A) => Either<E, B>): Either<E, B> =>
    ('right' in fa) ? f(fa.right) : fa as any
});



// const EM = EitherMonad<string>();
// EM.chain({ right: 2 }, n => ({ right: n * 3 })); // { right: 6 }




// =============================================================================
// TupleK instances: focus on the 2nd (covariant) slot
// =============================================================================

// Fix the first component to expose a unary HKT: PairFix<X>[A] = [X, A]
export interface PairFix<X> extends Kind1 {
  readonly type: Apply<TupleK, [X, this['arg0']]>;
}

export interface Monoid<T> extends Semigroup<T> { empty: T; }

// Functor maps the second element
export const PairFunctor = <X>(): Functor<PairFix<X>> => ({
  map: <A, B>(fa: [X, A], f: (a: A) => B): [X, B] => [fa[0], f(fa[1])]
});

// Applicative accumulates the first element with a Monoid
export const PairApplicative = <X>(M: Monoid<X>): Applicative<PairFix<X>> => ({
  ...PairFunctor<X>(),
  of:     <A>(a: A): [X, A] => [M.empty, a],
  ap: <A, B>(ff: [X, (a: A) => B], fa: [X, A]): [X, B] =>
    [M.concat(ff[0], fa[0]), ff[1](fa[1])]
});

// Monad also requires Monoid to combine contexts in `chain`
export const PairMonad = <X>(M: Monoid<X>): Monad<PairFix<X>> => ({
  ...PairApplicative<X>(M),
  chain: <A, B>(fa: [X, A], f: (a: A) => [X, B]): [X, B] => {
    const [x2, b] = f(fa[1]);
    return [M.concat(fa[0], x2), b];
  }
});




// ============================================================================
// Example Usage and Tests
// ============================================================================

/**
 * Example: Using lift2 with Array
 */
export function exampleLift2Array(): void {
  const add = (a: number, b: number) => a + b;
  const liftedAdd = lift2(ArrayApplicative as Applicative<ArrayK>)(add);
  
  const result = liftedAdd([1, 2, 3], [10, 20]);
  console.log(result); // [11, 21, 12, 22, 13, 23]
}

/**
 * Example: Using composeK with Maybe
 */
export function exampleComposeKMaybe(): void {
  const safeDivide = (n: number) => (d: number): Maybe<number> => 
    d === 0 ? null : n / d;
  
  const safeSqrt = (n: number): Maybe<number> => 
    n < 0 ? null : Math.sqrt(n);
  
  const composed = composeK(MaybeMonad as Monad<MaybeK>)(safeSqrt, safeDivide(16));
  
  console.log(composed(4)); // 2
  console.log(composed(0)); // null
  console.log(composed(-1)); // null
}

/**
 * Example: Deriving ArrayMonad from minimal definitions
 */
export function exampleDeriveArrayMonad(): void {
  const of = <A>(a: A): Array<A> => [a];
  const chain = <A, B>(fa: Array<A>, f: (a: A) => Array<B>): Array<B> => 
    fa.flatMap(f);
  
  const derivedArrayMonad = deriveMonad<ArrayK>(of as any, chain as any) as Monad<ArrayK>;
  
  // Test that it works
  const result = derivedArrayMonad.chain([1, 2, 3], (x: number) => [x * 2, x * 3]);
  console.log(result); // [2, 3, 4, 6, 6, 9]
}

export function exampleX(): void {
  // Promise demo
const P = PromiseMonad;
P.chain(P.of(2), (n: number) => P.of(n * 10)).then(console.log); // 20

// Reader demo
type Env = { base: number };
const RM = ReaderMonad<Env>();
const addBase = (n: number) => (e: Env) => n + e.base;
const prog = RM.chain((e: Env) => e.base, (b: number) => addBase(b)); // (e) => b + e.base
console.log(prog({ base: 3 })); // 6

// mapLast demos
const lift2P = lift2(PromiseApplicativePar)((a: number, b: number) => a + b);
lift2P(Promise.resolve(1), Promise.resolve(2)).then(console.log); // 3

}
// ============================================================================
// Laws Documentation
// ============================================================================

/**
 * Typeclass Laws for HKT-based implementations:
 * 
 * Functor Laws:
 * 1. Identity: map(fa, x => x) = fa
 * 2. Composition: map(map(fa, f), g) = map(fa, x => g(f(x)))
 * 
 * Applicative Laws:
 * 1. Identity: ap(of(x => x), v) = v
 * 2. Homomorphism: ap(of(f), of(x)) = of(f(x))
 * 3. Interchange: ap(u, of(y)) = ap(of(f => f(y)), u)
 * 4. Composition: ap(ap(ap(of(f => g => x => f(g(x))), u), v), w) = ap(u, ap(v, w))
 * 
 * Monad Laws:
 * 1. Left Identity: chain(of(a), f) = f(a)
 * 2. Right Identity: chain(ma, of) = ma
 * 3. Associativity: chain(chain(ma, f), g) = chain(ma, x => chain(f(x), g))
 * 
 * Bifunctor Laws:
 * 1. Identity: bimap(fa, x => x, y => y) = fa
 * 2. Composition: bimap(bimap(fa, f1, g1), f2, g2) = bimap(fa, x => f2(f1(x)), y => g2(g1(y)))
 * 
 * Profunctor Laws:
 * 1. Identity: dimap(p, x => x, y => y) = p
 * 2. Composition: dimap(dimap(p, f1, g1), f2, g2) = dimap(p, x => f1(f2(x)), y => g2(g1(y)))
 * 
 * HKT Laws:
 * 1. Apply Identity: Apply<F, [A]> should be well-formed for valid F and A
 * 2. Apply Composition: Apply<Compose<F, G>, [A]> = Apply<F, [Apply<G, [A]>]>
 * 3. Kind Preservation: KindArity<F> should be consistent across all uses
 */ 