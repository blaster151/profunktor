// Concrete P instance: the category of functions (Hask)
// 1-cells: (A) => B encoded by `FunctionK`
// 2-cells: defaulted to identity/endocomposition from the profunctor bicategory builder

import { FunctionK } from '../../../fp-hkt';
import { makeProfunctorBicategory, withMonoidal } from '../profunctor-bicategory';

export const FunctionKBicategory = makeProfunctorBicategory<FunctionK>({
  id: <A>() => (a: A) => a,
  compose: <A, B, C>(g: (b: B) => C, f: (a: A) => B) => (a: A) => g(f(a)),
});

export const FunctionKBicategoryMonoidal = withMonoidal(FunctionKBicategory, {
  tensor1: <A1, B1, A2, B2>(
    f: (a1: A1) => B1,
    g: (a2: A2) => B2
  ) => ([a1, a2]: [A1, A2]) => [f(a1), g(a2)] as [B1, B2],
});


