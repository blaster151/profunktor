// src/phl/term-model.ts
// Skeleton for the term model Ter(T): carriers = closed terms provably defined,
// equality = provable equality; initial among models. (Section 4.1)
// You can plug in a "provable" oracle; without one this stays symbolic.

export type Sort = string;

export interface QESig {
  sorts: readonly Sort[];
  funcs: readonly { name: string; inSorts: readonly Sort[]; outSort: Sort }[];
}
export interface QETheory { sigma: QESig; /* plus axioms elsewhere */ }

export type ClosedTerm =
  | { kind: "const"; name: string; sort: Sort }
  | { kind: "app"; sym: string; args: ClosedTerm[]; sort: Sort };

export interface Prover {
  /** Return true if ⊢ t↓ is provable. */
  defined: (t: ClosedTerm) => boolean;
  /** Return true if ⊢ t = u is provable. */
  equal: (t: ClosedTerm, u: ClosedTerm) => boolean;
}

export interface TermModel {
  carriers: Record<string, ClosedTerm[]>; // only those with ⊢ t↓
  equal: (s: Sort, t: ClosedTerm, u: ClosedTerm) => boolean;
}

export function mkTermModel(T: QETheory, prover: Prover): TermModel {
  const carriers: Record<string, ClosedTerm[]> = Object.fromEntries(
    T.sigma.sorts.map(s => [s, [] as ClosedTerm[]])
  );

  // Enumerate a shallow set of closed terms (constants + one-step apps) for quick starts.
  const consts = T.sigma.funcs.filter(f => f.inSorts.length === 0);
  const apps  = T.sigma.funcs.filter(f => f.inSorts.length > 0);
  for (const c of consts) {
    const t: ClosedTerm = { kind: "const", name: c.name, sort: c.outSort };
    if (prover.defined(t)) carriers[c.outSort]?.push(t);
  }
  // (Optionally: add a bounded app enumeration here.)

  return {
    carriers,
    equal: (s, t, u) => prover.equal(t, u)
  };
}
