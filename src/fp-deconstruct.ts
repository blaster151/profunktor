/**
 * Readonly-Safe Deconstruction Helpers
 * 
 * This module provides tiny, predictable helpers for deconstructing arrays and
 * persistent collections in a uniform, FP-friendly way without sacrificing
 * immutability or type inference.
 * 
 * Features:
 * - Uniform uncons/unsnoc/head/tail for arrays and persistent collections
 * - Readonly and Immutable type preservation
 * - Tuple-based returns for ergonomic destructuring
 * - Zero-cost sugar helpers (isEmpty, nonEmpty, toReadonlyArray)
 * - Integration with existing matchers/builders
 */

import { Immutable } from '../fp-immutable';
import {
  PersistentList,
  PersistentMap,
  PersistentSet,
  destructureList as _destructureList
} from '../fp-persistent';
import { assertDefined } from './util/assert';

// ============================================================================
// Part 1: Shared tuple helpers for arrays
// ============================================================================

/**
 * Array: take first element and the rest (never mutates)
 * Returns undefined on empty arrays for safe optional chaining
 */
export function unconsArray<T>(xs: readonly T[]): readonly [head: T, tail: readonly T[]] | undefined {
  if (xs.length === 0) return undefined;
  const [h, ...t] = xs;
  const head = assertDefined(h, "unconsArray: head required");
  return [head, t] as const;
}

/**
 * Array: split into init (all but last) and last element
 * Returns undefined on empty arrays for safe optional chaining
 */
export function unsnocArray<T>(xs: readonly T[]): readonly [init: readonly T[], last: T] | undefined {
  const n = xs.length;
  if (n === 0) return undefined;
  return [xs.slice(0, n - 1), xs[n - 1]] as const;
}

/**
 * Non-throwing head for arrays
 * Returns undefined instead of throwing on empty arrays
 */
export const headArray = <T>(xs: readonly T[]) => (xs.length ? xs[0] : undefined);

/**
 * Non-throwing tail for arrays
 * Returns undefined instead of throwing on empty arrays
 */
export const tailArray = <T>(xs: readonly T[]) => (xs.length ? (xs.slice(1) as readonly T[]) : undefined);

/**
 * Fast emptiness checks that read nicer at call sites
 */
export const isEmptyArray = <T>(xs: readonly T[]) => xs.length === 0;
export const nonEmptyArray = <T>(xs: readonly T[]) => xs.length > 0;

/**
 * Safe "view" with only non-mutating methods
 * This is a pass-through type guard for communicating readonly intent
 */
export function immutableArray<T>(xs: readonly T[]): readonly T[] {
  // xs is already readonly by type; we only retype it to communicate intent
  return xs;
}

// ============================================================================
// Part 2: PersistentList deconstruction
// ============================================================================

/**
 * Safe destructure for PersistentList that returns undefined on empty
 * Wraps the library's destructureList to provide better type safety
 */
function _safeDestructureList<T>(list: PersistentList<T>):
  | readonly [head: T, tail: PersistentList<T>]
  | undefined {
  if (list.isEmpty()) return undefined;
  const h = list.head();
  const t = list.tail();
  return h === undefined ? undefined : ([h, t] as const);
}

// Always use our safe wrapper to ensure consistent undefined behavior
export const destructureList = _safeDestructureList;

/**
 * List uncons: get head and tail
 * Returns undefined on empty lists for safe optional chaining
 */
export function unconsList<T>(list: PersistentList<T>):
  | readonly [head: T, tail: PersistentList<T>]
  | undefined {
  return _safeDestructureList(list);
}

/**
 * Non-throwing head for lists
 * Returns undefined instead of throwing on empty lists
 */
export function headList<T>(list: PersistentList<T>): T | undefined {
  return list.isEmpty() ? undefined : (list.head() as T);
}

/**
 * Non-throwing tail for lists
 * Returns undefined instead of throwing on empty lists
 */
export function tailList<T>(list: PersistentList<T>): PersistentList<T> | undefined {
  return list.isEmpty() ? undefined : list.tail();
}

/**
 * Fast emptiness checks for lists
 */
export const isEmptyList = <T>(list: PersistentList<T>) => list.isEmpty();
export const nonEmptyList = <T>(list: PersistentList<T>) => !list.isEmpty();

/**
 * Convert to readonly array (useful for quick iteration / tests)
 * Preserves order and creates a readonly view
 */
