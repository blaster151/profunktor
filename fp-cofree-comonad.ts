import { Kind1, Apply } from './fp-hkt';
import { Functor } from './fp-typeclasses-hkt';
// Minimal local Comonad to avoid heavy deps
export interface Comonad<W extends Kind1> {
  map<A, B>(wa: Apply<W, [A]>, f: (a: A) => B): Apply<W, [B]>;
  extract<A>(wa: Apply<W, [A]>): A;
  extend<A, B>(wa: Apply<W, [A]>, f: (w: Apply<W, [A]>) => B): Apply<W, [B]>;
}
import { Cofree, mapCofree, extractCofree, duplicateCofree, CofreeK } from './fp-free';

// Build a Comonad dictionary for Cofree<F,_> from Functor<F>
export function cofreeComonad<F extends Kind1>(F: Functor<F>): Comonad<CofreeK<F>> {
  return {
    map: <A, B>(fa: Cofree<F, A>, f: (a: A) => B): Cofree<F, B> =>
      mapCofree(F, fa, f),
    extract: <A>(fa: Cofree<F, A>): A =>
      extractCofree(fa),
    extend: <A, B>(fa: Cofree<F, A>, k: (wa: Cofree<F, A>) => B): Cofree<F, B> =>
      mapCofree(F, duplicateCofree(F, fa), k),
  } as Comonad<CofreeK<F>> as any;
}


