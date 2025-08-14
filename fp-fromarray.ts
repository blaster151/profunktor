/**
 * FromArray typeclass + ArrayK/ListK instances + tiny BFS/DFS smoke test.
 *
 * Side-effectful registration is exposed via registerFromArrayInstances().
 * If you want auto-registration, import this file once from your main index.
 */

// Minimal Node globals for optional runtime demo/registry hooks
declare const require: any;
declare const module: any;

import { Kind1, Apply, ArrayK } from './fp-hkt';

// Optional: if you have a persistent list, we'll soft-load it.
type MaybePersistentList<A> = { fromArray(xs: A[]): any } | undefined;

export interface FromArray<F extends Kind1> {
  fromArray<A>(xs: A[]): Apply<F, [A]>;
}

export interface ToArray<F extends Kind1> {
  toArray<A>(fa: Apply<F, [A]>): A[];
}

// ---------------------------------------------
// Instances
// ---------------------------------------------

// ArrayK is your concrete array HKT. Trivial instance.
export const FromArray_ArrayK: FromArray<ArrayK> = {
  fromArray: <A>(xs: A[]) => xs as any
};

export const ToArray_ArrayK: ToArray<ArrayK> = {
  toArray: <A>(fa: Apply<ArrayK, [A]>) => fa as unknown as A[]
};

// Optional ListK / PersistentList instance (soft-loaded)
function tryLoadPersistentList(): MaybePersistentList<any> {
  try {
    // adjust path if your persistent list lives elsewhere
    const mod = require('./fp-persistent');
    return mod?.PersistentList ?? mod?.List ?? undefined;
  } catch {
    return undefined;
  }
}

export const FromArray_ListK: FromArray<any> | undefined = (() => {
  const PL = tryLoadPersistentList();
  if (!PL) return undefined;
  return {
    fromArray: <A>(xs: A[]) => (PL as any).fromArray(xs)
  } as FromArray<any>;
})();

export const ToArray_ListK: ToArray<any> | undefined = (() => {
  const PL = tryLoadPersistentList();
  if (!PL) return undefined;
  return {
    toArray: <A>(fa: any) => fa.toArray ? fa.toArray() : Array.from(fa)
  } as ToArray<any>;
})();

// ---------------------------------------------
// Registry glue (side-effect on call)
// ---------------------------------------------

export function registerFromArrayInstances(): void {
  let reg: any | undefined;
  try {
    // If you use a different init module, tweak this import.
    const { getFPRegistry } = require('./fp-registry-init');
    reg = getFPRegistry?.();
  } catch {
    // no registry available: skip
  }
  if (!reg) return;

  try {
    reg.registerTypeclass('ArrayK', 'FromArray', FromArray_ArrayK);
    reg.registerTypeclass('ArrayK', 'ToArray', ToArray_ArrayK);
  } catch {}

  if (FromArray_ListK) {
    try {
      reg.registerTypeclass('ListK', 'FromArray', FromArray_ListK);
    } catch {}
  }
  if (ToArray_ListK) {
    try {
      reg.registerTypeclass('ListK', 'ToArray', ToArray_ListK);
    } catch {}
  }
}

// ---------------------------------------------
// 60-sec smoke test: BFS / DFS (ArrayK)
// ---------------------------------------------

type Graph = Record<string, string[]>;

export function bfsLayers(g: Graph, start: string): string[][] {
  const seen = new Set<string>([start]);
  const q: string[] = [start];
  const layers: string[][] = [];
  while (q.length) {
    const levelSize = q.length;
    const level: string[] = [];
    for (let i = 0; i < levelSize; i++) {
      const v = q.shift()!;
      level.push(v);
      for (const w of g[v] ?? []) {
        if (!seen.has(w)) {
          seen.add(w);
          q.push(w);
        }
      }
    }
    layers.push(level);
  }
  return layers;
}

export function dfsOrder(g: Graph, start: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  function go(v: string) {
    if (seen.has(v)) return;
    seen.add(v);
    out.push(v);
    for (const w of g[v] ?? []) go(w);
  }
  go(start);
  return out;
}

// run quick sample if executed directly
if (require.main === module) {
  const g: Graph = {
    A: ['B', 'C'],
    B: ['D', 'E'],
    C: ['F'],
    D: [], E: ['F'], F: []
  };
  console.log('BFS layers from A:', bfsLayers(g, 'A'));
  console.log('DFS order  from A:', dfsOrder(g, 'A'));

  // registry side-effect (safe no-op if registry missing)
  registerFromArrayInstances();

  // demo FromArray/ToArray
  const arr = FromArray_ArrayK.fromArray([1, 2, 3]);
  const back = ToArray_ArrayK.toArray(arr);
  console.log('roundtrip ArrayK:', back);
}
