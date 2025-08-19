// Concrete P instance: the category of functions (Hask)
// 1-cells: (A) => B encoded by `FunctionK`
// 2-cells: defaulted to identity/endocomposition from the profunctor bicategory builder

import { FunctionK } from '../../fp-hkt';
import { makeProfunctorBicategory, withMonoidal, NatP } from '../profunctor-bicategory';

export const FunctionKBicategory = makeProfunctorBicategory<FunctionK>({
  id: <A>() => (a: A) => a,
  compose: <A, B, C>(g: (b: B) => C, f: (a: A) => B) => (a: A) => g(f(a)),
});

export const FunctionKBicategoryMonoidal = withMonoidal(FunctionKBicategory, {
  tensor1: <A1, B1, A2, B2>(
    f: (a1: A1) => B1,
    g: (a2: A2) => B2
  ) => ([a1, a2]: [A1, A2]) => [f(a1), g(a2)] as [B1, B2],
  tensor2: <A1,B1,A2,B2>(alpha: NatP<FunctionK,A1,B1>, beta: NatP<FunctionK,A2,B2>) =>
    (p: (arg: [A1, A2]) => [B1, B2]) => {
      // Compose alpha/beta componentwise on product endpoints
      // Decompose product function, apply transformations, recompose
      return ([a1, a2]: [A1, A2]) => {
        const f1 = (x: A1) => p([x, a2])[0];  // Extract first component function
        const f2 = (x: A2) => p([a1, x])[1];  // Extract second component function
        const g1 = alpha(f1);                  // Apply alpha to first component
        const g2 = beta(f2);                   // Apply beta to second component
        return [g1(a1), g2(a2)] as [B1, B2];  // Recompose
      };
    }
});


