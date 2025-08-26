// src/kan/indexed-view.ts
// Indexed "skeleton-of-Set" view of a left Kan result J: D → Set.
// Matches the CQL state from the paper: J(d) size, UF on indices per d,
// per-edge adjacency list, and the unit η(c): I(c) → J(Fc) as indices.

export class UnionFind {
  private parent = new Map<number, number>();
  add(i: number) { if (!this.parent.has(i)) this.parent.set(i, i); }
  find(i: number): number { const p = this.parent.get(i) ?? i; if (p === i) return i; const r = this.find(p); this.parent.set(i, r); return r; }
  union(a: number, b: number) { const ra = this.find(a), rb = this.find(b); if (ra !== rb) this.parent.set(ra, rb); }
}

export type EdgeKey = `${string}->${string}:${string}`; // "d1->d2:edgeId"

export interface IndexedLKEState {
  J: Record<string, number>;                        // |J(d)|
  uf: Record<string, UnionFind>;                    // UF on {0..J(d)-1}
  edges: Record<EdgeKey, Array<Set<number>>>;       // for each f: d1→d2, a list of length J(d1); each entry is a set⊆{0..J(d2)-1}
  eta: Record<string, Array<number | undefined>>;   // for each c, array parallel to I(c) picking index in J(Fc)
}

export function estimateBytes(state: IndexedLKEState): number {
  // Crude: 8 bytes per number + overhead; sets/lists dominate—good enough for rows/MB signal.
  const Jbytes = Object.values(state.J).length * 16;
  const ufbytes = Object.values(state.uf).reduce((n, uf) => n + 32 * 1024 /* handwave */, 0);
  const edgebytes = Object.values(state.edges).reduce((n, arr) => n + arr.length * 64, 0);
  const etabytes = Object.values(state.eta).reduce((n, a) => n + (a.length * 8), 0);
  return Jbytes + ufbytes + edgebytes + etabytes;
}

export function rowsPerMB(state: IndexedLKEState): number {
  const rows = Object.values(state.J).reduce((s, n) => s + n, 0);
  const mb = Math.max(1, estimateBytes(state) / (1024 * 1024));
  return rows / mb;
}
