/**
 * Readonly Collections and Deconstruction Utilities
 * 
 * This module provides a unified API for working with readonly collections
 * and immutable data structures, including safe deconstruction helpers
 * and pattern matching utilities.
 * 
 * Re-exports all readonly-safe deconstruction helpers for:
 * - Arrays (readonly T[])
 * - PersistentList<T>
 * - PersistentMap<K,V>
 * - PersistentSet<T>
 * 
 * Features:
 * - Readonly and Immutable type preservation
 * - Safe uncons/unsnoc/head/tail operations
 * - Zero-cost sugar helpers
 * - Uniform bridge functions for pattern matching
 */

// Re-export all deconstruction helpers as first-class exports
export {
  // Array deconstruction
  immutableArray,
  unconsArray,
  unsnocArray,
  headArray,
  tailArray,
  isEmptyArray,
  nonEmptyArray,
  
  // List deconstruction
  destructureList,
  unconsList,
  headList,
  tailList,
  isEmptyList,
  nonEmptyList,
  listToReadonlyArray,
  
  // Map deconstruction
  unconsMap,
  isEmptyMap,
  nonEmptyMap,
  mapToEntries,
  
  // Set deconstruction
  unconsSet,
  isEmptySet,
  nonEmptySet,
  setToReadonlyArray,
  
  // Uniform bridges for pattern matching
  firstArray,
  restArray,
  onArray,
  onList,
  onMap,
  onSet
} from './fp-deconstruct';

// Re-export readonly builder utilities
export {
  createReadonlyArrayBuilder,
  createListBuilder,
  createMapBuilder,
  createSetBuilder,
  populateFromCases,
  fromArrayCases,
  fromListCases,
  fromMapCases,
  fromSetCases,
  createReadonlyArrayMatcher,
  createListMatcher,
  createMapMatcher,
  createSetMatcher,
  type BuilderState,
  type MatcherBuilder,
  type ArrayCases,
  type ListCases,
  type MapCases,
  type SetCases
} from './fp-readonly-builder';

// Re-export GADT readonly pattern matching
export {
  pmatchReadonly,
  pmatchReadonlyPartial,
  createReadonlyGADTMatcher,
  createReadonlyPmatchBuilder,
  pmatchReadonlyK,
  type ReadonlyPmatchBuilder,
  type Kindlike
} from './fp-gadt-readonly';
