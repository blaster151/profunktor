// src/sset/SX.ts
// Minimal category of simplices S(X) for a finite simplicial set X.
// Objects are named simplices with a dimension; morphisms x→y carry θ:[nx]→[ny] with y∘θ = x.  :contentReference[oaicite:2]{index=2}

export interface Simplex { id: string; dim: number; vertices?: string[] }
export interface ThetaArrow { id: string; src: string; dst: string; theta: number[] } // monotone θ

export interface SSet {
  simplices: Simplex[];                          // all simplices (any dim)
  arrows: ThetaArrow[];                          // commutative triangles with θ
}

export interface SX {
  objects: string[];                             // simplex ids
  arrows: ThetaArrow[];
}

export function buildSX(X: SSet): SX {
  // (We assume X.arrows are already valid triangles; no further validation here.)
  return { objects: X.simplices.map(s => s.id), arrows: X.arrows };
}
