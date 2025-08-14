// fp-cokleisli-arrow-choice.ts
import { Kind1, Apply } from './fp-hkt';
import { Functor } from './fp-typeclasses-hkt';
import { Comonad } from './fp-cofree-comonad';
import { Cofree, CofreeK, cofree } from './fp-free'; // you exported Cofree/CofreeK earlier
import type { Either as EitherT } from './fp-either-unified';
import { Left, Right, matchEither } from './fp-either-unified';

// CoKleisli W A B ~ (W<A>) => B
export interface CoKleisli<W extends Kind1, A, B> {
  (wa: Apply<W,[A]>): B;
}

// Minimal distributive law to support ArrowChoice-left:
//
// selectLeft: W<Either<A,C>> -> Either<W<A>, C>
// For Cofree, we can implement it structurally by inspecting head and mapping tail.
export interface SelectLeft<W extends Kind1> {
  selectLeft<A,C>(wac: Apply<W,[EitherT<A,C>]>): EitherT<Apply<W,[A]>, C>;
}

// ----- Cofree instance of SelectLeft -----
export function selectLeftCofree<F extends Kind1>(F: Functor<F>): SelectLeft<CofreeK<F>> {
  const go = <A, C>(w: Cofree<F, EitherT<A, C>>): EitherT<Cofree<F, A>, C> => {
    return matchEither(w.head as any, {
      Left: (a: A) => {
        const tailA = F.map(w.tail as any, (child: Cofree<F, EitherT<A, C>>) => {
          const res = go<A, C>(child);
          return matchEither(res as any, {
            Left: (wa: Cofree<F, A>) => wa,
            Right: (_c: C) => (child as unknown as Cofree<F, A>)
          });
        }) as any;
        return Left(cofree(a, tailA)) as any;
      },
      Right: (c: C) => Right(c) as any
    });
  };
  return {
    selectLeft: <A, C>(wac: Apply<CofreeK<F>, [EitherT<A, C>]>) => go(wac as any) as any
  };
}

// ----- ArrowChoice dictionary for CoKleisli W -----
export interface Arrow<W extends Kind1> {
  id<A>(): CoKleisli<W,A,A>;
  compose<A,B,C>(g: CoKleisli<W,B,C>, f: CoKleisli<W,A,B>): CoKleisli<W,A,C>;
  arr<A,B>(h: (a:A)=>B): CoKleisli<W,A,B>;
  first<A,B,C>(f: CoKleisli<W,A,B>): CoKleisli<W,[A,C],[B,C]>;
}

export interface ArrowChoice<W extends Kind1> extends Arrow<W> {
  left<A,B,C>(f: CoKleisli<W,A,B>): CoKleisli<W, EitherT<A,C>, EitherT<B,C>>;
}

export function CoKleisliArrowChoice<W extends Kind1>(
  Wf: Functor<W>,
  Wc: Comonad<W>,
  sel: SelectLeft<W>
): ArrowChoice<W> {
  return {
    id: () => (wa) => Wc.extract(wa),
    compose: (g,f) => (wa) => g(Wf.map(wa, (a:any)=>f(wa as any)) as any),
    arr: (h) => (wa) => h(Wc.extract(wa)),
    first: (f) => (wac) => {
      const pair = Wc.extract(wac) as any as [any, any];
      const outB = f(Wf.map(wac, (p:[any,any])=>p[0]) as any);
      return [outB, pair[1]];
    },
    left: (f) => (weac) => {
      const e = sel.selectLeft(weac);
      return matchEither(e as any, {
        Left: (wea: any) => Left(f(wea)) as any,
        Right: (c: any) => Right(c) as any
      });
    }
  };
}

// Convenience for Cofree<F,_>
export function CoKleisliArrowChoiceCofree<F extends Kind1>(
  F: Functor<F>,
  CofreeComonad: Comonad<CofreeK<F>>
) {
  return CoKleisliArrowChoice<CofreeK<F>>(F as any, CofreeComonad, selectLeftCofree<F>(F));
}

