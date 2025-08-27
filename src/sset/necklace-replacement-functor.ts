// src/sset/necklace-replacement-functor.ts
// Necklace-replacement functor N*: (Zχ_p)₁ → (N^p_X)₁ with inclusion 2-cell ε_T (pp. 23–24).
// Input: a χ_p–decorated zig-zag (|T|→X, U⃗* : (x,a)⇒(y,b)).
// Output: a *proper* necklace morphism (|N_T|→X, U⃗*) and a canonical ε_T in Z_{S(X)} witnessing inclusion.

import type { DecoratedZigZagB, NecklaceReplacementA } from "./necklace";
import { necklaceReplacement as toProper } from "./necklace";
import type { ProperHoriz, NecklaceInX } from "./npX";

export interface Inclusion2Cell {
  // minimal witness of the "upper necklace includes into T" square of pp. 23–24
  kind: "inclusion";
  // backbone of the target zig-zag and of the necklace
  T_chain: { simplices: string[] };   // x=x0,…,xk=y
  N_chain: { simplices: string[] };   // y0,…,yk with α/ω inclusions
}

export interface NStarResult {
  proper: ProperHoriz;
  epsilon: Inclusion2Cell;            // ε_T
}

// Turn any "decorated zig-zag B" into a *proper* necklace arrow with an inclusion 2-cell.
export function NStar(
  XidOf: (simpId: string) => string, // helper to identify bead-simplex ids
  dzz: DecoratedZigZagB
): NStarResult {
  const A = toProper(dzz); // (|N_T|→X, U⃗*) – already proper; Construction 4.1
  const NtoX: NecklaceInX = {
    neck: { beads: dzz.simplices.map(s => s.dim), label: "N_T" },
    beadSimplexIds: dzz.simplices.map(s => XidOf(String(s.id))),
    a: XidOf(String(dzz.vertices[0])),
    b: XidOf(String(dzz.vertices[dzz.vertices.length - 1]))
  };
  const proper: ProperHoriz = { NtoX, dec: { p: dzz.p, flag: A.chain.map(l => l.flag[0]) } as any };
  const epsilon: Inclusion2Cell = {
    kind: "inclusion",
    T_chain: { simplices: dzz.simplices.map(s => String(s.id)) },
    N_chain: { simplices: NtoX.beadSimplexIds }
  };
  return { proper, epsilon };
}
