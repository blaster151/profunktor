// src/phl/free-left-adjoint.ts
// Free left adjoint F_ρ for U_ρ induced by a theory morphism ρ: T → T′.
// We realize the paper's construction T′ ∪ D_ρ(M) via your cartesian chase:
//   • encode Σ′ as a cartesian/regular theory (functions-as-graphs),
//   • inject D_ρ(M) as a *seed instance* (constants + graph facts),
//   • call freeReflect(theory, seed) to get the free (partial) T′-model,
//   • read off the unit η_M from the constant graphs.
//
// Pages 13–15 (diagram D_ρ(M), term model, free partial model theorem).  :contentReference[oaicite:1]{index=1}

import type { Signature, SigMorphism, FuncSym } from "./sig-morphism";
import type { RegularTheory, Instance as CartInstance } from "../logic/regular-cartesian";
import { mergeTheories, totalityAxiomsFor } from "../logic/regular-cartesian";
import { freeReflect } from "../logic/chase";

export interface PartialOp {
  // return {defined:false} when f is undefined on args
  apply: (name: string, args: unknown[]) => { defined: true; value: unknown } | { defined: false };
}
export interface PartialStructure {
  sigma: Signature;
  carriers: Record<string, readonly unknown[]>; // Σ-sorts ⇒ set of elements
  ops: PartialOp;                                // Σ-functions as partial maps
}

export interface TheoryMorphism {
  sigma: Signature;         // Σ
  sigmaPrime: Signature;    // Σ′
  rho: SigMorphism;         // ρ: Σ → Σ′
  // Assume caller ensured: ρ(T) ⊆ T′ at axiom level
  Tprime: RegularTheory;    // T′ encoded as cartesian/regular (graphs-of-functions)
}

/** Build the *diagram seed* D_ρ(M) as a cartesian instance over Σ′ (constants + graph facts). */
function buildDiagramSeed(Tm: TheoryMorphism, M: PartialStructure): CartInstance {
  const sorts: CartInstance["sorts"] = {};
  const rels: CartInstance["relations"] = {};

  // 0-ary "constants" c_{A,s} become Σ′-function symbols with arity 0; we seed their graph tuples.
  // In the graphs-of-functions encoding, every function f has a relation R_f([...args, y]).
  const constOf = (A: string, s: unknown): FuncSym => ({
    name: `c[${Tm.rho.onSort(A)}:${String(s)}]`,
    inSorts: [],
    outSort: Tm.rho.onSort(A)
  });

  // Seed carriers (Σ′ sorts) with one element per introduced constant
  for (const A of M.sigma.sorts) {
    const Aprime = Tm.rho.onSort(A);
    const xs = M.carriers[A] ?? [];
    // reserve array even if empty
    sorts[Aprime] = sorts[Aprime] ?? [];
    xs.forEach(s => {
      // materialize a fresh element tagged by its source
      const elt = { from: A, value: s };
      sorts[Aprime] = [...(sorts[Aprime] ?? []), elt];

      // record the graph tuple for the constant: R_c(elt)
      const c = constOf(A, s);
      const rname = c.name;
      rels[rname] = [...(rels[rname] ?? []), [elt]];
    });
  }

  // Seed function-graph tuples for f^ρ on the lifted constants
  for (const f of M.sigma.funcs) {
    const fRho = Tm.rho.onFunc(f);
    const rname = fRho.name;

    const pools = f.inSorts.map(A => M.carriers[A] ?? []);
    const cart = <T>(arrs: T[][]) =>
      arrs.reduce<T[][]>((acc, cur) => acc.flatMap(pref => cur.map(x => [...pref, x])), [[]]);

    for (const a of cart(pools.map(xs => xs.slice() as unknown[]))) {
      const res = M.ops.apply(f.name, a);
      if (!res.defined) continue;

      // Find the lifted constants for inputs and output
      const argsLift = a.map((x, i) => {
        const A = f.inSorts[i];
        if (A === undefined) return undefined;
        const Aprime = Tm.rho.onSort(A);
        // pick the first matching constant element we created
        const arr = sorts[Aprime] ?? [];
        const found = arr.find(e => (e as any).from === A && (e as any).value === x);
        return found ?? x; // fallback: if not found, keep raw
      });

      const outA = f.outSort;
      const outAprime = Tm.rho.onSort(outA);
      const outArr = sorts[outAprime] ?? [];
      const y = outArr.find(e => (e as any).from === outA && (e as any).value === res.value) ?? { from: outA, value: res.value };

      rels[rname] = [...(rels[rname] ?? []), [...argsLift, y] as const];
    }
  }

  return { sorts, relations: rels };
}

/** Build totality/uniqueness axioms for Σ′, including any diagram-constants we'll use. */
function theoryWithSigmaPrimeAndConstants(Tprime: RegularTheory, extraConsts: FuncSym[]): RegularTheory {
  // Make all 0-ary "constants" total (∃! y. R_c(y)); keep T′'s own axioms as-is.
  const tot = totalityAxiomsFor(extraConsts);
  return mergeTheories(Tprime, { sigma: Tprime.sigma, axioms: tot });
}

/**
 * Compute F_ρ(M) and the unit η_M : M → U_ρ(F_ρ(M)).
 * Returns the chased cartesian model (graphs-of-functions for Σ′),
 * and a unit mapping that sends each s∈M(A) to its image in the Σ′-sort A^ρ.
 */
export function freeLeftAdjoint(
  Tm: TheoryMorphism,
  M: PartialStructure
): {
  modelPrime: { sorts: Record<string, readonly unknown[]>; relations: Record<string, readonly (readonly unknown[])[]> };
  unit: Record<string, (s: unknown) => unknown>;
} {
  // 1) Diagram constants for every element in M
  const consts: FuncSym[] = [];
  for (const A of M.sigma.sorts) {
    for (const s of M.carriers[A] ?? []) {
      consts.push({ name: `c[${Tm.rho.onSort(A)}:${String(s)}]`, inSorts: [], outSort: Tm.rho.onSort(A) });
    }
  }

  // 2) Enrich T′ with totality axioms for those constants
  const TprimePlus = theoryWithSigmaPrimeAndConstants(Tm.Tprime, consts);

  // 3) Seed instance = D_ρ(M) as facts (constants' graphs + f^ρ graphs on those constants)
  const seed = buildDiagramSeed(Tm, M);

  // 4) FREE model via your cartesian chase reflector
  const model = freeReflect(TprimePlus, seed);

  // 5) Unit η_M: read constants' graphs to map each s to its image in F_ρ(M)
  const unit: Record<string, (s: unknown) => unknown> = {};
  for (const A of M.sigma.sorts) {
    const Aprime = Tm.rho.onSort(A);
    const map = new Map<unknown, unknown>();
    for (const s of M.carriers[A] ?? []) {
      const r = model.relations[`c[${Aprime}:${String(s)}]`] ?? [];
      const firstTuple = r[0];
      const y = firstTuple?.[0]; // R_c(y) has arity 1
      if (y !== undefined) map.set(s, y);
    }
    unit[A] = (s: unknown) => map.get(s) ?? s;
  }

  return { modelPrime: model, unit };
}
