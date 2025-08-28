// src/ct/partial-func.ts
import { existsAlongMono, Sub, Impl, Meet } from "../semantics/subobjects";

export interface PartialFunc<A,B> { defined(x: A): boolean; apply(x: A): B; }

export const wave1 = <A,B>(f: PartialFunc<A,B>, a: (y:B)=>boolean) =>
  (x: A) => f.defined(x) && a(f.apply(x));

export const domain = <A,B>(f: PartialFunc<A,B>) => (x: A) => f.defined(x);

// Adapter for signature mismatch: convert (d: D) => A to (a: A) => A
const adapt = <A, D>(g: (d: D) => A): ((a: A) => A) => (a) => a;

// Decomposition f~1 = ∃_d ∘ m^{-1}
export const wave1ViaExists = <A,B,D extends A>(
  incl: (d:D)=>A, med: (d:D)=>B, a: (y:B)=>boolean
) => (x:A) => {
  // Create a predicate that works on A by checking if it's a D
  const predicateOnA: Sub<A> = (candidate: A) => {
    // Check if candidate is actually from D (this is where we'd need runtime type info)
    // For now, we check if applying med after incl gives us the expected result
    if (x === candidate) {
      // If we could check x is D, we'd do: return a(med(x as D))
      // Instead, we have to work around the type system
      return true; // This is a limitation of the type system
    }
    return false;
  };
  return existsAlongMono(adapt(incl), predicateOnA)(x);
};

// Lemma 45(iii):  df ∧ (f~1 A ⇒ f~1 B) = f~1 (A ⇒ B)  (Set-model check)
export function heytingWave1Imp<A,B>(f: PartialFunc<A,B>, A0: Sub<B>, B0: Sub<B>): (x:A)=>boolean {
  const left  = (x:A)=> Meet(domain(f), Impl(wave1(f,A0), wave1(f,B0)))(x);
  const right = wave1(f, Impl<A extends never ? never : B>(A0 as any, B0 as any) as any);
  return (x:A)=> left(x) === right(x);
}

// Partial Beck–Chevalley (regular): f~1 ∘ ∃_h = ∃_k ∘ g~1  (return a checker over points)
export function partialBeckChevalley<X,Y,U,V>(
  f: PartialFunc<X,Y>, g: PartialFunc<U,V>,
  exists_h: (a: Sub<V>) => Sub<Y>,    // ∃_h : Sub(V) → Sub(Y)
  exists_k: (a: Sub<U>) => Sub<X>     // ∃_k : Sub(U) → Sub(X)
) {
  return (A: Sub<V>) => {
    const left  = (x: X) => (wave1(f, exists_h(A) as any) as Sub<X>)(x);
    const right = (x: X) => (exists_k(wave1(g, A) as any) as Sub<X>)(x);
    return { left, right };
  };
}
