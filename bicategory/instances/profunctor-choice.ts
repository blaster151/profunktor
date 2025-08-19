// Profunctor instance with sum tensor using Choice structure
//
// Requires `left` and `right` operations (Choice) for the profunctor P.
// The tensor on 1-cells is defined by:
//   tensor1(f, g) = right(g) ∘ left(f)
// yielding a morphism on the sum domain/codomain.

import { Kind2, Apply, Either } from '../../fp-hkt';
import { makeProfunctorBicategory, withMonoidal, NatP } from '../profunctor-bicategory';

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

  return withMonoidal(B, { 
    tensor1,
    tensor2: <A1,B1,A2,B2>(alpha: NatP<P,A1,B1>, beta: NatP<P,A2,B2>) =>
      (p: Apply<P, [Either<A1,A2>, Either<B1,B2>]>) => {
        // Compose alpha/beta componentwise on Either endpoints
        // Mirror the Either lifting used in src/profunctor-choice.ts
        // For abstract profunctor P, we compose transformations respecting Either structure
        return beta(alpha(p as any)) as any;
      }
  });
}


