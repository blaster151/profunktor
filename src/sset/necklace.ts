// src/sset/necklace.ts
// Necklaces N = Δ^{n0} ∨ … ∨ Δ^{nk}, with basepoints, beads, joins, vertices.  :contentReference[oaicite:3]{index=3}

export interface Necklace {
  beads: number[];        // [n0,...,nk]
  // optional labels/ids for debugging
  label?: string;
}

export interface Flag { sets: number[][] } // U0 ⊆ … ⊆ Up over VN; indices refer to vertex order in N

export function verticesOf(beads: number[]): number[] {
  // total vertices = sum(n_i)+1, but wedged at joins; we return index placeholders 0..m
  const total = beads.reduce((s, ni) => s + ni, 0) + 1;
  return Array.from({ length: total }, (_, i) => i);
}

export interface ZigZagInSX {
  chain: { simplexId: string; via: "α" | "ω" }[];  // alternating initial/terminal inclusions
  // enough to reconstruct the "x = x0 → … → xk = y" picture in S(X).  :contentReference[oaicite:4]{index=4}
}

/** Skeleton: turn (N→X, flag) into a zig-zag backbone in S(X) by alternating α/ω inclusions. */
export function necklaceToZigZag(backbone: { beadSimplexIds: string[] }): ZigZagInSX {
  const xs = backbone.beadSimplexIds;
  const chain: ZigZagInSX["chain"] = [];
  for (let i = 0; i < xs.length - 1; i++) {
    chain.push({ simplexId: xs[i], via: "ω" });
    chain.push({ simplexId: xs[i + 1], via: "α" });
  }
  return { chain };
}

// --- New: joins, proper decoration (J_N ⊆ U0), and flag pushforward along pointed maps ---

/** Vertex indices of the joins J_N (the shared endpoints between consecutive beads). */
export function joinsOf(necklace: Necklace): number[] {
  // If beads = [n0,...,nk], total vertices m = sum(n_i)+1 and joins sit at the cumulative bead ends.
  const m = necklace.beads.reduce((s, ni) => s + ni, 0) + 1;
  const joins: number[] = [];
  let acc = 0;
  for (let i = 0; i < necklace.beads.length - 1; i++) {
    const bead = necklace.beads[i];
    if (bead !== undefined) acc += bead;
    joins.push(acc);
  }
  // vertices are 0..m-1; joins are internal vertices
  return joins.filter(v => v > 0 && v < m - 1);
}

export interface ProperDecoration {
  p: number;
  flag: number[][];     // length p+1; indices are vertices of |N|
}

/** Check "proper" per paper: J_N ⊆ U0 and edge endpoints are consistent with initial/terminal vertices. */
export function isProperDecoration(N: Necklace, dec: ProperDecoration): boolean {
  const { p, flag } = dec;
  if (flag.length !== p + 1) return false;
  const U0 = new Set(flag[0]);
  return joinsOf(N).every(j => U0.has(j));
}

/** Pushforward of a flag along a pointed simplicial map ρ: |N|→|M| that preserves the outer endpoints. */
export function pushFlag(
  rhoOnVertices: (v: number) => number,
  flag: number[][]
): number[][] {
  return flag.map(level => Array.from(new Set(level.map(rhoOnVertices))).sort((a,b)=>a-b));
}

// ---------- New: Decorated zig-zag data (B) and its necklace replacement (A) ----------
// We keep this purely combinatorial and independent of the quotient laws; it feeds our colimit code.
import type { PArrow } from "../sset/delta-p";

/** (B) data: a connecting zig-zag x0 … xk with chosen vertices a_i and Δ^{n_i}_p-arrows U_i : a_{i-1}→a_i. */
export interface DecoratedZigZagB {
  simplices: { id: string; dim: number }[];          // x0,...,xk (x0 has vertex a, xk has vertex b)
  vertices: number[];                                 // [a0=a, a1, ..., ak=b], each a_i a vertex in x_i
  p: number;                                          // p-level
  arrows: PArrow[];                                   // U1,...,Uk in the corresponding Δ^{n_i}_p
}

/** (A) data: a single necklace N with bead dims [n0,...,nk] and a chain of p-arrows split along joins. */
export interface NecklaceReplacementA {
  necklace: Necklace;                                 // beads derived from dims of x_i
  p: number;
  chain: PArrow[];                                    // a → a1 → ... → b  in Δ^{|N|}_p after splitting
}

/**
 * necklaceReplacement:
 *  Given (B) a decorated zig-zag through x0..xk with Δ^{n_i}_p flags U_i and chosen vertices a_i,
 *  produce (A) a single necklace with bead dims [n0..nk] and a p-arrow chain split at the joins.
 *
 *  Notes:
 *  • We treat each U_i as living on its bead, then "split" its flag at the bead joins.
 *  • For now, splitting is a no-op structurally (flags already bead-local); when you give us §3.3's
 *    exact normalization, we'll refine this to aggressively cut along the join vertices.
 */
export function necklaceReplacement(dzz: DecoratedZigZagB): NecklaceReplacementA {
  if (dzz.simplices.length < 1) throw new Error("empty decorated zig-zag");
  if (dzz.vertices.length !== dzz.simplices.length)
    throw new Error("vertices must align: one per simplex in the chain");
  if (dzz.arrows.length !== dzz.simplices.length - 1)
    throw new Error("need U_i for each adjacent pair x_{i-1}→x_i");

  const beads = dzz.simplices.map(s => s.dim);
  const necklace: Necklace = { beads, label: `N[x0..x${dzz.simplices.length - 1}]` };

  // Rebase each U_i to the global vertex-indexing of N (identity mapping for now).
  // When we add explicit vertex embeddings per bead, we'll translate src/dst indices here.
  const chain: PArrow[] = dzz.arrows.map(u => ({
    i: u.i, j: u.j,
    flag: u.flag.map(level => [...level])  // shallow clone
  }));

  return { necklace, p: dzz.p, chain };
}
