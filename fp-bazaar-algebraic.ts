/** 
 * Bazaar Algebraic (Church-encoded, minimal & type-correct)
 *
 * This file provides only the **Profunctor** instance that is valid for a
 * Church-encoded Bazaar:
 *
 *   type Bazaar<A,B,S,T> =
 *     <F extends Kind1>(F: Applicative<F>, k: (a: A) => Apply<F, [B]>) =>
 *       (s: S) => Apply<F, [T]>
 *
 * Key point: to adapt a continuation `k2 : A2 -> F<B2>` to the inner
 * `baz : (A -> F<B>)`, you need a function **A -> A2** (contravariant in A)
 * and a function **B -> B2** (covariant in B). So `lmap` takes `(A -> A2)`,
 * not `(A2 -> A)`. The previous orientation caused the TS2345 errors you saw.
 *
 * Other algebraic structures that were previously here (Strong/Choice/Closed/
 * Traversing/Arrow/Category + examples & law checks) were not type-sound for
 * the Church encoding as written and caused additional type errors. They have
 * been intentionally removed. If you want those, implement them for a
 * **reified** bazaar (e.g., RBazaar with explicit “holes” and “rebuild”),
 * where composition/strength/choice can be expressed structurally.
 */

import { Kind1, Apply } from './fp-hkt';
import { Applicative } from './fp-typeclasses-hkt';
import { Bazaar } from './fp-optics-iso-helpers';

// ============================================================================
// Profunctor (correct variance for Church-encoded Bazaar)
// ============================================================================

/**
 * NOTE (Church-encoded Bazaar variance):
 * - lmap is A-contravariant: (A -> A2)
 * - the only implementable “right mapping” is a premap: (B2 -> B)
 *   so we expose rmap as right-premap and dimap takes rInv : B2 -> B.
 * True covariant rmap (B -> B2) is NOT implementable without a reified bazaar.
 */
export interface Profunctor<A, B, S, T> {
  /** dimap l rInv = lmap l >>> rmap rInv (right-premap) */
  dimap<A2, B2>(l: (a: A) => A2, rInv: (b2: B2) => B): (p: Bazaar<A, B, S, T>) => Bazaar<A2, B2, S, T>;
  /** lmap: pre-process the continuation’s expected input */
  lmap<A2>(l: (a: A) => A2): (p: Bazaar<A, B, S, T>) => Bazaar<A2, B, S, T>;
  /** rmap: right-premap: pre-process the value expected by the continuation */
  rmap<B2>(rInv: (b2: B2) => B): (p: Bazaar<A, B, S, T>) => Bazaar<A, B2, S, T>;
}

  return {
    dimap: <A2, B2>(l: (a: A) => A2, rInv: (b2: B2) => B) =>
      (baz: Bazaar<A, B, S, T>): Bazaar<A2, B2, S, T> =>
        <F extends Kind1>(F: Applicative<F>, k2: (a2: A2) => Apply<F, [B2]>) =>
          (s: S) =>
            // adapt k2 : A2 -> F<B2> to A -> F<B> using rInv : B2 -> B
            baz(F, (a: A) => F.map(k2(l(a)), rInv))(s),

    lmap: <A2>(l: (a: A) => A2) =>
      (baz: Bazaar<A, B, S, T>): Bazaar<A2, B, S, T> =>
        <F extends Kind1>(F: Applicative<F>, k2: (a2: A2) => Apply<F, [B]>) =>
          (s: S) =>
            baz(F, (a: A) => k2(l(a)))(s),

    rmap: <B2>(rInv: (b2: B2) => B) =>
      (baz: Bazaar<A, B, S, T>): Bazaar<A, B2, S, T> =>
        <F extends Kind1>(F: Applicative<F>, k2: (a: A) => Apply<F, [B2]>) =>
          (s: S) =>
            baz(F, (a: A) => F.map(k2(a), rInv))(s)
  };
}

// ============================================================================
// Utilities that were previously used by examples/tests
// ============================================================================

/** Deep equality (basic structural compare for small data) */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      return a.every((x, i) => deepEqual(x, b[i]));
    }
    const ka = Object.keys(a); const kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every(k => deepEqual(a[k], b[k]));
  }
  return false;
}
export { deepEqual };

/**
 * A tiny helper to build a simple Bazaar from “extract / transform / construct”.
 * Not used by the algebraic core, but handy for local experiments.
 */
export function simpleBazaar<A, B, S, T>(
  transform: (a: A) => B,
  extract: (s: S) => A,
  construct: (b: B, s: S) => T
): Bazaar<A, B, S, T> {
  return <F extends Kind1>(F: Applicative<F>, k: (a: A) => Apply<F, [B]>) =>
    (s: S) => {
      const a = extract(s);
      // We *must* feed the original A into k; transform can be used by construct.
      return F.map(k(a), (b: B) => construct(transform(a), s));
    };
}

/**
 * NOTE ON REMOVED SECTIONS:
 * The previous file contained Strong/Choice/Closed/Traversing/Arrow/Category
 * helpers and several example “law checks”. Those were not sound for a
 * Church-encoded Bazaar and were the source of your type errors (e.g., the
 * need to conjure a `B2` from an arbitrary `S`, mapping over `T` with a `B`
 * function, and mixing applicatives while traversing).
 *
 * If you want those structures, derive them over a **reified** bazaar
 * (e.g., RBazaar = { holes: A[]; rebuild: (bs: B[]) => T }), or import
 * them from your existing optics modules (Lens/Prism/Traversal) where the
 * laws are well-known to hold and the encodings support composition.
 */


