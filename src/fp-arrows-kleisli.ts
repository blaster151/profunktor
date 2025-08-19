// BEGIN PATCH: Kleisli arrow instance
import { KleisliK, Kind1, Apply, Either } from '../fp-hkt';
import type { ArrowChoice, ArrowApply, Category, Arrow } from './fp-typeclasses-arrows';

export function KleisliArrow<M extends Kind1>(M: {
  of: <A>(a: A) => Apply<M, [A]>;
  map: <A, B>(fa: Apply<M, [A]>, f: (a: A) => B) => Apply<M, [B]>;
  ap: <A, B>(ff: Apply<M, [(a: A) => B]>, fa: Apply<M, [A]>) => Apply<M, [B]>;
  chain: <A, B>(fa: Apply<M, [A]>, f: (a: A) => Apply<M, [B]>) => Apply<M, [B]>;
}): ArrowChoice<KleisliK<M>> & ArrowApply<KleisliK<M>> {
  return {
    effectTag: 'Pure' as const,
    usageBound: '∞' as const,
    
    id: <A>(): Apply<KleisliK<M>, [A, A]> => 
      ((a: A) => M.of(a)) as Apply<KleisliK<M>, [A, A]>,

    compose: <A, B, C>(
      pbc: Apply<KleisliK<M>, [B, C]>,
      pab: Apply<KleisliK<M>, [A, B]>
    ): Apply<KleisliK<M>, [A, C]> => 
      ((a: A) => M.chain((pab as any)(a), (b) => (pbc as any)(b))) as Apply<KleisliK<M>, [A, C]>,

    arr: <A, B>(f: (a: A) => B): Apply<KleisliK<M>, [A, B]> => 
      ((a: A) => M.of(f(a))) as Apply<KleisliK<M>, [A, B]>,

    first: <A, B, C>(
      pab: Apply<KleisliK<M>, [A, B]>
    ): Apply<KleisliK<M>, [[A, C], [B, C]]> =>
      (([a, c]: [A, C]) => M.map((pab as any)(a), (b) => [b, c] as [B, C])) as Apply<KleisliK<M>, [[A, C], [B, C]]>,

    left: <A, B, C>(
      pab: Apply<KleisliK<M>, [A, B]>
    ): Apply<KleisliK<M>, [Either<A, C>, Either<B, C>]> =>
      ((e: Either<A, C>): Apply<M, [Either<B, C>]> =>
        'left' in e
          ? M.map((pab as any)(e.left), (b) => ({ left: b } as Either<B, C>))
          : M.of({ right: e.right } as Either<B, C>)) as Apply<KleisliK<M>, [Either<A, C>, Either<B, C>]>,

    app: <A, B>(): Apply<KleisliK<M>, [[Apply<KleisliK<M>, [A, B]>, A], B]> =>
      (([pab, a]: [Apply<KleisliK<M>, [A, B]>, A]) => (pab as any)(a)) as Apply<KleisliK<M>, [[Apply<KleisliK<M>, [A, B]>, A], B]>,
  };
}
// END PATCH


