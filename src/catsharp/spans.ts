// src/catsharp/spans.ts
// Span-based operations and opposite categories

import type { SmallCat, Morph } from "./cofunctor";

/** Build the opposite category C^op from C */
export function oppositeFromSpan(C: SmallCat): SmallCat {
  return {
    objects: C.objects,
    morphisms: C.morphisms.map(m => ({
      id: `${m.id}^op`,
      src: m.dst,  // swap source and target
      dst: m.src
    }))
  };
}
