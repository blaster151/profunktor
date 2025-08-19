import { Kind1, Kind2, Apply, Either } from './fp-hkt';
import { Functor, Applicative, Monad } from './fp-typeclasses-hkt';
import { Category, Arrow, ArrowChoice, ArrowApply } from './src/fp-typeclasses-arrows';

// Re-export the arrow types for external use
export { Category, Arrow, ArrowChoice, ArrowApply };

export interface Profunctor<P extends Kind2> {
  dimap<A, B, C, D>(
    pab: Apply<P, [A, B]>,
    f: (c: C) => A,
    g: (b: B) => D
  ): Apply<P, [C, D]>;
  lmap<A, B, C>(pab: Apply<P, [A, B]>, f: (c: C) => A): Apply<P, [C, B]>;
  rmap<A, B, D>(pab: Apply<P, [A, B]>, g: (b: B) => D): Apply<P, [A, D]>;
}

export interface Strong<P extends Kind2> extends Profunctor<P> {
  first<A, B, C>(pab: Apply<P, [A, B]>): Apply<P, [[A, C], [B, C]]>;
  second<A, B, C>(pab: Apply<P, [A, B]>): Apply<P, [[C, A], [C, B]]>;
}

export interface Choice<P extends Kind2> extends Profunctor<P> {
  left<A, B, C>(pab: Apply<P, [A, B]>): Apply<P, [Either<A, C>, Either<B, C>]>;
  right<A, B, C>(pab: Apply<P, [A, B]>): Apply<P, [Either<C, A>, Either<C, B>]>;
}

export type EffectTag = 'Pure' | 'State' | 'Async' | 'IO';
export type UsageBound = 1 | '∞';

// -----------------------------
// Kleisli & Star HKTs
// -----------------------------
export type Kleisli<M extends Kind1, A, B> = (a: A) => Apply<M, [B]>;
export interface KleisliK<M extends Kind1> extends Kind2 {
  readonly type: (a: this['arg0']) => Apply<M, [this['arg1']]>;
}

export type Star<F extends Kind1, A, B> = (a: A) => Apply<F, [B]>;
export interface StarK<F extends Kind1> extends Kind2 {
  readonly type: (a: this['arg0']) => Apply<F, [this['arg1']]>;
}

// Either helpers consistent with fp-hkt's Either shape
const Left = <L, R = never>(value: L): Either<L, R> => ({ left: value });
const Right = <L, R = never>(value: R): Either<L, R> => ({ right: value });

// -----------------------------
// Profunctor witnesses
// -----------------------------
export function ProfunctorFromKleisli<M extends Kind1>(M: Functor<M>): Profunctor<KleisliK<M>> {
  return {
    dimap: <A, B, C, D>(
      pab: Apply<KleisliK<M>, [A, B]>,
      f: (c: C) => A,
      g: (b: B) => D
    ): Apply<KleisliK<M>, [C, D]> => 
      ((c: C) => M.map((pab as any)(f(c)), g)) as Apply<KleisliK<M>, [C, D]>,
    lmap: <A, B, C>(pab: Apply<KleisliK<M>, [A, B]>, f: (c: C) => A): Apply<KleisliK<M>, [C, B]> =>
      ((c: C) => (pab as any)(f(c))) as Apply<KleisliK<M>, [C, B]>,
    rmap: <A, B, D>(pab: Apply<KleisliK<M>, [A, B]>, g: (b: B) => D): Apply<KleisliK<M>, [A, D]> =>
      ((a: A) => M.map((pab as any)(a), g)) as Apply<KleisliK<M>, [A, D]>
  };
}

export function StrongFromKleisli<M extends Kind1>(M: Functor<M>): Strong<KleisliK<M>> {
  const P = ProfunctorFromKleisli(M);
  return {
    ...P,
    first: <A, B, C>(pab: Apply<KleisliK<M>, [A, B]>): Apply<KleisliK<M>, [[A, C], [B, C]]> =>
      (([a, c]: [A, C]) => M.map((pab as any)(a), (b) => [b, c] as [B, C])) as Apply<KleisliK<M>, [[A, C], [B, C]]>,
    second: <A, B, C>(pab: Apply<KleisliK<M>, [A, B]>): Apply<KleisliK<M>, [[C, A], [C, B]]> =>
      (([c, a]: [C, A]) => M.map((pab as any)(a), (b) => [c, b] as [C, B])) as Apply<KleisliK<M>, [[C, A], [C, B]]>
  };
}

export function ChoiceFromKleisli<M extends Kind1>(M: Monad<M>): Choice<KleisliK<M>> {
  const P = ProfunctorFromKleisli<M>(M as any);
  return {
    ...P,
    left: <A, B, C>(pab: Apply<KleisliK<M>, [A, B]>): Apply<KleisliK<M>, [Either<A, C>, Either<B, C>]> =>
      ((e: Either<A, C>) =>
        'left' in e
          ? M.map((pab as any)(e.left), (b: B) => Left<B, C>(b))
          : M.of(Right<B, C>(e.right as C))) as Apply<KleisliK<M>, [Either<A, C>, Either<B, C>]>,
    right: <A, B, C>(pab: Apply<KleisliK<M>, [A, B]>): Apply<KleisliK<M>, [Either<C, A>, Either<C, B>]> =>
      ((e: Either<C, A>) =>
        'right' in e
          ? M.map((pab as any)(e.right as A), (b: B) => Right<C, B>(b))
          : M.of(Left<C, B>(e.left as C))) as Apply<KleisliK<M>, [Either<C, A>, Either<C, B>]>
  };
}

