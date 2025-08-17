/**
 * Tests for Fluent Pattern-Matching Builder DSL
 */

import { PersistentList, PersistentMap, PersistentSet } from '../fp-persistent';
import {
  createReadonlyArrayMatcherFluent,
  createListMatcher,
  createMapMatcher,
  createSetMatcher,
  createListBuilder,
  createReadonlyArrayBuilder,
  createMapBuilder,
  createSetBuilder,
  fromArrayCases,
  fromListCases,
  fromMapCases,
  fromSetCases
} from '../fp-readonly-patterns';

describe('Builder DSL', () => {
  test('array: exhaustive with record-style API', () => {
    const f = createReadonlyArrayMatcherFluent<number, string>({
      empty: () => '∅',
      nonEmpty: (h, t) => `${h}|${t.length}`
    });
    expect(f([])).toBe('∅');
    expect(f([1,2,3])).toBe('1|2');
  });

  test('list: fluent builder style', () => {
    const l = PersistentList.fromArray([1,2,3]);
    const render = createListBuilder<number, string>()
      .with('empty', () => '∅')
      .with('cons', (h, t) => `${h} :: ${t.size}`)
      .exhaustive();
    expect(render(l)).toBe('1 :: 2');
  });

  test('list: record-style API', () => {
    const l = PersistentList.fromArray([1,2,3]);
    const render = createListMatcher<number, string>({
      empty: () => '∅',
      cons: (h, t) => `${h} :: ${t.size}`
    });
    expect(render(l)).toBe('1 :: 2');
  });

  test('map: exhaustive', () => {
    const m = PersistentMap.fromEntries([['a', 1], ['b', 2]]);
    const f = createMapMatcher<string, number, string>({
      empty: () => '∅',
      nonEmpty: (k, v, rest) => `${k}=${v} & ${Array.from(rest.entries()).length}`
    });
    expect(f(PersistentMap.fromEntries([]))).toBe('∅');
    const result = f(m);
    // The result should contain either "a=1 & 1" or "b=2 & 1" depending on map iteration order
    expect(result).toMatch(/[ab]=[12] & 1/);
  });

  test('set: partial', () => {
    const s = PersistentSet.fromArray([10, 20]);
    const builder = createSetBuilder<number, string>()
      .with('nonEmpty', (x) => `first:${x}`);
    const result = builder.partial(s);
    // Should match one of the elements
    expect(result).toMatch(/first:(10|20)/);
    // exhaustive should throw because 'empty' missing
    expect(() => builder.exhaustive()).toThrow('Unhandled cases: empty');
  });

  test('array: fluent builder style', () => {
    const arr: readonly number[] = [1, 2, 3];
    const render = createReadonlyArrayBuilder<number, string>()
      .with('empty', () => 'no items')
      .with('nonEmpty', (head, tail) => `${head} with ${tail.length} more`)
      .exhaustive();
    expect(render([])).toBe('no items');
    expect(render(arr)).toBe('1 with 2 more');
  });

  test('exhaustiveness checking', () => {
    // Should throw when not all cases are covered
    const incompleteBuilder = createListBuilder<number, string>()
      .with('cons', (h, t) => `${h}`);
    
    expect(() => incompleteBuilder.exhaustive()).toThrow('Unhandled cases: empty');
  });

  test('partial matching', () => {
    // Partial should return undefined when case not handled
    const partialBuilder = createListBuilder<number, string>()
      .with('cons', (h, t) => `${h}`);
    
    const emptyList = PersistentList.fromArray([]);
    const nonEmptyList = PersistentList.fromArray([42]);
    
    expect(partialBuilder.partial(emptyList)).toBeUndefined();
    expect(partialBuilder.partial(nonEmptyList)).toBe('42');
  });

  test('toFunction alias', () => {
    const render = createListBuilder<number, string>()
      .with('empty', () => '∅')
      .with('cons', (h, t) => `${h}`)
      .toFunction(); // Should be same as .exhaustive()
    
    const list = PersistentList.fromArray([42]);
    expect(render(list)).toBe('42');
  });
});

describe('Edge Cases', () => {
  test('empty map/set operations', () => {
    const emptyMap = PersistentMap.fromEntries([]);
    const emptySet = PersistentSet.fromArray([]);
    
    const mapMatcher = createMapMatcher<string, number, string>({
      empty: () => 'empty map',
      nonEmpty: (k, v, rest) => `has ${k}`
    });
    
    const setMatcher = createSetMatcher<number, string>({
      empty: () => 'empty set',
      nonEmpty: (first, rest) => `has ${first}`
    });
    
    expect(mapMatcher(emptyMap)).toBe('empty map');
    expect(setMatcher(emptySet)).toBe('empty set');
  });

  test('single element collections', () => {
    const singleMap = PersistentMap.fromEntries([['key', 'value']]);
    const singleSet = PersistentSet.fromArray(['item']);
    
    const mapMatcher = createMapMatcher<string, string, string>({
      empty: () => 'empty',
      nonEmpty: (k, v, rest) => `${k}:${v} (rest: ${rest.size})`
    });
    
    const setMatcher = createSetMatcher<string, string>({
      empty: () => 'empty',
      nonEmpty: (first, rest) => `${first} (rest: ${rest.size})`
    });
    
    expect(mapMatcher(singleMap)).toBe('key:value (rest: 0)');
    expect(setMatcher(singleSet)).toBe('item (rest: 0)');
  });
});

describe('fromCases() partial population', () => {
  test('array: start partial, finish fluent', () => {
    const b = fromArrayCases<number, string>({
      nonEmpty: (h, t) => `${h}|${t.length}`
    });
    // still missing 'empty' → exhaustive should throw
    expect(() => b.exhaustive()).toThrow();

    // complete and then call
    const f = b.with('empty', () => '∅').exhaustive();
    expect(f([])).toBe('∅');
    expect(f([1,2,3] as const)).toBe('1|2');
  });

  test('list: partial -> partial() works, exhaustive after fill', () => {
    const l = PersistentList.fromArray([10, 20]);

    const b = fromListCases<number, string>({
      cons: (h, t) => `H${h}/S${t.size}`
    });

    // partial evaluation works even if 'empty' not registered
    expect(b.partial(l)).toBe('H10/S1');

    // finalize
    const f = b.with('empty', () => '∅').exhaustive();
    expect(f(PersistentList.empty<number>())).toBe('∅');
  });

  test('map: partial + finalize', () => {
    const m = PersistentMap.fromEntries([['a', 1]]);
    const b = fromMapCases<string, number, string>({
      nonEmpty: (k, v, rest) => `${k}:${v},r=${Array.from(rest.entries()).length}`
    });
    // complete and call
    const f = b.with('empty', () => '∅').exhaustive();
    expect(f(PersistentMap.fromEntries([]))).toBe('∅');
    expect(f(m)).toMatch(/a:1,r=0/);
  });

  test('set: partial then exhaustive', () => {
    const s = PersistentSet.fromArray([7, 8, 9]);
    const b = fromSetCases<number, number>({
      nonEmpty: (first) => first
    });
    // add missing empty
    const f = b.with('empty', () => -1).exhaustive();
    expect(f(PersistentSet.fromArray<number>([]))).toBe(-1);
    const out = f(s);
    expect([7,8,9]).toContain(out);
  });
});
