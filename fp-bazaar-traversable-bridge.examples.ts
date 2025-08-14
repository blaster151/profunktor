/**
 * Examples for fp-bazaar-traversable-bridge.ts
 * - Build a Bazaar from an Array Traversable
 * - Run traversal via Id applicative
 * Tweak imports to your local paths if needed.
 */

import { Kind1, Apply } from './fp-hkt';
import { Applicative, Traversable } from './fp-typeclasses-hkt';
import {
  toBazaarFromTraversable,
  runTraversalViaApplicative,
  IdApplicative
} from './fp-bazaar-traversable-bridge';

// -------------------------
// Minimal ArrayK Traversable instance (local, for examples)
// -------------------------
export interface ArrayK extends Kind1 { type: Array<this['arg0']>; }

const ArrayTraversable: Traversable<ArrayK> = {
  map: <A, B>(ta: A[], f: (a: A) => B): B[] => ta.map(f),
  traverse: <F extends Kind1, A, B>(
    F: Applicative<F>,
    k: (a: A) => Apply<F, [B]>,
    ta: A[]
  ): Apply<F, [B[]]> => {
    // Classic traverse via fold, using Applicative
    return ta.reduce<Apply<F, [B[]]>>(
      (acc, a) =>
        F.ap(
          F.map(acc, (bs: B[]) => (b: B) => [...bs, b]),
          k(a)
        ),
      F.of([] as B[])
    );
  }
};

// -------------------------
// 1) Bazaar from Traversable(Array)
// -------------------------
const bazaar = toBazaarFromTraversable(ArrayTraversable)<number, string>();
const r1 = bazaar(IdApplicative, (n: number) => String(n * 2))([1, 2, 3]);
console.log('toBazaarFromTraversable/Id result:', r1); // ["2","4","6"]

// -------------------------
// 2) Direct Applicative fast-path
// -------------------------
const r2 = runTraversalViaApplicative<ArrayK, any, number, number>(
  ArrayTraversable,
  IdApplicative,
  (n) => n + 1,
  [10, 20, 30]
);
console.log('runTraversalViaApplicative/Id result:', r2); // [11,21,31]

// If you want to try an effectful path, wire a small Option/Result Applicative
// and pass it in; the same example code will lift through the effect.
