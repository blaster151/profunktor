// Concrete P instance: minimal profunctor-like with id/compose supplied by caller
// This serves as a ready-made hook to plug your existing profunctor dictionary.

import { Kind2, Apply } from 'fp-hkt';
import { makeProfunctorBicategory, withMonoidal, NatP } from '../profunctor-bicategory';

export function fromProfunctor<P extends Kind2>(ops: {
  id: <A>() => Apply<P, [A, A]>;
  compose: <A, B, C>(g: Apply<P, [B, C]>, f: Apply<P, [A, B]>) => Apply<P, [A, C]>;
  tensor1?: <A1, B1, A2, B2>(
    f: Apply<P, [A1, B1]>,
    g: Apply<P, [A2, B2]>
  ) => Apply<P, [[A1, A2], [B1, B2]]>;
  id2?: <A, B>(f: Apply<P, [A, B]>) => NatP<P, A, B>;
  vert?: <A, B>(beta: NatP<P, A, B>, alpha: NatP<P, A, B>) => NatP<P, A, B>;
  horiz?: <A, B, C>(beta: NatP<P, B, C>, alpha: NatP<P, A, B>) => NatP<P, A, C>;
}) {
  const base = makeProfunctorBicategory<P>({
    id: ops.id,
    compose: ops.compose,
    id2: ops.id2,
    horiz: ops.horiz,
  });

  if (ops.tensor1) {
    return withMonoidal(base, { 
      tensor1: ops.tensor1,
      tensor2: <A1,B1,A2,B2>(alpha: NatP<P,A1,B1>, beta: NatP<P,A2,B2>) =>
        (p: Apply<P, [[A1,A2],[B1,B2]]>) => {
          // Compose alpha/beta componentwise on product endpoints
          // Apply alpha to first component and beta to second component
          const first  = (alpha as any)(p as any) as Apply<P, [[A1,A2],[B1,B2]]>;
          const second = (beta  as any)(first as any) as Apply<P, [[A1,A2],[B1,B2]]>;
          return second as any;
        }
    });
  }
  return base;
}


