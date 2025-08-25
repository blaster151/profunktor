// fp-model-sets.ts
// Nine model category structures on Set (Goodwillie theorem).

import { SetMap, isMono, isEpi, isIso, isSplitMono, isSplitEpi } from './fp-wfs-set';

// Predicate type for morphism classes
export type MorphismPredicate = (f: SetMap) => boolean;

// Predicate functions for different morphism classes
export const predicates = {
  // All morphisms
  all: (_f: SetMap) => true,
  
  // Isomorphisms only
  isomorphisms: (f: SetMap) => isIso(f),
  
  // Monomorphisms
  monomorphisms: (f: SetMap) => isMono(f),
  
  // Epimorphisms  
  epimorphisms: (f: SetMap) => isEpi(f),
  
  // Split monomorphisms
  splitMonomorphisms: (f: SetMap) => isSplitMono(f),
  
  // Split epimorphisms
  splitEpimorphisms: (f: SetMap) => isSplitEpi(f),
} as const;

export interface ModelStructure {
  name: string;
  cof: MorphismPredicate;
  fib: MorphismPredicate;
  weakEq: MorphismPredicate;
  homotopyCategory: string;
}

export const ALL_MODEL_STRUCTURES: ModelStructure[] = [
  {
    name: "Discrete",
    cof: predicates.all,
    fib: predicates.all,
    weakEq: predicates.isomorphisms,
    homotopyCategory: "-2 types",
  },
  {
    name: "Chaotic",
    cof: predicates.all,
    fib: predicates.all,
    weakEq: predicates.all,
    homotopyCategory: "-2 types",
  },
  {
    name: "Trivial Cofibrations",
    cof: predicates.isomorphisms,
    fib: predicates.all,
    weakEq: predicates.all,
    homotopyCategory: "-1 types",
  },
  {
    name: "Trivial Fibrations",
    cof: predicates.all,
    fib: predicates.isomorphisms,
    weakEq: predicates.all,
    homotopyCategory: "-1 types",
  },
  {
    name: "Mono-Epi",
    cof: predicates.monomorphisms,
    fib: predicates.epimorphisms,
    weakEq: predicates.isomorphisms,
    homotopyCategory: "0 types",
  },
  {
    name: "Epi-Mono",
    cof: predicates.epimorphisms,
    fib: predicates.monomorphisms,
    weakEq: predicates.isomorphisms,
    homotopyCategory: "0 types",
  },
  {
    name: "SplitMono-SplitEpi",
    cof: predicates.splitMonomorphisms,
    fib: predicates.splitEpimorphisms,
    weakEq: predicates.isomorphisms,
    homotopyCategory: "0 types",
  },
  {
    name: "SplitEpi-SplitMono",
    cof: predicates.splitEpimorphisms,
    fib: predicates.splitMonomorphisms,
    weakEq: predicates.isomorphisms,
    homotopyCategory: "0 types",
  },
  {
    name: "Mixed",
    cof: predicates.monomorphisms,
    fib: predicates.epimorphisms,
    weakEq: predicates.all,
    homotopyCategory: "0 types",
  },
];

// Utility functions for working with predicate-based model structures

/**
 * Check if a morphism is a cofibration in a given model structure
 */
export function isCofibration(f: SetMap, model: ModelStructure): boolean {
  return model.cof(f);
}

/**
 * Check if a morphism is a fibration in a given model structure
 */
export function isFibration(f: SetMap, model: ModelStructure): boolean {
  return model.fib(f);
}

/**
 * Check if a morphism is a weak equivalence in a given model structure
 */
export function isWeakEquivalence(f: SetMap, model: ModelStructure): boolean {
  return model.weakEq(f);
}

/**
 * Find a model structure by name
 */
export function findModelStructure(name: string): ModelStructure | undefined {
  return ALL_MODEL_STRUCTURES.find(model => model.name === name);
}

/**
 * Get all model structures with a specific homotopy category
 */
export function getModelStructuresByHomotopyCategory(category: string): ModelStructure[] {
  return ALL_MODEL_STRUCTURES.filter(model => model.homotopyCategory === category);
}
