// src/catsharp/duoidal.ts
// Duoidal structure for categories: product operations

import type { SmallCat, Obj, Morph } from "./cofunctor";

/** Product of two small categories C ⊗ D */
export function prod(C: SmallCat, D: SmallCat): SmallCat {
  const objects: Obj[] = [];
  const morphisms: Morph[] = [];
  
  // Objects are pairs ⟨c,d⟩
  for (const c of C.objects) {
    for (const d of D.objects) {
      objects.push(`⟨${c},${d}⟩`);
    }
  }
  
  // Morphisms are pairs of morphisms
  for (const mC of C.morphisms) {
    for (const mD of D.morphisms) {
      morphisms.push({
        id: `${mC.id}⊗${mD.id}`,
        src: `⟨${mC.src},${mD.src}⟩`,
        dst: `⟨${mC.dst},${mD.dst}⟩`
      });
    }
  }
  
  return { objects, morphisms };
}
