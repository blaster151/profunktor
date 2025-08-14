// fp-trampoline.ts
//
// A tiny trampoline plus a Traversable-powered "streaming toStrict" for LazyCofree.
// Works one layer at a time, no deep recursion required.

import { Kind1, Apply } from './fp-hkt';
import { Functor, Traversable, Applicative } from './fp-typeclasses-hkt';
import { Cofree, cofree } from './fp-free';
import { LazyCofree } from './fp-cofree-lazy';

// ------------------------
// Trampoline (Done|More)
// ------------------------
export type Trampoline<T> = { tag: 'done'; value: T } | { tag: 'more'; thunk: () => Trampoline<T> };

export const Tramp = {
  done: <T>(value: T): Trampoline<T> => ({ tag: 'done', value }),
  more: <T>(thunk: () => Trampoline<T>): Trampoline<T> => ({ tag: 'more', thunk })
};

export function runTrampoline<T>(t: Trampoline<T>): T {
  let cur = t;
  // iterative driver
  for (;;) {
    if (cur.tag === 'done') return cur.value;
    cur = cur.thunk();
  }
}

// Minimal Applicative instance for Trampoline (sufficient for Traversable.traverse)
export const TrampolineApplicative: Applicative<any> = {
  of: Tramp.done,
  map: <A, B>(ta: Trampoline<A>, f: (a: A) => B): Trampoline<B> =>
    ta.tag === 'done' ? Tramp.done(f(ta.value)) : Tramp.more(() => TrampolineApplicative.map(ta.thunk(), f)),
  ap: <A, B>(tf: Trampoline<(a: A) => B>, ta: Trampoline<A>): Trampoline<B> => {
    if (tf.tag === 'done') {
      if (ta.tag === 'done') return Tramp.done(tf.value(ta.value));
      // ta is 'more'
      return Tramp.more(() => TrampolineApplicative.ap(tf, ta.thunk()));
    }
    // tf is 'more'
    return Tramp.more(() => TrampolineApplicative.ap(tf.thunk(), ta));
  }
};

// ------------------------
// Streaming toStrict
// ------------------------
//
// Requires Traversable<F> so we can traverse F<Trampoline<X>> -> Trampoline<F<X>>.
// This keeps the whole conversion in trampoline space until the very end.

export function toStrictTramp<F extends Kind1, A>(
  functor: Functor<F> & Traversable<F>,
  wa: LazyCofree<F, A>
): Cofree<F, A> {
  // Build a Trampoline<Cofree<F,A>> for the whole structure
  const build = (w: LazyCofree<F, A>): Trampoline<Cofree<F, A>> =>
    Tramp.more(() => {
      const tailF: Apply<F, [LazyCofree<F, A>]> = w.tail();
      // traverse under F, turning each child into a trampoline of strict child
      const trampTail: Trampoline<Apply<F, [Cofree<F, A>]>> =
        functor.traverse(tailF, (child) => build(child)) as any;

      // Once the trampoline for the tail is resolved, assemble the Cofree node
      return Tramp.more(() => {
        const strictTail = runTrampoline(trampTail);
        return Tramp.done(cofree(w.head, strictTail));
      });
    });

  return runTrampoline(build(wa));
}

// Convenience: sequence a functor of trampolines (if you need it)
// (Usually you can just use F.traverse(TrampolineApplicative, fa, id))
export function sequenceTrampoline<F extends Kind1, A>(
  functor: Traversable<F>,
  fta: Apply<F, [Trampoline<A>]>
): Trampoline<Apply<F, [A]>> {
  return functor.traverse(fta, (x) => x) as any;
}


