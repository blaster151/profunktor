// fp-free-applicative.ts
//
// A minimal FreeApplicative for higher-kinded F with Kind1 encoding.
// Provides: constructors (pure, lift), interpreters (foldMap), and helpers.

import { Kind1, Apply } from './fp-hkt';
import { Applicative, Functor } from './fp-typeclasses-hkt';

// Encoding adapted to the standard FreeAp as a left-associated tree of effects

export type FreeAp<F extends Kind1, A> = Pure<F, A> | Ap<F, any, A>;

export interface Pure<F extends Kind1, A> { readonly _tag: 'Pure'; readonly value: A }
export interface Ap<F extends Kind1, X, A> {
  readonly _tag: 'Ap';
  readonly fx: Apply<F, [X]>;
  readonly k: FreeAp<F, (x: X) => A>;
}

export const Pure = <F extends Kind1, A>(a: A): FreeAp<F, A> => ({ _tag: 'Pure', value: a });
export const Lift = <F extends Kind1, A>(fa: Apply<F, [A]>): FreeAp<F, A> => ApNode(fa, Pure<F, (a: A) => A>((a) => a));
export const ApNode = <F extends Kind1, X, A>(fx: Apply<F, [X]>, k: FreeAp<F, (x: X) => A>): FreeAp<F, A> => ({ _tag: 'Ap', fx, k });

export function mapFreeAp<F extends Kind1, A, B>(fa: FreeAp<F, A>, f: (a: A) => B): FreeAp<F, B> {
  return apFreeAp<PureK, A, B>(pureApplicative as any, pure(f), fa) as any;
}

export function apFreeAp<F extends Kind1, A, B>(
  FApp: Applicative<any>,
  ff: Apply<any, [(a: A) => B]>,
  fa: Apply<any, [A]>
): Apply<any, [B]> {
  return FApp.ap(ff, fa);
}

// FreeApplicative instance for FreeAp itself
export function FreeApplicative<F extends Kind1>(): Applicative<FreeApK<F>> {
  return {
    of: <A>(a: A) => Pure<F, A>(a) as any,
    map: <A, B>(fa: FreeAp<F, A>, f: (a: A) => B) => mapFree<F, A, B>(fa, f) as any, // direct map over FreeAp structure
    ap: <A, B>(ff: FreeAp<F, (a: A) => B>, fa: FreeAp<F, A>) => apFree(ff, fa) as any
  };
}

export type FreeApK<F extends Kind1> = { readonly type: FreeAp<F, any> } & Kind1;

function apFree<F extends Kind1, A, B>(ff: FreeAp<F, (a: A) => B>, fa: FreeAp<F, A>): FreeAp<F, B> {
  if (ff._tag === 'Pure') return mapFree(fa, ff.value);
  // ff = Ap(fx, k: FreeAp<F, (x)=> (a)=>b>)
  const fx = ff.fx as Apply<F, [any]>;
  const k = ff.k as FreeAp<F, (x: any) => (a: A) => B>;
  // restructure: Ap(fx, map(k, g => (a => g(x)(a))) <*> fa)
  const mapped: FreeAp<F, (x: any) => B> = apFree(mapFree(k, (g) => (a: A) => (x: any) => g(x)(a)) as any, fa as any) as any;
  return ApNode<F, any, B>(fx, mapped);
}

function mapFree<F extends Kind1, A, B>(fa: FreeAp<F, A>, f: (a: A) => B): FreeAp<F, B> {
  switch (fa._tag) {
    case 'Pure': return Pure<F, B>(f(fa.value));
    case 'Ap': return ApNode<F, any, B>(fa.fx, mapFree(fa.k as any, (g: any) => (x: any) => f(g(x))));
  }
}

// foldMap interprets the FreeAp into a target applicative G via a natural transformation F ~> G
export function foldMap<F extends Kind1, G extends Kind1, A, B>(
  GApp: Applicative<G>,
  fa: FreeAp<F, A>,
  nt: <X>(fx: Apply<F, [X]>) => Apply<G, [X]>
): Apply<G, [A]> {
  switch (fa._tag) {
    case 'Pure':
      return GApp.of(fa.value);
    case 'Ap': {
      const gx = nt(fa.fx);
      const gk = foldMap<F, G, any, (x: any) => A>(GApp, fa.k as any, nt);
      return GApp.ap(GApp.map(gk, (k) => (x: any) => k(x)), gx as any) as any;
    }
  }
}

// Id FreeAp instance (used internally by map fallback)
interface PureK extends Kind1 { readonly type: this['arg0'] }
const pureApplicative: Applicative<PureK> = {
  of: <A>(a: A) => a,
  map: <A, B>(a: A, f: (a: A) => B) => f(a),
  ap: <A, B>(f: (a: A) => B, a: A) => f(a)
};
const pure = <A>(a: A) => a;


