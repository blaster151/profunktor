// src/catsharp/delta.ts
// Finite Δ[n] and a bounded Δ^op carrier for demos.  :contentReference[oaicite:1]{index=1}
import type { SmallCat } from "./cofunctor";

/** Δ[n]: objects 0..n; morphisms i→j for every i≤j (identities included). */
export function deltaSimplex(n: number): SmallCat {
  const objs = Array.from({ length: n + 1 }, (_, i) => String(i));
  const morphisms = [];
  for (let i = 0; i <= n; i++) {
    for (let j = i; j <= n; j++) {
      morphisms.push({ id: `m_${i}_${j}`, src: String(i), dst: String(j) });
    }
  }
  return { objects: objs, morphisms };
}

/** A bounded Δ^op (discrete for now) with objects ["[0]",...,"[N]"]. */
export function deltaOpBound(N = 3): SmallCat {
  return {
    objects: Array.from({ length: N + 1 }, (_, k) => `[${k}]`),
    // keep it discrete (faces/degeneracies TODO when needed)
    morphisms: Array.from({ length: N + 1 }, (_, k) => ({ id: `id_[${k}]`, src: `[${k}]`, dst: `[${k}]` }))
  };
}
