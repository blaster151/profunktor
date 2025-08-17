import { Either } from '../../bicategory/instances/profunctor-choice';
import { ProfunctorChoiceOps, fromProfunctorChoiceWithSumTensor } from '../../bicategory/examples/fromChoiceSumTensor';

// A toy, *finite* relations profunctor for demos: Rel<A,B> := (a: A) => B[]
// (we pick a deterministic image set to keep composition implementable)
export type Rel<A, B> = (a: A) => ReadonlyArray<B>;

const id = <A>() => (a: A) => [a];
const compose = <A, B, C>(r2: Rel<B, C>, r1: Rel<A, B>): Rel<A, C> =>
  (a) => r1(a).flatMap((b) => r2(b));

// Choice structure: map over Either by sides
const left =  <A, B, C>(r: Rel<A,B>) => (e: Either<A, C>): ReadonlyArray<Either<B, C>> =>
  ('left' in e) ? r(e.left).map((b) => ({ left: b } as const)) : [e];
const right = <A, B, C>(r: Rel<A,B>) => (e: Either<C, A>): ReadonlyArray<Either<C, B>> =>
  ('right' in e) ? r(e.right).map((b) => ({ right: b } as const)) : [e];

export const RelChoiceOps: ProfunctorChoiceOps<any> = { id, compose, left, right };

// Build the sum-monoidal structure (law checks can operate on shapes; evaluation compares arrays)
export const SumMonoidalRel = fromProfunctorChoiceWithSumTensor(RelChoiceOps);