export function ProfunctorFromStar<F extends Kind1>(F: Functor<F>): Profunctor<StarK<F>> {
  return {
    dimap: <A, B, C, D>(
      pab: Apply<StarK<F>, [A, B]>,
      f: (c: C) => A,
      g: (b: B) => D
    ): Apply<StarK<F>, [C, D]> => 
      ((c: C) => F.map((pab as any)(f(c)), g)) as Apply<StarK<F>, [C, D]>,
    lmap: <A, B, C>(pab: Apply<StarK<F>, [A, B]>, f: (c: C) => A): Apply<StarK<F>, [C, B]> =>
      ((c: C) => (pab as any)(f(c))) as Apply<StarK<F>, [C, B]>,
    rmap: <A, B, D>(pab: Apply<StarK<F>, [A, B]>, g: (b: B) => D): Apply<StarK<F>, [A, D]> =>
      ((a: A) => F.map((pab as any)(a), g)) as Apply<StarK<F>, [A, D]>
  };
}

export function StrongFromStar<F extends Kind1>(F: Functor<F>): Strong<StarK<F>> {
  const P = ProfunctorFromStar(F);
  return {
    ...P,
    first: <A, B, C>(pab: Apply<StarK<F>, [A, B]>): Apply<StarK<F>, [[A, C], [B, C]]> =>
      (([a, c]: [A, C]) => F.map((pab as any)(a), (b) => [b, c] as [B, C])) as Apply<StarK<F>, [[A, C], [B, C]]>,
    second: <A, B, C>(pab: Apply<StarK<F>, [A, B]>): Apply<StarK<F>, [[C, A], [C, B]]> =>
      (([c, a]: [C, A]) => F.map((pab as any)(a), (b) => [c, b] as [C, B])) as Apply<StarK<F>, [[C, A], [C, B]]>
  };
}

export function ChoiceFromStar<F extends Kind1>(F: Applicative<F> & Functor<F>): Choice<StarK<F>> {
  const P = ProfunctorFromStar(F);
  return {
    ...P,
    left: <A, B, C>(pab: Apply<StarK<F>, [A, B]>): Apply<StarK<F>, [Either<A, C>, Either<B, C>]> =>
      ((e: Either<A, C>) =>
        'left' in e
          ? F.map((pab as any)(e.left), (b: B) => Left<B, C>(b))
          : F.of(Right<B, C>(e.right as C))) as Apply<StarK<F>, [Either<A, C>, Either<B, C>]>,
    right: <A, B, C>(pab: Apply<StarK<F>, [A, B]>): Apply<StarK<F>, [Either<C, A>, Either<C, B>]> =>
      ((e: Either<C, A>) =>
        'right' in e
          ? F.map((pab as any)(e.right as A), (b: B) => Right<C, B>(b))
          : F.of(Left<C, B>(e.left as C))) as Apply<StarK<F>, [Either<C, A>, Either<C, B>]>
  };
}

// -----------------------------
// Arrow witnesses
// -----------------------------
export function ArrowFromKleisli<M extends Kind1>(M: Monad<M>):
  Category<KleisliK<M>> & Arrow<KleisliK<M>> & ArrowChoice<KleisliK<M>> & ArrowApply<KleisliK<M>> {

  return {
    effectTag: 'Pure' as any,
    usageBound: '∞' as any,
    
    id: <A>(): Apply<KleisliK<M>, [A, A]> => 
      ((a: A) => M.of(a)) as Apply<KleisliK<M>, [A, A]>,
      
    compose: <A, B, C>(pbc: Apply<KleisliK<M>, [B, C]>, pab: Apply<KleisliK<M>, [A, B]>): Apply<KleisliK<M>, [A, C]> =>
      ((a: A) => M.chain((pab as any)(a), (b: B) => (pbc as any)(b))) as Apply<KleisliK<M>, [A, C]>,
      
    arr: <A, B>(f: (a: A) => B): Apply<KleisliK<M>, [A, B]> => 
      ((a: A) => M.of(f(a))) as Apply<KleisliK<M>, [A, B]>,
      
    first: <A, B, C>(pab: Apply<KleisliK<M>, [A, B]>): Apply<KleisliK<M>, [[A, C], [B, C]]> =>
      (([a, c]: [A, C]) => M.map((pab as any)(a), (b: B) => [b, c] as [B, C])) as Apply<KleisliK<M>, [[A, C], [B, C]]>,
      
    left: <A, B, C>(pab: Apply<KleisliK<M>, [A, B]>): Apply<KleisliK<M>, [Either<A, C>, Either<B, C>]> =>
      ((e: Either<A, C>) => 
        'left' in e
          ? M.map((pab as any)(e.left), (b: B) => Left<B, C>(b))
          : M.of(Right<B, C>(e.right as C))) as Apply<KleisliK<M>, [Either<A, C>, Either<B, C>]>,
          
    app: <A, B>(): Apply<KleisliK<M>, [[Apply<KleisliK<M>, [A, B]>, A], B]> =>
      (([pab, a]: [Apply<KleisliK<M>, [A, B]>, A]) => (pab as any)(a)) as Apply<KleisliK<M>, [[Apply<KleisliK<M>, [A, B]>, A], B]>
  };
}

// Note: Star<F,_,_> generally does NOT form an Arrow unless F has stronger structure.
// We expose Profunctor/Strong/Choice for Star; use Kleisli(M) or CoKleisli(W) for Arrow needs.

// -----------------------------
// Runners
// -----------------------------
export const runKleisli = <M extends Kind1, A, B>(k: Kleisli<M, A, B>) => k;
export const runStar    = <F extends Kind1, A, B>(s: Star<F, A, B>) => s;


