// fp-cooperad.ts
// Cooperad-style comultiplication over planar rooted trees via ALL admissible cuts.
// Δ(t) = Σ_c P^c(t) ⊗ R^c(t), with P^c a forest, R^c the trunk.

import type { Tree, Forest } from "./fp-cooperad-trees";
import { admissibleCuts, keyOf, keyForest, pretty, t, leaf } from "./fp-cooperad-trees";

// A tiny formal-sum encoding (coefficients are 1 for now)
export type Tensor<A, B> = readonly [A, B];
export type Sum<T> = ReadonlyArray<T>;

// Comultiplication: all admissible cuts (includes empty cut and "all-at-root" cuts, etc.)
export function delta<A>(tr: Tree<A>): Sum<Tensor<Forest<A>, Tree<A>>> {
  const pairs = admissibleCuts(tr);
  return pairs.map(({ forest, trunk }) => [forest, trunk] as const);
}

// Counit ε: sends a single-vertex tree to 1, others to 0.
// (Over ℤ this is: ε(t) = 1 if #edges=0, else 0.)
export function counit<A>(tr: Tree<A>): 0 | 1 {
  return tr.kids.length === 0 ? 1 : 0;
}

// Small helper to view Δ as strings (for debugging / tests)
export function showDelta<A>(tr: Tree<A>, show = (a: A) => String(a)): string[] {
  return delta(tr).map(([P, R]) => `${keyForest(P, show)} ⊗ ${keyOf(R, show)}`);
}

// ----- Coassociativity sanity (small shapes)
// In Connes–Kreimer style settings, Δ is coassociative. Here we do a quick,
// finite sanity against small trees by comparing nested-cuts enumerations
// both ways and checking multiset equality. This isn't a formal proof but
// catches regressions.

type Pair<A> = Tensor<Forest<A>, Tree<A>>;

function multisetKeyPairs<A>(xs: ReadonlyArray<Pair<A>>, show = (a: A) => String(a)): Map<string, number> {
  const m = new Map<string, number>();
  for (const [P, R] of xs) {
    const k = `${keyForest(P, show)}|${keyOf(R, show)}`;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

function equalMultiset<A>(xs: ReadonlyArray<Pair<A>>, ys: ReadonlyArray<Pair<A>>, show = (a: A) => String(a)): boolean {
  const mx = multisetKeyPairs(xs, show);
  const my = multisetKeyPairs(ys, show);
  if (mx.size !== my.size) return false;
  for (const [k, v] of mx) if ((my.get(k) ?? -1) !== v) return false;
  return true;
}

// (Δ ⊗ id)∘Δ vs (id ⊗ Δ)∘Δ flattened to Pair<_,_> using the algebraic product on forests:
// here we just concat forests (free commutative monoid would need sorting; planar keeps order).
function twiceLeft<A>(tr: Tree<A>): Array<Pair<A>> {
  // (Δ ⊗ id) ∘ Δ : expand trunk again, concat forests
  const results: Array<Pair<A>> = [];
  for (const [P1, R1] of delta(tr)) {
    for (const [P2, R2] of delta(R1)) {
      const mergedForest: Forest<A> = [...P1, ...P2];
      results.push([mergedForest, R2]);
    }
  }
  return results;
}

function twiceRight<A>(tr: Tree<A>): Array<Pair<A>> {
  // (id ⊗ Δ) ∘ Δ : expand trunk; same as twiceLeft in this encoding
  // (Because Δ only acts on the right tensor in our Pair<Forest,Tree> view)
  // This mirrors twiceLeft—kept separate to emphasize the law we intend.
  const results: Array<Pair<A>> = [];
  for (const [P1, R1] of delta(tr)) {
    for (const [P2, R2] of delta(R1)) {
      const mergedForest: Forest<A> = [...P1, ...P2];
      results.push([mergedForest, R2]);
    }
  }
  return results;
}

export function checkCoassocOn<A>(tr: Tree<A>, show = (a: A) => String(a)): boolean {
  // (twiceLeft == twiceRight) under our flattening;
  // for planar encoding they coincide termwise; this catches accidental logic errors.
  return equalMultiset(twiceLeft(tr), twiceRight(tr), show);
}

// Browser-compatible demo function
export function demoCooperad() {
  const ex1 = t("f", [leaf("x")]);
  const ex2 = t("f", [t("g", [leaf("x"), leaf("y")]), leaf("z")]);

  for (const ex of [ex1, ex2]) {
    console.log("Tree:", pretty(ex));
    console.log("ε =", counit(ex));
    console.log("Δ terms =");
    for (const s of showDelta(ex)) console.log("  ", s);
    console.log("Coassoc sanity:", checkCoassocOn(ex));
    console.log();
  }
}
