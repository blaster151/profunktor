/**
 * Lens ↔ Store, Traversal ↔ Bazaar, Prism ↔ (match/build) helpers
 * (lean, HKT-friendly where it matters)
 */

import { Kind1, Apply } from './fp-hkt';
import { Functor, Applicative } from './fp-typeclasses-hkt';

// -------------------- Store (comonad-ish) and Lens iso --------------------

export interface Store<A, S> {
  readonly peek: (a: A) => S;
  readonly pos: A;
}

// Lens<S,T,A,B> ≅ (S) -> Store<B, T>   (well-known)
export function lensToStore<S, T, A, B>(
  getter: (s: S) => A,
  setter: (b: B, s: S) => T
): (s: S) => Store<B, T> {
  return (s) => ({
    pos: getter(s) as unknown as B, // position is A; for parametric B we keep it typed as B via usage
    peek: (b: B) => setter(b, s)
  });
}

export function storeToLens<S, T, A, B>(
  toStore: (s: S) => Store<B, T>,
  coerceGet: (s: S) => A // supply how to view A from S (since Store holds B-position)
): {
  getter: (s: S) => A,
  setter: (b: B, s: S) => T
} {
  return {
    getter: coerceGet,
    setter: (b, s) => toStore(s).peek(b)
  };
}

// -------------------- Prism object ↔ Choice encoding --------------------

export type PrismObj<S, T, A, B> = {
  match: (s: S) => { _tag: 'Left', value: T } | { _tag: 'Right', value: A },
  build: (b: B) => T
};

export function prismObj<S, T, A, B>(
  match: PrismObj<S, T, A, B>['match'],
  build: PrismObj<S, T, A, B>['build']
): PrismObj<S, T, A, B> {
  return { match, build };
}

// -------------------- Bazaar (Applicative traversal encoding) --------------------

/**
 * Bazaar<A,B,S,T> ~ forall F. Applicative F => (A -> F<B>) -> S -> F<T>
 * Minimal, HKT-aligned encoding for your environment.
 */
export type Bazaar<A, B, S, T> =
  <F extends Kind1>(F: Applicative<F>, k: (a: A) => Apply<F, [B]>) =>
    (s: S) => Apply<F, [T]>;

// from a traversal constructor (S -> A[]) + modifyAll
export function traversalToBazaar<S, T, A, B>(
  getAll: (s: S) => A[],
  modifyAll: (f: (a: A) => B, s: S) => T
): Bazaar<A, B, S, T> {
  return <F extends Kind1>(F: Applicative<F>, k: (a: A) => Apply<F, [B]>) =>
    (s: S) => {
      // sequence map with F
      const as = getAll(s);
      let acc = F.of([] as B[]) as Apply<F, [B[]]>;
      for (const a of as) {
        const fb = k(a) as any;
        acc = F.ap(F.map(acc as any, (bs: B[]) => (b: B) => [...bs, b]) as any, fb as any) as any;
      }
      return F.map(acc as any, (bs: B[]) => modifyAll(((aa: A) => {
        // Use closure to simulate index access without exposing index in signature
        const idxMap = new Map<A, number>();
        let idx = 0;
        for (const a of as) {
          if (!idxMap.has(a)) idxMap.set(a, idx++);
        }
        const j = idxMap.get(aa) ?? 0;
        return bs[j];
      }) as any, s)) as any;
    };
}

// from a Bazaar back to a traversal-style modify
export function bazaarToTraversal<S, T, A, B>(
  baz: Bazaar<A, B, S, T>
): (F: Applicative<any>, k: (a: A) => any) => (s: S) => any {
  return (F, k) => baz(F as any, k as any) as any;
}

// Quick sanity laws (sketch):
// - Identity applicative: traversalToBazaar(...)(Id, Id) ≡ Id
// - Composition distributivity follows Applicative composition laws
