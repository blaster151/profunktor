// src/fusionReachability.ts
import { operatorRegistry } from '../operatorMetadata.js';

export interface Reachability {
  readonly names: string[];
  readonly indexOf: Map<string, number>;
  readonly mat: boolean[][];
}

function floydWarshallBool(m: boolean[][]): void {
  const n = m.length;
  for (let k = 0; k < n; k++) {
    const mk = m[k];
    if (mk === undefined) continue;
    for (let i = 0; i < n; i++) {
      const rowI = m[i];
      if (rowI === undefined || !rowI[k]) continue;
      const mi = rowI;
      for (let j = 0; j < n; j++) {
        // reach(i,j) |= reach(i,k) && reach(k,j)
        const mkj = mk[j];
        if (mkj) mi[j] = true;
      }
    }
  }
}

let _cache: Reachability | null = null;
export function getFusibilityReachability(): Reachability {
  if (_cache) return _cache;

  const names = Object.keys(operatorRegistry);
  const indexOf = new Map<string, number>(names.map((n, i) => [n, i]));
  const n = names.length;

  // direct adjacency: A -> B if B appears in operatorRegistry[A].fusibleAfter
  const mat: boolean[][] = Array.from({ length: n }, () =>
    Array<boolean>(n).fill(false)
  );
  for (let i = 0; i < n; i++) {
    const row = mat[i];
    if (row !== undefined) row[i] = true; // reflexive
    const a = names[i];
    if (a === undefined) continue;
    const info = (operatorRegistry as any)[a];
    const after: string[] = info?.fusibleAfter ?? [];
    for (const b of after) {
      const j = indexOf.get(b);
      if (j != null && row !== undefined) row[j] = true;
    }
  }

  // transitive closure
  floydWarshallBool(mat);

  _cache = { names, indexOf, mat };
  return _cache!;
}

export function isFusibleReachable(a: string, b: string): boolean {
  const R = getFusibilityReachability();
  const i = R.indexOf.get(a);
  const j = R.indexOf.get(b);
  if (i == null || j == null) return false;
  const row = R.mat[i];
  return row !== undefined && row[j] === true;
}

// Optional: quick stats for tracing
export function fusibilityStats() {
  const { names, mat } = getFusibilityReachability();
  const n = names.length;
  let edges = 0;
  for (let i = 0; i < n; i++) {
    const row = mat[i];
    if (row === undefined) continue;
    for (let j = 0; j < n; j++) {
      if (i !== j && row[j]) edges++;
    }
  }
  return { operators: n, reachablePairs: edges };
}


