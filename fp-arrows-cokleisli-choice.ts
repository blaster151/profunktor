/**
 * ArrowChoice for CoKleisli given a distributive witness:
 *   splitEither: W<Either<A,C>> -> Either<W<A>, W<C>>
 *
 * Notes:
 * - This is the standard "CoKleisli is ArrowChoice if W is cocartesian" shape.
 * - You already have (or recently added) Category/Arrow for CoKleisli; we extend with `left`.
 * - We also expose a tiny Id comonad instance for smoke tests + optional registry glue.
 */

import { Kind1, Apply } from './fp-hkt';
import { Either, Left, Right, matchEither } from './fp-either-unified';

// Import arrow functions - adjust path as needed
import { ArrowFromCoKleisli } from './fp-arrows-cokleisli';

// Minimal Comonad (align with your existing one if exported elsewhere)
export interface Comonad<W extends Kind1> {
  extract<A>(wa: Apply<W, [A]>): A;
  extend<A, B>(wa: Apply<W, [A]>, f: (w: Apply<W, [A]>) => B): Apply<W, [B]>;
  map<A, B>(wa: Apply<W, [A]>, f: (a: A) => B): Apply<W, [B]>; // Required for ArrowFromCoKleisli
}

// CoKleisli carrier
export type CoKleisli<W extends Kind1, A, B> = (wa: Apply<W, [A]>) => B;

export interface CoKleisliK<W extends Kind1> extends Kind1 {
  readonly type: CoKleisli<W, this['arg0'], any>;
}

// Category / Arrow / ArrowChoice dictionaries (keep in sync with your project)
export interface Category<F> {
  id<A>(): any; // A ~> A
  compose<A, B, C>(g: any, f: any): any; // (A~>B) -> (B~>C) -> (A~>C)
}

export interface Arrow<F> extends Category<F> {
  arr<A, B>(f: (a: A) => B): any;                 // A ~> B
  first<A, B, C>(f: any): any;                    // (A~>B) -> ([A,C] ~> [B,C])
}

export interface ArrowChoice<F> extends Arrow<F> {
  left<A, B, C>(f: any): any;                     // (A~>B) -> (Either<A,C] ~> Either<B,C])
}

// Witness: distribute Either out of W
export interface ChoiceW<W extends Kind1> {
  splitEither<A, C>(wac: Apply<W, [Either<A, C>]>): Either<Apply<W, [A]>, Apply<W, [C]>>;
}

// Base CoKleisli Arrow (assume you already have one; provided here for completeness)
export function arrowCoKleisli<W extends Kind1>(W: Comonad<W>): Arrow<CoKleisliK<W>> {
  const id = <A>(): CoKleisli<W, A, A> => (wa) => W.extract(wa);
  const compose = <A, B, C>(g: CoKleisli<W, B, C>, f: CoKleisli<W, A, B>): CoKleisli<W, A, C> =>
    (wa) => g(W.extend(wa, f));

  const arr = <A, B>(f: (a: A) => B): CoKleisli<W, A, B> =>
    (wa) => f(W.extract(wa));

  // `first` needs a strength-like ability W<[A,C]> -> [W<A>, C].
  // Provide it via extend+extract in a standard CoKleisli way:
  // we assume the comonad can map; if not, this is still valid for many W (e.g., Cofree with functor tail).
  const first = <A, B, C>(f: CoKleisli<W, A, B>): CoKleisli<W, [A, C], [B, C]> =>
    (wac) => {
      const a = (W as any).map ? (W as any).map(wac, (t: [A, C]) => t[0]) : (wac as any);
      const c = (W as any).map ? (W as any).map(wac, (t: [A, C]) => t[1]) : (wac as any);
      const b = f(a);
      const c0 = W.extract(c) as C; // Type assertion to fix unknown -> C
      return [b, c0];
      return [b, c0];
    };

  return { id, compose, arr, first };
}

// Extend with ArrowChoice via ChoiceW witness
export function arrowChoiceCoKleisli<W extends Kind1>(
  W: Comonad<W>,
  base: Arrow<CoKleisliK<W>>,
  choiceW: ChoiceW<W>
): ArrowChoice<CoKleisliK<W>> {
  const left = <A, B, C>(f: CoKleisli<W, A, B>): CoKleisli<W, Either<A, C>, Either<B, C>> =>
    (wac) => {
      const split = choiceW.splitEither<A, C>(wac);
      return matchEither(split as any, {
        Left: (wa: any)  => Left(f(wa)) as any,
        Right: (wc: any) => Right(W.extract(wc)) as any
      });
    };

  return { ...base, left };
}

// ---------------------------------------------
// Tiny Id comonad + smoke test
// ---------------------------------------------

// IdK functor/comonad
export interface IdK extends Kind1 { readonly type: this['arg0']; }
const Id: Comonad<IdK> = {
  extract: <A>(a: A) => a,
  extend: <A, B>(a: A, f: (x: A) => B) => f(a),
  map: <A, B>(a: A, f: (x: A) => B) => f(a)
};

const Choice_Id: ChoiceW<IdK> = {
  splitEither: <A, C>(eac: Either<A, C>) =>
    matchEither(eac, {
      Left: (a)  => Left(a as any as Apply<IdK, [A]>),
      Right: (c) => Right(c as any as Apply<IdK, [C]>)
    })
};

// Optional registry hook (safe no-op if registry is absent)
export function registerArrowChoiceCoKleisli_Id(): void {
  try {
    // Use dynamic import to avoid Node.js require issues in ES modules
    import('./fp-registry-init').then(({ getFPRegistry }) => {
      const reg = getFPRegistry?.();
      if (!reg) return;

      const base = ArrowFromCoKleisli(Id);
      const ac = arrowChoiceCoKleisli(Id, base, Choice_Id);
      reg.register?.('CoKl<Id>', 'CoKleisliK<IdK>');
      // Fix register calls to use correct number of parameters
      reg.register?.('Arrow', base);
      reg.register?.('ArrowChoice', ac);
    }).catch(() => {
      // Silently ignore registry failures
    });
  } catch {
    // Silently ignore import failures
  }
}

// Export test function for module testing
export function runArrowChoiceCoKleisliTests(): void {
  const base = ArrowFromCoKleisli(Id);
  const AC = arrowChoiceCoKleisli(Id, base, Choice_Id);

  const f = base.arr((n: number) => n + 1);
  const l = AC.left<number, number, string>(f);

  const L = Left(41);
  const R = Right('ok');

  console.log('left(arr(+1)) on Left 41 ->', l(L)); // Left 42
  console.log('left(arr(+1)) on Right "ok" ->', l(R)); // Right "ok"

  // pseudo law check: left(arr f) == arr (left f)
  const arrLeft = base.arr((e: Either<number, string>) =>
    matchEither(e, { Left: (n: number) => Left(n + 1), Right: (s: string) => Right(s) })
  );
  const lhs = l;               // left(arr (+1))
  const rhs = arrLeft;         // arr(left (+1))
  console.log('law (shape only) passes:', JSON.stringify(lhs(L)) === JSON.stringify(rhs(L))
    && JSON.stringify(lhs(R)) === JSON.stringify(rhs(R)));
}
