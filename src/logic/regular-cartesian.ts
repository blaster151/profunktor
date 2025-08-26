// src/logic/regular-cartesian.ts
// Minimal data model for regular & cartesian theories, EDs/TGDs/EGDs, and
// a constructor for the cartesian theory associated to a category presentation (Q,E).
// Matches Defs 22–29 and the "Cartesian theory of a category presentation" recipe. [pp. 10–12]

import type { CategoryPresentation, Path, SmallCategory } from "../kan/category-presentations";

// ----- Signatures, instances, morphisms -------------------------------------

export interface Signature {
  sorts: readonly string[]; // S
  relations: readonly { name: string; arity: readonly string[] }[]; // R, each with sorted arity
}

// A σ-instance: sets at sorts + relations as subsets (we keep shapes symbolic for now)
export interface Instance {
  sorts: Record<string, readonly unknown[]>;
  relations: Record<string, readonly (readonly unknown[])[]>;
}

export interface InstanceMorphism {
  onSort: Record<string, (x: unknown) => unknown>; // family of functions Is→Js
  // Relation preservation is implied (diagram factors through Jr) per Def. 22
}

// In database-style runs, set instance semantics to "constants" so morphisms fix constants.
// Otherwise default to "labeled-nulls" (fresh skolem-like witnesses are admissible).

// ----- Regular formulas & EDs (egds/tgds) -----------------------------------

export type EqAtom = { kind: "eq"; leftVar: string; rightVar: string };
export type RelAtom = { kind: "rel"; rel: string; vars: readonly string[] };

export type RegularAtom = EqAtom | RelAtom;
export type RegularFormula = { all: readonly RegularAtom[] }; // conjunction only (Def. 23)

export type VarDecl = { name: string; sort: string };

export interface ED {
  forall: readonly VarDecl[];
  lhs: RegularFormula; // φ
  exists: readonly VarDecl[]; // witnesses (may be empty)
  rhs: RegularFormula; // ψ
  unique?: boolean; // ∃! for cartesian (Def. 27)
}

export interface RegularTheory { sigma: Signature; axioms: readonly ED[] }
export type CartesianTheory = RegularTheory; // with every ED tagged unique:true

// ----- Build the cartesian theory from a presentation (Q,E) ------------------
// Given (Q,E) presenting C, build σ with sorts = Ob(Q), relations = Gen(Q) (arity [c,d]),
// and axioms: (i) each generator total & functional; (ii) for every equation p=q in E,
// enforce equality of endpoints along p and q. Models ≅ Set^C (Lemma 8).

export function cartesianFromPresentation(p: CategoryPresentation): CartesianTheory {
  const sorts = p.Q.objects.map(o => o.id);
  const gens = p.Q.arrows.map(a => ({ name: a.id, arity: [a.src, a.dst] as const }));
  const sigma: Signature = { sorts, relations: gens };

  const totalFunctional: ED[] = p.Q.arrows.map(a => ({
    forall: [{ name: "x", sort: a.src }],
    lhs: { all: [] },
    exists: [{ name: "y", sort: a.dst }],
    rhs: { all: [{ kind: "rel", rel: a.id, vars: ["x", "y"] }] },
    unique: true
  }));

  const pathEqToED = (left: Path, right: Path): ED => {
    // f0(x,y0) ∧ … ∧ fm(ym-1,ym) ∧ g0(x,z0) ∧ … ∧ gn(zn-1,zn) ⇒ ym = zn  (page 12)
    const lhsAtoms: RegularAtom[] = [];
    // Encode both chains; we just use schematic y_i/z_i variable names
    left.arrows.forEach((f, i) => {
      const vars = i === 0 ? ["x", "y0"] : [`y${i-1}`, `y${i}`];
      lhsAtoms.push({ kind: "rel", rel: f, vars });
    });
    right.arrows.forEach((g, j) => {
      const vars = j === 0 ? ["x", "z0"] : [`z${j-1}`, `z${j}`];
      lhsAtoms.push({ kind: "rel", rel: g, vars });
    });
    const maxY = Math.max(0, left.arrows.length - 1);
    const maxZ = Math.max(0, right.arrows.length - 1);
    const rhs: RegularAtom = { kind: "eq", leftVar: `y${maxY}`, rightVar: `z${maxZ}` };
    return {
      forall: [{ name: "x", sort: left.at }],
      lhs: { all: lhsAtoms },
      exists: [], // cartesian uniqueness handled globally by totalFunctional axioms
      rhs: { all: [rhs] }
    };
  };

  const congruenceEDs: ED[] = p.E.map(({ left, right }) => pathEqToED(left, right));

  return { sigma, axioms: [...totalFunctional, ...congruenceEDs] };
}

// ----- "Cartesian ⇒ regular" converter (Lemma 7; optional) -------------------

export function cartesianToRegular(ct: CartesianTheory): RegularTheory {
  // For each ∃! turn into (i) ∃ and (ii) equality of any two such witnesses (schema) (Def. 27 → Eq. (4)).
  const axioms: ED[] = ct.axioms.flatMap(ed => {
    if (!ed.unique) return [ed];
    const uniq: ED = {
      forall: [...ed.forall, ...ed.exists, ...ed.exists.map(v => ({ name: v.name + "'", sort: v.sort }))],
      lhs: { all: [...ed.lhs.all, ...ed.rhs.all.map(a => ({ ...a })), ...ed.rhs.all.map(a => ({ ...a }))] },
      exists: [],
      rhs: { all: ed.exists.map(v => ({ kind: "eq", leftVar: v.name, rightVar: v.name + "'" } as EqAtom)) }
    };
    const ex: ED = { ...ed, unique: false };
    return [ex, uniq];
  });
  return { sigma: ct.sigma, axioms };
}

// ----- Theory composition helpers --------------------------------------------

/** Merge two theories by unioning their signatures and concatenating axioms. */
export function mergeTheories(a: RegularTheory, b: RegularTheory): RegularTheory {
  const sorts = Array.from(new Set([...a.sigma.sorts, ...b.sigma.sorts]));
  const rels = [
    ...a.sigma.relations,
    ...b.sigma.relations.filter(r => !a.sigma.relations.some(s => s.name === r.name)),
  ];
  return { sigma: { sorts, relations: rels }, axioms: [...a.axioms, ...b.axioms] };
}

// src/logic/regular-cartesian.ts (append)
export function totalityAxiomsFor(symbols: readonly { name: string; inSorts: readonly string[]; outSort: string }[]): ED[] {
  // > ⊢ f(x̄)↓   becomes:  ∀x̄. ⊤ ⇒ ∃! y. R_f(x̄,y)  in our cartesian (graph-of-f) encoding
  return symbols.map(sym => ({
    forall: sym.inSorts.map((s, i) => ({ name: `x${i}`, sort: s })),
    lhs: { all: [] },
    exists: [{ name: "y", sort: sym.outSort }],
    rhs: { all: [{ kind: "rel", rel: sym.name, vars: sym.inSorts.map((_, i) => `x${i}`).concat("y") }] },
    unique: true
  }));
}
