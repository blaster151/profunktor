import { CartesianMonad } from "./cartesian-monad-cat"
import { Category, InternalCategory } from "./internal-category"

export function barResolutionObject<C>(T: CartesianMonad<any>, n: number) {
  // Represents T^n(1). Replace with your actual terminal object + iterated T.
  return { pow: n, of: "1" as const }
}

// types we already use elsewhere
export interface Terminal<C extends Category> {
  one: ReturnType<C['id']> extends infer _ ? any : never // object 1
  bang: (X: any) => ReturnType<C['id']>                  // unique X → 1
}

// (A) Face/degeneracy formulas for the bar object B•(T,T,1)
type Obj = any; type Mor = any;
type CObj<C extends Category> = ReturnType<C['dom']> extends (f: any) => infer O ? O : never;
type CMor<C extends Category> = ReturnType<C['id']>;

// Given T: CartesianMonad<C> and terminal: Terminal<C>, define:
function B0<C extends Category>(T: CartesianMonad<C>, terminal: Terminal<C>): CObj<C> { 
  return T.T0(terminal.one as any) as any;            // T(1)
}
function B1<C extends Category>(T: CartesianMonad<C>, terminal: Terminal<C>): CObj<C> { 
  const c0 = B0(T, terminal); return T.T0(c0 as any) as any; // T^2(1)
}
function B2<C extends Category>(T: CartesianMonad<C>, terminal: Terminal<C>): CObj<C> { 
  const c1 = B1(T, terminal); return T.T0(c1 as any) as any; // T^3(1)
}

// Faces for n=1: d0, d1 : T^2(1) → T(1)
function d0_1<C extends Category>(T: CartesianMonad<C>, terminal: Terminal<C>): CMor<C> {
  return T.μ(terminal.one as any) as any;            // μ₁ : T^2(1) → T(1)
}
function d1_1<C extends Category>(T: CartesianMonad<C>, terminal: Terminal<C>): CMor<C> {
  const bang_T1 = terminal.bang(B0(T, terminal) as any); // T(1) → 1
  return T.T1(bang_T1) as any;                            // T(!) : T^2(1) → T(1)
}

// Degeneracy for n=0: s0 : T(1) → T^2(1)
function s0_0<C extends Category>(T: CartesianMonad<C>, terminal: Terminal<C>): CMor<C> {
  return T.η(B0(T, terminal) as any) as any;         // η_{T(1)} : T(1) → T^2(1)
}

// Faces for n=2: d0,d1,d2 : T^3(1) → T^2(1)
function d0_2<C extends Category>(T: CartesianMonad<C>, terminal: Terminal<C>): CMor<C> {
  const T1 = B0(T, terminal); return T.μ(T1 as any) as any;      // μ_{T(1)}
}
function d1_2<C extends Category>(T: CartesianMonad<C>, terminal: Terminal<C>): CMor<C> {
  return T.T1(T.μ(terminal.one as any)) as any;                   // T(μ₁)
}
function d2_2<C extends Category>(T: CartesianMonad<C>, terminal: Terminal<C>): CMor<C> {
  const bang_T1 = terminal.bang(B0(T, terminal) as any);
  return T.T1(T.T1(bang_T1) as any) as any;                       // T^2(!)
}

// (B) The classifier: 2-truncation turned into an InternalCategory
export function internalAlgebraClassifier<C extends Category>(
  T: CartesianMonad<C>,
  terminal: Terminal<C>,
  opts: { maxLevel?: number } = {}
): InternalCategory<C> {
  const C0 = B0(T, terminal)          // T(1)
  const C1 = B1(T, terminal)          // T^2(1)
  const C2 = B2(T, terminal)          // T^3(1)

  // source/target/identity from 1-simplices
  const s = d1_1(T, terminal)         // s := d1 : T^2(1) → T(1)  (T(!))
  const t = d0_1(T, terminal)         // t := d0 : T^2(1) → T(1)  (μ₁)
  const i = s0_0(T, terminal)         // i := s0 : T(1) → T^2(1)  (η)

  // pullback of (t, s) gives composable pairs
  const pb = T.C.pullback(t as any, s as any)         // C1 ×_{C0} C1

  // Segal map σ = ⟨d2, d0⟩ : C2 → C1 ×_{C0} C1  (assumed iso for cartesian monad)
  // Placeholder inverse (TODO)
  const segalIsoInv = (_p: typeof pb['obj']) => T.C.id(C2 as any) as any // replace with real inverse
  const m = T.C.comp(d1_2(T, terminal) as any, segalIsoInv(pb.obj) as any) as any

  return {
    C: T.C,
    C0: C0 as any,
    C1: C1 as any,
    s: s as any,
    t: t as any,
    i: i as any,
    m: m as any,
    compPB: pb as any
  }
}
