// src/semantics/subobjects.ts
export type Sub<T> = (x: T) => boolean;

export const Top = <T>(): Sub<T> => (_: T) => true;
export const Bot = <T>(): Sub<T> => (_: T) => false;
export const Meet = <T>(a: Sub<T>, b: Sub<T>): Sub<T> => (x) => a(x) && b(x);
export const Join = <T>(a: Sub<T>, b: Sub<T>): Sub<T> => (x) => a(x) || b(x);
export const Impl = <T>(a: Sub<T>, b: Sub<T>): Sub<T> => (x) => (!a(x) || b(x)); // Heyting ⇒ (Set-model)

export const inverseImage = <A,B>(h: (x:A)=>B, a: Sub<B>): Sub<A> => (x) => a(h(x));

// ∃ along a mono: Set-model = image-inclusion; we model as identity predicate transport.
export const existsAlongMono = <A>(incl: (a:A)=>A, a: Sub<A>): Sub<A> => (x) => a(incl(x));

// ∀ along a projection p: X×Z → X  (need the finite Z to compute)
export function forallAlongProjection<X,Z>(Zall: readonly Z[], S: Sub<[X,Z]>): Sub<X> {
  return (x: X) => Zall.every(z => S([x,z]));
}
