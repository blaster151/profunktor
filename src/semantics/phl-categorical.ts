// src/semantics/phl-categorical.ts
import { Top, Meet, Impl, forallAlongProjection, Sub } from "./subobjects";
import { wave1, domain as dom, PartialFunc } from "../ct/partial-func";

// A minimal signature/model surface sufficient for eq/definedness (predicates compile to definedness of f_R).
export type Sort = string;
export interface Sig {
  sorts: readonly Sort[];
  funcs: readonly { name: string; inSorts: readonly Sort[]; outSort: Sort }[];
}
export interface Model {
  carriers: Record<string, unknown[]>;
  // Partial function interpreter per symbol
  func: (name: string) => PartialFunc<unknown[], unknown>;
  // Equality subobject on a sort (graph of equality)
  eq: (sort: string) => Sub<[unknown, unknown]>;
}

export type Term =
  | { kind: "var"; idx: number; sort: Sort }
  | { kind: "app"; sym: string; args: Term[]; sort: Sort };

export type Atom =
    | { kind: "true" }
    | { kind: "eq"; left: Term; right: Term }   // t1 = t2
    | { kind: "def"; term: Term };              // t↓

export interface Horn { all: Atom[]; }

export type Formula =
  | { kind: "atom"; a: Atom }
  | { kind: "and"; l: Formula; r: Formula }
  | { kind: "or";  l: Formula; r: Formula }
  | { kind: "bot" }
  | { kind: "exists"; boundSize: number; body: Formula } // ∃z; boundSize = |carrier(z)|
  | { kind: "forall"; boundSize: number; body: Formula }
  | { kind: "imp"; l: Formula; r: Formula };

// Evaluate a term to a PartialFunc from environments to its carrier.
export function evalTerm(M: Model, t: Term): PartialFunc<unknown[], unknown> {
  if (t.kind === "var") {
    return {
      defined: (env) => env[t.idx] !== undefined,
      apply:   (env) => env[t.idx]
    };
  }
  // app
  const fsym = M.func(t.sym);
  const args = t.args.map(tt => evalTerm(M, tt));
  return {
    defined: (env) => args.every(a => a.defined(env)) && fsym.defined(args.map(a => a.apply(env))),
    apply:   (env) => fsym.apply(args.map(a => a.apply(env)))
  };
}

// Atomic semantics as subobjects of environments (categorical reading with ∼1).  [pp. 22–25]
export function evalAtom(M: Model, a: Atom): Sub<unknown[]> {
  switch (a.kind) {
    case "true": return Top();
    case "def": {
      const ft = evalTerm(M, a.term);
      return dom(ft); // [[t↓]] = d[[t]]
    }
    case "eq": {
      const l = evalTerm(M, a.left);
      const r = evalTerm(M, a.right);
      // [[t1 = t2]] = 〈[[t1]],[[t2]]〉^~1(=) ; Set-model: defined(l)∧defined(r)∧EQ(l,r)
      return (env) => l.defined(env) && r.defined(env) && M.eq(a.left.sort)([l.apply(env), r.apply(env)]);
    }
  }
}

// Conjunction
export const evalHorn = (M: Model, h: Horn): Sub<unknown[]> =>
  h.all.reduce((s, a) => (env) => s(env) && evalAtom(M, a)(env), Top<unknown[]>());

export function evalFormula(M: Model, F: Formula): Sub<unknown[]> {
  switch (F.kind) {
    case "atom":  return evalHorn(M, { all: [F.a] });
    case "and":   return (env)=> evalFormula(M,F.l)(env) && evalFormula(M,F.r)(env);
    case "or":    return (env)=> evalFormula(M,F.l)(env) || evalFormula(M,F.r)(env);
    case "bot":   return Top<unknown[]>() && (()=>false as any) as any;
    case "imp":   return Impl(evalFormula(M,F.l), evalFormula(M,F.r));
    case "exists": {
      // interpret as ∃ along projection: env×Z → env
      const Z = Array.from({length: Math.max(1,F.boundSize)}, (_,i)=>i);
      return (env)=> Z.some(z => evalFormula(M,F.body)([...env, z]));
    }
    case "forall": {
      const Z = Array.from({length: Math.max(1,F.boundSize)}, (_,i)=>i);
      return (env)=> Z.every(z => evalFormula(M,F.body)([...env, z]));
    }
  }
}

