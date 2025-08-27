// fp-commutative-applicative.ts
// CommutativeApplicative witness + common instances and planner hook notes

import { Kind1 } from './fp-hkt';
import { Applicative } from './fp-typeclasses-hkt';
import { assertDefined, isDefined } from './src/util/assert';

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
  const x0 = assertDefined(xs[0], "isCommutative: xs[0] must be defined");
  const x1 = assertDefined(xs[1], "isCommutative: xs[1] must be defined");
  const a = S.concat(x0, x1);
  const b = S.concat(x1, x0);
  return JSON.stringify(a) === JSON.stringify(b);
}


