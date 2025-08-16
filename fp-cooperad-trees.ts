// fp-cooperad-trees.ts
// Planar rooted trees; enumerate ALL admissible cuts (≤1 cut per root→leaf path).
// A cut returns a pair: (pruned forest, trunk-with-holes-closed).

export type Tree<A> = { label: A; kids: ReadonlyArray<Tree<A>> };
export type Forest<A> = ReadonlyArray<Tree<A>>;

export function t<A>(label: A, kids: ReadonlyArray<Tree<A>> = []): Tree<A> {
  return { label, kids };
}

export function leaf<A>(label: A): Tree<A> {
  return { label, kids: [] };
}

// Pretty-print (planar)
export function pretty<A>(tr: Tree<A>, show = (a: A) => String(a)): string {
  if (!tr.kids.length) return show(tr.label);
  return `${show(tr.label)}(${tr.kids.map(k => pretty(k, show)).join(", ")})`;
}

// String key for maps/multisets
export function keyOf<A>(tr: Tree<A>, show = (a: A) => String(a)): string {
  return pretty(tr, show); // stable enough given planar order
}

export function keyForest<A>(fs: Forest<A>, show = (a: A) => String(a)): string {
  return `[${fs.map(x => keyOf(x, show)).join("|")}]`;
}

/**
 * Enumerate all admissible cuts of a tree.
 * In each child edge we choose:
 *  - CUT HERE: take the whole child subtree into the pruned forest; do NOT recurse inside it
 *  - DESCEND: do NOT cut that edge; recurse and collect all admissible cuts below
 * We take the cartesian product of choices across children.
 *
 * Each yielded pair is: { forest, trunk }
 * - forest: the (possibly empty) list of pruned subtrees
 * - trunk : the original node with children replaced by either
 *           (a) nothing, if we cut directly under this node, or
 *           (b) the recursively truncated child, if we descended.
 */
export function admissibleCuts<A>(root: Tree<A>): Array<{ forest: Forest<A>; trunk: Tree<A> }> {
  // For each child produce two families of choices:
  //  CUT:   { forest: [child], trunkChild: null }
  //  DESC:  all { forest: f_i, trunkChild: t_i } from admissibleCuts(child)
  type Choice<A> =
    | { kind: "cut"; forest: Forest<A>; trunkChild: null }
    | { kind: "descend"; forest: Forest<A>; trunkChild: Tree<A> };

  const choicesPerChild: Array<Array<Choice<A>>> = root.kids.map((child) => {
    const rec = admissibleCuts(child).map(({ forest, trunk }) =>
      ({ kind: "descend", forest, trunkChild: trunk } as const)
    );
    const cutHere = [{ kind: "cut", forest: [child] as Forest<A>, trunkChild: null } as const];
    return [...cutHere, ...rec];
  });

  if (choicesPerChild.length === 0) {
    // Leaf: only the empty cut
    return [{ forest: [], trunk: root }];
  }

  // Cartesian product over children choices - fully immutable
  function go(i: number, accForest: ReadonlyArray<Tree<A>>, accKids: ReadonlyArray<Tree<A>>): Array<{ forest: Forest<A>; trunk: Tree<A> }> {
    if (i === choicesPerChild.length) {
      return [{ forest: accForest, trunk: t(root.label, accKids) }];
    }
    
    const results: Array<{ forest: Forest<A>; trunk: Tree<A> }> = [];
    for (const ch of choicesPerChild[i]) {
      if (ch.kind === "cut") {
        // prune this whole child; no trunk child
        const newForest = [...accForest, ...ch.forest];
        results.push(...go(i + 1, newForest, accKids));
      } else {
        // descend: keep truncated child in the trunk
        const newForest = [...accForest, ...ch.forest];
        const newKids = [...accKids, ch.trunkChild];
        results.push(...go(i + 1, newForest, newKids));
      }
    }
    return results;
  }

  return go(0, [], []);
}

// Browser-compatible demo function
export function demoCooperadTrees() {
  const ex = t("f", [t("g", [leaf("x"), leaf("y")]), leaf("z")]);
  const cuts = admissibleCuts(ex);
  console.log("Tree:", pretty(ex));
  console.log("Cuts:", cuts.length);
  for (const { forest, trunk } of cuts) {
    console.log("  Δ term:", keyForest(forest), "⊗", keyOf(trunk));
  }
}
