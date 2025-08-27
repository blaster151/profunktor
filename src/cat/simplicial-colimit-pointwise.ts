// src/cat/simplicial-colimit-pointwise.ts
// Pointwise colimits for diagrams J → Cat_Δ using (colim F)_p = colim F(i)_p  (pp. 1–3).  :contentReference[oaicite:3]{index=3}

import type { DiagramCat, SmallCategory } from "./zigzag-colimit";
import { colimitCategory } from "./zigzag-colimit";
import { buildSX, type SSet } from "../sset/SX";
import { deltaNP, thetaStar, type SmallCategory as DeltaPCat } from "../sset/delta-p";

export type SimpLevel = number; // p-simplex level
export interface SimpCatDiagram {
  J: DiagramCat["J"];
  // For each i ∈ J and each p-level, a category C_i^p (same objects across p if you're in the (−)* image)
  C_p: (i: string, p: SimpLevel) => SmallCategory;
  F_p: (uId: string, p: SimpLevel) => { onObj: (o: string) => string; onMor: (m: {id:string;src:string;dst:string}) => {id:string;src:string;dst:string}; src: string; dst: string };
}

/** Compute pointwise colimits up to a finite pMax (you can set pMax=1 or 2 for experiments). */
export function colimSimplicial(diag: SimpCatDiagram, pMax = 1) {
  const out: Record<number, ReturnType<typeof colimitCategory>> = {};
  for (let p = 0; p <= pMax; p++) {
    const C: Record<string, SmallCategory> = {};
    const F: Record<string, any> = {};
    for (const i of diag.J.objects) C[i] = diag.C_p(i, p);
    for (const u of diag.J.arrows) {
      const fp = diag.F_p(u.id, p);
      F[u.id] = { id: u.id, src: u.src, dst: u.dst, ...fp };
    }
    out[p] = colimitCategory({ J: diag.J, C, F });
  }
  return out;
}

/** Build C_X up to pMax by pointwise colimits of Δ^n_p along χ_p : S(X) → Cat.  :contentReference[oaicite:6]{index=6} */
export function freeSimplicialCategory(X: SSet, pMax = 1) {
  const SX = buildSX(X);
  const out: Record<number, ReturnType<typeof colimitCategory>> = {};

  for (let p = 0; p <= pMax; p++) {
    // Objects: x∈X_n ↦ Δ^n_p
    const C: Record<string, DeltaPCat> = {};
    X.simplices.forEach(s => { C[s.id] = deltaNP(nOf(s), p); });

    // Arrows: θ: x→y gives θ*: Δ^{ny}_p → Δ^{nx}_p (id on objs; flags pulled back)
    const F: Record<string, any> = {};
    SX.arrows.forEach(a => {
      F[a.id] = {
        id: a.id, src: a.src, dst: a.dst,
        onObj: (o: number) => o, // identity on vertices 0..n
        onMor: (m: { id: string; src: number; dst: number; data: { flag: number[][] } }) => ({
          id: `theta*_${a.id}_${m.id}`, 
          src: m.src, 
          dst: m.dst,
          data: { ...m.data, flag: thetaStar(a.theta, m.data.flag) }
        })
      };
    });

    // Indexing category J = S(X)
    const J = { objects: SX.objects, arrows: SX.arrows.map(a => ({ id: a.id, src: a.src, dst: a.dst })) };
    out[p] = colimitCategory({ J, C, F } as any);
  }
  return out;
}

function nOf(s: { dim: number }): number { return s.dim; }
