// src/optics/dialens-mod-sig.ts
// Concrete instance over your Mod→Sig fibration using your existing structures.
// Sources: Capucci et al. unify optics/dialectica via fibrations; Spivak lenses via indexed categories.
import type { PartialStructure } from "../meta/generalized-morphism";
import { Dialens } from "../../fp-optics-dialens";
import { U_M, leftAdjoint_M, type GMorphSpec, type SeedSynthesizer } from "../meta/generalized-morphism";

// A dialens between T- and T′-models, parameterized by a generalized morphism spec.
// get  = U_M (forgetful to T)
// put  = compute L_M (left adjoint) on a delta in T′ and reflect back a delta in T
export function dialensFromGMorph(
  spec: GMorphSpec,
  synth: SeedSynthesizer
): Dialens<PartialStructure, PartialStructure, unknown, unknown> {
  return {
    get: (N_Tprime) => U_M(spec, N_Tprime),
    put: (N_Tprime, deltaY) => {
      // Minimal "delta" story: re-run L_M on get(N) to absorb an edit on the T′ side.
      const X_T = U_M(spec, N_Tprime);
      const rebuilt = leftAdjoint_M(spec, synth, X_T);
      // In practice you'd diff (rebuilt vs N_Tprime) to produce a principled ΔX.
      return { x1: rebuilt, dx: { rebased: true, deltaY } };
    }
  };
}
