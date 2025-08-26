// src/logic/partial-horn.ts
// Partial Horn / quasi-equational layer for cartesian categories.
// Lets you declare *partial* operations as graphs with a domain predicate.
// We translate them to ED axioms with ∃! witnesses (cartesian) so our chase
// produces FREE *partial* models and left adjoints exist.

import type {
  Signature, RegularTheory, ED, RegularAtom, RegularFormula,
} from "./regular-cartesian";

// A domain predicate is just a regular (conjunctive) formula on the inputs.
export type DomainFormula = RegularFormula;

export interface PartialOp {
  name: string;                // symbol for the operation graph R_f(x̄, y)
  inSorts: readonly string[];  // x̄ sorts
  outSort: string;             // y sort
  domain: DomainFormula;       // when defined
}

export interface PartialHornSpec {
  // Add new graph relations for ops on top of an existing signature.
  base: Signature;
  ops: readonly PartialOp[];
}

/** Extend a signature with the relational symbols for partial ops (their graphs). */
export function extendSignatureWithPartialOps(spec: PartialHornSpec): Signature {
  const rels = [
    ...spec.base.relations,
    ...spec.ops.map(op => ({
      name: op.name,
      arity: [...op.inSorts, op.outSort] as const,
    })),
  ];
  return { sorts: spec.base.sorts, relations: rels };
}

/** EDs enforcing "when domain holds, there exists a unique output" for each partial op. */
export function partialOpsCartesianAxioms(spec: PartialHornSpec): ED[] {
  return spec.ops.flatMap(op => {
    // variables x1,…,xn : A1,…,An and y : B
    const forall = op.inSorts.map((s, i) => ({ name: `x${i}`, sort: s }));
    const y = { name: "y", sort: op.outSort };

    const lhs: RegularFormula = { all: [...op.domain.all] };
    const rhs: RegularFormula = {
      all: [
        { kind: "rel", rel: op.name, vars: [...forall.map(v => v.name), y.name] } as RegularAtom,
      ],
    };

    // ∀x̄. domain(x̄) ⇒ ∃! y. R_f(x̄, y)
    const ed: ED = { forall, lhs, exists: [y], rhs, unique: true };
    return [ed];
  });
}

/** Convenience: build a cartesian *partial Horn* theory from a base signature + ops. */
export function partialHornToCartesian(spec: PartialHornSpec): RegularTheory {
  return {
    sigma: extendSignatureWithPartialOps(spec),
    axioms: partialOpsCartesianAxioms(spec),
  };
}

// Re-export the PHL surface so users can import from one place.
export type { Sequent, Context, Term, Horn, Atom } from "./phl-sequent";
export { partialSubstitution, defined } from "./phl-sequent";
