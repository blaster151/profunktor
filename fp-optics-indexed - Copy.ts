/**
 * Indexed optics (pragmatic, profunctor-friendly)
 *
 * - Introduces an Indexed function profunctor: IndexedK<I> ~ A -> [I, B]
 * - Constructors: ilens, itraversal
 * - Runners: iview, itoListOf, iover, iset
 *
 * Notes:
 * - Stays compatible with your existing profunctor optics: you can "run" any lens/traversal
 *   through the Indexed profunctor to obtain indices when the optic was built with them.
 * - If a plain (non-indexed) optic is run with IndexedK, you'll just get a dummy index you supply.
 */

import { Kind2, Apply } from './fp-hkt';
// Minimal local interfaces to avoid heavy deps
export interface Profunctor<P extends Kind2> {
  dimap<A, B, C, D>(
    pab: Apply<P, [A, B]>,
    f: (c: C) => A,
    g: (b: B) => D
  ): Apply<P, [C, D]>;
}

export interface Strong<P extends Kind2> extends Profunctor<P> {
  first<A, B, C>(pab: Apply<P, [A, B]>): Apply<P, [[A, C], [B, C]]>;
  second<A, B, C>(pab: Apply<P, [A, B]>): Apply<P, [[C, A], [C, B]]>;
}

export interface Choice<P extends Kind2> extends Profunctor<P> {
  left<A, B, C>(pab: Apply<P, [A, B]>): Apply<P, [any, any]>;
  right<A, B, C>(pab: Apply<P, [A, B]>): Apply<P, [any, any]>;
}

// -----------------------------
// Indexed function profunctor
// -----------------------------

export interface IndexedK<I> extends Kind2 {
  readonly type: (a: this['arg0']) => [I, this['arg1']];
}

export type IndexedFn<I, A, B> = (a: A) => [I, B];

export const IndexedProfunctor = <I>() => ({
  dimap:
    <A, B, C, D>(pab: IndexedFn<I, A, B>, f: (c: C) => A, g: (b: B) => D): ((c: C) => [I, D]) =>
      (c: C) => {
        const [i, b] = pab(f(c));
        return [i, g(b)];
      }
}) as unknown as Profunctor<IndexedK<I>>;

export const IndexedStrong = <I>() => ({
  ...(IndexedProfunctor<I>() as unknown as any),
  first:
    <A, B, C>(pab: IndexedFn<I, A, B>): ((ac: [A, C]) => [I, [B, C]]) =>
      ([a, c]) => {
        const [i, b] = pab(a);
        return [i, [b, c]];
      },
  second:
    <A, B, C>(pab: IndexedFn<I, A, B>): ((ca: [C, A]) => [I, [C, B]]) =>
      ([c, a]) => {
        const [i, b] = pab(a);
        return [i, [c, b]];
      }
}) as unknown as Strong<IndexedK<I>>;

// (Optional) Choice for Indexed — index threads untouched through Either
export const IndexedChoice = <I>() => ({
  ...(IndexedProfunctor<I>() as unknown as any),
  left:
    <A, B, C>(pab: IndexedFn<I, A, B>) =>
      (e: { _tag: 'Left', value: A } | { _tag: 'Right', value: C }) => {
        if (e._tag === 'Left') {
          const [i, b] = pab(e.value);
          return { _tag: 'Left' as const, value: [i, b] } as const;
        }
        return { _tag: 'Right' as const, value: e.value } as const;
      },
  right:
    <A, B, C>(pab: IndexedFn<I, A, B>) =>
      (e: { _tag: 'Left', value: C } | { _tag: 'Right', value: A }) => {
        if (e._tag === 'Right') {
          const [i, b] = pab(e.value);
          return { _tag: 'Right' as const, value: [i, b] } as const;
        }
        return { _tag: 'Left' as const, value: e.value } as const;
      }
}) as unknown as Choice<IndexedK<I>>;

// --------------------------------------
// Indexed Lens / Traversal constructors
// --------------------------------------

/**
 * Indexed lens: provide a getter that returns both index and focus.
 * The setter is the usual S × B -> T.
 */
export function ilens<S, T, I, A, B>(
  getIA: (s: S) => [I, A],
  set: (b: B, s: S) => T
) {
  // Plain (unindexed) lens is still useful everywhere
  const asLens = (pab: (a: A) => B) =>
    (s: S): T => set(pab(getIA(s)[1]), s);

  // When "run" with IndexedStrong<I>(), you obtain [I, T]
  const asIndexed = (pab: IndexedFn<I, A, B>) =>
    (s: S): [I, T] => {
      const [i, a] = getIA(s);
      const [, b] = pab(a);
      return [i, set(b, s)];
    };

  // Expose getter to allow iview-style helpers without losing indices
  return { asLens, asIndexed, getIA };
}

/**
 * Indexed traversal: supply all (index, focus) pairs and a bulk modifier.
 */
export function itraversal<S, T, I, A, B>(
  getAll: (s: S) => Array<[I, A]>,
  modifyAll: (f: (i: I, a: A) => B, s: S) => T
) {
  const asTraversal = (pab: (a: A) => B) =>
    (s: S): T => modifyAll((_i, a) => pab(a), s);

  const asIndexed = (pab: IndexedFn<I, A, B>) =>
    (s: S): [Array<I>, T] => {
      const pairs = getAll(s);
      const idxs: I[] = [];
      const t = modifyAll((i, a) => {
        idxs.push(i);
        const [, b] = pab(a);
        return b;
      }, s);
      return [idxs, t];
    };

  return { asTraversal, asIndexed, getAll };
}

// -----------------------------
// User-facing helpers
// -----------------------------

export function iview<S, I, A>(
  ln: ReturnType<typeof ilens<S, S, I, A, A>>,
  s: S
): [I, A] {
  const [i, a] = ln.getIA(s);
  return [i, a];
}

/** Collect all (index, focus) pairs from an indexed traversal. */
export function itoListOf<S, I, A>(
  tr: ReturnType<typeof itraversal<S, S, I, A, A>>,
  s: S
): Array<[I, A]> {
  return tr.getAll(s);
}

/** Modify with awareness of indices. */
export function iover<S, T, I, A, B>(
  tr: ReturnType<typeof itraversal<S, T, I, A, B>>,
  f: (i: I, a: A) => B,
  s: S
): T {
  return tr.asIndexed((a: A) => [undefined as any as I, f(undefined as any as I, a)])(s)[1];
}

/** Set all foci to a single B (ignoring index). */
export function iset<S, T, I, A, B>(
  tr: ReturnType<typeof itraversal<S, T, I, A, B>>,
  b: B,
  s: S
): T {
  return tr.asTraversal((_a) => b)(s);
} 