export function listToReadonlyArray<T>(list: PersistentList<T>): readonly T[] {
  const out: T[] = [];
  let cur: PersistentList<T> = list;
  while (!cur.isEmpty()) {
    const h = cur.head();
    if (h !== undefined) out.push(h);
    cur = cur.tail();
  }
  return out as readonly T[];
}

// ============================================================================
// Part 3: PersistentMap deconstruction
// ============================================================================

/**
 * Map deconstruction: return first key/value pair + rest map
 * Note: order follows the iteration order of PersistentMap.entries()
 * Returns undefined on empty maps for safe optional chaining
 */
export function unconsMap<K, V>(
  map: PersistentMap<K, V>
): readonly [firstKey: K, firstValue: V, rest: PersistentMap<K, V>] | undefined {
  if (map.isEmpty()) return undefined;
  const entries = Array.from(map.entries());
  const [k, v] = entries[0]!;
  const rest = PersistentMap.fromEntries(entries.slice(1));
  return [k, v, rest] as const;
}

/**
 * Fast emptiness checks for maps
 */
export const isEmptyMap = <K, V>(m: PersistentMap<K, V>) => m.isEmpty();
export const nonEmptyMap = <K, V>(m: PersistentMap<K, V>) => !m.isEmpty();

/**
 * Safe toEntries (readonly)
 * Returns readonly array of readonly tuples for full immutability
 */
export function mapToEntries<K, V>(m: PersistentMap<K, V>): ReadonlyArray<readonly [K, V]> {
  return Array.from(m.entries()) as ReadonlyArray<readonly [K, V]>;
}

// ============================================================================
// Part 4: PersistentSet deconstruction
// ============================================================================

/**
 * Set deconstruction: first element + rest set
 * Note: order follows the iteration order of PersistentSet
 * Returns undefined on empty sets for safe optional chaining
 */
export function unconsSet<T>(set: PersistentSet<T>):
  | readonly [first: T, rest: PersistentSet<T>]
  | undefined {
  if (set.isEmpty()) return undefined;
  const values = Array.from(set);
  const first = values[0]!;
  const rest = PersistentSet.fromArray(values.slice(1));
  return [first, rest] as const;
}

/**
 * Fast emptiness checks for sets
 */
export const isEmptySet = <T>(s: PersistentSet<T>) => s.isEmpty();
export const nonEmptySet = <T>(s: PersistentSet<T>) => !s.isEmpty();

/**
 * Safe conversion to readonly array
 * Preserves iteration order and creates a readonly view
 */
export function setToReadonlyArray<T>(s: PersistentSet<T>): readonly T[] {
  return Array.from(s) as readonly T[];
}

// ============================================================================
// Part 5: Uniform "view" helpers (bridges)
// ============================================================================

/**
 * Uniform "first/rest" views so higher-level code can be generic
 * These aliases make the API consistent across all collection types
 */
export const firstArray = headArray;
export const restArray = tailArray;

/**
 * Uniform pattern matching bridge for arrays
 * Use this to bridge pattern matchers with tiny pre-checks
 */
export function onArray<T, R>(
  xs: readonly T[],
  branches: { empty: () => R; nonEmpty: (h: T, t: readonly T[]) => R }
): R {
  const u = unconsArray(xs);
  return u ? branches.nonEmpty(u[0], u[1]) : branches.empty();
}

/**
 * Uniform pattern matching bridge for lists
 * Mirrors existing match* but with zero extra types—handy in pipelines
 */
export function onList<T, R>(
  list: PersistentList<T>,
  branches: { empty: () => R; cons: (h: T, t: PersistentList<T>) => R }
): R {
  const u = unconsList(list);
  return u ? branches.cons(u[0], u[1]) : branches.empty();
}

/**
 * Uniform pattern matching bridge for maps
 * Provides first entry deconstruction for iteration-order-based processing
 */
export function onMap<K, V, R>(
  map: PersistentMap<K, V>,
  branches: { empty: () => R; nonEmpty: (k: K, v: V, rest: PersistentMap<K, V>) => R }
): R {
  const u = unconsMap(map);
  return u ? branches.nonEmpty(u[0], u[1], u[2]) : branches.empty();
}

/**
 * Uniform pattern matching bridge for sets
 * Provides first element deconstruction for iteration-order-based processing
 */
export function onSet<T, R>(
  set: PersistentSet<T>,
  branches: { empty: () => R; nonEmpty: (x: T, rest: PersistentSet<T>) => R }
): R {
  const u = unconsSet(set);
  return u ? branches.nonEmpty(u[0], u[1]) : branches.empty();
}
