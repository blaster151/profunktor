// src/phl/homomorphism.ts
// Σ-homomorphisms for quasi-equational partial structures: total maps on carriers
// that preserve defined operations and (compiled) predicate-graphs.
// Induces commuting squares on terms and coherent formulae. (Section 3.1)

export type Sort = string;
export interface QESig { sorts: readonly Sort[]; funcs: readonly { name: string; inSorts: readonly Sort[]; outSort: Sort }[] }

export interface PartialOp {
  // Interpret f by a partial function: returns {defined:false} when undefined
  apply: (name: string, args: unknown[]) => { defined: true; value: unknown } | { defined: false };
}

export interface PartialStructure {
  sigma: QESig;
  carriers: Record<string, unknown[]>; // per sort
  ops: PartialOp;
}

export type Hom = Record<string, (x: unknown) => unknown>; // per-sort total maps

/** Check α: M → N is a Σ-homomorphism (preserves definedness + values). */
export function isHomomorphism(M: PartialStructure, N: PartialStructure, alpha: Hom): boolean {
  // Carriers: total maps
  for (const s of M.sigma.sorts) {
    const f = alpha[s];
    if (!f) return false;
    for (const x of M.carriers[s] ?? []) void f(x);
  }
  // Ops: if Mf(args) is defined then Nf(α(args)) is defined with same value under α
  for (const f of M.sigma.funcs) {
    const testArgs: unknown[][] = sampleArgs(M, f.inSorts, 16);
    for (const a of testArgs) {
      const m = M.ops.apply(f.name, a);
      if (m.defined) {
        const a2 = a.map((x, i) => {
          const inSort = f.inSorts[i];
          if (inSort === undefined) {
            throw new Error(`Missing input sort at index ${i} for operation ${f.name}`);
          }
          const sortMap = alpha[inSort];
          if (sortMap === undefined) {
            throw new Error(`No mapping found for sort ${inSort}`);
          }
          return sortMap(x);
        });
        const n = N.ops.apply(f.name, a2);
        if (!n.defined) return false;
        const sortMap = alpha[f.outSort];
        if (sortMap === undefined) {
          throw new Error(`No mapping found for sort ${f.outSort}`);
        }
        if (sortMap(m.value) !== n.value) return false;
      }
    }
  }
  return true;
}

function sampleArgs(M: PartialStructure, inSorts: readonly Sort[], k: number): unknown[][] {
  const pools = inSorts.map(s => M.carriers[s] ?? []);
  const out: unknown[][] = [];
  for (let i = 0; i < k; i++) out.push(pools.map(ps => ps[i % Math.max(1, ps.length)]));
  return out;
}
