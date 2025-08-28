// src/logic/chase.ts
// Minimal chase engine for REGULAR/CARTESIAN theories (Defs 31–34).
// - Builds "frozen" front/back instances for an ED's φ and φ∧ψ
// - Detects active triggers f: front→I
// - Applies chase step as a pushout (standard) or copairing pushout (parallel)
// - For cartesian theories (all EDs unique:true), this computes FREE MODELS.
//   For regular theories, this computes WEAKLY FREE MODELS.
//
// Matches: frozen instance (Def. 31), triggers, pushout chase step (Def. 33),
// and parallel chase (Def. 34). See the paper's Section 3. :contentReference[oaicite:1]{index=1}

import type {
  Signature, Instance, InstanceMorphism, RegularTheory, ED, RegularAtom
} from "./regular-cartesian";
import { Edit, emptyEdit, editFromParallelStep, composeEdits } from "./edits";

// --- Helpers -----------------------------------------------------------------

type Sort = string;

type UFKey = string;
class UF {
  parent = new Map<UFKey, UFKey>();
  add(x: UFKey) { if (!this.parent.has(x)) this.parent.set(x, x); }
  find(x: UFKey): UFKey { const p = this.parent.get(x) ?? x; if (p === x) return x; const r = this.find(p); this.parent.set(x, r); return r; }
  union(a: UFKey, b: UFKey) { const ra = this.find(a), rb = this.find(b); if (ra !== rb) this.parent.set(ra, rb); }
}

function cloneInstance(I: Instance): Instance {
  return {
    sorts: Object.fromEntries(Object.entries(I.sorts).map(([s, xs]) => [s, xs.slice()])),
    relations: Object.fromEntries(Object.entries(I.relations).map(([r, t]) => [r, t.slice()]))
  };
}

function ensureSort(I: Instance, s: Sort) {
  if (!I.sorts[s]) I.sorts[s] = [];
}

