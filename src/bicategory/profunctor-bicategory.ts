//
/**
 * Profunctor Bicategory skeleton
 *
 * Objects: Types (implicitly)
 * 1-cells: profunctor-like values `Apply<P, [A, B]>`
 * 2-cells: natural transformations between parallel profunctors, modeled with `NatP`
 *
 * This module wires the bicategory scaffold to the existing HKT and natural
 * transformation utilities. Composition of profunctors is provided as a
 * witness-level API; concrete instances can refine it.
 */

import { Apply, Kind2 } from "../../fp-hkt";

// ----------------------------------------------------------------------------
// 2-cells between parallel profunctors as natural transformations
// ----------------------------------------------------------------------------

export interface NatPK<P extends Kind2> extends Kind2 {
  readonly type: (
    p: Apply<P, [this['arg0'], this['arg1']]>
  ) => Apply<P, [this['arg0'], this['arg1']]>;
}

/**
 * A 2-cell for profunctors: component-wise mapping of a profunctor `P` that
 * keeps domain/codomain fixed and transforms the internal structure. For many
 * concrete `P`, this is a natural transformation in the profunctor argument.
 */
export type NatP<P extends Kind2, A, B> = (pab: Apply<P, [A, B]>) => Apply<P, [A, B]>;

// Encode NatP as a `Kind2` instance so it can be used as `Cell` in `Bicategory`.
export interface NatPCell<P extends Kind2> extends Kind2 {
  readonly type: NatP<P, this['arg0'], this['arg1']>;
}

// ----------------------------------------------------------------------------
// Profunctor bicategory constructor
// ----------------------------------------------------------------------------

export function makeProfunctorBicategory<P extends Kind2>(args: {
  id: <A>() => Apply<P, [A, A]>;
  compose: <A, B, C>(g: Apply<P, [B, C]>, f: Apply<P, [A, B]>) => Apply<P, [A, C]>;
  // Horizontal and vertical composition on 2-cells — default to composition of endomaps
  id2?: <A, B>(f: Apply<P, [A, B]>) => NatP<P, A, B>;
  vert?: <A, B>(beta: NatP<P, A, B>, alpha: NatP<P, A, B>) => NatP<P, A, B>;
  horiz?: <A, B, C>(
    beta: NatP<P, B, C>,
    alpha: NatP<P, A, B>
  ) => NatP<P, A, C>;
  // Coherence witnesses (associator/unitors) — default to identities
  associator?: <A, B, C, D>(
    f: Apply<P, [A, B]>,
    g: Apply<P, [B, C]>,
    h: Apply<P, [C, D]>
  ) => NatP<P, A, D>;
  leftUnitor?: <A, B>(f: Apply<P, [A, B]>) => NatP<P, A, B>;
  rightUnitor?: <A, B>(f: Apply<P, [A, B]>) => NatP<P, A, B>;
}) {
  const id2 = args.id2 ?? (<A, B>(_: Apply<P, [A, B]>): NatP<P, A, B> => (p) => p);
  const vert = args.vert ?? (<A, B>(b: NatP<P, A, B>, a: NatP<P, A, B>): NatP<P, A, B> => (p) => b(a(p)));
  const horiz =
    args.horiz ??
    (<A, B, C>(b: NatP<P, B, C>, a: NatP<P, A, B>): NatP<P, A, C> => (p) => b(a(p)));
  const associator =
    args.associator ??
    (<A, B, C, D>(_: Apply<P, [A, B]>, __: Apply<P, [B, C]>, ___: Apply<P, [C, D]>): NatP<P, A, D> => (p) => p);
  const leftUnitor = args.leftUnitor ?? (<A, B>(_: Apply<P, [A, B]>): NatP<P, A, B> => (p) => p);
  const rightUnitor = args.rightUnitor ?? (<A, B>(_: Apply<P, [A, B]>): NatP<P, A, B> => (p) => p);

  const Bicat = {
    id1: args.id,
    compose1: args.compose,
    id2,
    vert,
    horiz,
    associator,
    leftUnitor,
    rightUnitor,
  } as const;

  return Bicat;
}

// ----------------------------------------------------------------------------
// Optional: Monoidal enhancement (tensor via product on objects)
// ----------------------------------------------------------------------------

export function withMonoidal<P extends Kind2>(bicategory: ReturnType<typeof makeProfunctorBicategory<P>>, ops: {
  tensor1: <A1, B1, A2, B2>(
    f: Apply<P, [A1, B1]>,
    g: Apply<P, [A2, B2]>
  ) => Apply<P, [[A1, A2], [B1, B2]]>;
  tensor2?: <A1, B1, A2, B2>(
    alpha: NatP<P, A1, B1>,
    beta: NatP<P, A2, B2>
  ) => NatP<P, [A1, A2], [B1, B2]>;
}) {
  const tensor2 =
    ops.tensor2 ??
    (<A1, B1, A2, B2>(alpha: NatP<P, A1, B1>, beta: NatP<P, A2, B2>) =>
      ((p: Apply<P, [[A1, A2], [B1, B2]]>) => beta(alpha(p as any)) as any));

  return {
    ...bicategory,
    tensor1: ops.tensor1,
    tensor2,
  } as const;
}


