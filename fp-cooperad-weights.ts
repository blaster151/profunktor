// fp-cooperad-weights.ts
// Weights + laziness for the cooperad-of-trees story.
// - Semiring (with a default Nat semiring)
// - Generator-based admissibleCutsGen (streaming)
// - deltaStream (lazy)
// - deltaW (weighted, merges duplicates via semiring.add)
// - Symmetry modes: planar, symmetric-agg, symmetric-orbit

import type {
  Tree, Forest,
} from "./fp-cooperad-trees";
import {
  t, keyOf, keyForest, pretty,
} from "./fp-cooperad-trees";

// Import symmetry support
import { Rational, RationalSemiring as RS, R } from './math/rational';
import { canonicalize } from './trees/canonicalTree';

// ============================================================================
// Weight Abstraction Layer
// ============================================================================

export interface NumericLike {
  add(b: this): this;
  sub?(b: this): this;
  mul?(b: this): this;
  compare(b: this): number; // -1 | 0 | 1
}

export type Weight<W = number> = W;

export interface WeightMonoid<W = number> {
  empty: W;
  concat: (a: W, b: W) => W;
}

// Factory functions for common weight types
export function numberWeightMonoid(): WeightMonoid<number> {
  return {
    empty: 0,
    concat: (a, b) => a + b,
  };
}

export function bigIntWeightMonoid(): WeightMonoid<bigint> {
  return {
    empty: BigInt(0),
    concat: (a, b) => a + b,
  };
}

export function rationalWeightMonoid(): WeightMonoid<Rational> {
  return {
    empty: R.zero,
    concat: (a, b) => a.add(b),
  };
}

// -----------------------------
// 1) Symmetry Modes
// -----------------------------

// Discriminated union for symmetry modes
export type SymmetryMode =
  | { kind: 'planar' }                        // keep order; no merging; integer weights ok
  | { kind: 'symmetric-agg' }                // canonicalize + merge identical children; no division
  | { kind: 'symmetric-orbit' };             // canonicalize + divide by |Aut| (recommended, needs ℚ)

// -----------------------------
// 2) Polynomial Type for Sums
// -----------------------------

export type Poly<K, W> = Map<K, W>;

export const polyInsert = <K, W>(m: Poly<K, W>, k: K, w: W, add: (a: W, b: W) => W, zero: W) => {
  const prev = m.get(k);
  m.set(k, prev ? add(prev, w) : add(zero, w));
  return m;
};

// -----------------------------
// 3) Node Emission Context
// -----------------------------

export interface EmitCtx<K> {
  poly: Poly<K, Rational>;        // move to ℚ for symmetric-orbit; works for other modes too
  keyOfCurrentNode: K;            // how you identify the produced term
  // the current tree (or subterm) you're emitting; used only if symmetric*
  asTree?: { children: any[] };   // adapt to your real tree type
  mode: SymmetryMode;
}

// compute |Aut| for the current (unordered) shape (ignores labels by default; extend if needed)
function autSizeOf(treeLike: { children: any[] }): bigint {
  // Map children to anonymous Tree and canonicalize
  const toTree = (x: any): { children: any[] } => ({ children: (x?.children ?? []).map(toTree) });
  return canonicalize(toTree(treeLike)).aut;
}

// main: add 1 · term, possibly divided by |Aut|
export function emitNode<K>(ctx: EmitCtx<K>): void {
  const { poly, keyOfCurrentNode: k, mode } = ctx;
  let w = R.fromInt(BigInt(1)); // start with 1

  if (mode.kind === 'planar') {
    // unchanged
  } else if (mode.kind === 'symmetric-agg') {
    // canonicalize upstream to ensure keys merge; no division here
    // nothing to do to weight
  } else if (mode.kind === 'symmetric-orbit') {
    if (!ctx.asTree) throw new Error('symmetric-orbit requires ctx.asTree');
    const aut = autSizeOf(ctx.asTree);       // exact BigInt
    w = w.mul(R.inv(R.fromInt(aut)));        // divide by |Aut|
  }

  polyInsert(poly, k, w, RS.add, RS.zero);
}

// -----------------------------
// 4) Semiring
// -----------------------------
export interface AdditiveMonoid<C> {
  readonly zero: C;
  add(x: C, y: C): C;
}

export interface MultiplicativeMonoid<C> {
  readonly one: C;
  mul(x: C, y: C): C;
}

export interface Semiring<C> extends AdditiveMonoid<C>, MultiplicativeMonoid<C> {}

export const NatSemiring: Semiring<number> = {
  zero: 0,
  one: 1,
  add: (x, y) => x + y,
  mul: (x, y) => x * y,
};

// -----------------------------
// 5) Streaming admissible cuts
// -----------------------------
type Choice<A> =
  | { kind: "cut"; forest: Forest<A>; trunkChild?: undefined }
  | { kind: "descend"; forest: Forest<A>; trunkChild: Tree<A> };

/**
 * Generator version of admissible cuts.
 * Yields lazily: { forest, trunk } for every admissible cut
 * (≤ 1 cut per root→leaf path).
 */
