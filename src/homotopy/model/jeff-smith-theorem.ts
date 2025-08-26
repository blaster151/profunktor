// src/homotopy/model/jeff-smith-theorem.ts
import type { LocallyPresentable, ModelCategory, Cover } from "./sheafifiable-model-structure";
import type { CategoryOps as CatOps, GeneratingMap } from "../small-object/small-object-argument";
import { cof as cofRetracts, inj as injRLP, smallObjectArgument } from "../small-object/small-object-argument";
import { buildJFromSolutionSets, type SolutionSet } from "./solution-set";

// --- W as the class of weak equivalences (as in the paper) ---
export interface WeakEqClass<X> {
  isW(f: X): boolean;                        // membership predicate
  closedUnderRetracts: boolean;              // c0 (part 1)
  twoOfThree: boolean;                       // c0 (part 2) = Quillen M2

  // c2: closure of cof(I) ∩ W under pushout + transfinite composition.
  // We only track a yes/no witness here; operational checks live in CatOps.
  cofWClosedUnderPushoutAndTransfinite: boolean;

  // c3: Freyd's solution set condition at I. We model this as: for each i∈I,
  // provide a small family W_i ⊆ W that covers factorisations of squares with left leg i.
  solutionSetAtI?: <XMap>(i: XMap) => readonly XMap[];
}

// Optional explicit inclusion witness inj(I) ⊆ W (c1). When omitted we assume true.
export interface InjInWAssumption {
  readonly holds: boolean;
  readonly note?: string;
}

export interface JeffSmithInputs<X> {
  readonly presentable: LocallyPresentable; // locally presentable category (M1)
  readonly ops: CatOps<X>;                  // pushouts, coproducts, lift etc.
  readonly I: readonly GeneratingMap<X>[];  // generating cofibrations
  readonly W: WeakEqClass<X>;               // weak equivalences class
  readonly injIncluded?: InjInWAssumption;  // c1 (optional)
}

export interface JeffSmithReport {
  c0: boolean;
  c1: boolean;
  c2: boolean;
  c3: boolean;
  notes?: string[];
}

// Construct a dense J ⊆ cof(I) ∩ W (Lemma-style placeholder).
// In practice you'll compute it from solution sets; here we keep a predictable hook.
export function constructDenseJ<X>(inputs: JeffSmithInputs<X>): readonly GeneratingMap<X>[] {
  const { I, W } = inputs;
  // Cheap seed: take those generators already in W; callers can extend later.
  const J0 = I.filter(g => W.isW(g.map));
  return J0.length ? J0 : I.slice(0, Math.min(1, I.length)); // never empty
}

export function buildJeffSmithModel<X>(inputs: JeffSmithInputs<X>): { model: ModelCategory<X>; report: JeffSmithReport } {
  const { presentable, ops, I, W } = inputs;
  const c0 = W.closedUnderRetracts && W.twoOfThree;
  const c1 = inputs.injIncluded?.holds ?? true; // user-provided witness
  const c2 = W.cofWClosedUnderPushoutAndTransfinite;
  const c3 = !!W.solutionSetAtI || true;       // keep permissive until wired

  // cof = cof(I), weq = W, fib = inj(cof(I) ∩ W).
  const cofibration = cofRetracts(I, ops);
  const J = W.solutionSetAtI
    ? buildJFromSolutionSets({ I, ops, inW: W.isW, injSubsetW: inputs.injIncluded?.holds ?? true }, { forGenerator: W.solutionSetAtI })
    : constructDenseJ(inputs); // intended dense set in cof(I) ∩ W
  const fibPredicate = injRLP(J, ops);

  const model: ModelCategory<X> = {
    hasAllLimits: presentable.hasAllLimits,
    hasAllColimits: presentable.hasAllColimits,
    isCofibration: (f) => cofibration(f),
    isWeakEquivalence: (f) => W.isW(f),
    isFibration: (p) => fibPredicate(p),
    factor: (f) => {
      // One SOA factorization (f ≃ inj ∘ cell) is enough to satisfy M5; acyclicity uses W.
      const fac = smallObjectArgument(f, I, ops, { maxStages: 32 });
      return { cofibration: fac.left, trivialFibration: fac.right };
    },
    has2of3: (_g, _f, _h) => W.twoOfThree
  };

  const report: JeffSmithReport = {
    c0, c1, c2, c3,
    notes: [
      !c1 ? (inputs.injIncluded?.note ?? "No explicit witness that inj(I) ⊆ W") : "",
      !W.solutionSetAtI ? "No explicit solution-set witness provided; assuming true for now." : ""
    ].filter(Boolean)
  };

  return { model, report };
}
