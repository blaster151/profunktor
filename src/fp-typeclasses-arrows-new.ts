// src/fp-typeclasses-arrows.ts
import { Kind2, Apply } from '../fp-hkt';

export interface Category<P extends Kind2> {
  effectTag: 'Pure' | 'IO' | 'Async' | 'State' | string;
  usageBound: '∞' | number | string;
  id<A>(): Apply<P, [A, A]>;
  compose<A,B,C>(pbc: Apply<P,[B,C]>, pab: Apply<P,[A,B]>): Apply<P,[A,C]>;
}

export interface Arrow<P extends Kind2> extends Category<P> {
  arr<A,B>(f: (a: A) => B): Apply<P,[A,B]>;
  first<A,B,C>(pab: Apply<P,[A,B]>): Apply<P, [[A,C],[B,C]]>;
}

export interface ArrowChoice<P extends Kind2> extends Arrow<P> {
  left<A,B,C>(pab: Apply<P,[A,B]>): Apply<P, [import('../fp-hkt').Either<A,C>, import('../fp-hkt').Either<B,C>]>;
}

export interface ArrowApply<P extends Kind2> extends Arrow<P> {
  app<A,B>(): Apply<P, [[Apply<P,[A,B]>, A], B]>;
}