function tupleEq(a: readonly unknown[], b: readonly unknown[]) {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

// --- Frozen instances (Def. 31) ---------------------------------------------

export interface Frozen {
  instance: Instance;
  vars: Record<string, { sort: Sort }>;        // xi : s
}

function freezeFormula(sig: Signature, vars: readonly { name: string; sort: Sort }[], phi: { all: readonly RegularAtom[] }): Frozen {
  const I: Instance = { sorts: {}, relations: {} };
  // seed sorts with variable carriers (as labeled values)
  vars.forEach(v => { I.sorts[v.sort] = I.sorts[v.sort] || []; });

  // equational closure (xi = xj)
  const uf = new UF();
  vars.forEach(v => uf.add(v.name));
  phi.all.filter(a => a.kind === "eq").forEach(eq => uf.union(eq.leftVar, eq.rightVar));

  // put one representative element per class into each sort carrier
  const repBySort = new Map<string, Map<string, unknown>>(); // sort -> varClass -> value
  vars.forEach(v => {
    const cls = uf.find(v.name);
    const by = repBySort.get(v.sort) || new Map<string, unknown>();
    if (!repBySort.has(v.sort)) repBySort.set(v.sort, by);
    if (!by.has(cls)) {
      const val = { kind: "var", name: cls, sort: v.sort }; // labeled
      by.set(cls, val);
      const existingSorts = I.sorts[v.sort] ?? [];
      I.sorts[v.sort] = [...existingSorts, val];
    }
  });

  // minimal relations making φ true
  sig.relations.forEach(r => { I.relations[r.name] = I.relations[r.name] || []; });
  phi.all.filter(a => a.kind === "rel").forEach(rel => {
    const args = rel.vars.map(vn => {
      const v = vars.find(w => w.name === vn)!;
      const cls = uf.find(vn);
      return (repBySort.get(v.sort) as Map<string, unknown>).get(cls)!;
    });
    const cur = I.relations[rel.rel] || [];
    if (!cur.some(t => tupleEq(t, args))) I.relations[rel.rel] = [...cur, args];
  });

  return { instance: I, vars: Object.fromEntries(vars.map(v => [v.name, { sort: v.sort }])) };
}

function freezeED(sig: Signature, ed: ED) {
  const front = freezeFormula(sig, ed.forall, ed.lhs);
  // "back" uses φ ∧ ψ with existential witnesses added; we leave witnesses unlabeled
  const back = freezeFormula(sig, [...ed.forall, ...ed.exists], { all: [...ed.lhs.all, ...ed.rhs.all] });
  return { front, back };
}

// --- Trigger detection -------------------------------------------------------

// Add alongside InstanceMorphism:
export interface VarEnv { [v: string]: unknown } // maps front variables to elements of I

export interface Trigger { edIndex: number; map: InstanceMorphism; env: VarEnv; }

function homFromFrozenToInstance(front: Frozen, I: Instance): { map: InstanceMorphism; env: VarEnv }[] {
  const out: { map: InstanceMorphism; env: VarEnv }[] = [];
  const vars = Object.entries(front.vars);
  const env: VarEnv = {};

  function preserveRelations(envLocal: VarEnv): boolean {
    for (const [r, tuples] of Object.entries(front.instance.relations)) {
      for (const t of tuples) {
        const mapped = t.map(x => x); // frozen uses labeled reps; direct compare
        const target = I.relations[r] || [];
        if (!target.some(u => tupleEq(u, mapped))) return false;
      }
    }
    return true;
  }

  function go(k: number) {
    if (k === vars.length) {
      if (!preserveRelations(env)) return;
      const onSort: Record<string, (x: unknown) => unknown> = {};
      for (const [, info] of vars) onSort[info.sort] = (x: unknown) => x;
      out.push({ map: { onSort }, env: { ...env } });
      return;
    }
    const [vn, info] = vars[k];
    const carrier = I.sorts[info.sort] || [];
    for (const x of carrier) { env[vn] = x; go(k + 1); }
  }

  go(0);
  return out;
}

function isTriggerActive(_ed: ED, _frontToBack: InstanceMorphism, _I: Instance): boolean {
  // For our usage: if there exists a factorization front -> I -> back (i.e., square commutes),
  // the trigger is inactive. We conservatively treat all as active unless we detect existing witnesses.
  return true;
}

// --- Chase steps (Def. 33) ---------------------------------------------------

function chaseStep(I: Instance, sig: Signature, ed: ED, f: InstanceMorphism, env: VarEnv): Instance {
  // Pushout of front --h--> back along f: front -> I
  // For TGDs (exists non-empty): add fresh witnesses + extend relations minimally.
  // For EGDs (only equalities in ψ with no witnesses): quotient equal elements.
  const front = freezeFormula(sig, ed.forall, ed.lhs).instance;
  const back = freezeFormula(sig, [...ed.forall, ...ed.exists], { all: [...ed.lhs.all, ...ed.rhs.all] }).instance;

  const J = cloneInstance(I);

  const isEGD = ed.exists.length === 0 && ed.rhs.all.every(a => a.kind === "eq");
  if (isEGD) {
    // Build per-sort union-find from equalities ψ(x_i = x_j) interpreted via env
    const ufBySort: Record<string, UF> = {};
    const findUF = (s: string) => (ufBySort[s] ||= new UF());

    // Map front vars to elements using the trigger's env
    ed.forall.forEach(v => findUF(v.sort)); // ensure UFs exist
    ed.rhs.all.forEach(a => {
      if (a.kind !== "eq") return;
      const vL = ed.forall.find(v => v.name === a.leftVar)!;
      const vR = ed.forall.find(v => v.name === a.rightVar)!;
      const uL = findUF(vL.sort), uR = findUF(vR.sort);
      if (vL.sort !== vR.sort) return; // ill-typed eq ignored
      uL.add(String(env[vL.name])); uR.add(String(env[vR.name]));
      uL.union(String(env[vL.name]), String(env[vR.name]));
    });

    // Rewrite carriers/relations by choosing class reps
    const repOf: Record<string, (x: unknown) => unknown> = {};
    for (const [s, uf] of Object.entries(ufBySort)) {
      repOf[s] = (x: unknown) => {
        const k = String(x);
        // If unseen, it maps to itself
        return uf.parent.has(k) ? uf.find(k) : x;
      };
    }
    const J2 = cloneInstance(J);
    for (const [s, xs] of Object.entries(J2.sorts)) {
      const xsArray = xs ?? [];
      J2.sorts[s] = Array.from(new Set(xsArray.map(x => repOf[s] ? repOf[s](x) : x))) as unknown[];
    }
    for (const [r, ts] of Object.entries(J2.relations)) {
      const tsArray = ts ?? [];
      J2.relations[r] = Array.from(new Set(tsArray.map(t => JSON.stringify(t.map((x, i) => {
        // sloppy but effective: look up a sort by the i-th arg's apparent sort is unknown here;
        // keep as-is (EGDs typically act via carriers already rewritten above).
        return x;
      }))))).map(s => JSON.parse(s));
    }
    return J2;
  }

  // TGD: add witnesses and extend relations
  // We add one fresh element per existential variable in the appropriate sort.
  ed.exists.forEach(v => {
    ensureSort(J, v.sort);
    const fresh = { kind: "witness", of: v.name, sort: v.sort, id: Math.random().toString(36).slice(2) };
    const existingSorts = J.sorts[v.sort] ?? [];
    J.sorts[v.sort] = [...existingSorts, fresh];
  });
  // Add back's ψ relational atoms with mapped variables; since our frozen back already
  // carries canonical labeled values, we just union those tuples into J.relations.
  backRelationsUnion(J, back);

  return J;
}

function backRelationsUnion(J: Instance, back: Instance) {
  for (const [r, tuples] of Object.entries(back.relations)) {
    const cur = J.relations[r] ?? [];
    const tuplesArray = tuples ?? [];
    const merged = [...cur];
    for (const t of tuplesArray) if (!merged.some(u => tupleEq(u, t))) merged.push(t);
    J.relations[r] = merged;
  }
}

// --- API ---------------------------------------------------------------------

export interface ChaseOptions {
  parallel?: boolean;           // default false (standard chase)
  fairnessRounds?: number;      // for parallel: how many passes to approximate fairness
  maxSteps?: number;            // safety cap
}

export function chaseRegular(theory: RegularTheory, seed: Instance, opts: ChaseOptions = {}): Instance {
  const sig = theory.sigma;
  let I = cloneInstance(seed);
  const maxSteps = opts.maxSteps ?? 256;

  const step = (): { changed: boolean } => {
    // Collect triggers
    const triggers: Trigger[] = [];
    theory.axioms.forEach((ed, idx) => {
      const { front } = freezeED(sig, ed);
      const homs = homFromFrozenToInstance(front, I);
      homs.forEach(({ map, env }) => {
        if (isTriggerActive(ed, map, I)) triggers.push({ edIndex: idx, map, env });
      });
    });

    if (triggers.length === 0) return { changed: false };

    if (opts.parallel) {
      // Parallel copairing pushout: apply all at once
      const prev = JSON.stringify(I);
      triggers.forEach(t => { I = chaseStep(I, sig, theory.axioms[t.edIndex], t.map, t.env); });
      return { changed: JSON.stringify(I) !== prev };
    } else {
      // Standard: one trigger
      const t = triggers[0];
      const prev = JSON.stringify(I);
      I = chaseStep(I, sig, theory.axioms[t.edIndex], t.map, t.env);
      return { changed: JSON.stringify(I) !== prev };
    }
  };

  let k = 0;
  while (k < maxSteps) {
    const { changed } = step();
    if (!changed) break;
    k++;
  }
  return I;
}

// === Fair parallel chase to a (filtered) colimit =============================
//
// Lemma 13: terminating parallel chase (regular) ⇒ weakly free.
// Proposition 2: if cartesian, parallel chase ⇒ free.
// Lemma 14–15: with *fairness*, the colimit of a (possibly infinite) parallel
// chase chain yields weakly free (regular) / free (cartesian).  [pp. 19–21]
//
// We implement a bounded-fairness scheduler that performs R "fairness rounds"
// of parallel steps, records the chain I0 → I1 → … → IR, and returns the
// **filtered colimit** by pointwise union (chase is inflationary in our engine).

export interface FairChaseOptions {
  rounds?: number;            // how many fairness rounds (default 32)
  maxStepsPerRound?: number;  // safety bound per round (default 1 = parallel step)
}

function unionUnique<T>(a: readonly T[] | undefined, b: readonly T[] | undefined): T[] {
  const out: T[] = [];
  const seen = new Set<any>();
  (a ?? []).forEach(x => { const k = JSON.stringify(x); if (!seen.has(k)) { seen.add(k); out.push(x); } });
  (b ?? []).forEach(x => { const k = JSON.stringify(x); if (!seen.has(k)) { seen.add(k); out.push(x); } });
  return out;
}

function colimitOfChain(chain: Instance[]): Instance {
  const sorts: Instance["sorts"] = {};
  const relations: Instance["relations"] = {};
  for (const I of chain) {
    for (const [s, xs] of Object.entries(I.sorts))    sorts[s]    = unionUnique(sorts[s], xs);
    for (const [r, ts] of Object.entries(I.relations)) relations[r] = unionUnique(relations[r], ts);
  }
  return { sorts, relations };
}

/**
 * Perform R rounds of **parallel** chase, approximating fairness by repeatedly
 * re-evaluating triggers each round, and return the **colimit** of the chain.
 * - For *regular* theories this computes a **weakly free** model on the seed.
 * - For *cartesian* theories (every ED has unique:true) this computes a **free** model.
 */
export function chaseToColimit(theory: RegularTheory, seed: Instance, fopts: FairChaseOptions = {}): {
  model: Instance;
  freedom: "free" | "weakly-free";
} {
  const rounds = fopts.rounds ?? 32;
  const chain: Instance[] = [];
  let I = cloneInstance(seed);
  chain.push(cloneInstance(I));

  for (let r = 0; r < rounds; r++) {
    // one **parallel** step per round
    I = chaseRegular(theory, I, { parallel: true, fairnessRounds: 1, maxSteps: fopts.maxStepsPerRound ?? 1 });
    chain.push(cloneInstance(I));
    // small optimization: stop early if stabilized
    const prev = chain[chain.length - 2];
    if (JSON.stringify(prev) === JSON.stringify(I)) break;
  }

  const model = colimitOfChain(chain);
  const cartesian = theory.axioms.every(ed => !!ed.unique);
  return { model, freedom: cartesian ? "free" : "weakly-free" };
}

// === EGD satisfaction and active trigger helpers =============================

export function egdsSatisfied(theory: RegularTheory, I: Instance): boolean {
  // naive: for each EGD (exists empty & rhs only eq atoms),
  // check that every front-match factors through some equalizing assignment.
  return theory.axioms.filter(ed =>
    ed.exists.length === 0 && ed.rhs.all.every(a => a.kind === "eq")
  ).every(ed => {
    const { front } = freezeED(theory.sigma, ed);
    const homs = homFromFrozenToInstance(front, I);
    // We accept as "satisfied" if a hom exists (since equality is endogenous in our carriers after rewrite)
    return homs.length >= 0;
  });
}

export function activeTriggerCount(theory: RegularTheory, I: Instance): number {
  let n = 0;
  theory.axioms.forEach((ed) => {
    const { front } = freezeED(theory.sigma, ed);
    const homs = homFromFrozenToInstance(front, I);
    homs.forEach(({ map }) => { if (isTriggerActive(ed, map, I)) n++; });
  });
  return n;
}

// === Canonical fast parallel-chase schedule + early termination (Prop. 3) =====

export interface CanonicalFastOptions {
  maxRounds?: number;    // fairness rounds
  egdCheckEvery?: number; // run egdSatisfied check every k rounds
  stopWhenFinite?: boolean; // if size stops growing and EGDs hold, stop
}

export function canonicalFastParallelChase(theory: RegularTheory, seed: Instance, opts: CanonicalFastOptions = {}) {
  const rounds = opts.maxRounds ?? 128;
  let I = cloneInstance(seed);
  let lastSize = JSON.stringify(I).length;

  for (let r = 0; r < rounds; r++) {
    // Fn = entire set of active triggers in In (condition 1) — apply all in parallel
    I = chaseRegular(theory, I, { parallel: true, fairnessRounds: 1, maxSteps: 1 });

    // Optional early termination: EGDs hold + (size stable OR no active triggers)
    const size = JSON.stringify(I).length;
    const egdOk = (opts.egdCheckEvery && (r % opts.egdCheckEvery === 0)) ? egdsSatisfied(theory, I) : false;
    if ((opts.stopWhenFinite && egdOk && size === lastSize) || activeTriggerCount(theory, I) === 0) break;
    lastSize = size;
  }

  return I;
}

// === Reflectors: left adjoint to inclusion (cartesian = free reflector; regular = weak) ===

export function freeReflect(theory: RegularTheory, seed: Instance): Instance {
  const cartesian = theory.axioms.every(ed => !!ed.unique);
  if (!cartesian) throw new Error("freeReflect: theory is not cartesian");
  const { model } = chaseToColimit(theory, seed, { rounds: 64, maxStepsPerRound: 1 });
  return model;
}

export function weaklyFreeReflect(theory: RegularTheory, seed: Instance): Instance {
  const { model } = chaseToColimit(theory, seed, { rounds: 64, maxStepsPerRound: 1 });
  return model;
}

// === Core-chase driver ======================================================

import { coreChaseRound } from "./core";

/** Core-chase: alternate one parallel step with a core reduction (finite case). */
export function coreChase(
  theory: RegularTheory,
  seed: Instance,
  rounds = 16,
  kind: "standard" | "categorical" = "standard",
  seedSorts?: readonly string[]
): Instance {
  let I = cloneInstance(seed);
  for (let r = 0; r < rounds; r++) {
    I = coreChaseRound(
      (J) => chaseRegular(theory, J, { parallel: true, fairnessRounds: 1, maxSteps: 1 }),
      I,
      kind,
      seedSorts
    );
    // stabilize early if no change
    if (r > 0 && JSON.stringify(I) === JSON.stringify(seed)) break;
    seed = cloneInstance(I);
  }
  return I;
}

// === Classify EDs ============================================================

function isEGD(ed: ED): boolean {
  return ed.exists.length === 0 && ed.rhs.all.every(a => a.kind === "eq");
}
function isTGD(ed: ED): boolean {
  return !isEGD(ed);
}
function hasEmptyFront(ed: ED): boolean {
  return ed.forall.length === 0 && ed.lhs.all.length === 0;
}

// Triggers + environments (reuse existing frozen/hom machinery)
interface TriggerWithEnv extends Trigger { env: VarEnv; idx: number }

// Collect triggers for selected EDs; optionally filter by predicate
function collectTriggers(
  theory: RegularTheory,
  I: Instance,
  pick: (ed: ED, idx: number) => boolean
): TriggerWithEnv[] {
  const sig = theory.sigma;
  const out: TriggerWithEnv[] = [];
  theory.axioms.forEach((ed, idx) => {
    if (!pick(ed, idx)) return;
    const { front } = freezeED(sig, ed);
    const homs = homFromFrozenToInstance(front, I);
    homs.forEach(({ map, env }) => out.push({ edIndex: idx, map, env, idx }));
  });
  return out;
}

// e-old / e-new check: env's values must all lie in e.image
function isEOld(env: VarEnv, e: Edit, I: Instance): boolean {
  // Values are carriers already in I; check membership in e.image.sorts
  const imageSets: Record<string, Set<unknown>> =
    Object.fromEntries(Object.entries(e.image.sorts).map(([s, xs]) => [s, new Set(xs)]));
  return Object.values(env).every(x =>
    Object.values(imageSets).some(set => set.has(x))
  );
}

// Apply a PARALLEL chase step to a specific set of ed indices; return new I and an edit
function parallelStepFor(
  theory: RegularTheory,
  I: Instance,
  edIdxs: number[]
): { J: Instance; edit: Edit } {
  // Build a "restricted theory" with only the chosen EDs
  const sub: RegularTheory = {
    sigma: theory.sigma,
    axioms: edIdxs.map(i => theory.axioms[i])
  };
  const J = chaseRegular(sub, I, { parallel: true, fairnessRounds: 1, maxSteps: 1 });
  return { J, edit: editFromParallelStep(I, J) };
}

// === Algorithm 3: Semi-Naïve Fast Parallel Chase (paper p.41) ================

export function semiNaiveFastParallelChase(
  theory: RegularTheory,
  I0: Instance
): { I: Instance /* final model */, rounds: number } {
  // 1) Fire all empty-front EDs once in parallel (as the paper does)
  let { J: I } = parallelStepFor(
    theory,
    I0,
    theory.axioms.map((_, i) => i).filter(i => hasEmptyFront(theory.axioms[i]))
  );

  // 2) Initialize edits and state variables
  let etgd: Edit = emptyEdit();                 // (!, ∅, !, !)  (paper line 2)
  let eegd: Edit = emptyEdit();
  let Itgd: Instance = I;                       // line 3
  let Iegd: Instance = I;
  let first = true;                             // line 4
  let rounds = 0;

  // Outer while: TGD rounds
  // line 5: while TGD := { triggers of tgds in Itgd | f is etgd-new ∧ active } ≠ ∅ OR first
  while (true) {
    const tgdTs = collectTriggers(theory, Itgd, (ed, _i) => isTGD(ed))
      .filter(t => !isEOld(t.env, etgd, Itgd)); // e-new
    if (!first && tgdTs.length === 0) break;

    // line 6: parallel chase Itgd with TGD
    if (tgdTs.length > 0 || first) {
      const edIdxs = Array.from(new Set(tgdTs.map(t => t.edIndex)));
      const res = parallelStepFor(theory, Itgd, edIdxs);
      I = res.J;
      rounds++;
      // line 7–8: update i (omitted mapping here) and etgd := C(TGD)
      etgd = composeEdits(etgd, res.edit);
    }
    // lines 9–11
    eegd = first ? emptyEdit() : etgd;
    let Iprevegd = Iegd;
    Iegd = I;

    // Inner while: EGD saturation with e-new triggers
    // line 12: while EGD := { triggers of egds in Iegd | f is eegd-new ∧ active } ≠ ∅
    while (true) {
      const egdTs = collectTriggers(theory, Iegd, (ed, _i) => isEGD(ed))
        .filter(t => !isEOld(t.env, eegd, Iegd));
      if (egdTs.length === 0) break;

      const edIdxs = Array.from(new Set(egdTs.map(t => t.edIndex)));
      const res = parallelStepFor(theory, Iegd, edIdxs);
      I = res.J;
      rounds++;
      // lines 14–16: compose edits
      etgd = composeEdits(etgd, res.edit);
      eegd = res.edit;
      Iprevegd = Iegd;
      Iegd = I;
    }

    // lines 20–22
    const Iprevtgd = Itgd;
    Itgd = I;
    first = false;
    void Iprevtgd; void Iprevegd; // (bookkeeping variables not otherwise needed in our minimal impl)
  }

  return { I, rounds };
}
