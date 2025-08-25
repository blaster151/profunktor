/**
 * Pushout Operations
 * 
 * Provides a generic pushout implementation with category operations interface.
 * This module is self-contained and can be used independently.
 */

/**
 * Category operations interface for computing pushouts.
 * Provides the minimal operations needed: coproduct, coequalizer, and composition.
 */
export interface CategoryOps<Obj, Mor> {
  /** coproduct X ⊕ Y with injections inl, inr */
  coproduct: (x: Obj, y: Obj) => { obj: Obj; inl: Mor; inr: Mor };
  /** coequalizer of two parallel morphisms u,v : A ⇒ B */
  coequalizer: (u: Mor, v: Mor) => { obj: Obj; q: Mor };
  /** compose v ∘ u */
  compose: (v: Mor, u: Mor) => Mor;
}

/**
 * Compute the pushout of f: A→B and g: A→C. 
 * Returns object P and the maps B→P, C→P.
 * 
 * The pushout is computed as the coequalizer of the coproduct:
 * P = coequalizer(B ⊕ C, inl ∘ f, inr ∘ g)
 */
export function pushout<Obj, Mor>(
  ops: CategoryOps<Obj, Mor>,
  A: Obj, B: Obj, C: Obj,
  f: Mor, g: Mor
): { P: Obj; inB: Mor; inC: Mor } {
  const { obj: sum, inl, inr } = ops.coproduct(B, C);
  // coequalize inl ∘ f and inr ∘ g
  const uf = ops.compose(inl, f);
  const vg = ops.compose(inr, g);
  const { obj: P, q } = ops.coequalizer(uf, vg);
  return { P, inB: ops.compose(q, inl), inC: ops.compose(q, inr) };
}
