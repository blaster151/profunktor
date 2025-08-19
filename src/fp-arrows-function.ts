import { FunctionK, Kind2, Apply, Either } from '../fp-hkt';
import { Category, Arrow, ArrowChoice, ArrowApply } from './fp-typeclasses-arrows';

export const FunctionCategory: Category<FunctionK> = {
  effectTag: 'Pure',
  usageBound: '∞',
  id: <A>(): Apply<FunctionK, [A, A]> => 
    ((a: A) => a) as Apply<FunctionK, [A, A]>,
  compose: <A, B, C>(pbc: Apply<FunctionK, [B, C]>, pab: Apply<FunctionK, [A, B]>): Apply<FunctionK, [A, C]> => 
    ((a: A) => (pbc as any)((pab as any)(a))) as Apply<FunctionK, [A, C]>
};

export const FunctionArrow: Arrow<FunctionK> = {
  ...FunctionCategory,
  arr: <A, B>(f: (a: A) => B): Apply<FunctionK, [A, B]> => 
    f as Apply<FunctionK, [A, B]>,
  first: <A, B, C>(pab: Apply<FunctionK, [A, B]>): Apply<FunctionK, [[A, C], [B, C]]> =>
    (([a, c]: [A, C]) => [(pab as any)(a), c]) as Apply<FunctionK, [[A, C], [B, C]]>
};

export const FunctionArrowChoice: ArrowChoice<FunctionK> = {
  ...FunctionArrow,
  left: <A, B, C>(pab: Apply<FunctionK, [A, B]>): Apply<FunctionK, [Either<A, C>, Either<B, C>]> =>
    ((e: Either<A, C>): Either<B, C> =>
      ('left' in e ? { left: (pab as any)(e.left) } : { right: e.right })) as Apply<FunctionK, [Either<A, C>, Either<B, C>]>
};

export const FunctionArrowApply: ArrowApply<FunctionK> = {
  ...FunctionArrow,
  app: <A, B>(): Apply<FunctionK, [[Apply<FunctionK, [A, B]>, A], B]> =>
    (([pab, a]: [Apply<FunctionK, [A, B]>, A]) => (pab as any)(a)) as Apply<FunctionK, [[Apply<FunctionK, [A, B]>, A], B]>
};


