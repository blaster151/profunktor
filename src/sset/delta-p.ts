// src/sset/delta-p.ts (new)
// Category Δ^n_p: objects 0..n; p-arrows i→j are flags U0⊆…⊆Up ⊆ P({i..j}) with i,j ∈ U0.
// Composition: flagwise union. θ*: Δ^n_p ← Δ^n_q by (Uθ(0) ⊆ … ⊆ Uθ(q)).  :contentReference[oaicite:1]{index=1}

export type Obj = number;
export type Flag = number[][]; // each Ui is a sorted list of vertices in {i..j}
export interface PArrow { i: number; j: number; flag: Flag }

export interface SmallCategory {
  name: string;
  objects: Obj[];
  morphisms: { id: string; src: Obj; dst: Obj; data: PArrow }[];
}

export function deltaNP(n: number, p: number): SmallCategory {
  const objs = Array.from({ length: n + 1 }, (_, i) => i);
  const morphs: SmallCategory["morphisms"] = [];
  const id = (i: number): PArrow => ({ i, j: i, flag: Array.from({ length: p + 1 }, () => [i]) });

  // generate trivial identities; nontrivial arrows can be constructed on demand in tests/demos
  objs.forEach(i => morphs.push({ id: `id_${i}`, src: i, dst: i, data: id(i) }));

  return { name: `Δ^${n}_${p}`, objects: objs, morphisms: morphs };
}

// Compose p-arrows by flagwise union (objects concatenate along j):
export function composeP(p: number, g: PArrow, f: PArrow): PArrow {
  if (f.j !== g.i) throw new Error("composeP: middle endpoint mismatch");
  const flag: Flag = Array.from({ length: p + 1 }, (_, k) =>
    {
      const fFace = f.flag[k];
      const gFace = g.flag[k];
      if (fFace === undefined || gFace === undefined) {
        throw new Error(`Invalid flag index ${k}`);
      }
      return Array.from(new Set([...fFace, ...gFace])).sort((a, b) => a - b);
    }
  );
  return { i: f.i, j: g.j, flag };
}

// θ*: pick indices along θ (monotone [q]→[p]); we encode θ as an array θ(0..q)
export function thetaStar(theta: number[], flag: Flag): Flag {
  return theta.map(ti => {
    const face = flag[ti];
    if (face === undefined) {
      throw new Error(`Invalid theta index ${ti} for flag of length ${flag.length}`);
    }
    return face;
  });
}
