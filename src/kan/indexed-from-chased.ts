// src/kan/indexed-from-chased.ts
// Build the indexed view directly from the chased cograph model M
// (D-objects live in M.sorts["D:..."], D-arrows in M.relations["D:edgeId"],
// and unit components come from α_c relations).

import type { CategoryPresentation } from "./category-presentations";
import type { IndexedLKEState, EdgeKey } from "./indexed-view";
import { UnionFind } from "./indexed-view";

export interface ChasedModel {
  sorts: Record<string, readonly unknown[]>;
  relations: Record<string, readonly (readonly unknown[])[]>;
}

export function indexedFromChasedModel(
  M: ChasedModel,
  D: CategoryPresentation,
  F_onObj: (c: string) => string
): IndexedLKEState {
  // 1) J(d) and index maps
  const J: Record<string, number> = {};
  const idxOf: Record<string, Map<unknown, number>> = {};
  const uf: Record<string, UnionFind> = {};

  for (const a of D.Q.objects) {
    const d = a.id;
    const arr = M.sorts[`D:${d}`] ?? [];
    J[d] = arr.length;
    const m = (idxOf[d] = new Map());
    const u = (uf[d] = new UnionFind());
    arr.forEach((x, i) => { m.set(x, i); u.add(i); });
  }

  // 2) per-edge adjacency lists
  const edges: Record<EdgeKey, Array<Set<number>>> = {};
  for (const e of D.Q.arrows) {
    const key: EdgeKey = `${e.src}->${e.dst}:${e.id}`;
    const rel = M.relations[`D:${e.id}`] ?? []; // tuples [x,y]
    const arr = new Array(J[e.src]).fill(0).map(() => new Set<number>());
    rel.forEach(([x, y]) => {
      const i = idxOf[e.src].get(x);
      const j = idxOf[e.dst].get(y);
      if (i !== undefined && j !== undefined) arr[i].add(j);
    });
    edges[key] = arr;
  }

  // 3) η(c): read α_c : C:c → D:F(c)
  const eta: IndexedLKEState["eta"] = {};
  // Map C-side carriers (if present) to stable positions; fallback to sparse map
  const alphaPrefix = "α:";
  for (const relName of Object.keys(M.relations)) {
    if (!relName.startsWith(alphaPrefix)) continue;
    const c = relName.slice(alphaPrefix.length);
    const pairs = M.relations[relName] || [];
    const m: Array<number | undefined> = [];
    pairs.forEach(([x, y]) => {
      const d = F_onObj(c);
      const j = idxOf[d].get(y);
      if (j !== undefined) {
        // Unsafe: we don't know positions of x in I(c); treat as sparse by pushing
        m.push(j);
      }
    });
    eta[c] = m;
  }

  return { J, uf, edges, eta };
}
