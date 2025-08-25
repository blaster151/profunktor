/**
 * fp-enrichment
 * -------------
 * Why this file exists:
 *   Several constructions in Parts 7–8 of Batanin–Berger (e.g., Theorem 8.2 and
 *   Corollary 8.4 on pp. 56–58 of "Homotopy Theory for Algebras over Polynomial Monads")
 *   require the *ambient* category 𝓔 to be **enriched in simplicial sets** and to admit
 *   a "good" *realization* functor for simplicial objects. In practice, that means some
 *   high-level derived or homotopical features in our codebase must be **gated** on a
 *   bit of metadata about 𝓔. This file provides exactly that metadata + tiny helpers.
 *
 * What developers should know:
 *   • Use this when you write code that only makes sense for simplicial enrichment:
 *       - Bousfield–Kan simplicial replacements;
 *       - Quillen adjunctions that depend on a "good" realization functor |–|_𝓔;
 *       - Simplicial nerve / classifier constructions (e.g., N(T^S) in Cor. 8.4);
 *       - Any algorithm that relies on a *compatibility relation* like
 *         𝓔_*(X, Y) ≅ 𝓔(e, 𝓔(X, Y)) (see the discussion leading to Thm. 8.2).
 *   • Don't use it for ordinary (plain) category code—set `enrichment: 'none'`.
 *   • For topological enrichment, we keep a placeholder tag ('topological'); the
 *     current algorithms only *require* the simplicial case, but the type allows
 *     future extension.
 *
 * How it maps to the paper:
 *   • Theorem 8.2: Under simplicial enrichment + a "good" realization functor and a
 *     standard system of simplices, derived left functors behave well (pointwise
 *     cofibrant replacements compute homotopy colimits, etc.). We expose two boolean
 *     hints to represent those hypotheses:
 *       - `hasStandardSimplices`: encodes "standard system of simplices";
 *       - `hasGoodRealization`: encodes the existence of a "good realization" functor.
 *     Use the guard `supportsGoodRealization(E)` before you trigger algorithms that
 *     assume those hypotheses (e.g., BK simplicial replacement equals hocolim).
 *
 * Example usage:
 *   const E: EnrichedCategory<ModelCategory> = {
 *     base: SetsWithQuillen,
 *     enrichment: 'simplicial',
 *     hasStandardSimplices: true,
 *     hasGoodRealization: true
 *   };
 *
 *   if (isSimplicial(E) && supportsGoodRealization(E)) {
 *     // Safe to run BK-style replacement or collapse nested colimits via Thm. 8.2.
 *     computeHomotopyColimit(diagram, E);
 *   }
 *
 * Minimal policy:
 *   We **never** hard-require these flags at the type level; we only *guard* optional
 *   pathways (optimizations and derived constructions). This keeps the rest of the
 *   library usable for plain categories while making "homotopical" code explicit.
 */

/** Which enrichment the ambient category provides. */
export type Enrichment = 'none' | 'simplicial' | 'topological';

/**
 * Wrap a concrete category object `C` with enrichment metadata.
 * `C` can be your own category/model structure wrapper (e.g., Set, Ch_≥0, sSet, …).
 */
export interface EnrichedCategory<C> {
  /** Your concrete category carrier (objects, morphisms, Quillen structure, …). */
  readonly base: C;
  /** Declares whether the hom-objects live in sSet, Top, or are just sets. */
  readonly enrichment: Enrichment;
  /**
   * Paper-level hypothesis (Theorem 8.2):
   *   "standard system of simplices" available in 𝓔.
   * Set to `true` only if your simplicial enrichment exposes the canonical Δ-simplices
   * with the expected face/degeneracy behavior (e.g., sSet with Δ[n]).
   */
  readonly hasStandardSimplices?: boolean;
  /**
   * Paper-level hypothesis (Theorem 8.2):
   *   a "good realization functor" |–|_𝓔 for simplicial objects in 𝓔.
   * Set to `true` only if your build has a geometric/∣–∣-like functor that interacts
   * well with weak equivalences (in practice: computes homotopy colimits correctly).
   */
  readonly hasGoodRealization?: boolean;
}

/** Quick guard: is the ambient category simplicially enriched? */
export const isSimplicial = <C>(E: EnrichedCategory<C>) =>
  E.enrichment === 'simplicial';

/** Guard for Theorem 8.2 use-sites (BK replacement, derived left functors, etc.). */
export const supportsGoodRealization = <C>(E: EnrichedCategory<C>) =>
  isSimplicial(E) && !!E.hasStandardSimplices && !!E.hasGoodRealization;

/**
 * Optional runtime assertion helper for developer ergonomics.
 * Use inside code paths that *require* the Thm. 8.2 hypotheses; throws a helpful error.
 */
export function ensureSimplicialRealization<C>(E: EnrichedCategory<C>, feature: string): void {
  if (!supportsGoodRealization(E)) {
    const msg =
      `[fp-enrichment] Feature "${feature}" requires simplicial enrichment ` +
      `with { hasStandardSimplices: true, hasGoodRealization: true }. ` +
      `Got enrichment=${E.enrichment}, hasStandardSimplices=${!!E.hasStandardSimplices}, ` +
      `hasGoodRealization=${!!E.hasGoodRealization}. See Thm. 8.2 (Batanin–Berger).`;
    throw new Error(msg);
  }
}

// ============================================================================
// CONSTRUCTOR HELPERS (for convenience)
// ============================================================================

/**
 * Create an enriched category with no enrichment.
 *
 * @param base The base category
 * @returns An enriched category with 'none' enrichment
 */
export const enrichNone = <C>(base: C): EnrichedCategory<C> => ({
  base,
  enrichment: 'none'
});

/**
 * Create a simplicially enriched category.
 *
 * @param base The base category
 * @param hasStandardSimplices Whether the standard system of simplices is present
 * @param hasGoodRealization Whether a good realization functor is available
 * @returns A simplicially enriched category
 */
export const enrichSimplicial = <C>(
  base: C, 
  hasStandardSimplices: boolean = false,
  hasGoodRealization: boolean = false
): EnrichedCategory<C> => ({
  base,
  enrichment: 'simplicial',
  hasStandardSimplices,
  hasGoodRealization
});

/**
 * Create a topologically enriched category.
 *
 * @param base The base category
 * @returns A topologically enriched category
 */
export const enrichTopological = <C>(base: C): EnrichedCategory<C> => ({
  base,
  enrichment: 'topological'
});
