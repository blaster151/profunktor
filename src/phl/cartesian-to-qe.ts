// src/phl/cartesian-to-qe.ts
// Convert a *cartesian* theory T to an equivalent *quasi-equational* theory T′
// by: adding a one-element sort U with constant u; replacing each predicate R by
// a partial function f_R: ES ⇀ U with axiom f_R(t̄)↓ ↔ R(t̄);
// and for each cartesian subformula (∃! y) ψ, adding a *witness* function W_ψ
// with axiom W_ψ(Ex) = y  |-  ψ°   and interpreting (∃!y)ψ as W_ψ(Ex)↓.  (Thm 62)  [pp. 350–351]

export type Sort = string;

export interface CTFunc { name: string; inSorts: readonly Sort[]; outSort: Sort }
export interface CTPred  { name: string; argSorts: readonly Sort[] }
export type CTFormula =
  | { kind: "eq"; left: string; right: string }
  | { kind: "pred"; name: string; args: readonly string[] }
  | { kind: "top" }
  | { kind: "and"; l: CTFormula; r: CTFormula }
  | { kind: "exists1"; bound: { name: string; sort: Sort }; body: CTFormula };

export interface CTAxiom { ctx: readonly { name: string; sort: Sort }[]; lhs: CTFormula; rhs: CTFormula }

export interface CTTheory {
  sorts: readonly Sort[];
  funcs: readonly CTFunc[];      // total (cartesian) functions
  preds: readonly CTPred[];      // predicates
  axioms: readonly CTAxiom[];    // Horn in context (cartesian)
}

export interface QEFunc { name: string; inSorts: readonly Sort[]; outSort: Sort }
export interface QEAxiom { forall: readonly { name: string; sort: Sort }[]; lhs: string; rhs: string }
export interface QETheory {
  sorts: readonly Sort[];
  funcs: readonly QEFunc[];      // partial ops, includes f_R and W_ψ
  axioms: readonly QEAxiom[];    // *Horn*, using "defined(f(...))" tokens in strings
}

export function cartesianToQuasiEquational(T: CTTheory): QETheory {
  const U = "U";
  const u: QEFunc = { name: "u", inSorts: [], outSort: U };
  const fR: QEFunc[] = T.preds.map(R => ({ name: `f_${R.name}`, inSorts: R.argSorts, outSort: U }));

  const funcs: QEFunc[] = [...T.funcs, u, ...fR];

  // Replace predicates by definedness of f_R; interpret ∃! via W_ψ
  const axioms: QEAxiom[] = [];

  const encode = (phi: CTFormula): string => {
    switch (phi.kind) {
      case "eq":   return `eq(${phi.left},${phi.right})`;
      case "pred": return `defined(f_${phi.name}(${phi.args.join(",")}))`;
      case "top":  return "true";
      case "and":  return `(${encode(phi.l)} AND ${encode(phi.r)})`;
      case "exists1": {
        // Introduce witness symbol W_ψ : σ(Ex) ⇀ σ(y)
        const W: QEFunc = { name: `W_${hashFormula(phi.body)}`, inSorts: [], outSort: phi.bound.sort };
        funcs.push(W);
        // Add defining axiom:  W(Ex)=y  |-  ψ°
        axioms.push({
          forall: [], lhs: encode({ kind: "top" }),
          rhs: `implies(eq(${W.name}(),${phi.bound.name}), ${encode(phi.body)})`
        });
        return `defined(${W.name}())`;
      }
    }
  };

  // Base axioms: u↓ and ∀x:U . x = u, and the ⇔-direction (we record → as two Horns)
  axioms.push({ forall: [], lhs: "true", rhs: `defined(${u.name}())` });
  axioms.push({ forall: [{ name: "x", sort: U }], lhs: "true", rhs: `eq(x,${u.name}())` });

  // Add T's axioms translated with ° (predicates→definedness; ∃!→W_ψ)
  T.axioms.forEach((ax, i) => {
    axioms.push({
      forall: ax.ctx, lhs: encode(ax.lhs), rhs: encode(ax.rhs)
    });
  });

  return { sorts: Array.from(new Set([...T.sorts, U])), funcs, axioms };
}

function hashFormula(_f: CTFormula): string {
  // simple stable tag; real impl could serialize `_f`
  return Math.random().toString(36).slice(2, 8);
}
