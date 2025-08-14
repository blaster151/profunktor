/**
 * Examples for fp-optics-law-harness.ts
 * - Affine (array head) passes Optional-style laws
 * - Indexed lens (second field of a pair) coheres with plain lens laws
 */

import {
  checkAffineLaws,
  checkIndexedLensCoherence,
  Eq, Gen,
  Either
} from './fp-optics-law-harness';

// -------------------------
// Helpers
// -------------------------
const eqNumArr: Eq<number[]> = (xs, ys) =>
  xs.length === ys.length && xs.every((x, i) => x === ys[i]);

const eqPair: Eq<[number, number]> = (a, b) => a[0] === b[0] && a[1] === b[1];
const eqStr: Eq<string> = (a, b) => a === b;

// few simple generators
const genSmallInt: Gen<number> = () => Math.floor(Math.random() * 5);
const genNumArr: Gen<number[]> = () => {
  const n = Math.floor(Math.random() * 3); // 0..2
  return Array.from({ length: n }, genSmallInt);
};

// -------------------------
// Affine example: head of array
//   S = number[],  T = number[],  A = number,  B = number
//   - hit if array non-empty
//   - miss if empty (set is a no-op => returns original)
// -------------------------
const headMatch = (s: number[]): Either<number[], number> =>
  s.length > 0 ? { _tag: 'Right', value: s[0] } : { _tag: 'Left', value: s };

const headSet = (b: number, s: number[]): number[] =>
  s.length > 0 ? [b, ...s.slice(1)] : s;

// Run affine laws
const affineRes = checkAffineLaws<number[], number[], number, number>({
  match: headMatch,
  set: headSet,
  genS: genNumArr,
  genB: genSmallInt,
  eqT: eqNumArr,
  samples: 100
});

console.log('Affine(head) laws:', affineRes);

// -------------------------
// Indexed lens example: focus on 2nd component of a pair
//   S = [n0, n1], T = [n0, n1], I = 'snd', A=B=number
// -------------------------
type Pair = [number, number];
const genPair: Gen<Pair> = () => [genSmallInt(), genSmallInt()];

const getIA = (s: Pair): ['snd', number] => ['snd', s[1]];
const setSnd = (b: number, s: Pair): Pair => [s[0], b];

const indexedRes = checkIndexedLensCoherence<Pair, Pair, 'snd', number, number>({
  getIA,
  set: setSnd,
  genS: genPair,
  genB: genSmallInt,
  eqT: eqPair,
  eqI: eqStr,
  samples: 100
});

console.log('Indexed Lens(second) coherence:', indexedRes);
