// src/meta/cart-dollar-T.ts
// Build Cart$T from a quasi-equational (partial-Horn) theory T.
// Encodes the paper's constants γ_S, γ_f = (γ_fd, γ_fm), γ_ϕ, γ_a and their axioms,
// atop our Cart kit (id,d,c,comp, products) with pArr & Mon scaffolding.
//
// Source: Section 9 (Cart$T description; classifying category CT; Thm 54/56).  [pp. 344–347]

import type { RegularTheory, ED, Signature, RegularAtom } from "../logic/regular-cartesian";
import { mergeTheories } from "../logic/regular-cartesian";
import { Tcart } from "../logic/quasieq-cartesian-kits";

export interface QEFunc { name: string; inSorts: readonly string[]; outSort: string }
export interface QEAxiom { /* schematic Horn-in-context */ premise: string; conclusion: string; }
export interface QETheoryInput {
  sorts: readonly string[];                  // sorts of T
  funcs: readonly QEFunc[];                  // partial function symbols of T
  axioms: readonly QEAxiom[];               // presented axioms ϕ ⊢ ψ (schematic)
}

const v = (n: string, s: string) => ({ name: n, sort: s });
const rel = (name: string, vars: readonly string[]): RegularAtom => ({ kind: "rel", rel: name, vars } as any);
const eq  = (l: string, r: string): RegularAtom => ({ kind: "eq", leftVar: l, rightVar: r } as any);
const ED_ = (forall: ReturnType<typeof v>[], lhs: RegularAtom[], exists: ReturnType<typeof v>[], rhs: RegularAtom[], unique=false): ED =>
  ({ forall, lhs: { all: lhs }, exists, rhs: { all: rhs }, unique });

/** Construct Cart$T (schematic) as a RegularTheory. */
export function CartDollarT(T: QETheoryInput): RegularTheory {
  // Start from Cart (objects/arr,id,d,c,comp,products). Add Mon, pArr if absent.
  const Cart = Tcart();
  const Mon = { name: "Mon", arity: ["arr"] as const };
  const pArr = { name: "pArr", arity: ["arr","arr"] as const };
  const sigma: Signature = { ...Cart.sigma, relations: [...Cart.sigma.relations, Mon as any, pArr as any] };

  const eds: ED[] = [];

  // For each sort S in T: a constant γ_S : obj
  T.sorts.forEach(S => {
    const gammaS = `gamma_sort_${S}`; // nullary op producing an obj; encode via graph relation
    // Make it "total" by ∃! witness (cartesian unique existence idiom): ∃! t:obj . R_gammaS(t)
    eds.push({ forall: [], lhs: { all: [] }, exists: [v("t","obj")], rhs: { all: [rel(gammaS, ["t"])] }, unique: true } as ED);
  });

  // For each function f : ES ⇀ T in T: constants γ_fd, γ_fm : arr with pArr(γ_fd, γ_fm) and codomain equations
  T.funcs.forEach(f => {
    const gfd = `gamma_${f.name}_d`, gfm = `gamma_${f.name}_m`;
    // Declare their graph facts and assert pArr(gfd,gfm)
    eds.push(ED_([v("d","arr"), v("m","arr")], [ rel(gfd, ["d"]), rel(gfm, ["m"]) ], [], [ rel("pArr", ["d","m"]) ]));

    // c(γ_fd)=γ_ES  and  c(γ_fm)=γ_T
    const gammaES = `gamma_sort_tuple_${f.inSorts.join("_")}`; // schematic product object for ES
    // Witness product object constant too (∃!):
    eds.push({ forall: [], lhs: { all: [] }, exists: [v("t","obj")], rhs: { all: [rel(gammaES, ["t"])] }, unique: true } as ED);

    eds.push(ED_([v("d","arr"), v("o","obj")],
      [ rel(gfd,["d"]), rel(gammaES,["o"]), rel("c",["d","o1"]) ],
      [], [ eq("o1","o") ]));

    eds.push(ED_([v("m","arr"), v("o","obj")],
      [ rel(gfm,["m"]), rel(`gamma_sort_${f.outSort}`,["o"]), rel("c",["m","o1"]) ],
      [], [ eq("o1","o") ]));
  });

  // For each axiom a: ϕ ⊢ ψ, provide a constant γ_a (a mono witnessing inclusion) and equation γ_ϕ = γ_ψ ∘ γ_a.
  T.axioms.forEach((a, i) => {
    const gphi = `gamma_formula_${i}_phi`, gpsi = `gamma_formula_${i}_psi`, ga = `gamma_axiom_${i}`;
    // Make the three arrows exist (as arr-constants)
    [gphi,gpsi,ga].forEach(n => eds.push({ forall: [], lhs: { all: [] }, exists: [v("u","arr")], rhs: { all: [rel(n,["u"])] }, unique: true } as ED));
    // Enforce γ_ϕ = γ_ψ ∘ γ_a (composition equality)
    eds.push(ED_([v("u","arr"), v("v","arr"), v("w","arr"), v("k","arr"), v("l","arr")],
      [ rel(gphi,["u"]), rel(gpsi,["v"]), rel(ga,["w"]),
        rel("comp",["w","v","k"]), // k = γ_a ∘ γ_ψ
        rel("comp",["k","?","l"])  // schematic slot; real encoding would use typed domains/codomains
      ],
      [], [ eq("u","k") ]));
  });

  return mergeTheories(Cart, { sigma, axioms: eds });
}