export function* admissibleCutsGen<A>(
  root: Tree<A>
): Generator<{ forest: Forest<A>; trunk: Tree<A> }> {
  if (root.kids.length === 0) {
    // Leaf: only the empty cut
    yield { forest: [], trunk: root };
    return;
  }

  // For each child, we have two "families" of choices:
  //  - CUT HERE: take whole child into forest, do not descend
  //  - DESCEND : do not cut this edge; recurse into child
  const perChild: Array<() => Generator<Choice<A>>> = root.kids.map((child) => {
    function* cutHere(): Generator<Choice<A>> {
      yield { kind: "cut", forest: [child] as Forest<A> };
    }
    function* descend(): Generator<Choice<A>> {
      for (const { forest, trunk } of admissibleCutsGen(child)) {
        yield { kind: "descend", forest, trunkChild: trunk };
      }
    }
    return function* choices() {
      yield* cutHere();
      yield* descend();
    };
  });

  // Cartesian product of choices across children, done lazily
  function* go(
    i: number,
    accForest: Array<Tree<A>>,
    accKids: Array<Tree<A>>
  ): Generator<{ forest: Forest<A>; trunk: Tree<A> }> {
    if (i === perChild.length) {
      yield { forest: accForest.slice(), trunk: t(root.label, accKids.slice()) };
      return;
    }
    for (const ch of perChild[i]()) {
      if (ch.kind === "cut") {
        yield* go(i + 1, accForest.concat(ch.forest), accKids);
      } else {
        yield* go(i + 1, accForest.concat(ch.forest), accKids.concat([ch.trunkChild]));
      }
    }
  }

  yield* go(0, [], []);
}

// -----------------------------
// 6) Lazy Δ: stream of terms
// -----------------------------
export function* deltaStream<A>(
  tr: Tree<A>
): Generator<readonly [Forest<A>, Tree<A>]> {
  for (const { forest, trunk } of admissibleCutsGen(tr)) {
    yield [forest, trunk] as const;
  }
}

// -----------------------------
// 7) Weighted Δ with merging
// -----------------------------
export type WeightedTerm<A, W = number> = {
  coef: Weight<W>;
  forest: Forest<A>;
  trunk: Tree<A>;
};

export type WeightedSum<A, W = number> = Map<string, WeightedTerm<A, W>>;

function pairKey<A>(P: Forest<A>, R: Tree<A>): string {
  return `${keyForest(P)}|${keyOf(R)}`;
}

/**
 * Weighted Δ:
 * - streams all admissible cuts of `tr`
 * - for each term, computes its weight (default 1)
 * - merges duplicate (forest,trunk) pairs by summing coefficients via weight monoid
 *
 * `coefOf` lets you attach custom weights per cut (default: 1 per cut).
 */
export function deltaW<A, W = number>(
  tr: Tree<A>,
  monoid: WeightMonoid<W>,
  coefOf: (P: Forest<A>, R: Tree<A>) => Weight<W> = () => monoid.empty
): WeightedSum<A, W> {
  const out: WeightedSum<A, W> = new Map();
  for (const [P, R] of deltaStream(tr)) {
    const k = pairKey(P, R);
    const w = coefOf(P, R);
    const prev = out.get(k);
    if (prev) {
      out.set(k, { coef: monoid.concat(prev.coef, w), forest: prev.forest, trunk: prev.trunk });
    } else {
      out.set(k, { coef: w, forest: P, trunk: R });
    }
  }
  return out;
}

// -----------------------------
// 8) Symmetry-Aware Δ
// -----------------------------

/**
 * Symmetry-aware weighted Δ with mode selection.
 * Uses Rational coefficients to support orbit normalization.
 */
export function deltaWSym<A>(
  tr: Tree<A>,
  mode: SymmetryMode,
  coefOf: (P: Forest<A>, R: Tree<A>) => Rational = () => R.fromInt(BigInt(1))
): Poly<string, Rational> {
  const poly: Poly<string, Rational> = new Map();
  
  for (const [P, trunk] of deltaStream(tr)) {
    // Determine the key based on mode
    let key: string;
    if (mode.kind === 'planar') {
      // Use existing structural key for planar mode
      key = pairKey(P, trunk);
    } else {
      // For symmetric modes, use canonical codes
      const forestCode = canonicalize({ children: P.map(treeToCanonicalTree) }).code;
      const trunkCode = canonicalize(treeToCanonicalTree(trunk)).code;
      key = `${forestCode}|${trunkCode}`;
    }
    
    // Create emission context
    const ctx: EmitCtx<string> = {
      poly,
      keyOfCurrentNode: key,
      asTree: mode.kind !== 'planar' ? treeToCanonicalTree(tr) : undefined,
      mode
    };
    
    // Emit with appropriate weight
    const baseWeight = coefOf(P, trunk);
    if (mode.kind === 'symmetric-orbit') {
      const aut = autSizeOf(treeToCanonicalTree(tr));
      const normalizedWeight = baseWeight.mul(R.inv(R.fromInt(aut)));
      polyInsert(poly, key, normalizedWeight, RS.add, RS.zero);
    } else {
      polyInsert(poly, key, baseWeight, RS.add, RS.zero);
    }
  }
  
  return poly;
}

// Helper to convert Tree<A> to canonical tree format
function treeToCanonicalTree<A>(tree: Tree<A>): { children: any[] } {
  return {
    children: tree.kids.map(treeToCanonicalTree)
  };
}

// Pretty-print a weighted sum (debug)
export function showWeighted<A, W = number>(
  ws: WeightedSum<A, W>,
  showA: (a: A) => string = (x) => String(x),
  showW: (w: Weight<W>) => string = (x) => String(x)
): string[] {
  const lines: string[] = [];
  for (const { coef, forest, trunk } of ws.values()) {
    lines.push(`${showW(coef)} · ${keyForest(forest, showA)} ⊗ ${keyOf(trunk, showA)}`);
  }
  return lines;
}

// Pretty-print a polynomial (debug)
export function showPoly<K, W>(
  poly: Poly<K, W>,
  showK: (k: K) => string = (k) => String(k),
  showW: (w: W) => string = (w) => String(w)
): string[] {
  const lines: string[] = [];
  for (const [key, weight] of poly) {
    lines.push(`${showW(weight)} · ${showK(key)}`);
  }
  return lines;
}

// Browser-compatible execution check
// Note: Examples can be called directly by creating a demo function
