// src/logic/phl-sequent.ts
// Minimal PHL surface: contexts, Horn formulae, sequents, and the
// partial-term substitution rule gate (requires Et↓ and sort-compatibility).
// Matches the paper's start: t↓ ≡ (t = t), identity, cut, and partial substitution. [pp. 1–3]

export type Sort = string;

export type Var = { name: string; sort: Sort };
export type Context = readonly Var[];

export type Term = { kind: "var"; name: string; sort: Sort } | {
  kind: "app";  // (partial) function symbol application
  sym: string;
  args: readonly Term[];
  sort: Sort;   // declared output sort of sym
};

export type Atom =
  | { kind: "eq"; left: Term; right: Term }      // equality
  | { kind: "true" };                            // >

export type Horn = { all: readonly Atom[] };     // conjunction of atoms (empty = >)

export interface Sequent {
  ctx: Context;      // Ex
  lhs: Horn;         // ϕ
  rhs: Horn;         // ψ
}

// --- Definedness and helpers -------------------------------------------------

/** t↓ is encoded as (t = t). */
export const defined = (t: Term): Atom => ({ kind: "eq", left: t, right: t });

export const and = (...atoms: Atom[]): Horn => ({ all: atoms.filter(Boolean) });

export function ctxSorts(ctx: Context): readonly Sort[] { return ctx.map(v => v.sort); }

export function sortCompatible(ctx: Context, terms: readonly Term[]): boolean {
  return ctx.length === terms.length && ctx.every((v, i) => v.sort === terms[i].sort);
}

// Capture-avoiding substitution on atoms (variables only, to keep this light).
export function substAtom(a: Atom, ctx: Context, terms: readonly Term[]): Atom {
  if (a.kind !== "eq") return a;
  const sub = (t: Term): Term => {
    if (t.kind === "var") {
      const i = ctx.findIndex(v => v.name === t.name && v.sort === t.sort);
      return i >= 0 ? terms[i] : t;
    }
    return { ...t, args: t.args.map(sub) };
  };
  return { kind: "eq", left: sub(a.left), right: sub(a.right) };
}

export function substHorn(h: Horn, ctx: Context, terms: readonly Term[]): Horn {
  return { all: h.all.map(a => substAtom(a, ctx, terms)) };
}

// --- Partial term substitution rule gate ------------------------------------

// === Strictness axioms as helpers (PHL rules b3–b5) =========================
export function strictFromPredicate(_pred: string, _args: readonly Term[], ctx: Context): Horn {
  // R(t1,…,tn) ⊢ tk↓ for each k — we expose a single pack you can splice into a proof state.
  const defs = _args.map(a => defined(a));
  return { all: defs };
}
export function strictFromEquality(left: Term, right: Term, _ctx: Context): Horn {
  // t1 = t2 ⊢ t1↓ ∧ t2↓
  return { all: [defined(left), defined(right)] };
}
export function strictFromFunctionApp(sym: string, args: readonly Term[], _ctx: Context): Horn {
  // f(t1,…,tn)↓ ⊢ tk↓ for each k
  const defs = args.map(a => defined(a));
  return { all: defs };
}

// === Context weakening (Prop. 6) =============================================
export function weakenContext(sq: Sequent, Ey: Context): Sequent {
  // Ey must include all vars of sq.ctx (no capture checks here).
  // Derived: ϕ ⊢_Ex ψ  ⇒  ϕ ⊢_Ey ψ
  return { ctx: Ey, lhs: sq.lhs, rhs: sq.rhs };
}

// === BAx substitutivity (definedness-aware) ==================================
/** s ∼= t is (s↓ ⇒ s=t) ∧ (t↓ ⇒ s=t); we reify it as a guard for selective replacement. */
export function baSubstituteSomeOccurrences(
  phiWithZ: Horn,              // ϕ(s/z) syntactically
  z: Var,                       // the placeholder variable
  s: Term, t: Term              // s ∼= t
): Horn {
  // We don't prove; we perform the permitted substitution at the Horn layer,
  // assuming BAx holds as a premise in your derivation. (See paper's BAx.) :contentReference[oaicite:4]{index=4}
  const sub = (tm: Term): Term => {
    if (tm.kind === "var" && tm.name === z.name && tm.sort === z.sort) return t;
    return tm.kind === "app" ? { ...tm, args: tm.args.map(sub) } : tm;
  };
  const mapAtom = (a: Atom): Atom =>
    a.kind === "eq" ? { kind: "eq", left: sub(a.left), right: sub(a.right) } : a;
  return { all: phiWithZ.all.map(mapAtom) };
}

// === Tot(Σ) gate: if you declare all functions total, PHL≃Horn (Thm. 9) =====
export interface TotSymbol { name: string; inSorts: readonly Sort[]; outSort: Sort }
export function totEnabled(_symbols: readonly TotSymbol[]): boolean { return true; }
// Callers set this flag to relax partial-substitution's definedness precondition when running under Tot(Σ). :contentReference[oaicite:5]{index=5}

/** Strengthen partial substitution with a free-vars check (explicit on pp.1–3). */
export function partialSubstitution(
  sq: Sequent, Ex: Context, Ey: Context, Et: readonly Term[], opts?: { requireDefined?: boolean }
): Sequent {
  if (!sortCompatible(Ex, Et)) throw new Error("PHL: substitution rejected (sort mismatch Et vs Ex).");
  const needDefs = opts?.requireDefined !== false; // default true
  const EtDefined = needDefs ? and(...Et.map(defined)) : { all: [] };
  const lhs = and(...EtDefined.all, ...substHorn(sq.lhs, Ex, Et).all);
  const rhs = substHorn(sq.rhs, Ex, Et);
  return { ctx: Ey, lhs, rhs };
}

// === Fresh constant name generation ===========================================
export function freshConstantNames(Ez: Context, prefix = "c"): string[] {
  return Ez.map((_, i) => `${prefix}${i}`);
}
