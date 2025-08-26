// src/meta/generalized-morphism.ts
// Generalized theory morphisms (pp. 349–350): a model M of T in CT′ induces
// a forgetful functor U_M : T′-PMod(Set) → T-PMod(Set) that has a left adjoint (Thm 61).
// We expose a *practical* Set-level adapter where you specify how each sort/op of T
// is interpreted in any T′-model N. Then we give a constructive left-adjoint builder
// that uses our diagram/term-model + chase pipeline (as in our earlier F_ρ(M)).

export type Sort = string;
export interface QEFunc { name: string; inSorts: readonly Sort[]; outSort: Sort }

export interface PartialOp {
  apply: (name: string, args: unknown[]) =>
    | { defined: true; value: unknown }
    | { defined: false };
}
export interface PartialStructure {
  sigma: { sorts: readonly Sort[]; funcs: readonly QEFunc[] };
  carriers: Record<string, readonly unknown[]>;
  ops: PartialOp;
}

// ---------- Generalized morphism spec ----------------------------------------

/** How T's data is *interpreted* inside any T′-model N. */
export interface GMorphSpec {
  T: { sorts: readonly Sort[]; funcs: readonly QEFunc[] };
  Tprime: { sorts: readonly Sort[]; funcs: readonly QEFunc[] };

  // Given N (a T′-model), produce the carrier of each T-sort as a *definable* set in N.
  interpretSort: (N: PartialStructure, S: Sort) => readonly unknown[];

  // Given N, implement T-op f using N's operations (a partial function).
  interpretFunc: (N: PartialStructure, f: QEFunc) => (args: readonly unknown[]) =>
    | { defined: true; value: unknown }
    | { defined: false };
}

/** U_M: map a T′-model N to the induced T-model U_M(N). */
export function U_M(spec: GMorphSpec, N: PartialStructure): PartialStructure {
  const carriers: Record<string, readonly unknown[]> = {};
  spec.T.sorts.forEach(S => { carriers[S] = spec.interpretSort(N, S); });

  const ops: PartialOp = {
    apply: (name, args) => {
      const f = spec.T.funcs.find(g => g.name === name);
      if (!f) return { defined: false };
      return spec.interpretFunc(N, f)(args);
    }
  };
  return { sigma: { sorts: spec.T.sorts, funcs: spec.T.funcs }, carriers, ops };
}

// ---------- Left adjoint in Set (constructive, using our chase) ---------------

import { freeLeftAdjoint } from "../phl/free-left-adjoint";
import type { RegularTheory, Instance as CartInstance } from "../logic/regular-cartesian";

/**
 * Build the *left adjoint* L_M : T-PMod(Set) → T′-PMod(Set).
 * Construction (Thm 61, specialized to Set): for M giving U_M,
 * we synthesize a diagram D_M(X) over Σ′ from a T-model X so that
 * the free T′-model on that diagram maps back via U_M to (a copy of) X.
 *
 * Practically: we ask the GMorphSpec for *witnessing recipes* to realize X
 * inside Σ′ (constants & op-graphs), then call our existing free-model
 * reflector to generate the universal T′-model.
 */
export interface SeedSynthesizer {
  /** Given X:T-model, produce a Σ′-instance (constants + graphs) seeding the free T′-model. */
  seedFor: (X: PartialStructure) => CartInstance;
  /** Regular/cartesian encoding of T′ (functions-as-graphs). */
  TprimeCart: RegularTheory;
}

/** Left adjoint L_M on objects. */
export function leftAdjoint_M(
  spec: GMorphSpec,
  synth: SeedSynthesizer,
  X: PartialStructure
): PartialStructure {
  // 1) Seed Σ′ with constants/graphs that "present" X via the generalized morphism
  const seed = synth.seedFor(X);

  // 2) Free Σ′-model by chase
  const { modelPrime } = freeLeftAdjoint(
    {
      sigma: { sorts: spec.T.sorts, funcs: spec.T.funcs } as any,
      sigmaPrime: { sorts: spec.Tprime.sorts, funcs: spec.Tprime.funcs } as any,
      rho: { onSort: (s: string) => s, onFunc: (f: QEFunc) => f } as any, // no renaming here
      Tprime: synth.TprimeCart
    },
    // Treat X as a Σ-structure only to drive constant naming; seed is already Σ′-typed.
    { sigma: { sorts: spec.T.sorts, funcs: spec.T.funcs } as any,
      carriers: X.carriers, ops: X.ops }
  );

  // 3) Read off the Σ′-model; caller may further normalize carriers
  return {
    sigma: { sorts: spec.Tprime.sorts, funcs: spec.Tprime.funcs },
    carriers: modelPrime.sorts as any,
    ops: {
      apply: (name, args) => {
        const tuples = modelPrime.relations[name] ?? [];
        // Basic graph lookup (partial): pick any matching tuple by prefix
        const hit = tuples.find(t => JSON.stringify(t.slice(0, args.length)) === JSON.stringify(args));
        return hit ? { defined: true, value: hit[args.length] } : { defined: false };
      }
    }
  };
}
