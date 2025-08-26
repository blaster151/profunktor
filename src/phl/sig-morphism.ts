// src/phl/sig-morphism.ts
// Minimal signatures & morphisms ρ for (quasi-)equational/PHL settings.

export type Sort = string;

export interface FuncSym {
  name: string;
  inSorts: readonly Sort[];
  outSort: Sort;
}

export interface Signature {
  sorts: readonly Sort[];
  funcs: readonly FuncSym[]; // no predicates here; use predicate-elimination if needed
}

/** A signature morphism ρ: Σ → Σ′ (renames/sends sorts & symbols). */
export interface SigMorphism {
  onSort: (A: Sort) => Sort;
  onFunc: (f: FuncSym) => FuncSym; // must map arities compatibly
}
