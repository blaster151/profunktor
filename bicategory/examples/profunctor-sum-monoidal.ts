// Example: Build a monoidal bicategory from a Choice profunctor P using sum tensor

import { Kind2, Apply, FunctionK } from '../../fp-hkt';
import { fromProfunctorChoiceWithSumTensor } from '../instances/profunctor-choice';
import type { Either } from 'fp-hkt';
import { FunctionKBicategoryMonoidal } from '../instances/function';
import { runMonoidalTriangle, runMonoidalPentagon } from '../monoidal-laws';

// For demonstration, we can reuse FunctionK as a trivial profunctor with Choice structure
// by defining `left`/`right` lifting on Either.

type P = FunctionK; // A -> B

const id = <A>() => (a: A) => a;
const compose = <A, B, C>(g: (b: B) => C, f: (a: A) => B) => (a: A) => g(f(a));

const choice = {
  left: <A, B, C>(pab: (a: A) => B) => (e: Either<A, C>): Either<B, C> =>
    'left' in e ? { left: pab(e.left) } : e,
  right: <A, B, C>(pab: (a: A) => B) => (e: Either<C, A>): Either<C, B> =>
    'right' in e ? { right: pab(e.right) } : e,
};

export const SumMonoidalFunctionKBicat = fromProfunctorChoiceWithSumTensor<P>({ id, compose, choice });

// Law checks (illustrative)
const evalP = <X, Y>(p: (x: X) => Y) => p;
const eqPair = <T>(x: T, y: T) => JSON.stringify(x) === JSON.stringify(y);

// Provide associator/unit reindexing as concrete functions where needed for examples.
// For brevity, we reuse product-based associators encoded as functions.
const assoc_abc = <A, B, C>([[a, b], c]: [[A, B], C]) => [a, [b, c]] as [A, [B, C]];
const assoc_bcd = <B, C, D>([[b, c], d]: [[B, C], D]) => [b, [c, d]] as [B, [C, D]];
const assoc_a_bc_d = <A, B, C, D>([a, [b, c, d]]: any) => [a, [b, [c, d]]];
const assoc_ab_cd = <A, B, C, D>([[a, b], [c, d]]: [[A, B], [C, D]]) => [a, [b, [c, d]]];

// These examples show call shapes only; users should pass real morphisms for their P.
runMonoidalPentagon(SumMonoidalFunctionKBicat, {
  evalP,
  eq: eqPair,
  samples: [ [[[1,2],3],4] ],
  assoc: {
    abc: assoc_abc as any,
    bcd: assoc_bcd as any,
    a_bc_d: assoc_a_bc_d as any,
    ab_cd: assoc_ab_cd as any,
  },
});


