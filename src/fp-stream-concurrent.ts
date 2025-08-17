// fp-stream-concurrent.ts
import { Kind1, Apply } from '../fp-hkt';
import { StreamK } from './fp-stream-core';

export interface AsyncEffect<F extends Kind1> {
  // minimal; adapt to your IO/Async effect later
  fromPromise<A>(thunk: () => Promise<A>): Apply<F, [A]>;
}

export function parEvalMap<F extends Kind1, A, B>(
  F: AsyncEffect<F>,
  n: number,
  f: (a: A) => Promise<B>
): (s: StreamK<F, A>) => StreamK<F, B> {
  // implement as: buffer inputs, run up to n promises, emit in completion order
  // keep it small here; wire real back-pressure later
  return (s) => s.evalMap((a) => F.fromPromise(() => f(a))) as any;
}

// `merge` is similar; you can model as `interleave` of two streams with async boundaries.
