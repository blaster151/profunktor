// fp-cofree-lazy-bfs-build.ts
//
// Build a LazyCofree<F,A> breadth-first using a "level stepper":
//   nextLayer(parents: A[], depth: number) => A[][]
// returning, for each parent in `parents`, its children (as plain arrays).
//
// We stay fully generic in F by requiring a small FromArray<F> helper to
// inject arrays into F, and Functor<F> to map under F when we need it.

import { Kind1, Apply } from './fp-hkt';
import { Functor } from './fp-typeclasses-hkt';
import { LazyCofree } from './fp-cofree-lazy';

// ------------------------------
// FromArray typeclass (minimal)
// ------------------------------
export interface FromArray<F extends Kind1> {
  fromArray<A>(xs: A[]): Apply<F, [A]>;
}

// If you want, add instances alongside your registry:
// export const ArrayFromArray: FromArray<ArrayK> = { fromArray: xs => xs as any };

// ------------------------------------------------------------
// BFS builder: level-driven unfold into LazyCofree<F, A>
// ------------------------------------------------------------
export function unfoldLazyCofreeBFS<F extends Kind1, A>(
  F: Functor<F>,
  From: FromArray<F>,
  root: A,
  nextLayer: (parents: A[], depth: number) => A[][]
): LazyCofree<F, A> {
  // Node whose tail "knows" which level it belongs to, and its index in that level.
  const nodeWithLevel = (head: A, depth: number, levelHeads: A[], indexInLevel: number): LazyCofree<F, A> => ({
    head,
    tail: () => {
      // For the whole level, ask for children partitioned *per parent*.
      const groups: A[][] = nextLayer(levelHeads, depth) ?? [];
      const myKids: A[] = groups[indexInLevel] ?? [];

      // Compute the *next* level (flattened) and my offset in that flattened list.
      let offset = 0;
      for (let i = 0; i < indexInLevel; i++) offset += (groups[i]?.length ?? 0);
      const nextLevelHeads: A[] = ([] as A[]).concat(...groups);

      // Build my children nodes; each child closes over nextLevelHeads with its absolute index.
      const childNodes: LazyCofree<F, A>[] = myKids.map((h, j) =>
        nodeWithLevel(h, depth + 1, nextLevelHeads, offset + j)
      );

      // Tail is F<LazyCofree<F,A>> injected from array.
      return From.fromArray(childNodes) as Apply<F, [LazyCofree<F, A>]>;
    }
  });

  // Seed at depth 0, level [root], index 0
  return nodeWithLevel(root, 0, [root], 0);
}
