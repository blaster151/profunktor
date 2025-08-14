/**
 * Bicategory core scaffold
 *
 * This module defines lightweight, witness-oriented interfaces for bicategories
 * and monoidal bicategories that fit the existing HKT encoding (`Kind2`, `Apply`).
 *
 * Design goals
 * - Keep it types-first and witness-only; no heavy runtime required
 * - Avoid edits to existing files; consumers can import these new abstractions
 * - Make it easy to instantiate specialized bicategories (e.g., proarrow/profunctor-based)
 */

import { Kind2, Apply } from '../fp-hkt';

// ----------------------------------------------------------------------------
// Helper type aliases
// ----------------------------------------------------------------------------

/**
 * One-cell in a bicategory for a given binary type constructor `Hom`.
 *
 * Example: for a proarrow/profunctor-based instance, `Hom` might be a
 * particular proarrow encoding and `Apply<Hom, [A, B]>` the 1-cell A ⇒ B.
 */
export type OneCell<Hom extends Kind2, A, B> = Apply<Hom, [A, B]>;

/**
 * Two-cell between parallel 1-cells. We model 2-cells as a separate `Kind2`
 * over a pair of parallel 1-cells. Concretely, `Apply<Cell, [f, g]>` is a 2-cell
 * from `f` to `g`, where `f` and `g` are themselves values of `Apply<Hom, [A, B]>`.
 *
 * Note: This encoding intentionally abstracts away the internal representation
 * of 2-cells while preserving their variance over source/target 1-cells.
 */
export type TwoCell<Cell extends Kind2, F, G> = Apply<Cell, [F, G]>;

// ----------------------------------------------------------------------------
// Bicategory
// ----------------------------------------------------------------------------

/**
 * Bicategory over a fixed binary type constructor `Hom` for 1-cells, and a
 * 2-cell constructor `Cell` that relates parallel 1-cells.
 *
 * `Hom` and `Cell` are type-level carriers; concrete instances provide value-level
 * operations for identities, composition, and coherence witnesses.
 */
export interface Bicategory<Hom extends Kind2, Cell extends Kind2> {
  // 1-cell identities and composition
  id1<A>(): OneCell<Hom, A, A>;
  compose1<A, B, C>(g: OneCell<Hom, B, C>, f: OneCell<Hom, A, B>): OneCell<Hom, A, C>;

  // 2-cell identities and composition (vertical and horizontal)
  id2<A, B>(f: OneCell<Hom, A, B>): TwoCell<Cell, OneCell<Hom, A, B>, OneCell<Hom, A, B>>;

  vert<A, B>(
    beta: TwoCell<Cell, OneCell<Hom, A, B>, OneCell<Hom, A, B>>,
    alpha: TwoCell<Cell, OneCell<Hom, A, B>, OneCell<Hom, A, B>>
  ): TwoCell<Cell, OneCell<Hom, A, B>, OneCell<Hom, A, B>>;

  horiz<A, B, C>(
    beta: TwoCell<Cell, OneCell<Hom, B, C>, OneCell<Hom, B, C>>,
    alpha: TwoCell<Cell, OneCell<Hom, A, B>, OneCell<Hom, A, B>>
  ): TwoCell<Cell, OneCell<Hom, A, C>, OneCell<Hom, A, C>>;

  // Coherence isomorphisms (as 2-cells) — witnesses only
  associator<A, B, C, D>(
    f: OneCell<Hom, A, B>,
    g: OneCell<Hom, B, C>,
    h: OneCell<Hom, C, D>
  ): TwoCell<Cell, OneCell<Hom, A, D>, OneCell<Hom, A, D>>; // ((h ∘ g) ∘ f) ⇒ (h ∘ (g ∘ f))

  leftUnitor<A, B>(
    f: OneCell<Hom, A, B>
  ): TwoCell<Cell, OneCell<Hom, A, B>, OneCell<Hom, A, B>>; // (id ∘ f) ⇒ f

  rightUnitor<A, B>(
    f: OneCell<Hom, A, B>
  ): TwoCell<Cell, OneCell<Hom, A, B>, OneCell<Hom, A, B>>; // (f ∘ id) ⇒ f
}

// ----------------------------------------------------------------------------
// Monoidal Bicategory (witness-level tensor)
// ----------------------------------------------------------------------------

/**
 * Monoidal structure on a bicategory. This skeleton exposes a tensor on
 * 1-cells and 2-cells. Object-level tensoring is intentionally left implicit,
 * following the codebase convention to keep object-level structure at the TS
 * type level (e.g., via tuples) rather than runtime values.
 */
export interface MonoidalBicategory<Hom extends Kind2, Cell extends Kind2>
  extends Bicategory<Hom, Cell> {
  tensor1<A1, B1, A2, B2>(
    f: OneCell<Hom, A1, B1>,
    g: OneCell<Hom, A2, B2>
  ): OneCell<Hom, [A1, A2], [B1, B2]>;

  tensor2<A1, B1, A2, B2>(
    alpha: TwoCell<Cell, OneCell<Hom, A1, B1>, OneCell<Hom, A1, B1>>,
    beta: TwoCell<Cell, OneCell<Hom, A2, B2>, OneCell<Hom, A2, B2>>
  ): TwoCell<
    Cell,
    OneCell<Hom, [A1, A2], [B1, B2]>,
    OneCell<Hom, [A1, A2], [B1, B2]>
  >;

  // Optional symmetry/braiding witnesses could be added here if needed
}

// ----------------------------------------------------------------------------
// Minimal, reusable constructors (identity 2-cells and vertical composition)
// ----------------------------------------------------------------------------

/**
 * Utility to construct trivial 2-cells as identity endomorphisms on 1-cells.
 * Concrete instances can provide refined 2-cell structures by implementing
 * their own `Cell` encodings.
 */
export function idTwoCell<Cell extends Kind2, Hom extends Kind2, A, B>(
  _cell: Cell,
  f: OneCell<Hom, A, B>
): TwoCell<Cell, OneCell<Hom, A, B>, OneCell<Hom, A, B>> {
  // The value is not used at runtime in this witness-only encoding.
  return {} as any;
}


