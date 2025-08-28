// src/cat/zigzag-colimit.ts
// Colimits of small categories via objects-as-Set-colimit + morphisms-as zig-zag chains.
// Matches the "necklace" idea in Theorem 1.1 (pp. 1–3).  TODO: refine ~ using §3.3's relation.  :contentReference[oaicite:2]{index=2}

export type ObjId = string;
export type MorId = string;

export interface SmallCategory {
  name: string;
  objects: ObjId[];                                   // object IDs (stable strings)
  morphisms: { id: MorId; src: ObjId; dst: ObjId }[]; // no composition table needed here
}

export interface Functor {
  id: string;
  src: string; // index object in J
  dst: string; // index object in J
  onObj: (o: ObjId) => ObjId;
  onMor: (m: { id: MorId; src: ObjId; dst: ObjId }) => { id: MorId; src: ObjId; dst: ObjId };
}

// Indexing category J (just what we need)
export interface IndexingCategory {
  objects: string[];
  arrows: { id: string; src: string; dst: string }[];
}

export interface DiagramCat {
  J: IndexingCategory;
  C: Record<string, SmallCategory>;               // Ci for each i ∈ J
  F: Record<string, Functor>;                     // for each arrow u:i→j in J, a functor F(u)=ũ:Ci→Cj
}

// ----- Set-level colimit of objects (coequalizer via union-find) ----------------

