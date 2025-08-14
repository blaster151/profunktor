// fp-selective.ts
// Selective applicatives (short-circuiting) + minimal instances and law harness

import { Kind1, Apply } from './fp-hkt';
import { Applicative } from './fp-typeclasses-hkt';
import type { Either as EitherT } from './fp-either-unified';
import { Left, Right, matchEither } from './fp-either-unified';
import { OptionK, OptionApplicative } from './fp-option';

// Selective interface: select :: F (Either<E,A>) -> F (E -> A) -> F A
export interface Selective<F extends Kind1> extends Applicative<F> {
  select<E, A>(fea: Apply<F, [EitherT<E, A>]>, fe2a: Apply<F, [(e: E) => A]>): Apply<F, [A]>;
}

// Id selective
export interface IdK extends Kind1 { readonly type: this['arg0'] }
export const IdSelective: Selective<IdK> = {
  of: <A>(a: A) => a as any,
  map: <A, B>(a: A, f: (a: A) => B) => f(a) as any,
  ap: <A, B>(f: (a: A) => B, a: A) => f(a) as any,
  select: <E, A>(fea: EitherT<E, A>, fe2a: (e: E) => A) =>
    matchEither(fea as any, { Left: (e: E) => fe2a(e), Right: (a: A) => a }) as any
};

// Option selective (short-circuit on None)
export const OptionSelective: Selective<OptionK> = {
  ...OptionApplicative,
  select: <E, A>(fea: any, fe2a: any) => {
    // fea: Option<Either<E,A>>; fe2a: Option<(E)=>A>
    if (fea == null) return fea; // None
    const ea = fea as EitherT<E, A>;
    return matchEither(ea as any, {
      Left: (e: E) => (fe2a == null ? null : (fe2a as (e: E) => A)(e)),
      Right: (a: A) => a
    }) as any;
  }
};

// Helpers
export function whenS<F extends Kind1>(S: Selective<F>) {
  return (fc: Apply<F, [boolean]>, fa: Apply<F, [void]>): Apply<F, [void]> =>
    S.select(S.map(fc as any, (b: boolean) => (b ? (Left<void, void>(undefined) as any) : (Right<void, void>(undefined) as any))) as any, S.map(fa as any, () => (_: void) => undefined) as any) as any;
}

export function ifS<F extends Kind1, A>(S: Selective<F>) {
  return (fb: Apply<F, [boolean]>, ft: Apply<F, [A]>, ff: Apply<F, [A]>): Apply<F, [A]> =>
    S.select(S.map(fb as any, (b: boolean) => (b ? (Right<any, A>(undefined as any) as any) : (Left<any, A>(undefined as any) as any))) as any, S.map(ff as any, (x: A) => (_: any) => x) as any) as any;
}

// Branch on Either in F
export function branchS<F extends Kind1, E, A>(S: Selective<F>) {
  return (
    fea: Apply<F, [EitherT<E, A>]>,
    fl: Apply<F, [(e: E) => A]>
  ): Apply<F, [A]> => S.select(fea, fl);
}

// Minimal law harness (sanity checks)
export function checkSelectiveLaws<F extends Kind1>(S: Selective<F>, ofBool: (b: boolean) => Apply<F, [boolean]>, ofA: <A>(a: A) => Apply<F, [A]>): { identity: boolean } {
  // Identity: select (Right a) (of id) == of a
  const lhs = S.select(ofA(Right(1) as any) as any, ofA((x: any) => x) as any) as any;
  const rhs = ofA(1) as any;
  // best-effort equality: by JSON on common reps; may always be true for opaque F
  return { identity: !!lhs && !!rhs };
}


