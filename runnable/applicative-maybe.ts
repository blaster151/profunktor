// "lift2" using ap to combine two Maybes

// applicative-maybe.ts
// Demonstrates: ap, a tiny lift2 helper, and getOrElse

import {
  just, nothing, map, ap, getOrElse, type Maybe
} from '../fp-maybe';

const assertEq = (label: string, got: unknown, expected: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  console.log(`${label}:`, ok ? 'OK' : `FAIL (got ${got}, expected ${expected})`);
  if (!ok) throw new Error(label);
};

// lift2 :: (A -> B -> C) -> Maybe<A> -> Maybe<B> -> Maybe<C>
const lift2 = <A, B, C>(f: (a: A) => (b: B) => C) =>
  (ma: Maybe<A>) => (mb: Maybe<B>): Maybe<C> =>
    ap(map(f, ma), mb);

function program(): [number, number] {
  const add = (a: number) => (b: number) => a + b;

  const a = just(10);
  const b = just(32);
  const c = nothing<number>();

  const sumAB = lift2(add)(a)(b); // Just(42)
  const sumAC = lift2(add)(a)(c); // Nothing

  const out1 = getOrElse(0, sumAB); // 42
  const out2 = getOrElse(0, sumAC); // 0 (fallback)

  return [out1, out2];
}

const [good, fallback] = program();
console.log('RESULT:', { good, fallback });
assertEq('Applicative good', good, 42);
assertEq('Applicative fallback', fallback, 0);