class UF {
  parent = new Map<string, string>();
  find(x: string): string {
    if (!this.parent.has(x)) this.parent.set(x, x);
    const p = this.parent.get(x)!;
    if (p !== x) this.parent.set(x, this.find(p));
    return this.parent.get(x)!;
  }
  union(a: string, b: string) {
    const ra = this.find(a), rb = this.find(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }
}

/** Build object representatives of colim_i Ci by identifying o ~ ũ(o). */
export function colimObjects(diag: DiagramCat): { repOf: Map<string,string>; classes: Map<string,string[]> } {
  const uf = new UF();
  // Tag each object with its fiber: "i::o"
  const tag = (i: string, o: ObjId) => `${i}::${o}`;
  for (const u of diag.J.arrows) {
    const fun = diag.F[u.id];
    const Ci = diag.C[u.src]; const Cj = diag.C[u.dst];
    Ci.objects.forEach(o => {
      uf.union(tag(u.src, o), tag(u.dst, fun.onObj(o)));
    });
  }
  // Collect classes
  const repOf = new Map<string,string>();
  const classes = new Map<string,string[]>();
  for (const i of diag.J.objects) {
    for (const o of diag.C[i].objects) {
      const t = tag(i,o); const r = uf.find(t);
      repOf.set(t, r);
      if (!classes.has(r)) classes.set(r, []);
      classes.get(r)!.push(t);
    }
  }
  return { repOf, classes };
}

// ----- Zig-zag chains for morphisms -------------------------------------------

/** A single "roof" leg produced by a functor ũ along u:i→j. */
export interface RoofLeg {
  arrowId: string;             // u
  dir: "fwd" | "bwd";          // move i→j ("apply ũ") or j→i ("use inverse leg in the zig-zag index")
}

/** A necklace/zig-zag morphism witness between representatives [a]→[b]. */
export interface ZigZag {
  srcRep: string;              // class representative like "i::a"
  dstRep: string;              // class representative like "j::b"
  // A sequence: f0 in Ci0, then (leg, f1), (leg, f2), …, fn landing at b in Cjn
  start: { at: string /* i0 */, mor: { id: MorId; src: ObjId; dst: ObjId } };
  beads: {
    leg: RoofLeg;              // across J
    // fk lives in the domain category of this leg (direction-sensitive)
    mor: { id: MorId; src: ObjId; dst: ObjId };
  }[];
}

/** Apply a roof leg to an object/morphism (direction-aware). */
function whisker(diag: DiagramCat, leg: RoofLeg,
  x: { obj?: ObjId; mor?: { id: MorId; src: ObjId; dst: ObjId } },
  atIndex: string
): { obj?: ObjId; mor?: { id: MorId; src: ObjId; dst: ObjId }; atIndex: string } {
  const u = diag.J.arrows.find(a => a.id === leg.arrowId)!;
  const F = diag.F[leg.arrowId];
  if (leg.dir === "fwd") {
    if (x.obj !== undefined) return { obj: F.onObj(x.obj), atIndex: u.dst };
    if (x.mor !== undefined) return { mor: F.onMor(x.mor), atIndex: u.dst };
  } else {
    // backward leg uses only object transport for endpoints in the index; we leave morphisms unchanged here.
    if (x.obj !== undefined) return { obj: x.obj /* placeholder */, atIndex: u.src };
    if (x.mor !== undefined) return { mor: x.mor, atIndex: u.src };
  }
  return { ...x, atIndex };
}

/** Build a basic "roof" morphism from a span k→i, k→j and a middle object c∈Ck with f:a→ũ_l(c), g:ũ_r(c)→b. */
export function roofArrow(diag: DiagramCat, params: {
  i: string; j: string; k: string;
  lId: string; rId: string;          // l:k→i, r:k→j in J
  a: ObjId; c: ObjId; b: ObjId;
  f: { id: MorId; src: ObjId; dst: ObjId };           // in Ci
  g: { id: MorId; src: ObjId; dst: ObjId };           // in Cj
}): ZigZag {
  const { repOf } = colimObjects(diag);
  const srcRep = repOf.get(`${params.i}::${params.a}`)!;
  const dstRep = repOf.get(`${params.j}::${params.b}`)!;
  const leg1: RoofLeg = { arrowId: params.lId, dir: "bwd" }; // move i ← k
  const leg2: RoofLeg = { arrowId: params.rId, dir: "fwd" }; // move k → j
  return {
    srcRep, dstRep,
    start: { at: params.i, mor: params.f },
    beads: [
      { leg: leg1, mor: { id: "_id_k", src: params.c, dst: params.c } }, // we pass through c in Ck
      { leg: leg2, mor: params.g }
    ]
  };
}

/** Concatenate two zig-zags when the middle reps match (naive composition; refine via §3.3 later). */
export function composeZigZag(diag: DiagramCat, g: ZigZag, f: ZigZag): ZigZag {
  if (f.dstRep !== g.srcRep) throw new Error("composeZigZag: middle representatives don't match");
  return {
    srcRep: f.srcRep,
    dstRep: g.dstRep,
    start: f.start,
    beads: [...f.beads, ...g.beads]
  };
}

/** Build a "colimit category" façade exposing reps and zig-zag arrows. */
// SetDiagram type for working with Set-valued functors
export interface SetDiagram {
  J: IndexingCategory;
  C: { [obj: string]: string[] };
  F: { [arr: string]: (x: string) => string };
}

// Compute π0 (path components) of the category of elements
export function pi0OfElements(setDiag: SetDiagram): Map<string, number> {
  const elements: string[] = [];
  const parent = new Map<string, string>();
  
  // Collect all elements
  for (const obj of setDiag.J.objects) {
    for (const elem of setDiag.C[obj]) {
      const key = `${obj}::${elem}`;
      elements.push(key);
      parent.set(key, key); // Initially each element is its own parent
    }
  }
  
  // Find operation to get root parent
  const find = (x: string): string => {
    if (parent.get(x) === x) return x;
    const root = find(parent.get(x)!);
    parent.set(x, root); // Path compression
    return root;
  };
  
  // Union operation
  const union = (x: string, y: string) => {
    const rootX = find(x);
    const rootY = find(y);
    if (rootX !== rootY) {
      parent.set(rootX, rootY);
    }
  };
  
  // Connect elements related by morphisms
  for (const arr of setDiag.J.arrows) {
    const f = setDiag.F[arr.id];
    for (const elem of setDiag.C[arr.src]) {
      const srcKey = `${arr.src}::${elem}`;
      const dstKey = `${arr.dst}::${f(elem)}`;
      union(srcKey, dstKey);
    }
  }
  
  // Assign component numbers
  const componentMap = new Map<string, number>();
  const roots = new Map<string, number>();
  let componentId = 0;
  
  for (const elem of elements) {
    const root = find(elem);
    if (!roots.has(root)) {
      roots.set(root, componentId++);
    }
    componentMap.set(elem, roots.get(root)!);
  }
  
  return componentMap;
}

// Placeholder for categoryOfElements - not used in the test
export function categoryOfElements(setDiag: SetDiagram) {
  return {}; // Placeholder
}

export function colimitCategory(diag: DiagramCat) {
  const { classes, repOf } = colimObjects(diag);
  return {
    reps: Array.from(classes.keys()),             // canonical object reps of colim C
    classOf: (i: string, o: ObjId) => repOf.get(`${i}::${o}`)!,
    id: (i: string, o: ObjId) => {
      const rep = repOf.get(`${i}::${o}`)!;
      return <ZigZag>{ srcRep: rep, dstRep: rep, start: { at: i, mor: { id: "_id", src: o, dst: o } }, beads: [] };
    },
    compose: (g: ZigZag, f: ZigZag) => composeZigZag(diag, g, f)
    // NOTE: normalization/quotienting of zig-zags awaits §3.3; we've left a seam for it.
  };
}
