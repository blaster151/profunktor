// ts-category.ts
import type { PolyMonad } from "./poly-2cat"
import type { ColourMap } from "./cartesian-morphism-poly"

export interface TSObject<J extends string, I extends string> {
  carrier: unknown          // T c(1)
  jColour: J                // chosen J-colouring compatible with δ and T*
}

// Build a descriptor for an object of 𝕋^S from T, δ:J→I (shape-level)
export function objectOfTS<J extends string, I extends string>(
  T: PolyMonad<I>, delta: ColourMap<J, I>, j: J
): TSObject<J, I> {
  // We don't compute Tc(1) explicitly; we expose a stable descriptor you can refine later.
  return { carrier: { tag: "Tc(1)", T: !!T }, jColour: j }
}
