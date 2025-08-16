/**
 * Bazaar ↔ Traversable bridge
 *
 * - toBazaarFromTraversable: turn any Traversable<T> into a Bazaar over T
 * - traversalFromTraversable: produce a Traversal on T<A> focusing elements A
 * - runTraversalViaApplicative: fast path that delegates to T.traverse
 *
 * Targets your existing HKT/typeclass interfaces; tweak imports as needed.
 */

import { Kind1, Apply } from './fp-hkt';
import { Applicative, Traversable, Functor } from './fp-typeclasses-hkt';

// Bazaar<A,B,S,T> ~ forall F. Applicative F => (A -> F<B>) -> S -> F<T>
export type Bazaar<A, B, S, T> =
  <F extends Kind1>(F: Applicative<F>, k: (a: A) => Apply<F, [B]>) =>
    (s: S) => Apply<F, [T]>;

/**
 * Turn Traversable<T> into a Bazaar over its elements.
 *   S = T<A>,  T = T<B>
 */
export function toBazaarFromTraversable<T extends Kind1>(
  T: Traversable<T>
): <A, B>() => Bazaar<A, B, Apply<T, [A]>, Apply<T, [B]>> {
  return <A, B>() =>
    <F extends Kind1>(F: Applicative<F>, k: (a: A) => Apply<F, [B]>) =>
      (ta: Apply<T, [A]>) =>
        T.traverse(ta, k) as Apply<F, [Apply<T, [B]>]>;
}

/**
 * Build a Traversal for a Traversable container itself.
 *   Traversal<T<A>, T<B>, A, B>
 * Works well with your existing profunctor-based Traversal encoding.
 */
export function traversalFromTraversable<T extends Kind1>(
  T: Traversable<T>
) {
  // Optic runner in the "function profunctor" case: pab :: A -> B
  return function<S, A, B>(pab: (a: A) => B) {
    return (ta: Apply<T, [A]>): Apply<T, [B]> => T.map(ta, pab) as any;
  };
}

/**
 * Fast path runner that uses traverse directly with any Applicative F.
 * This mirrors the Bazaar encoding but stays in your Traversable dictionaries.
 */
export function runTraversalViaApplicative<T extends Kind1, F extends Kind1, A, B>(
  T: Traversable<T>,
  F: Applicative<F>,
  k: (a: A) => Apply<F, [B]>,
  ta: Apply<T, [A]>
): Apply<F, [Apply<T, [B]>]> {
  return T.traverse(ta, k) as any;
}

// Tiny Id applicative (handy for sanity checks)
export interface IdK extends Kind1 { type: this['arg0']; }
export const IdApplicative: Applicative<IdK> = {
  of: <A>(a: A) => a as any,
  ap: <A, B>(fab: (a: A) => B, fa: A) => fab(fa) as any,
  map: <A, B>(fa: A, f: (a: A) => B) => f(fa) as any
};
