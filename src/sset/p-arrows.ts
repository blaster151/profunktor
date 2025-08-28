// src/sset/p-arrows.ts
// Theorem 4.1 (pp. 24): p-arrows in C_X are pairs (|N|→X_{a,b}, U⃗ with J_N⊆U0) modulo pointed simplicial maps ρ with ρ(U⃗)=V⃗.

import { joinsOf, pushFlag, type Necklace } from "./necklace";

export interface PArrowRep {
  a: string; b: string;                // endpoints in X0
  N: Necklace;                         // necklace
  flag: number[][];                    // U⃗ (length p+1), indices are vertices of |N|
  p: number;
}

/** Quick check: well-formed + "proper" (J_N ⊆ U0). */
export function isValidPArrow(rep: PArrowRep): boolean {
  return rep.flag.length === rep.p + 1
      && joinsOf(rep.N).every(j => new Set(rep.flag[0]).has(j))
      && rep.N.beads.length > 0; // non-empty necklace
}

/**
 * Decide equivalence: (N,U⃗) ~ (M,V⃗) if there exists a *pointed* simplicial map ρ:|N|→|M| with ρ(U⃗)=V⃗.
 * Heuristic constructive search using the bead-index surjection θ:[k]↠[l] mentioned on p. 23:
 *  - assign each bead of N to a bead of M by a monotone *surjection* θ,
 *  - for each i, choose a monotone endpoint-preserving ρ_i: Δ^{n_i}→Δ^{m_{θ(i)}},
 *  - assemble a vertex map ρ and test pushFlag(ρ, U⃗)===V⃗.
 */
export function equivPArrow(lhs: PArrowRep, rhs: PArrowRep): boolean {
  if (lhs.a !== rhs.a || lhs.b !== rhs.b || lhs.p !== rhs.p) return false;
  if (!isValidPArrow(lhs) || !isValidPArrow(rhs)) return false;

  const beadsN = lhs.N.beads, beadsM = rhs.N.beads;
  const k = beadsN.length - 1, l = beadsM.length - 1;
  // generate surjective monotone θ : [0..k] → [0..l]
  const surjections = genSurjections(k, l);
  for (const theta of surjections) {
    // try beadwise monotone endpoint-preserving maps; pick the unique affine map on vertices
    const pieceMaps: ((v: number) => number)[] = [];
    let ok = true;
    let offsetN = 0, offsetM = 0;
    for (let i = 0; i <= k; i++) {
      const ni = beadsN[i];
      const j = theta[i];                      // target bead
      const mj = beadsM[j];
      // affine monotone map [0..ni]→[0..mj] fixing 0 and ni↦mj
      const local = (t: number) => Math.round((t / ni) * mj);
      // rebase to global vertex indices
      const mapV = (v: number) => offsetM + local(v - offsetN);
      pieceMaps.push(mapV);
      offsetN += ni; if (i < j) offsetM += beadsM.slice(theta[i - 1] ?? 0, j).reduce((s,n)=>s+n,0);
    }
    // stitch piecewise map across beads
    const rho = (v: number) => {
      // find bead index i for v
      let acc = 0;
      for (let i = 0; i <= k; i++) {
        const bead = beadsN[i];
        if (bead === undefined) continue;
        const start = acc, end = acc + bead;
        const pieceMap = pieceMaps[i];
        if (v >= start && v <= end && pieceMap !== undefined) return pieceMap(v);
        acc += bead;
      }
      const lastMap = pieceMaps[k];
      return lastMap !== undefined ? lastMap(v) : v;
    };
    // endpoints must be fixed
    if (rho(0) !== 0) { ok = false; }
    const sizeN = beadsN.reduce((s,n)=>s+n,0);
    const sizeM = beadsM.reduce((s,n)=>s+n,0);
    if (rho(sizeN) !== sizeM) { ok = false; }
    if (!ok) continue;

    const pushed = pushFlag(rho, lhs.flag);
    if (JSON.stringify(pushed) === JSON.stringify(rhs.flag)) return true;
  }
  return false;
}

function genSurjections(k: number, l: number): number[][] {
  if (l > k) return []; // impossible
  if (l === 0) return [Array(k + 1).fill(0)]; // constant map
  if (l === k) return [Array.from({length: k + 1}, (_, i) => i)]; // identity map
  
  // classic stars-and-bars for surjective monotone maps: choose l cut positions in [0..k-1]
  const cuts: number[][] = [];
  function rec(pos: number, rem: number, acc: number[]) {
    if (rem === 0) { cuts.push(acc.slice()); return; }
    for (let c = pos; c <= k - rem; c++) rec(c + 1, rem - 1, acc.concat(c));
  }
  rec(0, l, []);
  return cuts.map(sel => {
    const theta: number[] = [];
    let j = 0;
    for (let i = 0; i <= k; i++) {
      theta.push(j);
      if (sel.includes(i)) j++;
    }
    return theta;
  });
}
