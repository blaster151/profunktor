// fp-bazaar-effects.ts
//
// Bazaar Effect Systems
// - Natural transformations and runners for Bazaar against different Applicatives
// - Applicative utilities: Compose, Product, Const (Monoid), Validation (error accumulation)
// - Promise sequential vs parallel strategies
// - Helpers to collect, validate, and hoist effects when interpreting a Bazaar

import { Kind1, Apply } from './fp-hkt';
import { Applicative } from './fp-typeclasses-hkt';
import { Bazaar } from './fp-bazaar-traversable-bridge';

// ---------------------------------------------
// Helpers & Typeclasses
// ---------------------------------------------

export type Nat<F extends Kind1, G extends Kind1> = <A>(fa: Apply<F, [A]>) => Apply<G, [A]>;

export interface Semigroup<E> {
  readonly concat: (x: E, y: E) => E;
}

export interface Monoid<M> extends Semigroup<M> {
  readonly empty: M;
}

// ---------------------------------------------
// HKT helpers
// ---------------------------------------------

export interface ComposeK<F extends Kind1, G extends Kind1> extends Kind1 {
  readonly type: Apply<F, [Apply<G, [this['arg0']]>]>;
}

export interface ProductK<F extends Kind1, G extends Kind1> extends Kind1 {
  readonly type: readonly [Apply<F, [this['arg0']]>, Apply<G, [this['arg0']]>];
}

export interface ConstK<M> extends Kind1 {
  readonly type: Readonly<{ readonly value: M }>;
}

export type Validation<E, A> = Failure<E> | Success<A>;
export interface Failure<E> { readonly _tag: 'Failure'; readonly left: E }
export interface Success<A> { readonly _tag: 'Success'; readonly right: A }

export interface ValidationK<E> extends Kind1 {
  readonly type: Validation<E, this['arg0']>;
}

export const Failure = <E>(e: E): Failure<E> => ({ _tag: 'Failure', left: e });
export const Success = <A>(a: A): Success<A> => ({ _tag: 'Success', right: a });

export const isFailure = <E, A>(v: Validation<E, A>): v is Failure<E> => v._tag === 'Failure';
export const isSuccess = <E, A>(v: Validation<E, A>): v is Success<A> => v._tag === 'Success';

// ---------------------------------------------
// Applicative utilities
// ---------------------------------------------

export function ComposeApplicative<F extends Kind1, G extends Kind1>(
  applicativeF: Applicative<F>,
  applicativeG: Applicative<G>
): Applicative<ComposeK<F, G>> {
  return {
    of: <A>(a: A) => applicativeF.of(applicativeG.of(a)) as any,
    map: <A, B>(fga: Apply<ComposeK<F, G>, [A]>, f: (a: A) => B) =>
      applicativeF.map(fga as any, (ga: Apply<G, [A]>) => applicativeG.map(ga, f)) as any,
    ap: <A, B>(fgf: Apply<ComposeK<F, G>, [(a: A) => B]>, fga: Apply<ComposeK<F, G>, [A]>) =>
      applicativeF.ap(
        applicativeF.map(fgf as any, (gf: Apply<G, [(a: A) => B]>) => (ga: Apply<G, [A]>) => applicativeG.ap(gf, ga)) as any,
        fga as any
      ) as any
  };
}

export function ProductApplicative<F extends Kind1, G extends Kind1>(
  applicativeF: Applicative<F>,
  applicativeG: Applicative<G>
): Applicative<ProductK<F, G>> {
  return {
    of: <A>(a: A) => [applicativeF.of(a), applicativeG.of(a)] as any,
    map: <A, B>(p: Apply<ProductK<F, G>, [A]>, f: (a: A) => B) => {
      const [fa, ga] = p as unknown as [Apply<F, [A]>, Apply<G, [A]>];
      return [applicativeF.map(fa, f), applicativeG.map(ga, f)] as any;
    },
    ap: <A, B>(pf: Apply<ProductK<F, G>, [(a: A) => B]>, pa: Apply<ProductK<F, G>, [A]>) => {
      const [ff, gf] = pf as unknown as [Apply<F, [(a: A) => B]>, Apply<G, [(a: A) => B]>];
      const [fa, ga] = pa as unknown as [Apply<F, [A]>, Apply<G, [A]>];
      return [applicativeF.ap(ff, fa), applicativeG.ap(gf, ga)] as any;
    }
  };
}

export function Const<M>(value: M): Readonly<{ readonly value: M }> { return { value } as const; }

export function ConstApplicative<M>(monoidM: Monoid<M>): Applicative<ConstK<M>> {
  return {
    of: <A>(_a: A) => Const(monoidM.empty) as any,
    map: <A, B>(fa: Apply<ConstK<M>, [A]>, _f: (a: A) => B) => fa as any,
    ap: <A, B>(ff: Apply<ConstK<M>, [(a: A) => B]>, fa: Apply<ConstK<M>, [A]>) =>
      Const(monoidM.concat((ff as any).value, (fa as any).value)) as any
  };
}

