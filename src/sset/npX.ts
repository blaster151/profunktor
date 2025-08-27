// src/sset/npX.ts
// N^p_X: horizontal 1-cells are *properly* χ_p-decorated necklaces |N|→X with J_N ⊆ U0;
// 2-cells are pointed simplicial maps ρ carrying flags forward (ρ(U)=V).  (pp. 20–22)
import type { Necklace, ProperDecoration } from "./necklace";
import { isProperDecoration, pushFlag } from "./necklace";

export interface NecklaceInX {
  neck: Necklace;
  // backbone into X (ids of the bead simplices in S(X) order; enough for our combinatorics)
  beadSimplexIds: string[];
  // endpoints in X0 (initial of first bead, terminal of last bead)
  a: string;
  b: string;
}

export interface ProperHoriz {
  NtoX: NecklaceInX;
  dec: ProperDecoration;
}

export interface PointedMap {
  // simplicial map |N|→|M| encoded by vertex-level function that preserves first/last vertices
  mapVertex: (v: number) => number;
}

/** Smart constructor: enforce "proper" when building a horizontal 1-cell. */
export function mkProperHoriz(NtoX: NecklaceInX, dec: ProperDecoration): ProperHoriz {
  if (!isProperDecoration(NtoX.neck, dec)) {
    throw new Error("NpX: decoration is not proper (J_N ⊄ U0 or bad arity).");
  }
  return { NtoX, dec };
}

/** 2-cell action: push a proper flag along a pointed ρ. */
export function act2Cell(rho: PointedMap, h: ProperHoriz): ProperHoriz {
  return {
    NtoX: h.NtoX, // same endpoints in X (ρ preserves outer vertices)
    dec: { p: h.dec.p, flag: pushFlag(rho.mapVertex, h.dec.flag) }
  };
}
