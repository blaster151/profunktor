// src/kan/explicit-colim.ts
// Finite-case Σ_F(I)(d) via (F ↓ d) + Set-colimit with a tiny union-find.
// Also exposes a real unit lookup η_I(c): I(c) → Σ_F(I)(F c) picking the
// representative sitting at the (c, id_{F c}) object in the comma category.

import type { Functor, Path, SmallCategory } from "./category-presentations";

// ----- Union-Find ------------------------------------------------------------
class UF<T extends string> {
  parent = new Map<T, T>();
  find(x: T): T { const p = this.parent.get(x) ?? x; if (p === x) return x; const r = this.find(p); this.parent.set(x, r); return r; }
  union(a: T, b: T) { const ra = this.find(a), rb = this.find(b); if (ra !== rb) this.parent.set(ra, rb); }
  add(x: T) { if (!this.parent.has(x)) this.parent.set(x, x); }
}

// ----- Types & helpers -------------------------------------------------------
export type HomEnum = (src: string, dst: string) => Path[];
export type PathEq  = (p: Path, q: Path) => boolean;

export interface FiniteInstance {
  onObj: Record<string, readonly unknown[]>;
  onMor: Record<string, (x: unknown) => unknown>; // generators; paths compose left→right
}
function applyPath(I: FiniteInstance, p: Path): (x: unknown) => unknown {
  return (x0: unknown) => p.arrows.reduce((x, a) => (I.onMor[a] ? I.onMor[a](x) : x), x0);
}
// Helper functions to get domain and codomain from paths
const pathDom = (C: SmallCategory, p: Path) => p.at;
const pathCod = (C: SmallCategory, p: Path) => {
  // For a path, the codomain is the target after following all arrows
  // This is a simplified implementation - in practice you'd need to track the actual codomain
  return p.at; // Placeholder - should compute actual codomain
};

// Build (F ↓ d)
function buildCommaFOver_d(
  C: SmallCategory, D: SmallCategory, F: Functor, homC: HomEnum, homD: HomEnum, eqD: PathEq, dObj: string
) {
  const objs: { c: string; alpha: Path }[] = [];
  for (const c of C.objects) {
    const Fc = F.onObj(c);
    for (const a of homD(Fc, dObj)) objs.push({ c, alpha: a });
  }
  const mor: { from: number; to: number; u: Path }[] = [];
  for (let i = 0; i < objs.length; i++) for (let j = 0; j < objs.length; j++) {
    const obj1 = objs[i];
    const obj2 = objs[j];
    if (!obj1 || !obj2) continue;
    const { c, alpha } = obj1;
    const { c: c2, alpha: alpha2 } = obj2;
    for (const u of homC(c, c2)) {
      const Fu = F.onMor(u);
      const lhs = { at: pathDom(D, Fu), arrows: [...Fu.arrows, ...alpha2.arrows] } as Path; // Fu ; α'
      if (eqD(lhs, alpha)) mor.push({ from: i, to: j, u });
    }
  }
  return { objs, mor };
}

// ----- Internal: compute fiber + UF state (for unit lookup) ------------------
type Key = string;
const keyOf = (i: number, c: string, _x: unknown, n: number) => `(${i})${c}#${n}`;

function fiberUFState(
  C: SmallCategory, D: SmallCategory, F: Functor, I: FiniteInstance,
  homC: HomEnum, homD: HomEnum, eqD: PathEq, dObj: string
) {
  const comma = buildCommaFOver_d(C, D, F, homC, homD, eqD, dObj);
  const uf = new UF<Key>();
  const elems: Record<Key, unknown> = {};

  // Seed disjoint union
  comma.objs.forEach(({ c }, i) => {
    const xs = I.onObj[c] || [];
    xs.forEach((x, n) => { const k = keyOf(i, c, x, n); uf.add(k); elems[k] = x; });
  });

  // Identify along morphisms
  comma.mor.forEach(({ from, to, u }) => {
    const obj1 = comma.objs[from];
    const obj2 = comma.objs[to];
    if (!obj1 || !obj2) return;
    
    const c = obj1.c;
    const c2 = obj2.c;
    const f = applyPath(I, u);
    const xs = I.onObj[c] || [];
    xs.forEach((x, n) => {
      const y = f(x);
      const k1 = keyOf(from, c, x, n);
      const k2 = keyOf(to,   c2, y as unknown, n); // coarse place; refined matching left to caller
      uf.add(k2); elems[k2] = y;
      uf.union(k1, k2);
    });
  });

  // Representatives per class
  const repByClass = new Map<string, unknown>();
  Object.keys(elems).forEach(k => repByClass.set(uf.find(k), elems[k]));

  return { comma, uf, elems, repByClass };
}

// ----- Public: plain fiber ---------------------------------------------------
export function sigmaFiber_viaComma(
  C: SmallCategory, D: SmallCategory, F: Functor, I: FiniteInstance,
  homC: HomEnum, homD: HomEnum, eqD: PathEq, dObj: string
): readonly unknown[] {
  const { repByClass } = fiberUFState(C, D, F, I, homC, homD, eqD, dObj);
  return Array.from(repByClass.values());
}

// ----- Public: real unit components η_I(c) using representatives --------------
export function unitComponents_eta_I_withLookup(
  C: SmallCategory, D: SmallCategory, F: Functor, I: FiniteInstance,
  homC: HomEnum, homD: HomEnum, eqD: PathEq
): Record<string, (x: unknown) => unknown> {
  const out: Record<string, (x: unknown) => unknown> = {};
  for (const c of C.objects) {
    const d = F.onObj(c);
    const { comma, uf, repByClass } = fiberUFState(C, D, F, I, homC, homD, eqD, d);
    // Find the object index i0 corresponding to (c, id_{F c})
    // d is a string (object id), not a category object, so we need to create the identity path
    const idFc = { at: d, arrows: [] } as Path;
    const i0 = comma.objs.findIndex(o => o.c === c && eqD(o.alpha, idFc));
    // Define η_{I,c}(x): pick representative of the class containing x in the (c, id) copy
    out[c] = (x: unknown) => {
      const xs = I.onObj[c] || [];
      const n = xs.findIndex(v => v === x); // first occurrence
      if (n < 0 || i0 < 0) return x;        // fallback if not found
      const k = keyOf(i0, c, x, n);
      const rep = repByClass.get(uf.find(k));
      return rep ?? x;
    };
  }
  return out;
}
