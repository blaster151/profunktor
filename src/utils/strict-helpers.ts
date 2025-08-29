/**
 * Helper functions for TypeScript strict mode compliance
 * These utilities help handle undefined values safely when using
 * --noUncheckedIndexedAccess and other strict flags
 */

/**
 * Safely access an array element, returning undefined if out of bounds
 */
export function safeArrayAccess<T>(
  array: readonly T[], 
  index: number
): T | undefined {
  return array[index];
}

/**
 * Assert that a value is defined, throwing an error if not
 */
export function assertDefined<T>(
  value: T | undefined,
  message: string = 'Value is undefined'
): T {
  if (value === undefined) {
    throw new Error(message);
  }
  return value;
}

/**
 * Safely access an object property with a fallback
 */
export function safeGet<T, K extends keyof T>(
  obj: T,
  key: K,
  fallback: T[K]
): T[K] {
  const value = obj[key];
  return value !== undefined ? value : fallback;
}

/**
 * Check if a value is defined (type guard)
 */
export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

/**
 * Filter out undefined values from an array
 */
export function filterDefined<T>(array: readonly (T | undefined)[]): T[] {
  return array.filter(isDefined);
}

/**
 * Safe array comparison for sorting
 */
export function safeCompareArrayElements<T>(
  arr1: readonly T[],
  arr2: readonly T[],
  index: number,
  compareFn: (a: T, b: T) => number = (a, b) => a < b ? -1 : a > b ? 1 : 0
): number | undefined {
  const a = arr1[index];
  const b = arr2[index];
  if (a === undefined || b === undefined) {
    return undefined;
  }
  return compareFn(a, b);
}

/**
 * Safe object property comparison
 */
export function safeCompareProps<T, K extends keyof T>(
  obj1: T,
  obj2: T,
  key: K,
  compareFn: (a: T[K], b: T[K]) => number = (a, b) => a < b ? -1 : a > b ? 1 : 0
): number | undefined {
  const a = obj1[key];
  const b = obj2[key];
  if (a === undefined || b === undefined) {
    return undefined;
  }
  return compareFn(a, b);
}

/**
 * Safe record/object access with type narrowing
 */
export function safeRecordAccess<K extends PropertyKey, V>(
  record: Record<K, V>,
  key: K
): V | undefined {
  return record[key];
}

/**
 * Safely destructure array with defaults
 */
export function safeArrayDestructure<T>(
  array: readonly T[],
  count: 1
): [T | undefined];
export function safeArrayDestructure<T>(
  array: readonly T[],
  count: 2
): [T | undefined, T | undefined];
export function safeArrayDestructure<T>(
  array: readonly T[],
  count: 3
): [T | undefined, T | undefined, T | undefined];
export function safeArrayDestructure<T>(
  array: readonly T[],
  count: number
): (T | undefined)[] {
  const result: (T | undefined)[] = [];
  for (let i = 0; i < count; i++) {
    result.push(array[i]);
  }
  return result;
}