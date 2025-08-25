// poly-algebras.ts
import type { PolyMonad } from "./poly-2cat"
import type { Coll, CollMonoidal } from "./operad-nerve"

// Symmetric monoidal category interface (skeletal)
export interface SymMonCat<Obj = unknown, Mor = unknown> {
  unit: Obj
  tensor: (x: Obj, y: Obj) => Obj
  hom: (x: Obj, y: Obj) => Mor
  id: (x: Obj) => Mor
  comp: (g: Mor, f: Mor) => Mor
}

// Strong symmetric monoidal functor Set -> E given by copower with the unit
export interface StrongMonoidalSetToE<E extends SymMonCat> {
  toObj: (X: ReadonlyArray<unknown>) => E["unit"]  // placeholder: X ↦ ⊕_X 1
  toMor: (f: (x: unknown) => unknown) => any
}

// Given a polynomial monad T and monoidal data on collections, expose the *shape*
// of a coloured symmetric operad algebra in E (no runtime logic).
export type OperadAlgebraShape<I extends string, EObj> =
  Record<I, EObj> & { /* structure maps m_(b,σ): ⊗ A_{inputs} -> A_target are elided */ }

// Bridge: Alg_T(E) ≅ Alg_{O_T}(E) — here just the *types* aligning the shapes.
export function algebraBridgeShape<I extends string, E extends SymMonCat>(
  M: PolyMonad<I>,
  coll: CollMonoidal<I>,
  setToE: StrongMonoidalSetToE<E>
): {
  fromTAlgebraShape: (A: OperadAlgebraShape<I, E["unit"]>) => OperadAlgebraShape<I, E["unit"]>
  toTAlgebraShape:   (A: OperadAlgebraShape<I, E["unit"]>) => OperadAlgebraShape<I, E["unit"]>
} {
  void M, coll, setToE
  return {
    fromTAlgebraShape: (A) => A,
    toTAlgebraShape:   (A) => A
  }
}
