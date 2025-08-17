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
  const nodeWithLevel = (head: A, depth: number, levelHeads: A[], indexInLevel: number): LazyCofree<F, A> => ({
    head,
    tail: () => {
      const groups: A[][] = nextLayer(levelHeads, depth) ?? [];
      const myKids: A[] = groups[indexInLevel] ?? [];

      let offset = 0;
      for (let i = 0; i < indexInLevel; i++) offset += (groups[i]?.length ?? 0);
      const nextLevelHeads: A[] = ([] as A[]).concat(...groups);

      // zip children with absolute indices
      const pairs: ReadonlyArray<readonly [A, number]> =
        myKids.map((h, j) => [h, offset + j] as const);

      // lift into F and map to child nodes
      const kidsF = From.fromArray(pairs) as Apply<F, [readonly [A, number]]>;
      return F.map(kidsF, ([h, idx]) =>
        nodeWithLevel(h, depth + 1, nextLevelHeads, idx)
      ) as Apply<F, [LazyCofree<F, A>]>;
    }
  });

  return nodeWithLevel(root, 0, [root], 0);
}