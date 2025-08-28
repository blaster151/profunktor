// fp-cofree-async.ts
//
// An async variant of LazyCofree where tail is effectful (Promise).
// Includes: async unfold, DFS/BFS/layers async iterators, and a small bridge
// from your existing LazyCofree (sync) to the async one.

import { Kind1, Apply } from './fp-hkt';
import { Functor, Foldable, Traversable, Applicative } from './fp-typeclasses-hkt';
import { LazyCofree } from './fp-cofree-lazy';
import { Cofree, cofree } from './fp-free';
import { assertDefined, isDefined } from './src/util/assert';

// ------------------------------
// Async Lazy Cofree
// ------------------------------
export interface AsyncLazyCofree<F extends Kind1, A> {
  readonly head: A;
  readonly tail: () => Promise<Apply<F, [AsyncLazyCofree<F, A>]>>;
}

// Lift a sync LazyCofree into an async one (tail thunk wrapped in Promise)
export function liftToAsync<F extends Kind1, A>(
  w: LazyCofree<F, A>
): AsyncLazyCofree<F, A> {
  return {
    head: w.head,
    tail: async () => Promise.resolve(w.tail() as any) as Promise<Apply<F, [AsyncLazyCofree<F, A>]>>
  };
}

// ------------------------------
// Unfold (async successors)
// ------------------------------
//
// Given async successors succ: A -> Promise<F<A>>, produce AsyncLazyCofree<F,A>.
export function unfoldAsync<F extends Kind1, A>(
  F: Functor<F>,
  seed: A,
  succ: (a: A) => Promise<Apply<F, [A]>>
): AsyncLazyCofree<F, A> {
  const build = (a: A): AsyncLazyCofree<F, A> => ({
    head: a,
    tail: async () => {
      const fa = await succ(a);
      // map successors into async nodes
      return F.map(fa, (x: any) => build(x as A)) as Apply<F, [AsyncLazyCofree<F, A>]>;
    }
  });
  return build(seed);
}

// ------------------------------
// Foldable helpers (to array)
// ------------------------------
function toArrayF<F extends Kind1, A>(Fold: Foldable<F>, fx: Apply<F, [A]>): A[] {
  const buf: A[] = [];
  return Fold.foldl(fx, (acc: A[], a: A) => { acc.push(a); return acc; }, buf);
}

// ------------------------------
// Async DFS (preorder, non-recursive)
// ------------------------------
export async function* dfsAsync<F extends Kind1, A>(
  Fold: Foldable<F>,
  root: AsyncLazyCofree<F, A>
): AsyncGenerator<A> {
  const stack: AsyncLazyCofree<F, A>[] = [root];

  while (stack.length) {
    const node = assertDefined(stack.pop(), "dfsAsync: node must be defined");
    yield node.head;

    const kidsF = await node.tail();
    const kids = toArrayF(Fold, kidsF) as unknown as AsyncLazyCofree<F, A>[];
    // push right-to-left so left child is visited first
    for (let i = kids.length - 1; i >= 0; i--) {
      const t = assertDefined(kids[i], "cofree: tail required");
      stack.push(t);
    }
  }
}

// ------------------------------
// Async BFS (level order, non-recursive)
// ------------------------------
export async function* bfsAsync<F extends Kind1, A>(
  Fold: Foldable<F>,
  root: AsyncLazyCofree<F, A>
): AsyncGenerator<A> {
  const q: AsyncLazyCofree<F, A>[] = [root];

  while (q.length) {
    const node = assertDefined(q.shift(), "bfsAsync: node must be defined");
    yield node.head;

    const kidsF = await node.tail();
    const kids = toArrayF(Fold, kidsF) as unknown as AsyncLazyCofree<F, A>[];
    for (const k of kids) q.push(k);
  }
}

// ------------------------------
// Async layers (yield per-depth arrays)
// ------------------------------
export async function* layersAsync<F extends Kind1, A>(
  Fold: Foldable<F>,
  root: AsyncLazyCofree<F, A>
): AsyncGenerator<A[]> {
  let level: AsyncLazyCofree<F, A>[] = [root];

  while (level.length) {
    // Emit the heads we already have *before* computing next level
    yield level.map(n => n.head);

    // Compute next layer in parallel
    const tails = await Promise.all(level.map(n => n.tail()));
    const next: AsyncLazyCofree<F, A>[] = [];
    for (const tf of tails) next.push(...(toArrayF(Fold, tf) as unknown as AsyncLazyCofree<F, A>[]));
    level = next;
  }
}

