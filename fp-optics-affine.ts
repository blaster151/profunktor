/**
 * Affine optics: focus at most one target (lens-or-prism)
 *
 * Encoding:
 *   Affine<S,T,A,B> = (pab: P<A,B>) -> P<S,T>   requiring Strong & Choice
 * Pragmatic constructor:
 *   match: S -> Either<T, A>     (Left means miss & replacement T, Right means hit A)
 *   set:   (B, S) -> T
 */

import { Profunctor, Strong, Choice } from './fp-adt-optics';

export type Either<L, R> =
  | { _tag: 'Left'; value: L }
  | { _tag: 'Right'; value: R };

export type Affine<S, T, A, B> =
  <P>(P: Strong<any> & Choice<any>, pab: any) => any; // kept loose for painless interop

export function affine<S, T, A, B>(
  match: (s: S) => Either<T, A>,
  set: (b: B, s: S) => T
): {
  asAffine: <P>(P: Strong<any> & Choice<any>, pab: any) => any,
  preview: (s: S) => A | undefined,
  review: (b: B, s: S) => T,
  toLens?: never, // not always possible
  toPrism?: never
} {
  const asAffine = <P>(P: Strong<any> & Choice<any>, pab: any) => {
    // For the function profunctor case: pab :: A -> B
    // We emulate the standard affine traversal encoding:
    return (s: S): T => {
      const m = match(s);
      if (m._tag === 'Left') return m.value;
      const b: B = pab(m.value);
      return set(b, s);
    };
  };

  const preview = (s: S): A | undefined => {
    const m = match(s);
    return m._tag === 'Right' ? m.value : undefined;
  };

  const review = (b: B, s: S): T => set(b, s);

  return { asAffine, preview, review };
}

// Upcasts
export function lensToAffine<S, T, A, B>(
  getter: (s: S) => A,
  setter: (b: B, s: S) => T
) {
  return affine<S, T, A, B>(
    (s) => ({ _tag: 'Right', value: getter(s) }),
    setter
  );
}

export function prismToAffine<S, T, A, B>(
  match: (s: S) => Either<T, A>,
  build: (b: B) => T
) {
  return affine<S, T, A, B>(match, (_b, _s) => build(_b));
}

// Tiny laws (sanity):
// 1) If preview(s) = a, then review(b, s) should replace that occurrence exactly once.
// 2) If preview(s) = undefined, review(b, s) should equal the "miss" branch T carried by match(s).
