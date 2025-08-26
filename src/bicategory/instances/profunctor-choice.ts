// Profunctor instance with sum tensor using Choice structure
//
// Requires `left` and `right` operations (Choice) for the profunctor P.
// The tensor on 1-cells is defined by:
//   tensor1(f, g) = right(g) ∘ left(f)
// yielding a morphism on the sum domain/codomain.

import { Kind2, Apply } from '../../../fp-hkt';
import type { Either } from '../../../fp-hkt'; // canonical Either type
import { makeProfunctorBicategory, NatP } from '../profunctor-bicategory';
import { withCoproductMonoidal } from '../profunctor-bicategory';

export interface ChoiceOps<P extends Kind2> {
  left<A, B, C>(pab: Apply<P, [A, B]>): Apply<P, [Either<A, C>, Either<B, C>]>;
  right<A, B, C>(pab: Apply<P, [A, B]>): Apply<P, [Either<C, A>, Either<C, B>]>;
}

export function fromProfunctorChoiceWithSumTensor<P extends Kind2>(ops: {
  id: <A>() => Apply<P, [A, A]>;
  compose: <A, B, C>(g: Apply<P, [B, C]>, f: Apply<P, [A, B]>) => Apply<P, [A, C]>;
  choice: ChoiceOps<P>;
}) {
  const B = makeProfunctorBicategory<P>({ id: ops.id, compose: ops.compose });

  const tensor1 = <A1, B1, A2, B2>(
    f: Apply<P, [A1, B1]>,
    g: Apply<P, [A2, B2]>
  ): Apply<P, [Either<A1, A2>, Either<B1, B2>]> => {
    const leftF = ops.choice.left<A1, B1, A2>(f); // P<Either<A1,A2>, Either<B1,A2>>
    const rightG = ops.choice.right<A2, B2, B1>(g); // P<Either<B1,A2>, Either<B1,B2>>
    return ops.compose(rightG as any, leftF as any) as any;
  };

  // BEGIN PATCH: Choice uses sum (Either) tensor
  return withCoproductMonoidal(B, {
    tensor1,
    tensor2: <A1,B1,A2,B2>(alpha: NatP<P,A1,B1>, beta: NatP<P,A2,B2>) =>
      (p: Apply<P, [Either<A1,A2>, Either<B1,B2>]>) => {
        // p :: (Either<A1,A2>) => Either<B1,B2>
        // Restrict p to each branch to get A1->B1 and A2->B2, transform them with alpha/beta,
        // then rebuild a new (Either<A1,A2>)->Either<B1,B2> that applies the transformed branches.
        const pLeft  = (a1: A1): B1 => {
          const out = (p as unknown as (e: Either<A1,A2>) => Either<B1,B2>)({ left: a1 } as Either<A1,A2>);
          if ('left' in out)  return out.left as B1;
          // If this ever happens, the given p didn't behave as a Choice morphism.
          // Preserve the runtime contract by passing through; we'll favor Left-branch coherence.
          return out as unknown as B1;
        };
        const pRight = (a2: A2): B2 => {
          const out = (p as unknown as (e: Either<A1,A2>) => Either<B1,B2>)({ right: a2 } as Either<A1,A2>);
          if ('right' in out) return out.right as B2;
          return out as unknown as B2;
        };
        const pLeftT  = alpha(pLeft as any)  as unknown as (a1: A1) => B1;
        const pRightT = beta(pRight as any)  as unknown as (a2: A2) => B2;
        const q = (e: Either<A1,A2>): Either<B1,B2> =>
          ('left' in e)
            ? ({ left: pLeftT(e.left as A1) } as Either<B1,B2>)
            : ({ right: pRightT((e as any).right as A2) } as Either<B1,B2>);
        return q as unknown as Apply<P, [Either<A1,A2>, Either<B1,B2>]>;
      }
  });
  // END PATCH
}


