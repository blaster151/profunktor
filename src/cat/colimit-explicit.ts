// src/cat/colimit-explicit.ts
// Explicit colimit C of a diagram F:J→Cat:
//   Ob(C) = colim_i Ob(C_i)  (via E(ObF))
//   Mor([a]→[b]) = F-decorated zig-zags modulo 2-cells in Z_F.  :contentReference[oaicite:1]{index=1}
import { colimObjects, type DiagramCat } from "./zigzag-colimit";
import { actRhoConcat, type DecoratedLR, type RhoGen } from "./double-zigzag";
import { elementsPath, type ObFDiagram } from "./elements-obF";
import { assertDefined } from "../util/assert";

export type RepKey = string; // canonical representative "i::a"

export interface FDecor<Obj, Mor> {
  // Chain of length-1 F-decorated zig-zags (we concatenate for composition).
  lrChain: DecoratedLR<string, Obj, Mor>[];
}

export interface MorRep<Obj, Mor> {
  src: RepKey;
  dst: RepKey;
  dec: FDecor<Obj, Mor>;
}

// A tiny quotient manager: normalize a length-1 decorated zig-zag by acting with a given ρ string.
export function normalizeByRho<Obj, Mor>(
  Flookup: (uId: string) => { onObj(o: Obj): Obj; onMor(m: Mor): Mor },
  gens: RhoGen<string>[],
  m: MorRep<Obj, Mor>,
  composeInApex: (m2: Mor, m1: Mor) => Mor
): MorRep<Obj, Mor> {
  // normalize *each* bead; concatenation is preserved by ρ acting beadwise
  const actedBeads = m.dec.lrChain.map(lr => actRhoConcat(Flookup, gens, lr, composeInApex));
  // If square collapsed to trivial {k}, we keep endpoints and store the composed apex arrow as f0/f1 degenerate.
  const normBeads: DecoratedLR<string, Obj, Mor>[] = actedBeads.map(ab => {
    if ("g" in (ab as any)) {
      const t = ab as any as { k: string; aPrime: Obj; bPrime: Obj; g: Mor };
      return {
        i: t.k, j: t.k, k: t.k, lId: "id", rId: "id",
        a: t.aPrime, a1: t.aPrime, b: t.bPrime,
        f0: t.g, f1: t.g
      };
    }
    return ab as DecoratedLR<string, Obj, Mor>;
  });
  return { ...m, dec: { lrChain: normBeads } };
}

/** Build the explicit colimit category façade. 
 *  - id: represented by a trivial zig-zag on {i} with id_a
 *  - composition: concatenate, inserting an ObF-decorated bridge (with identity decorations) as in the paper.  :contentReference[oaicite:2]{index=2}
 *  Equality is by *user-supplied* 2-cells (ρ-strings) applied via normalizeByRho.
 */
