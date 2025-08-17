// Sequencing with chain + a small safe divide; also shows fromNullable & orElse

// monad-maybe.ts
// Demonstrates: chain (flatMap), fromNullable, orElse, getOrElse

import {
  just, nothing, chain, map, fromNullable, orElse, getOrElse, type Maybe
} from '../fp-maybe';

const assertEq = (label: string, got: unknown, expected: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  console.log(`${label}:`, ok ? 'OK' : `FAIL (got ${got}, expected ${expected})`);
  if (!ok) throw new Error(label);
};

const safeDivide = (num: number, den: number): Maybe<number> =>
  den === 0 ? nothing<number>() : just(num / den);

function parseIntMaybe(s: string): Maybe<number> {
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? nothing<number>() : just(n);
}

function program(): [string, string, string] {
  // Success path
  const r1 =
    chain((a: number) =>
      chain((b: number) =>
        map((q: number) => `q=${q}`, safeDivide(a, b)),
      parseIntMaybe('2')),
    parseIntMaybe('84'));
  const out1 = getOrElse('err', r1); // "q=42"

  // Failure path (divide by zero)
  const r2 =
    chain((a: number) =>
      chain((b: number) =>
        map((q: number) => `q=${q}`, safeDivide(a, b)),
      parseIntMaybe('0')),
    parseIntMaybe('84'));
  const out2 = getOrElse('err', r2); // "err"

  // Recovery with orElse
  const recovered = orElse(just(1), r2); // substitute default 1 when Nothing
  const out3 = getOrElse(-1, recovered); // 1

  return [out1, out2, `rec=${out3}`];
}

const [ok1, ok2, ok3] = program();
console.log('RESULT:', { ok1, ok2, ok3 });
assertEq('Monad success', ok1, 'q=42');
assertEq('Monad failure -> default', ok2, 'err');
assertEq('Monad recovery', ok3, 'rec=1');