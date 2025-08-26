// src/logic/finite-limit-and-coherent.ts
export type Sort = { name: string };
export type Op   = { name: string; arity: number };

// Finite-limit / cartesian presentation of a structure S (Prop. 2.3).
export interface FiniteLimitStructure {
  name: string;
  sorts: readonly Sort[];
  ops: readonly Op[];
  // Just metadata; your existing code interprets in Set or a topos.
}

// Coherent axiom set in the language of morphisms of S-structures (Prop. 2.7).
export interface CoherentAxioms {
  name: string;
  // Hints for 2.8(iii): either "finite-length / countable" or "enough models in Set".
  finiteLength?: boolean;
  countableFragment?: boolean;
  enoughModelsInSet?: boolean;
}

// A theory pack = (S, W, C) with annotations used by the discoverer.
export interface TheoryPack {
  S: FiniteLimitStructure;
  W: CoherentAxioms; // weak equivalences
  C: CoherentAxioms; // cofibrations (often C = cof(I) in Set)

  // Optional hint: in Set, C = cof(I) for a set I (2.8(i)); or in every topos (2.8(ii))
  cofibrationsAreCofIinSet?: boolean;
  cofibrationsAreCofIInEveryTopos?: boolean;
}
