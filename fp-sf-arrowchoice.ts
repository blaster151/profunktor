// fp-sf-arrowchoice.ts
//
// ArrowChoice for pure Mealy-style stream functions:
// SF<I, O> ≅ { step: (i: I) => [O, SF<I,O>] }
// This version has no initial O; arr/id/compose/first/left are total and law-abiding.
// If you already created an SF elsewhere, wire these dictionaries to it;
// otherwise, this file is standalone.

import { Kind2, Apply, Either } from './fp-hkt';

// Minimal SF definition
export interface SF<I, O> {
  step(i: I): [O, SF<I, O>];
}

// HKT wrapper
export interface SFK extends Kind2 {
  readonly type: SF<this['arg0'], this['arg1']>;
}

// Helpers
export const sf = <I, O>(f: (i: I) => [O, SF<I, O>]): SF<I, O> => ({ step: f });

// Category / Arrow / ArrowChoice
export interface Category<Arr extends Kind2> {
  id<A>(): Apply<Arr, [A, A]>;
  compose<A, B, C>(g: Apply<Arr, [B, C]>, f: Apply<Arr, [A, B]>): Apply<Arr, [A, C]>;
}

export interface Arrow<Arr extends Kind2> extends Category<Arr> {
  arr<A, B>(f: (a: A) => B): Apply<Arr, [A, B]>;
  first<A, B, C>(pab: Apply<Arr, [A, B]>): Apply<Arr, [[A, C], [B, C]]>;
}

const Left = <L, R = never>(left: L): Either<L, R> => ({ left });
const Right = <R, L = never>(right: R): Either<L, R> => ({ right });

export interface ArrowChoiceTC<Arr extends Kind2> extends Arrow<Arr> {
  left<A, B, C>(pab: Apply<Arr, [A, B]>): Apply<Arr, [Either<A, C>, Either<B, C>]>;
}

// Dictionaries
export const categorySF: Category<SFK> = {
  id: <A>(): Apply<SFK, [A, A]> =>
    sf<A, A>((a) => [a, categorySF.id<A>() as SF<A, A>]) as Apply<SFK, [A, A]>,
  compose: <A, B, C>(g: Apply<SFK, [B, C]>, f: Apply<SFK, [A, B]>): Apply<SFK, [A, C]> =>
    sf<A, C>((a: A) => {
      const [b, f1] = (f as any).step(a);
      const [c, g1] = (g as any).step(b);
      return [c, categorySF.compose(g1 as any, f1 as any) as SF<A, C>];
    }) as Apply<SFK, [A, C]>
};

export const arrowSF: Arrow<SFK> = {
  ...categorySF,
  arr: <A, B>(f: (a: A) => B): Apply<SFK, [A, B]> =>
    sf<A, B>((a) => [f(a), arrowSF.arr(f) as SF<A, B>]) as Apply<SFK, [A, B]>,
  first: <A, B, C>(pab: Apply<SFK, [A, B]>): Apply<SFK, [[A, C], [B, C]]> =>
    sf<[A, C], [B, C]>(([a, c]) => {
      const [b, pab1] = (pab as any).step(a);
      return [[b, c], arrowSF.first(pab1) as SF<[A, C], [B, C]>];
    }) as Apply<SFK, [[A, C], [B, C]]>
};

export const arrowChoiceSF: ArrowChoiceTC<SFK> = {
  ...arrowSF,
  left: <A, B, C>(pab: Apply<SFK, [A, B]>): Apply<SFK, [Either<A, C>, Either<B, C>]> =>
    sf<Either<A, C>, Either<B, C>>((eac) => {
      if ('left' in eac) {
        const [b, pab1] = (pab as any).step(eac.left as A);
        return [Left<B, C>(b), arrowChoiceSF.left(pab1) as SF<Either<A, C>, Either<B, C>>];
      } else {
        return [Right<C, B>(eac.right as C), arrowChoiceSF.left(pab) as SF<Either<A, C>, Either<B, C>>];
      }
    }) as Apply<SFK, [Either<A, C>, Either<B, C>]>
};

// Optional: quick registration hook (adapt to your registry/law runner)
export function registerSFArrowChoice(reg: {
  registerHKT: (name: string, hkt: string) => void;
  registerTypeclass: (name: string, cls: string, dict: any) => void;
}) {
  reg.registerHKT('SF', 'SFK');
  reg.registerTypeclass('SF', 'Category', categorySF);
  reg.registerTypeclass('SF', 'Arrow', arrowSF);
  reg.registerTypeclass('SF', 'ArrowChoice', arrowChoiceSF);
}


