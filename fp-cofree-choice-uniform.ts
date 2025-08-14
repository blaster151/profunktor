/**
 * Uniform-branch Cofree helpers + ChoiceW witness for CoKleisli ArrowChoice.
 *
 * Idea: if a Cofree<F, Either<A,C>> is *uniform* (all nodes Left or all nodes Right),
 * we can lawfully "split" it as Either<Cofree<F,A>, Cofree<F,C>>. That's exactly the
 * witness needed by ArrowChoice over CoKleisli.
 */

import { Kind1, Apply, ArrayK } from './fp-hkt';
import { Functor } from './fp-typeclasses-hkt';
import { Cofree, cofree, CofreeK, mapCofree } from './fp-free';
import { Either as EitherT, Left, Right, matchEither, isLeft } from './fp-either-unified';

// Minimal Comonad interface (align with your existing one if you export elsewhere)
export interface Comonad<W extends Kind1> {
  extract<A>(wa: Apply<W, [A]>): A;
  extend<A, B>(wa: Apply<W, [A]>, f: (w: Apply<W, [A]>) => B): Apply<W, [B]>;
  map?<A, B>(wa: Apply<W, [A]>, f: (a: A) => B): Apply<W, [B]>;
}

// ===== Cofree Comonad dictionary (parametric in F) =====

export function Comonad_Cofree<F extends Kind1>(F: Functor<F>): Comonad<CofreeK<F>> {
  const extract = <A>(wa: Cofree<F, A>): A => wa.head;
  const extend = <A, B>(wa: Cofree<F, A>, f: (w: Cofree<F, A>) => B): Cofree<F, B> =>
    cofree(f(wa), F.map(wa.tail, (w) => extend(w, f)) as any);
  const map = <A, B>(wa: Cofree<F, A>, g: (a: A) => B): Cofree<F, B> => mapCofree(F, wa, g);
  return { extract, extend, map } as Comonad<CofreeK<F>>;
}

// ===== Uniform Cofree constructors =====
//
// These guarantee the uniform-branch property at construction time.
// (TypeScript can't enforce this at the type level, so we rely on construction discipline.)

export function uniformLeftCofree<F extends Kind1, A, C>(
  F: Functor<F>,
  seed: A,
  unfold: (a: A) => Apply<F, [A]>
): Cofree<F, EitherT<A, C>> {
  const tail = F.map(unfold(seed), (a) => uniformLeftCofree(F, a, unfold)) as any;
  return cofree(Left<A>(seed), tail);
}

export function uniformRightCofree<F extends Kind1, A, C>(
  F: Functor<F>,
  seed: C,
  unfold: (c: C) => Apply<F, [C]>
): Cofree<F, EitherT<A, C>> {
  const tail = F.map(unfold(seed), (c) => uniformRightCofree(F, c, unfold)) as any;
  return cofree(Right<C>(seed), tail);
}

// ===== ChoiceW witness for Cofree, assuming uniformity =====

export interface ChoiceW<W extends Kind1> {
  splitEither<A, C>(wac: Apply<W, [EitherT<A, C>]>): EitherT<Apply<W, [A]>, Apply<W, [C]>>;
}

/**
 * If the Cofree is uniform (all Left or all Right), split is total and pure.
 * If it isn't uniform (mixed branches) we throw at runtime—callers should only pass
 * values built via the uniform constructors above (or otherwise guaranteed uniform).
 */
export function ChoiceW_CofreeUniform<F extends Kind1>(F: Functor<F>): ChoiceW<CofreeK<F>> {
  const peelLeft = (w: Cofree<F, EitherT<any, any>>): Cofree<F, any> => {
    const a = matchEither(w.head as any, {
      Left: (x: any) => x,
      Right: (_c: any) => { throw new Error('Non-uniform Cofree: encountered Right in Left branch'); }
    });
    const tail = F.map(w.tail, (t: Cofree<F, EitherT<any, any>>) => peelLeft(t)) as any;
    return cofree(a, tail);
  };

  const peelRight = (w: Cofree<F, EitherT<any, any>>): Cofree<F, any> => {
    const c = matchEither(w.head as any, {
      Left: (_a: any) => { throw new Error('Non-uniform Cofree: encountered Left in Right branch'); },
      Right: (y: any) => y
    });
    const tail = F.map(w.tail, (t: Cofree<F, EitherT<any, any>>) => peelRight(t)) as any;
    return cofree(c, tail);
  };

  return {
    splitEither: <A, C>(wac: Cofree<F, EitherT<A, C>>) =>
      matchEither(wac.head as any, {
        Left: (_a: A)  => Left(peelLeft(wac) as Cofree<F, A>) as any,
        Right: (_c: C) => Right(peelRight(wac) as Cofree<F, C>) as any
      }) as any
  };
}

// --- tiny local ArrayK functor for optional smoke testing (adjust if you already export one) ---
export const Functor_ArrayK: Functor<ArrayK> = {
  map: <A, B>(fa: A[], f: (a: A) => B) => fa.map(f) as any
};
