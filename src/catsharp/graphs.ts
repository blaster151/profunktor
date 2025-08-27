// src/catsharp/graphs.ts
// Graph of elements for a copresheaf F: C → Set

import type { SmallCat, Obj, Morph } from "./cofunctor";
import type { Copresheaf } from "./prafunctor";

export interface Graph {
  vertices: string[];
  edges: { src: string; dst: string; label: string }[];
}

/** Build the graph of elements of a copresheaf F: C → Set */
export function graphOfElements<C extends SmallCat>(
  C: C,
  F: Copresheaf<C>
): Graph {
  const vertices: string[] = [];
  const edges: { src: string; dst: string; label: string }[] = [];
  
  // Vertices: pairs (x, a) where x ∈ Ob(C) and a ∈ F(x)
  for (const x of C.objects) {
    const fx = F.onObj(x);
    for (const a of fx) {
      vertices.push(`${x}:${a}`);
    }
  }
  
  // Edges: for each morphism f: x → y, and each a ∈ F(x), we have an edge
  // from (x, a) to (y, F(f)(a))
  for (const m of C.morphisms) {
    const fx = F.onObj(m.src);
    for (const a of fx) {
      const fa = F.onMor(m)(a);
      edges.push({
        src: `${m.src}:${a}`,
        dst: `${m.dst}:${fa}`,
        label: m.id
      });
    }
  }
  
  return { vertices, edges };
}