export function explicitColimitC<Obj, Mor>(diag: DiagramCat) {
  const { repOf } = colimObjects(diag);

  const classOf = (i: string, a: string): RepKey => repOf.get(`${i}::${a}`)!;

  // --- Local normalizer inspired by the paper's unital/transposition 2-cells ---
  // (i) erase "trivial" beads (unital): i=j=k, l=r="id", and both morphisms are identities at the endpoints
  // (ii) collapse consecutive identity-decorated beads (bridge noise from ObF)
  function normalizeChain(lrChain: DecoratedLR<string, Obj, Mor>[]) {
    const trivial = (lr: DecoratedLR<string, Obj, Mor>) =>
      lr.i === lr.j && lr.j === lr.k && lr.lId === "id" && lr.rId === "id" &&
      JSON.stringify(lr.f0) === JSON.stringify(lr.f1);
    const out: DecoratedLR<string, Obj, Mor>[] = [];
    for (const bead of lrChain) {
      if (trivial(bead)) continue;                  // (unital) drop
      if (out.length) {
        const prev = assertDefined(out[out.length - 1], "normalizeChain: prev must be defined");
        // (transposition-ish collapse): if two consecutive beads only shuttle objects with ids and "id" legs, merge
        const justIds =
          prev.lId === "id" && prev.rId === "id" &&
          bead.lId === "id" && bead.rId === "id";
        if (justIds && JSON.stringify(prev.b) === JSON.stringify(bead.a)) {
          // stitch endpoints; keep the rightmost morphism as representative
          out[out.length - 1] = { ...prev, j: bead.j, b: bead.b, f1: bead.f1 };
          continue;
        }
      }
      out.push(bead);
    }
    return out;
  }

  return {
    classOf,
    /** Build a morphism [a]→[b] from a *proper* χ_p-decorated necklace living over x…y in S(X). */
    mkMorFromProper: (
      leftIdx: string, leftObj: string,
      rightIdx: string, rightObj: string,
      lr: DecoratedLR<string, Obj, Mor>[]
    ): MorRep<Obj, Mor> => ({
      src: classOf(leftIdx, leftObj),
      dst: classOf(rightIdx, rightObj),
      dec: { lrChain: lr }
    }),
    // construct a length-1 decorated zig-zag morphism [a]→[b]
    mkMor: (srcIdx: string, srcObj: string, dstIdx: string, dstObj: string,
            lr: DecoratedLR<string, Obj, Mor>): MorRep<Obj, Mor> => ({
      src: classOf(srcIdx, srcObj),
      dst: classOf(dstIdx, dstObj),
      dec: { lrChain: [lr] }
    }),
    /** Identity at [a]: choose representative (i,a) and use trivial zig-zag {i} with id_a. */
    id: (i: string, a: string, idInCi: (i: string, a: Obj) => Mor): MorRep<Obj, Mor> => {
      const ida = idInCi(i, { ...(typeof a === "object" ? (a as any) : { id: a }) } as any);
      const lr: DecoratedLR<string, Obj, Mor> = {
        i, j: i, k: i, lId: "id", rId: "id",
        a: ({ id: a } as unknown) as Obj,
        a1: ({ id: a } as unknown) as Obj,
        b: ({ id: a } as unknown) as Obj,
        f0: ida, f1: ida
      };
      return { src: classOf(i, a), dst: classOf(i, a), dec: { lrChain: [lr] } };
    },
    /** Composition per pp.17–18: (i,a)~(j,b) ∘ (j',b')~(k,c) by inserting an ObF-bridge (j,b) ⇒ (j',b'), decorated by identities. */
    compose: (
      m2: MorRep<Obj, Mor>,
      m1: MorRep<Obj, Mor>,
      opts: {
        // object part of F
        ObF: { Ob: Record<string, string[]>; uObj: Record<string, (a: string) => string> };
        // produce an identity morphism in C_i on object "a"
        idIn: (i: string, a: Obj) => Mor;
      }
    ): MorRep<Obj, Mor> => {
      // Extract the middle endpoints as elements (j,b) and (j',b')
      const last1 = assertDefined(m1.dec.lrChain[m1.dec.lrChain.length - 1], "compose: last1 must be defined");
      const first2 = assertDefined(m2.dec.lrChain[0], "compose: first2 must be defined");
      const left = { i: last1.j, a: (last1.b as any).id ?? String(last1.b) };
      const right = { i: first2.i, a: (first2.a as any).id ?? String(first2.a) };
      const J = diag.J;
      const ObF = { J, Ob: opts.ObF.Ob, uObj: opts.ObF.uObj };
      const path = elementsPath(ObF, left, right);
      if (!path) throw new Error(`No ObF-bridge found from (${left.i},${left.a}) to (${right.i},${right.a})`);

      // Turn the E(ObF) path into a chain of *identity-decorated* length-1 beads.
      const idBeads: DecoratedLR<string, Obj, Mor>[] = [];
      for (let t = 1; t < path.length; t++) {
        const p = assertDefined(path[t - 1], "compose: p must be defined");
        const q = assertDefined(path[t], "compose: q must be defined");
        const ida = opts.idIn(p.i, ({ id: p.a } as unknown) as Obj);
        const idb = opts.idIn(q.i, ({ id: q.a } as unknown) as Obj);
        idBeads.push({
          i: p.i, j: q.i, k: p.i, lId: "id", rId: "id",
          a: ({ id: p.a } as unknown) as Obj,
          a1: ({ id: p.a } as unknown) as Obj,
          b: ({ id: q.a } as unknown) as Obj,
          f0: ida, f1: idb
        });
      }
      return {
        src: m1.src,
        dst: m2.dst,
        dec: { lrChain: [...m1.dec.lrChain, ...idBeads, ...m2.dec.lrChain] }
      };
    },
    // decide equality modulo a provided list of ρ generators (horizontal) by normalizing both sides
    equalModulo: (
      Flookup: (uId: string) => { onObj(o: Obj): Obj; onMor(m: Mor): Mor },
      gens: RhoGen<string>[],
      composeInApex: (m2: Mor, m1: Mor) => Mor,
      g: MorRep<Obj, Mor>, f: MorRep<Obj, Mor>
    ) => {
      if (g.src !== f.src || g.dst !== f.dst) return false;
      const gn = normalizeByRho(Flookup, gens, g, composeInApex);
      const fn = normalizeByRho(Flookup, gens, f, composeInApex);
      const gnn = normalizeChain(gn.dec.lrChain);
      const fnn = normalizeChain(fn.dec.lrChain);
      return JSON.stringify(gnn) === JSON.stringify(fnn);
    },
    /** φ_i : C_i → C (object-level & trivial-zig-zag morphisms), per the proof of the universal property.  :contentReference[oaicite:3]{index=3} */
    phi: {
      onObj: (i: string, a: string) => classOf(i, a),
      onMor: (i: string, f: Mor, a: string, idInCi: (i: string, a: Obj) => Mor) => {
        const lr: DecoratedLR<string, Obj, Mor> = {
          i, j: i, k: i, lId: "id", rId: "id",
          a: ({ id: a } as unknown) as Obj,
          a1: ({ id: a } as unknown) as Obj,
          b: ({ id: a } as unknown) as Obj,
          f0: f, f1: idInCi(i, ({ id: a } as unknown) as Obj)
        };
        return { src: classOf(i, a), dst: classOf(i, a), dec: { lrChain: [lr] } } as MorRep<Obj, Mor>;
      }
    }
  };
}