export function ValidationApplicative<E>(semigroupE: Semigroup<E>): Applicative<ValidationK<E>> {
  return {
    of: <A>(a: A) => Success(a) as any,
    map: <A, B>(va: Validation<E, A>, f: (a: A) => B) => (isSuccess(va) ? Success(f(va.right)) : va) as any,
    ap: <A, B>(vf: Validation<E, (a: A) => B>, va: Validation<E, A>) => {
      if (isSuccess(vf) && isSuccess(va)) return Success(vf.right(va.right)) as any;
      if (isFailure(vf) && isFailure(va)) return Failure(semigroupE.concat(vf.left, va.left)) as any;
      return isFailure(vf) ? vf as any : va as any;
    }
  };
}

// Promise applicatives
export const PromiseParallelApplicative: Applicative<any> = {
  of: <A>(a: A) => Promise.resolve(a),
  map: <A, B>(pa: Promise<A>, f: (a: A) => B) => pa.then(f),
  ap: <A, B>(pf: Promise<(a: A) => B>, pa: Promise<A>) => Promise.all([pf, pa]).then(([f, a]) => f(a))
};

export const PromiseSequentialApplicative: Applicative<any> = {
  of: <A>(a: A) => Promise.resolve(a),
  map: <A, B>(pa: Promise<A>, f: (a: A) => B) => pa.then(f),
  ap: async <A, B>(pf: Promise<(a: A) => B>, pa: Promise<A>) => {
    const f = await pf; // wait first
    const a = await pa; // then argument
    return f(a);
  }
};

// ---------------------------------------------
// Bazaar runners and effect bridges
// ---------------------------------------------

export function runBazaarWith<F extends Kind1, A, B, S, T>(
  applicativeF: Applicative<F>,
  baz: Bazaar<A, B, S, T>,
  s: S,
  k: (a: A) => Apply<F, [B]>
): Apply<F, [T]> {
  const run = baz(applicativeF, k);
  return run(s);
}

// Hoist at run-time: interpret a Bazaar over F by mapping its handler into G via a natural transformation F ~> G
export function runBazaarHoist<F extends Kind1, G extends Kind1, A, B, S, T>(
  applicativeF: Applicative<F>,
  applicativeG: Applicative<G>,
  alpha: Nat<F, G>,
  baz: Bazaar<A, B, S, T>,
  s: S,
  kF: (a: A) => Apply<F, [B]>
): Apply<G, [T]> {
  return baz(applicativeG as any, (a: A) => alpha(kF(a)) as any)(s) as any;
}

// Because fully general hoist requires bidirectional transformations, we provide
// practical helpers for common cases instead of the total hoist above.

// Collect all foci using Const<M>
export function collectWithMonoid<A, B, S, T, M>(
  monoidM: Monoid<M>,
  baz: Bazaar<A, B, S, T>,
  s: S,
  measure: (a: A) => M
): M {
  const F = ConstApplicative(monoidM);
  const k = (a: A) => Const(measure(a));
  const _ignored = baz(F, k)(s) as any as Readonly<{ value: M }>;
  return _ignored.value;
}

// Validate all foci, accumulating errors via Validation<E,_>
export function validateBazaar<A, B, S, T, E>(
  semigroupE: Semigroup<E>,
  baz: Bazaar<A, B, S, T>,
  s: S,
  validate: (a: A) => Validation<E, B>
): Validation<E, T> {
  const F = ValidationApplicative<E>(semigroupE);
  return baz(F as any, validate as any)(s) as any;
}

// Run a Bazaar where the effect is Promise, with explicit parallel/sequential strategy
export function runBazaarPromiseParallel<A, B, S, T>(
  baz: Bazaar<A, B, S, T>,
  s: S,
  k: (a: A) => Promise<B>
): Promise<T> {
  return baz(PromiseParallelApplicative as any, k as any)(s) as any;
}

export function runBazaarPromiseSequential<A, B, S, T>(
  baz: Bazaar<A, B, S, T>,
  s: S,
  k: (a: A) => Promise<B>
): Promise<T> {
  return baz(PromiseSequentialApplicative as any, k as any)(s) as any;
}

// Combine two independent applicatives during interpretation
export function runBazaarProduct<F extends Kind1, G extends Kind1, A, B, S, T>(
  applicativeF: Applicative<F>,
  applicativeG: Applicative<G>,
  baz: Bazaar<A, B, S, T>,
  s: S,
  k: (a: A) => readonly [Apply<F, [B]>, Apply<G, [B]>]
): readonly [Apply<F, [T]>, Apply<G, [T]>] {
  const P = ProductApplicative(applicativeF, applicativeG);
  const res = baz(P as any, k as any)(s) as any as readonly [Apply<F, [T]>, Apply<G, [T]>];
  return res;
}

// Compose two applicatives during interpretation
export function runBazaarCompose<F extends Kind1, G extends Kind1, A, B, S, T>(
  applicativeF: Applicative<F>,
  applicativeG: Applicative<G>,
  baz: Bazaar<A, B, S, T>,
  s: S,
  k: (a: A) => Apply<F, [Apply<G, [B]>]>
): Apply<F, [Apply<G, [T]>]> {
  const C = ComposeApplicative(applicativeF, applicativeG);
  return baz(C as any, k as any)(s) as any;
}