// Master (29) checker for a general Formula (regular/coherent/Heyting by shape)
export function checkEq29(
  M: Model, Ey_len: number, Et: Term[], Ex_formula: Formula
): boolean {
  // LHS: [[Ey.(Et↓ ∧ φ(Et/Ex))]]
  const defs: Atom[] = Et.map(term => ({ kind:"def", term }));
  const phiSubAtoms = extractAtomsFromFormula(Ex_formula).map(a => substituteAtom(a, Et));
  const L = (env:any[]) => defs.every(d => evalAtom(M,d)(env))
                    && phiSubAtoms.every(a => evalAtom(M,a)(env));

  // RHS: [[Ey.Et]] ~1 ([[Ex.φ]])
  const tup: PartialFunc<any[], any[]> = {
    defined: (env)=> Et.every(t => evalTerm(M,t).defined(env)),
    apply:   (env)=> Et.map(t => evalTerm(M,t).apply(env))
  };
  const R = wave1(tup, evalFormula(M, Ex_formula) as any);

  const sample = enumerateEnv(M, Ey_len);
  return sample.every(env => L(env) === R(env));
}

// Substitution lemma hook: build Et↓ ∧ ϕ(Et/Ex) and check inclusion.  [Lemmas 39–40 ⇒ rule (a3)]
export function checkPartialSubstitution(
  M: Model,
  phi: Horn,      // ϕ in ctx Ex
  psi: Horn,      // ψ in ctx Ex
  Et: Term[]      // tuple Et (sort-compatible with Ex)
): boolean {
  // Build ⟨Et⟩ and its domain; on Set we treat env for Ey only.
  const defs: Atom[] = Et.map(term => ({ kind:"def", term }));
  const phiSub: Horn = { all: [...defs, ...phi.all.map(a => substituteAtom(a, Et))] };
  const psiSub: Horn = { all: [...defs, ...psi.all.map(a => substituteAtom(a, Et))] };
  const A = evalHorn(M, phiSub), B = evalHorn(M, psiSub);
  // inclusion of subobjects ⟦…⟧ ≤ ⟦…⟧ check by pointwise implication on a finite carrier product
  const sample = enumerateEnv(M, Et.length);
  return sample.every(env => !A(env) || B(env));
}

// helpers
function extractAtomsFromFormula(F: Formula): Atom[] {
  switch (F.kind) {
    case "atom": return [F.a];
    case "and":  return [...extractAtomsFromFormula(F.l), ...extractAtomsFromFormula(F.r)];
    case "or":   return [...extractAtomsFromFormula(F.l), ...extractAtomsFromFormula(F.r)];
    case "imp":  return [...extractAtomsFromFormula(F.l), ...extractAtomsFromFormula(F.r)];
    default:     return []; // ∀,∃,⊥ handled semantically, not syntactically
  }
}

// Very light substitution on atoms (variables only via de Bruijn-like indices).
function substituteAtom(a: Atom, Et: Term[]): Atom {
  if (a.kind !== "eq") return a;
  const sub = (t: Term): Term => {
    if (t.kind === "var") {
      const replacement = Et[t.idx];
      if (replacement === undefined) {
        throw new Error(`Variable index ${t.idx} out of bounds`);
      }
      return replacement;
    }
    return { ...t, args: t.args.map(sub) };
  };
  return { kind: "eq", left: sub(a.left), right: sub(a.right) };
}

function enumerateEnv(M: Model, n: number): unknown[][] {
  // Cartesian product of small prefixes of carriers; enough for smoke checks.
  const pools = Object.values(M.carriers);
  const take = (arr: unknown[], k: number) => arr.slice(0, Math.max(1, Math.min(k, arr.length || 1)));
  const base = take(pools[0] ?? [undefined], 3);
  let prod: unknown[][] = base.map(x => [x]);
  for (let i = 1; i < n; i++) {
    const next = take(pools[i % pools.length] ?? [undefined], 3);
    prod = prod.flatMap(vec => next.map(x => [...vec, x]));
  }
  return prod;
}
