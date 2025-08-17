// fp-typeclasses-std.ts
import type { Apply } from './fp-hkt';
import type { Functor, Applicative } from './fp-typeclasses-hkt';
import type { EitherGADT, Result } from './fp-gadt-enhanced';
import type { EitherRightK, ResultOkK } from './fp-hkt-either-result-kinds';

// GADT-friendly constructors (use your own if you already expose them)
const LeftG  = <L, R = never>(l: L): EitherGADT<L, R> => ({ tag: 'Left',  payload: { value: l } } as const);
const RightG = <L, R>(r: R): EitherGADT<L, R>         => ({ tag: 'Right', payload: { value: r } } as const);

const OkG  = <A, E>(a: A): Result<A, E>                => ({ tag: 'Ok',  payload: { value: a } } as const);
const ErrG = <A = never, E = unknown>(e: E): Result<A, E> => ({ tag: 'Err', payload: { error: e } } as const);

// ===== Either<L, _> =====

export function getEitherFunctor<L>(): Functor<EitherRightK<L>> {
  return {
    map<A, B>(fa: Apply<EitherRightK<L>, [A]>, f: (a: A) => B): Apply<EitherRightK<L>, [B]> {
      if (fa.tag === 'Right') return RightG<L, B>(f(fa.payload.value));
      return fa as unknown as Apply<EitherRightK<L>, [B]>;
    }
  };
}

export function getEitherApplicative<L>(): Applicative<EitherRightK<L>> {
  const F = getEitherFunctor<L>();
  return {
    ...F,
    of<A>(a: A): Apply<EitherRightK<L>, [A]> {
      return RightG<L, A>(a);
    },
    ap<A, B>(
      fab: Apply<EitherRightK<L>, [(a: A) => B]>,
      fa: Apply<EitherRightK<L>, [A]>
    ): Apply<EitherRightK<L>, [B]> {
      if (fab.tag === 'Left') return fab as unknown as Apply<EitherRightK<L>, [B]>;
      if (fa.tag  === 'Left') return fa  as unknown as Apply<EitherRightK<L>, [B]>;
      return RightG<L, B>(fab.payload.value(fa.payload.value));
    }
  };
}

// ===== Result<_, E> =====

export function getResultFunctor<E>(): Functor<ResultOkK<E>> {
  return {
    map<A, B>(fa: Apply<ResultOkK<E>, [A]>, f: (a: A) => B): Apply<ResultOkK<E>, [B]> {
      if (fa.tag === 'Ok') return OkG<B, E>(f(fa.payload.value));
      return fa as unknown as Apply<ResultOkK<E>, [B]>;
    }
  };
}

export function getResultApplicative<E>(): Applicative<ResultOkK<E>> {
  const F = getResultFunctor<E>();
  return {
    ...F,
    of<A>(a: A): Apply<ResultOkK<E>, [A]> {
      return OkG<A, E>(a);
    },
    ap<A, B>(
      fab: Apply<ResultOkK<E>, [(a: A) => B]>,
      fa: Apply<ResultOkK<E>, [A]>
    ): Apply<ResultOkK<E>, [B]> {
      if (fab.tag === 'Err') return fab as unknown as Apply<ResultOkK<E>, [B]>;
      if (fa.tag  === 'Err') return fa  as unknown as Apply<ResultOkK<E>, [B]>;
      return OkG<B, E>(fab.payload.value(fa.payload.value));
    }
  };
}
