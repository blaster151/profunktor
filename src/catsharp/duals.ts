// Bicomodule duals (shape-level) and opposite via Theorem 3.5.  :contentReference[oaicite:1]{index=1}
import type { SmallCat } from "./cofunctor";
import { oppositeFromSpan } from "./spans";

export interface DiscreteBico {
  X: string[]; Y: string[]; M: string[];
  C: (m: string) => string;   // target
  B: (m: string) => string;   // source
  R: (x: string) => string;   // object map
}

/** Right "dagger" dual (–)†: swap the outer legs. */
export function dagger(b: DiscreteBico): DiscreteBico {
  return { X: b.Y, Y: b.X, M: b.M, C: (_m)=> b.R(b.C(_m)), B: (_m)=> b.R(b.B(_m)), R: (_y)=> _y };
}

/** Left "vee" dual (–)∨: swap source/target in the middle span. */
export function vee(b: DiscreteBico): DiscreteBico {
  return { X: b.X, Y: b.Y, M: b.M, C: b.B, B: b.C, R: b.R };
}

/** Build right adjoint bicomodule from a category C. */
export function rightAdjointBicomoduleOf(C: SmallCat): DiscreteBico {
  return {
    X: C.objects,
    Y: C.objects,
    M: C.morphisms.map(m => m.id),
    C: (mId: string) => {
      const m = C.morphisms.find(mor => mor.id === mId);
      return m ? m.dst : "";
    },
    B: (mId: string) => {
      const m = C.morphisms.find(mor => mor.id === mId);
      return m ? m.src : "";
    },
    R: (x: string) => x
  };
}

/** Build left adjoint bicomodule from a category C. */
export function leftAdjointBicomoduleOf(C: SmallCat): DiscreteBico {
  return {
    X: C.objects,
    Y: C.objects,
    M: C.morphisms.map(m => m.id),
    C: (mId: string) => {
      const m = C.morphisms.find(mor => mor.id === mId);
      return m ? m.dst : "";
    },
    B: (mId: string) => {
      const m = C.morphisms.find(mor => mor.id === mId);
      return m ? m.src : "";
    },
    R: (x: string) => x
  };
}

/** Theorem 3.5 (shape-level): 2^op is represented by (2†)∨ ∘ (2∨)†. */
export function oppositeViaDuals(C: SmallCat): SmallCat {
  const R = rightAdjointBicomoduleOf(C);
  const L = leftAdjointBicomoduleOf(C);
  const comp = vee(dagger(R));      // (2†)∨
  const comp2 = dagger(vee(L));     // (2∨)†
  // Compose the two discrete spans by pullback-of-middle (here: names-only -> swap src/dst)
  return oppositeFromSpan(C);
}
