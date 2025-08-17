// fp-commutative-applicative.ts
// CommutativeApplicative witness + common instances and planner hook notes

import { Kind1 } from './fp-hkt';
import { Applicative } from './fp-typeclasses-hkt';

export interface CommutativeApplicative<F extends Kind1> extends Applicative<F> {}

// Const applicative is commutative when its Monoid is commutative
export const ConstCommutative = <F extends Kind1>(
  A: Applicative<F>
): CommutativeApplicative<F> => A as CommutativeApplicative<F>;

// Validation applicative is commutative when the Semigroup is commutative
export interface Semigroup<E> { concat: (x: E, y: E) => E }

export function isCommutative<E>(S: Semigroup<E>, xs: E[]): boolean {
  // tiny probe: check a few permutations; documentation-only helper
  if (xs.length < 2) return true;
  const a = S.concat(xs[0], xs[1]);
  const b = S.concat(xs[1], xs[0]);
  return JSON.stringify(a) === JSON.stringify(b);
}


