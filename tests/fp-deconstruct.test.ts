/**
 * Tests for Readonly-Safe Deconstruction Helpers
 * 
 * This test suite verifies all deconstruction helpers work correctly
 * with arrays and persistent collections while preserving readonly
 * and immutable types.
 */

// Simple test runner for now - can be adapted to vitest later
function describe(name: string, fn: () => void) {
  console.log(`\n=== ${name} ===`);
  fn();
}

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.log(`✗ ${name}: ${error}`);
  }
}

function expect<T>(actual: T) {
  return {
    toBe: (expected: T) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toEqual: (expected: T) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toBeUndefined: () => {
      if (actual !== undefined) {
        throw new Error(`Expected undefined, got ${actual}`);
      }
    },
    toBeDefined: () => {
      if (actual === undefined) {
        throw new Error(`Expected defined value, got undefined`);
      }
    },
    toContain: (expected: any) => {
      if (Array.isArray(actual) && !actual.includes(expected)) {
        throw new Error(`Expected array to contain ${expected}`);
      }
    },
    toMatch: (pattern: RegExp) => {
      if (typeof actual === 'string' && !pattern.test(actual)) {
        throw new Error(`Expected "${actual}" to match ${pattern}`);
      }
    }
  };
}

function expectArrayContaining<T>(actual: readonly T[], expected: readonly T[]) {
  const hasAllItems = expected.every(item => 
    actual.some(actualItem => JSON.stringify(actualItem) === JSON.stringify(item))
  );
  if (!hasAllItems) {
    throw new Error(`Expected array to contain all items: ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

import {
  unconsArray, unsnocArray, headArray, tailArray, isEmptyArray, immutableArray,
  unconsList, headList, tailList, listToReadonlyArray, isEmptyList, onList,
  unconsMap, mapToEntries, isEmptyMap, onMap,
  unconsSet, setToReadonlyArray, isEmptySet, onSet,
  destructureList, onArray
} from '../src/fp-deconstruct';
import { PersistentList, PersistentMap, PersistentSet } from '../fp-persistent';

describe('array deconstruction', () => {
  test('unconsArray handles empty and non-empty arrays', () => {
    expect(unconsArray([] as const)).toBeUndefined();
    expect(unconsArray([1, 2, 3] as const)).toEqual([1, [2, 3]]);
    expect(unconsArray(['a'] as const)).toEqual(['a', []]);
  });

  test('unsnocArray handles empty and non-empty arrays', () => {
    expect(unsnocArray([] as const)).toBeUndefined();
    expect(unsnocArray([1, 2, 3] as const)).toEqual([[1, 2], 3]);
    expect(unsnocArray(['a'] as const)).toEqual([[], 'a']);
  });

  test('head/tail/isEmpty work correctly', () => {
    expect(isEmptyArray([])).toBe(true);
    expect(isEmptyArray([1])).toBe(false);
    
    expect(headArray([])).toBeUndefined();
    expect(headArray([10, 20])).toBe(10);
    
    expect(tailArray([])).toBeUndefined();
    expect(tailArray([10])).toEqual([]);
    expect(tailArray([10, 20, 30])).toEqual([20, 30]);
  });

  test('immutableArray is pass-through but readonly', () => {
    const xs = immutableArray([1, 2, 3] as const);
    // Type should prevent mutation
    expect(xs[0]).toBe(1);
    expect(xs.length).toBe(3);
    // Should be same reference (pass-through)
    const original = [1, 2, 3] as const;
    expect(immutableArray(original)).toBe(original);
  });

  test('onArray bridge works correctly', () => {
    const emptyResult = onArray([], {
      empty: () => 'empty',
      nonEmpty: (h, t) => `head: ${h}, tail length: ${t.length}`
    });
    expect(emptyResult).toBe('empty');

    const nonEmptyResult = onArray([1, 2, 3], {
      empty: () => 'empty',
      nonEmpty: (h, t) => `head: ${h}, tail length: ${t.length}`
    });
    expect(nonEmptyResult).toBe('head: 1, tail length: 2');
  });
});

describe('list deconstruction', () => {
  const emptyList = PersistentList.empty<number>();
  const nonEmptyList = PersistentList.fromArray([10, 20, 30]);

  test('destructureList works correctly', () => {
    expect(destructureList(emptyList)).toBeUndefined();
    
    const result = destructureList(nonEmptyList);
    expect(result).toBeDefined();
    if (result) {
      const [head, tail] = result;
      expect(head).toBe(10);
      expect(tail.size).toBe(2);
    }
  });

  test('unconsList/head/tail work correctly', () => {
    expect(unconsList(emptyList)).toBeUndefined();
    expect(headList(emptyList)).toBeUndefined();
    expect(tailList(emptyList)).toBeUndefined();
    
    const u = unconsList(nonEmptyList)!;
    expect(u[0]).toBe(10);
    expect(u[1].size).toBe(2);
    
    expect(headList(nonEmptyList)).toBe(10);
    expect(tailList(nonEmptyList)?.size).toBe(2);
  });

  test('isEmpty checks work correctly', () => {
    expect(isEmptyList(emptyList)).toBe(true);
    expect(isEmptyList(nonEmptyList)).toBe(false);
  });

  test('listToReadonlyArray converts correctly', () => {
    expect(listToReadonlyArray(emptyList)).toEqual([]);
    expect(listToReadonlyArray(nonEmptyList)).toEqual([10, 20, 30]);
  });

  test('onList bridge works correctly', () => {
    const emptyResult = onList(emptyList, {
      empty: () => '∅',
      cons: (h, t) => `${h}/${t.size}`
    });
    expect(emptyResult).toBe('∅');

    const nonEmptyResult = onList(nonEmptyList, {
      empty: () => '∅',
      cons: (h, t) => `${h}/${t.size}`
    });
    expect(nonEmptyResult).toBe('10/2');
  });
});

describe('map deconstruction', () => {
  const emptyMap = PersistentMap.fromEntries<string, number>([]);
  const nonEmptyMap = PersistentMap.fromEntries([['a', 1], ['b', 2], ['c', 3]]);

  test('unconsMap works correctly', () => {
    expect(unconsMap(emptyMap)).toBeUndefined();
    
    const u = unconsMap(nonEmptyMap);
    expect(u).toBeDefined();
    if (u) {
      const [k, v, rest] = u;
      expect(typeof k).toBe('string');
      expect(typeof v).toBe('number');
      expect(['a', 'b', 'c']).toContain(k);
      expect([1, 2, 3]).toContain(v);
      expect(rest.size).toBe(2);
    }
  });

  test('isEmpty checks work correctly', () => {
    expect(isEmptyMap(emptyMap)).toBe(true);
    expect(isEmptyMap(nonEmptyMap)).toBe(false);
  });

  test('mapToEntries creates readonly entries', () => {
    expect(mapToEntries(emptyMap)).toEqual([]);
    
    const entries = mapToEntries(nonEmptyMap);
    expect(entries.length).toBe(3);
    expectArrayContaining(entries, [['a', 1], ['b', 2], ['c', 3]]);
  });

  test('onMap bridge works correctly', () => {
    const emptyResult = onMap(emptyMap, {
      empty: () => '∅',
      nonEmpty: (k, v, rest) => `${k}:${v};${rest.size}`
    });
    expect(emptyResult).toBe('∅');

    const nonEmptyResult = onMap(nonEmptyMap, {
      empty: () => '∅',
      nonEmpty: (k, v, rest) => `${k}:${v};${rest.size}`
    });
    expect(nonEmptyResult).toMatch(/[abc]:[123];2/);
  });
});

describe('set deconstruction', () => {
  const emptySet = PersistentSet.fromArray<number>([]);
  const nonEmptySet = PersistentSet.fromArray([7, 8, 9]);

  test('unconsSet works correctly', () => {
    expect(unconsSet(emptySet)).toBeUndefined();
    
    const u = unconsSet(nonEmptySet);
    expect(u).toBeDefined();
    if (u) {
      const [first, rest] = u;
      expect([7, 8, 9]).toContain(first);
      expect(rest.size).toBe(2);
    }
  });

  test('isEmpty checks work correctly', () => {
    expect(isEmptySet(emptySet)).toBe(true);
    expect(isEmptySet(nonEmptySet)).toBe(false);
  });

  test('setToReadonlyArray converts correctly', () => {
    expect(setToReadonlyArray(emptySet)).toEqual([]);
    
    const arr = setToReadonlyArray(nonEmptySet);
    expect(arr.length).toBe(3);
    expectArrayContaining(arr, [7, 8, 9]);
  });

  test('onSet bridge works correctly', () => {
    const emptyResult = onSet(emptySet, {
      empty: () => -1,
      nonEmpty: (x, rest) => x + rest.size
    });
    expect(emptyResult).toBe(-1);

    const nonEmptyResult = onSet(nonEmptySet, {
      empty: () => -1,
      nonEmpty: (x, rest) => x + rest.size
    });
    // Result should be first element + 2 (size of rest)
    expect([7+2, 8+2, 9+2]).toContain(nonEmptyResult);
  });
});

describe('type safety and readonly preservation', () => {
  test('all helpers preserve readonly types', () => {
    const readonlyArr = [1, 2, 3] as const;
    const readonlyList = PersistentList.fromArray([1, 2, 3]);
    const readonlyMap = PersistentMap.fromEntries([['a', 1]] as const);
    const readonlySet = PersistentSet.fromArray([1, 2, 3]);

    // These should all compile without type errors and preserve readonly
    const arrHead = headArray(readonlyArr);
    const arrTail = tailArray(readonlyArr);
    const listHead = headList(readonlyList);
    const listTail = tailList(readonlyList);
    const mapEntries = mapToEntries(readonlyMap);
    const setArray = setToReadonlyArray(readonlySet);

    // Basic type checks
    expect(typeof arrHead === 'number' || arrHead === undefined).toBe(true);
    expect(Array.isArray(arrTail) || arrTail === undefined).toBe(true);
    expect(typeof listHead === 'number' || listHead === undefined).toBe(true);
    expect(listTail === undefined || listTail.size >= 0).toBe(true);
    expect(Array.isArray(mapEntries)).toBe(true);
    expect(Array.isArray(setArray)).toBe(true);
  });

  test('uncons returns properly typed tuples', () => {
    const arr = [1, 2, 3] as const;
    const list = PersistentList.fromArray([1, 2, 3]);
    const map = PersistentMap.fromEntries([['a', 1], ['b', 2]]);
    const set = PersistentSet.fromArray([1, 2, 3]);

    const arrResult = unconsArray(arr);
    const listResult = unconsList(list);
    const mapResult = unconsMap(map);
    const setResult = unconsSet(set);

    if (arrResult) {
      const [head, tail] = arrResult;
      expect(typeof head).toBe('number');
      expect(Array.isArray(tail)).toBe(true);
    }

    if (listResult) {
      const [head, tail] = listResult;
      expect(typeof head).toBe('number');
      expect(tail.size >= 0).toBe(true);
    }

    if (mapResult) {
      const [k, v, rest] = mapResult;
      expect(typeof k).toBe('string');
      expect(typeof v).toBe('number');
      expect(rest.size >= 0).toBe(true);
    }

    if (setResult) {
      const [first, rest] = setResult;
      expect(typeof first).toBe('number');
      expect(rest.size >= 0).toBe(true);
    }
  });
});

describe('edge cases and error handling', () => {
  test('handles various empty collection types', () => {
    expect(unconsArray([])).toBeUndefined();
    expect(unsnocArray([])).toBeUndefined();
    expect(unconsList(PersistentList.empty())).toBeUndefined();
    expect(unconsMap(PersistentMap.fromEntries([]))).toBeUndefined();
    expect(unconsSet(PersistentSet.fromArray([]))).toBeUndefined();
  });

  test('handles single element collections', () => {
    const singleArray = [42] as const;
    const singleList = PersistentList.fromArray([42]);
    const singleMap = PersistentMap.fromEntries([['key', 42]]);
    const singleSet = PersistentSet.fromArray([42]);

    const arrResult = unconsArray(singleArray);
    expect(arrResult).toEqual([42, []]);

    const listResult = unconsList(singleList);
    expect(listResult?.[0]).toBe(42);
    expect(listResult?.[1].isEmpty()).toBe(true);

    const mapResult = unconsMap(singleMap);
    expect(mapResult?.[0]).toBe('key');
    expect(mapResult?.[1]).toBe(42);
    expect(mapResult?.[2].isEmpty()).toBe(true);

    const setResult = unconsSet(singleSet);
    expect(setResult?.[0]).toBe(42);
    expect(setResult?.[1].isEmpty()).toBe(true);
  });
});
