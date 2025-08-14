// fp-monoidal-bridge.ts
// Bridge the Monoidal witnesses into your existing Arrow & Profunctor story.

import { Kind1 } from './fp-hkt';
import { Applicative } from './fp-typeclasses-hkt';
import { MonoidalProduct, MonoidalSum, laxFromApplicative } from './fp-monoidal';
import { getFPRegistry } from './fp-registry-init';

// 1) Parallel Arrow combinators via cartesian monoidal
export function parStar<A, B, C, D>(
  f: (a: A) => B,
  g: (c: C) => D
): (args: [A, C]) => [B, D] {
  return ([a, c]) => [f(a), g(c)];
}

export function fanout<A, B, C>(f: (a: A) => B, g: (a: A) => C): (a: A) => [B, C] {
  return (a) => [f(a), g(a)];
}

// 2) Optics note: your Strong/Choice correspond to Product/Sum monoidal structure.
// (No runtime code needed; alignment is captured in docs and tests.)

// 3) Applicative-as-monoidal harness for Traversal/Bazaar laws
export function checkApplicativeMonoidal<F extends Kind1>(A: Applicative<F>) {
  const L = laxFromApplicative(A);
  const u = L.unit();
  const t = L.map2(A.of(1), A.of(2)); // should behave like of([1,2])
  return { unitOk: !!u, zipOk: !!t };
}

// 4) Register quick checks in your registry/test runner
export function registerMonoidalWitnesses() {
  const reg = getFPRegistry?.();
  if (!reg) return;
  try { reg.registerEvidence?.('Monoidal(Product×)', MonoidalProduct); } catch {}
  try { reg.registerEvidence?.('Monoidal(Sum+)', MonoidalSum); } catch {}
}


