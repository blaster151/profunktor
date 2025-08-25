/**
 * Colimit Collapsing Optimizations
 * 
 * Provides optimizations for colimit computations, specifically the
 * "nested colimit over slice collapses to a single colimit" trick.
 * This can be used as a rewrite before evaluation to improve performance.
 */

/**
 * A marker interface for slice-indexed diagrams Cat/E.
 * This marks diagrams that are indexed over slice categories.
 */
export interface SliceIndexed<I> {
  readonly isSliceIndexed: true;
  readonly base: I;
}

/**
 * A generic diagram functor shape for colimit evaluation.
 * This provides a uniform interface for diagrams that can be evaluated at indices.
 */
export interface ColimDiagram<I, X> {
  readonly index: I;
  evaluateAt(i: I): X;
}

/**
 * Collapse colim∘colim_D(X) → colim(X) when the outer index is a slice
 * (cf. Lemma 7.13). We encode this as a no-op transformation plus a tag
 * that downstream evaluators can match on to skip the inner colimit.
 * 
 * This optimization recognizes when we have a nested colimit structure
 * where the outer colimit is indexed over a slice category, and collapses
 * it to a single colimit computation.
 * 
 * @param outer The outer diagram indexed over a slice category
 * @param innerBuilder Function that builds the inner diagram for each base index
 * @returns A collapsed diagram that can be evaluated directly
 */
export function collapseNestedColimit<I, X>(
  outer: ColimDiagram<SliceIndexed<I>, X>,
  innerBuilder: (i: I) => ColimDiagram<I, X>
): ColimDiagram<I, X> {
  return {
    index: outer.index.base,
    evaluateAt: (i) => innerBuilder(i).evaluateAt(i)
  };
}
