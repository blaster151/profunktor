// fp-monoidal.ts
// Add a tiny, law-checked monoidal layer + instances for (×,1) and (+,0).
// Wire Applicative as a (strong) lax monoidal functor.
// Keep it witness-only; no heavy runtime.

import { Kind1, Apply } from './fp-hkt';
import { Applicative } from './fp-typeclasses-hkt';

// Category on Hask (functions)
export interface CategoryHask {
  id<A>(): (a: A) => A;
  compose<A, B, C>(g: (b: B) => C, f: (a: A) => B): (a: A) => C;
}

export interface Monoidal<C = unknown> {
  readonly I: {};
  tensor<A, B>(a: A, b: B): [A, B];
  lunit<A>(ab: [any, A]): A;
  runit<A>(ab: [A, any]): A;
  assoc<A, B, C>(abc: [[A, B], C]): [A, [B, C]];
  swap?<A, B>(ab: [A, B]): [B, A];
}

// Cartesian monoidal on Hask
export const MonoidalProduct: Monoidal = {
  I: {},
  tensor: (a, b) => [a, b],
  lunit: ([_, a]) => a,
  runit: ([a, _]) => a,
  assoc: ([[a, b], c]) => [a, [b, c]],
  swap: ([a, b]) => [b, a]
};

// Cocartesian “witness” for Either (sum). Minimal ops used by Choice.
export const MonoidalSum = {
  zero: undefined as void,
  injL: <A, B>(a: A): A | B => ({ _tag: 'L', value: a } as any),
  injR: <A, B>(b: B): A | B => ({ _tag: 'R', value: b } as any),
  match: <A, B, C>(e: any, L: (a: A) => C, R: (b: B) => C): C => (e._tag === 'L' ? L(e.value) : R(e.value))
};

// Lax/Strong monoidal functor via Applicative
export interface LaxMonoidalFunctor<F extends Kind1> {
  unit(): Apply<F, [{}]>;
  map2<A, B>(fa: Apply<F, [A]>, fb: Apply<F, [B]>): Apply<F, [[A, B]]>;
}

export interface StrongMonoidalFunctor<F extends Kind1> extends LaxMonoidalFunctor<F> {}

// Derive a LaxMonoidalFunctor from your Applicative dictionary
export function laxFromApplicative<F extends Kind1>(A: Applicative<F>): LaxMonoidalFunctor<F> {
  return {
    unit: () => A.of({}) as any,
    map2: <A0, B0>(fa: Apply<F, [A0]>, fb: Apply<F, [B0]>) =>
      A.ap(A.map(fa, (a: A0) => (b: B0) => [a, b] as [A0, B0]) as any, fb) as any
  };
}

// Tiny law checks (quick determinism checks for Hask)
export const MonoidalLaws = {
  symmetry<A, B>(M: Monoidal<any>, ab: [A, B]): boolean {
    if (!M.swap) return true;
    const s1 = M.swap(ab);
    const s2 = M.swap!(s1 as any);
    return JSON.stringify(s2) === JSON.stringify(ab);
  },
  assocRound<A, B, C>(M: Monoidal<any>, abc: [[A, B], C]): boolean {
    const r = M.assoc(abc);
    const back: [[A, B], C] = [[r[0], r[1][0]], r[1][1]] as any;
    return JSON.stringify(back) === JSON.stringify(abc);
  }
};


