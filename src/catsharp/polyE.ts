// Poly_E scaffolding + embedding into Cat♯ (generic, Set-level).  :contentReference[oaicite:2]{index=2}
import type { SmallCat } from "./cofunctor";
import type { BicomoduleWitness, Copresheaf } from "./prafunctor";
import { representable } from "./prafunctor";
import { assertString } from "../util/strings";

/** A *typed* polynomial  A ← P* → P → B  in a small E (we model E as SmallCat). */
export interface TypedPolynomial {
  A: string; B: string;   // objects of E
  P: string; Pstar: string;
  a_from_pstar: { id: string; src: string; dst: string }; // P* → A   (note: paper draws A ← P*)
  pstar_to_p:   { id: string; src: string; dst: string }; // P* → P   (exponentiable)
  p_to_B:       { id: string; src: string; dst: string }; // P  → B
}

/** Minimal helpers a client must provide to make the embedding concrete on their E. */
export interface EOps {
  hom: (src: string, dst: string) => Array<{ id: string; src: string; dst: string }>;
  pullback: (along: { id: string; src: string; dst: string }, f: { id: string; src: string; dst: string }) =>
    { obj: string }; // name (id) of the chosen pullback object (enough to name a representable)
}

/**
 * Embed a typed polynomial into a (E/A, E/B)-bicomodule (locally fully faithful double functor).
 * We expose just the *objectwise carrier*: positions at an object x:A are pairs (o→A, G:o→P over A),
 * and the fiber at such a position is the representable y(G*P*), matching Theorem 4.3.  :contentReference[oaicite:3]{index=3}
 */
export function embedTypedPolynomial(
  E: SmallCat,
  poly: TypedPolynomial,
  ops: EOps
): BicomoduleWitness<SmallCat, SmallCat> {
  // Slice categories E/A and E/B (discrete-only façade: objects are arrows into A, B)
  const AStr = assertString(poly.A, "embedTypedPolynomial: poly.A must be a string");
  const BStr = assertString(poly.B, "embedTypedPolynomial: poly.B must be a string");
  const EA: SmallCat = {
    objects: ops.hom(undefined as any, AStr).map(h => h.id), // callers typically pass hom(*,A)
    morphisms: ops.hom(AStr, AStr).filter(m => m.src === AStr && m.dst === AStr) // identities
  };
  const EB: SmallCat = {
    objects: ops.hom(undefined as any, BStr).map(h => h.id),
    morphisms: ops.hom(BStr, BStr).filter(m => m.src === BStr && m.dst === BStr)
  };

  return {
    left: EA,
    right: EB,
    positionsAt: (_xObjId: string) => {
      // { (o→A), G:o→P }  with cod(G)=P and (a∘?) = (p_to_B∘G) factoring over A in the slice
      const intoA = ops.hom(undefined as any, AStr);
      const PStr = assertString(poly.P, "embedTypedPolynomial: poly.P must be a string");
      const intoP = (o: string) => ops.hom(o, PStr);
      const pairs: string[] = [];
      for (const o2A of intoA) {
        const srcStr = assertString(o2A.src, "embedTypedPolynomial: o2A.src must be a string");
        const idStr = assertString(o2A.id, "embedTypedPolynomial: o2A.id must be a string");
        for (const G of intoP(srcStr)) {
          const GIdStr = assertString(G.id, "embedTypedPolynomial: G.id must be a string");
          pairs.push(`${idStr}::${GIdStr}`);
        }
      }
      return pairs;
    },
    fiberAt: (_xObjId: string, pos: string): Copresheaf<SmallCat> => {
      const parts = pos.split("::");
      const Gid = parts.length > 1 ? assertString(parts[1], "embedTypedPolynomial: Gid must be a string") : "";
      const PStr = assertString(poly.P, "embedTypedPolynomial: poly.P must be a string");
      // name the pullback G*P* and use its representable as the fiber (enough for Set-level tests)
      const pb = ops.pullback({ id: Gid, src: "", dst: PStr }, poly.pstar_to_p);
      return representable(EB, pb.obj);
    }
  };
}
