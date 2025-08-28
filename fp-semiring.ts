/**
 * Semiring + Kleene/Star + generic matrix closure.
 * Pairs nicely with transitive/shortest-path closure:
 *  - Boolean semiring (∨, ∧) → reachability
 *  - Tropical semiring (min, +) → shortest paths
 */

import { assertDefined } from './src/util/assert';
import { safeArrayAccess } from './src/utils/strict-helpers';

// ---------- Type classes ----------
export interface Semiring<A> {
  readonly zero: A;                 // additive identity
  readonly one: A;                  // multipliclicative identity
  add(x: A, y: A): A;               // ⊕
  mul(x: A, y: A): A;               // ⊗
}

// Kleene algebra / star semiring
export interface StarSemiring<A> extends Semiring<A> {
  star(a: A): A;                    // a*  = 1 ⊕ a ⊕ a^2 ⊕ ...
}

// ---------- Instances ----------
export const BoolSemiring: StarSemiring<boolean> = {
  zero: false,             // ∨-identity
  one: true,               // ∧-identity
  add: (x, y) => x || y,   // ⊕ = ∨
  mul: (x, y) => x && y,   // ⊗ = ∧
  star: (_a) => true       // in Boolean dioid, a* = true
};

export const NatSemiring: StarSemiring<number> = {
  zero: 0,
  one: 1,
  add: (x, y) => x + y,
  mul: (x, y) => x * y,
  // formal star diverges over ℕ; provide guarded star for a∈{0}
  star: (a) => (a === 0 ? 1 : Number.POSITIVE_INFINITY)
};

// Tropical (min,+); “one” is 0 for ⊗, “zero” is +∞ for ⊕
export const TropicalSemiring: StarSemiring<number> = {
  zero: Number.POSITIVE_INFINITY,       // min-identity
  one: 0,                               // + identity
  add: (x, y) => Math.min(x, y),        // ⊕ = min
  mul: (x, y) => x + y,                 // ⊗ = +
  // Kleene star solves 1 ⊕ a ⊗ x = x; in tropics, star(a)=0 if a≥0 else -∞
  star: (a) => (a >= 0 ? 0 : Number.NEGATIVE_INFINITY)
};

// ---------- Small helpers ----------
export function powS<A>(S: Semiring<A>, a: A, n: number): A {
  let acc = S.one, base = a, k = n;
  while (k > 0) {
    if (k & 1) acc = S.mul(acc, base);
    base = S.mul(base, base);
    k >>= 1;
  }
  return acc;
}

// ---------- Matrices over a semiring ----------
export type Matrix<A> = A[][];

export function matMul<A>(S: Semiring<A>, X: Matrix<A>, Y: Matrix<A>): Matrix<A> {
  const n = X.length;
  const firstRow = assertDefined(Y[0], "matMul: Y must have at least one row");
  const m = firstRow.length, k = Y.length;
  const Z: Matrix<A> = Array.from({ length: n }, () => Array(m).fill(S.zero));
  for (let i = 0; i < n; i++) {
    for (let t = 0; t < k; t++) {
      const xit = assertDefined(X[i]?.[t], "matMul: X[i][t] must be defined");
      if (xit === S.zero) continue;
      for (let j = 0; j < m; j++) {
        const ytj = assertDefined(Y[t]?.[j], "matMul: Y[t][j] must be defined");
        const zij = assertDefined(Z[i]?.[j], "matMul: Z[i][j] must be defined");
        const row = assertDefined(Z[i], "matMul: Z[i] must be defined");
        row[j] = S.add(zij, S.mul(xit, ytj));
      }
    }
  }
  return Z;
}

export function matId<A>(S: Semiring<A>, n: number): Matrix<A> {
  const I: Matrix<A> = Array.from({ length: n }, () => Array(n).fill(S.zero));
  for (let i = 0; i < n; i++) {
    const row = assertDefined(I[i], "matId: I[i] must be defined");
    row[i] = S.one;
  }
  return I;
}

// Reflexive closure: A ↦ I ⊕ A
export function reflexive<A>(S: Semiring<A>, A0: Matrix<A>): Matrix<A> {
  const n = A0.length;
  const I = matId(S, n);
  const R = A0.map((row, i) => row.map((aij, j) => {
    const iij = assertDefined(I[i]?.[j], "reflexive: I[i][j] must be defined");
    return S.add(iij, aij);
  }));
  return R;
}

// Warshall-style closure over a StarSemiring:
// C := (I ⊕ A) with iterative C[i,j] ⊕= C[i,k] ⊗ (A[k,k])^* ⊗ C[k,j]
// For boolean/tropical, reduces to classic transitive/shortest-path closure.
export function closure<A>(S: StarSemiring<A>, A0: Matrix<A>): Matrix<A> {
  const n = A0.length;
  const C = reflexive(S, A0).map(row => row.slice());
  for (let k = 0; k < n; k++) {
    const akk = assertDefined(A0[k]?.[k], "closure: A0[k][k] must be defined");
    const akkStar = S.star(akk);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const cik = assertDefined(C[i]?.[k], "closure: C[i][k] must be defined");
        const ckj = assertDefined(C[k]?.[j], "closure: C[k][j] must be defined");
        const cij = assertDefined(C[i]?.[j], "closure: C[i][j] must be defined");
        const via = S.mul(cik, S.mul(akkStar, ckj));
        const row = assertDefined(C[i], "closure: C[i] must be defined");
        row[j] = S.add(cij, via);
      }
    }
  }
  return C;
}

// ---------- Ready-made closures ----------
export function transitiveClosureBool(adj: Matrix<boolean>): Matrix<boolean> {
  return closure(BoolSemiring, adj);
}
export function shortestPathsTropical(weight: Matrix<number>): Matrix<number> {
  return closure(TropicalSemiring, weight);
}


