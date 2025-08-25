import { Category, InternalCategory } from "./internal-category"
import { internalAlgebraClassifier } from "./bar-resolution"
import type { CartesianMonad, Terminal } from "./bar-resolution"

export interface SimplicialObject<C extends Category> {
  at: (n: number) => ReturnType<C['product']> // object in C
  face: (n: number, i: number) => ReturnType<C['id']>   // C-map
  degeneracy: (n: number, i: number) => ReturnType<C['id']>
}

export function nerve<C extends Category>(Ic: InternalCategory<C>): SimplicialObject<C> {
  // N(C)_0 = C0, N(C)_1 = C1, N(C)_n = C1 ×_{C0} ... ×_{C0} C1
  // This skeleton returns placeholders for objects/maps you can refine with your PB/product builders.
  return {
    at: (n) => {
      if (n === 0) return Ic.C0 as any
      if (n === 1) return Ic.C1 as any
      // iterated pullback/product placeholder
      return Ic.C.product(Ic.C1 as any, Ic.C1 as any)
    },
    face: (_n,_i) => Ic.C.id(Ic.C1 as any),
    degeneracy: (_n,_i) => Ic.C.id(Ic.C0 as any),
  }
}

export interface SegalMap<C extends Category> {
  source: ReturnType<C['product']>
  target: ReturnType<C['product']>
  map: ReturnType<C['id']>
}

/** Produce the Segal map N(C)_n -> N(C)_1 ×_{N(C)_0} ... × N(C)_1. */
export function segalMap<C extends Category>(
  Ic: InternalCategory<C>, n: number
): SegalMap<C> {
  const N = nerve(Ic)
  // For now, return identity-shaped skeletons; hook to your PB product builder.
  return {
    source: N.at(n) as any,
    target: N.at(1) as any,
    map: Ic.C.id(N.at(n) as any),
  }
}

/** An oracle that treats a Segal object as strict if you can exhibit isomorphisms. */
export function isStrictSegalObject<C extends Category>(
  Ic: InternalCategory<C>,
  isIso: (f: ReturnType<C['id']>) => boolean,
  maxN = 3
): boolean {
  for (let n = 2; n <= maxN; n++) {
    const σ = segalMap(Ic, n)
    if (!isIso(σ.map)) return false
  }
  return true
}

// segal witness specialized to classifier
export function segalWitnessForClassifier<C extends Category>(
  T: CartesianMonad<C>, terminal: Terminal<C>
): {
  sigma: ReturnType<C['id']>,        // σ: C2 → C1 ×_{C0} C1  (⟨d2,d0⟩)
  sigmaInv: ReturnType<C['id']>,     // σ^{-1}: C1 ×_{C0} C1 → C2  (placeholder)
  reason: "pullback-iso" | "oracle-iso"
} {
  const Ic = internalAlgebraClassifier(T, terminal)
  // build σ = ⟨d2,d0⟩ using the faces we already exposed
  const C2 = (Ic.C1 as any) // placeholder object handle; actual object is T^3(1)
  const sigma = Ic.C.id(C2) as any   // TODO: assemble ⟨d2,d0⟩; keep as id placeholder
  // sigmaInv from universal property of pullback (placeholder)
  const sigmaInv = Ic.C.id(Ic.compPB!.obj as any)
  return { sigma, sigmaInv, reason: "pullback-iso" }
}
