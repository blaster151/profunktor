// src/phl/quasi-equationalize.ts
// Compile Horn-with-predicates to an equivalent quasi-equational theory
// by adding a one-element sort U with constant u and replacing each predicate R
// by a partial function f_R(...): U with "R(t̄)" ≡ "f_R(t̄) is defined".
// Matches Proposition 17.  (pp. 10–12)

export type Sort = string;

export interface PHLFunction { name: string; inSorts: readonly Sort[]; outSort: Sort }   // partial op symbol
export interface PHLPredicate { name: string; argSorts: readonly Sort[] }
export interface PHLAxiom { forall: readonly { name: string; sort: Sort }[]; lhs: string; rhs: string } // schematic

export interface PHLSig {
  sorts: readonly Sort[];
  funcs: readonly PHLFunction[];
  preds: readonly PHLPredicate[];
}
export interface PHLHornTheory { sigma: PHLSig; axioms: readonly PHLAxiom[] }

export interface QESig {
  sorts: readonly Sort[];             // includes "U"
  funcs: readonly PHLFunction[];      // includes f_R(...): U and constant u:U (arity 0)
}

export interface QETheory { sigma: QESig; axioms: readonly PHLAxiom[] }

/** Replace predicates by definedness of f_R; add U,u and totality/uniqueness for u. */
export function quasiEquationalize(T: PHLHornTheory): QETheory {
  const U = "U";
  const u: PHLFunction = { name: "u", inSorts: [], outSort: U };
  const fR: PHLFunction[] = T.sigma.preds.map(R => ({ name: `f_${R.name}`, inSorts: R.argSorts, outSort: U }));
  const sigma: QESig = {
    sorts: Array.from(new Set([...T.sigma.sorts, U])),
    funcs: [...T.sigma.funcs, u, ...fR]
  };

  // Very light schematic rewrite of axioms: R(t̄) in LHS/RHS → "f_R(t̄)↓"
  const rewrite = (s: string) =>
    T.sigma.preds.reduce((acc, R) => acc.replace(new RegExp(`${R.name}\\(`, 'g'), `defined(f_${R.name}(`), s);

  // Add axioms: ⊤ ⊢ u↓   and   ∀x:U. x = u   (forces U to be one-element)
  const axioms: PHLAxiom[] = [
    { forall: [], lhs: "true", rhs: "defined(u())" },
    { forall: [{ name: "x", sort: U }], lhs: "true", rhs: "eq(x,u())" },
    ...T.axioms.map(a => ({ ...a, lhs: rewrite(a.lhs), rhs: rewrite(a.rhs) }))
  ];

  return { sigma, axioms };
}
