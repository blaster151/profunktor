// src/cat/elements-obF.ts
// Elements of ObF (just the object-part) and a tiny BFS to find a zig-zag (j,b) ~ ... ~ (j',b').
// Matches the paper's use of an ObF-decorated zig-zag to *bridge* composition.  :contentReference[oaicite:1]{index=1}

export interface IndexingCategory {
  objects: string[];
  arrows: { id: string; src: string; dst: string }[];
}

export interface ObFDiagram {
  J: IndexingCategory;
  // For each i in J, the set of objects Ob(C_i)
  Ob: Record<string, string[]>;
  // For each u:i→j, object-map ũ: Ob(C_i) → Ob(C_j)
  uObj: Record<string, (a: string) => string>;
}

export type ElemNode = { i: string; a: string };

/** Adjacency list for E(ObF): edge (i,a) --u--> (j, ũ(a)). */
export function elementsGraph(F: ObFDiagram): Map<string, ElemNode[]> {
  const key = (x: ElemNode) => `${x.i}::${x.a}`;
  const adj = new Map<string, ElemNode[]>();
  for (const i of F.J.objects) {
    const obI = F.Ob[i];
    if (obI === undefined) continue;
    for (const a of obI) adj.set(key({ i, a }), []);
  }
  for (const u of F.J.arrows) {
    const f = F.uObj[u.id];
    const obSrc = F.Ob[u.src];
    if (obSrc === undefined) continue;
    for (const a of obSrc) {
      const from = { i: u.src, a };
      const to = { i: u.dst, a: f(a) };
      adj.get(key(from))!.push(to);
    }
  }
  return adj;
}

/** BFS to find *some* elements-zig-zag (maybe empty) from (j,b) to (j',b'). */
export function elementsPath(
  F: ObFDiagram,
  src: ElemNode,
  dst: ElemNode
): ElemNode[] | null {
  const key = (x: ElemNode) => `${x.i}::${x.a}`;
  if (key(src) === key(dst)) return [src];
  const adj = elementsGraph(F);
  const q: ElemNode[] = [src];
  const prev = new Map<string, ElemNode | null>();
  prev.set(key(src), null);
  while (q.length) {
    const v = q.shift()!;
    for (const w of adj.get(key(v)) ?? []) {
      if (prev.has(key(w))) continue;
      prev.set(key(w), v);
      if (key(w) === key(dst)) {
        // unwind
        const path: ElemNode[] = [];
        let cur: ElemNode | null = w;
        while (cur) { path.push(cur); cur = prev.get(key(cur)) ?? null; }
        path.reverse();
        return [src, ...path]; // include src
      }
      q.push(w);
    }
  }
  return null;
}
