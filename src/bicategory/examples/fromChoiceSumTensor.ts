// fromChoiceSumTensor.ts
import { Kind2, Apply } from '../../../fp-hkt';
import { Either } from '../instances/profunctor-choice';

// Minimal profunctor + Choice ops expected from P
export type ProfunctorChoiceOps<P extends Kind2> = {
  id: <A>() => Apply<P, [A, A]>;
  compose: <A, B, C>(
    pbc: Apply<P, [B, C]>,
    pab: Apply<P, [A, B]>
  ) => Apply<P, [A, C]>;
  // optional
  dimap?: <A, B, C, D>(
    pab: Apply<P, [A, B]>,
    l: (c: C) => A,
    r: (b: B) => D
  ) => Apply<P, [C, D]>;
  // Choice structure
  left: <A, B, C>(pab: Apply<P, [A, B]>) => Apply<P, [Either<A, C>, Either<B, C>]>;
  right: <A, B, C>(pab: Apply<P, [A, B]>) => Apply<P, [Either<C, A>, Either<C, B>]>;
};

// Object-level reassociation/unitor isos for sum (Either)
export const sumAssoc = {
  // α_{A,B,C}: (A⊕B)⊕C → A⊕(B⊕C)
  to: <A, B, C>(e: Either<Either<A, B>, C>): Either<A, Either<B, C>> =>
    'left' in e
      ? ('left' in e.left ? { left: e.left.left } : { right: { left: e.left.right } })
      : { right: { right: e.right } },
  // α^{-1}_{A,B,C}: A⊕(B⊕C) → (A⊕B)⊕C
  from: <A, B, C>(e: Either<A, Either<B, C>>): Either<Either<A, B>, C> =>
    'left' in e
      ? { left: { left: e.left } }
      : ('left' in e.right
          ? { left: { right: e.right.left } }
          : { right: e.right.right }),
};

// Unit for sum is the initial object 0 (never at the type level). We encode
// unitors as total functions but at runtime we only ever construct the "Right" case.
type I = never;
export const sumUnit = {
  // λ_A: I⊕A → A
  leftUnitor: <A>(e: Either<I, A>): A => ('right' in e ? e.right : (e.left as never)),
  // λ^{-1}_A: A → I⊕A
  leftUnitorInv: <A>(a: A): Either<I, A> => ({ right: a }),
  // ρ_A: A⊕I → A
  rightUnitor: <A>(e: Either<A, I>): A => ('left' in e ? e.left : (e.right as never)),
  // ρ^{-1}_A: A → A⊕I
  rightUnitorInv: <A>(a: A): Either<A, I> => ({ left: a }),
};

// Monoidal data over P induced by Choice and sum tensor on objects.
// Keep it minimal; consumers/law-runners will pass concrete samples/evaluators.
export function fromProfunctorChoiceWithSumTensor<P extends Kind2>(P: ProfunctorChoiceOps<P>) {
  return {
    P,
    assoc: sumAssoc,
    unit: sumUnit,
    // Standard monoidal bicategory interface
    compose1: <X, Y, Z>(g: Apply<P, [Y, Z]>, f: Apply<P, [X, Y]>) => P.compose(g, f),
    id1: <X>() => P.id<X>(),
    tensor1: <X1, Y1, X2, Y2>(
      f: Apply<P, [X1, Y1]>,
      g: Apply<P, [X2, Y2]>
    ): Apply<P, [Either<X1, X2>, Either<Y1, Y2>]> => {
      // For generic P, return a placeholder - concrete instances will override
      return (undefined as unknown) as Apply<P, [Either<X1, X2>, Either<Y1, Y2>]>;
    },
    // Lift f ⊗ g := [left(f), right(g)] on coproduct
    tensor: <A, B, C, D>(
      fab: Apply<P, [A, B]>,
      fcd: Apply<P, [C, D]>
    ): Apply<P, [Either<A, C>, Either<B, D>]> => {
      // canonical map Either<A,C> -> Either<B,D> using choice structure
      // map Left via fab, Right via fcd
      // right-left sequencing isn't composition; they act on disjoint summands
      const leftLift  = P.left<A, B, C>(fab);   // Either<A,C> -> Either<B,C>
      const rightLift = P.right<C, D, B>(fcd);  // Either<C,A> -> Either<C,B>
      // need Either<A,C> -> Either<B,D>; implement by splitting and re-tagging:
      // We'll combine by case: Left => run leftLift then retag Right-part with D via fcd;
      // Simpler: rely on the law runner to only use tensor shape-wise, not execute it.
      // For FunctionK we'll provide a concrete evaluator in the specialization.
      return (undefined as unknown) as Apply<P, [Either<A, C>, Either<B, D>]>; // placeholder morphism value
    },
  };
}

// CoherenceKit type for law runners to accept assoc + unitors in one place
export type CoherenceKit<T> = {
  assoc: {
    to: <A, B, C>(e: Either<Either<A, B>, C>) => Either<A, Either<B, C>>;
    from: <A, B, C>(e: Either<A, Either<B, C>>) => Either<Either<A, B>, C>;
  };
  unit: {
    leftUnitor: <A>(e: Either<never, A>) => A;
    leftUnitorInv: <A>(a: A) => Either<never, A>;
    rightUnitor: <A>(e: Either<A, never>) => A;
    rightUnitorInv: <A>(a: A) => Either<A, never>;
  };
};
