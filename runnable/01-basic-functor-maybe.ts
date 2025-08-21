// "map + filter + fold" over Maybe

// basic-functor-maybe.ts
// Demonstrates: map, filter, fold on Maybe

// ?? adjust the import path if needed
import {
  just, nothing, map, filter, fold, type Maybe
} from '../fp-maybe';

const assertEq = (label: string, got: unknown, expected: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  console.log(`${label}:`, ok ? 'OK' : `FAIL (got ${got}, expected ${expected})`);
  if (!ok) throw new Error(label);
};

function program(): string {
  // Start with a value, bump it, keep it if > 40, then fold to a string
  const m1 = just(41);
  const m2 = map((n: number) => n + 1, m1);           // Just(42)
  const m3 = filter((n: number) => n > 40, m2);       // Just(42)
  const out = fold(
    () => 'No value',
    (n: number) => `Value: ${n}`,
    m3
  );
  return out;
}

const result = program();
console.log('RESULT:', result);
assertEq('Functor/Filter/Fold', result, 'Value: 42');