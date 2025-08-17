/**
 * Demo of the Fluent Pattern-Matching Builder
 * 
 * This demonstrates the requested API from the specification including
 * the new fromCases() partial population feature.
 */

import { PersistentList, PersistentMap, PersistentSet } from './fp-persistent';
import {
  createListBuilder,
  createListMatcher,
  createReadonlyArrayBuilder,
  createMapBuilder,
  createSetBuilder,
  fromListCases,
  fromArrayCases,
  fromMapCases,
  fromSetCases
} from './fp-readonly-patterns';

console.log('=== Original Builder API ===');

// Example from the specification
const render = createListBuilder<number, string>()
  .with('empty', () => '∅')
  .with('cons', (h, t) => `${h} :: ${t.size}`)
  .exhaustive();

const result = render(PersistentList.fromArray([1,2,3])); // "1 :: 2"
console.log('List result:', result);

console.log('\n=== New fromCases() API ===');

// Demonstrate fromCases() partial population
const partialBuilder = fromListCases<number, string>({
  cons: (h, t) => `${h} :: ${t.size}`
});

// Can use partial() immediately even with missing cases
const list = PersistentList.fromArray([10, 20, 30]);
console.log('Partial result:', partialBuilder.partial(list)); // "10 :: 2"

// Empty list would return undefined since 'empty' case not registered
const emptyList = PersistentList.fromArray([]);
console.log('Partial empty result:', partialBuilder.partial(emptyList)); // undefined

// Complete the builder and make it exhaustive
const completeBuilder = partialBuilder.with('empty', () => '∅').exhaustive();
console.log('Complete empty result:', completeBuilder(emptyList)); // "∅"
console.log('Complete non-empty result:', completeBuilder(list)); // "10 :: 2"

console.log('\n=== Array fromCases() Example ===');

const arrayBuilder = fromArrayCases<number, string>({
  nonEmpty: (head, tail) => `${head} with ${tail.length} more`
});

// Test partial
console.log('Array partial [1,2,3]:', arrayBuilder.partial([1,2,3])); // "1 with 2 more"
console.log('Array partial []:', arrayBuilder.partial([])); // undefined

// Complete and test
const completeArrayBuilder = arrayBuilder.with('empty', () => 'no items').exhaustive();
console.log('Array complete []:', completeArrayBuilder([])); // "no items"
console.log('Array complete [1,2,3]:', completeArrayBuilder([1,2,3])); // "1 with 2 more"

console.log('\n=== Map fromCases() Example ===');

const mapBuilder = fromMapCases<string, number, string>({
  nonEmpty: (k, v, rest) => `${k}=${v}, ${rest.size} remaining`
});

const exampleMap = PersistentMap.fromEntries([['a', 1], ['b', 2], ['c', 3]]);
const emptyMap = PersistentMap.fromEntries<string, number>([]);

console.log('Map partial non-empty:', mapBuilder.partial(exampleMap));
console.log('Map partial empty:', mapBuilder.partial(emptyMap)); // undefined

// Complete and test
const completeMapBuilder = mapBuilder.with('empty', () => 'empty map').exhaustive();
console.log('Map complete empty:', completeMapBuilder(emptyMap)); // "empty map"

console.log('\n=== Set fromCases() Example ===');

const setBuilder = fromSetCases<string, string>({
  nonEmpty: (first, rest) => `found: ${first}, ${rest.size} remaining`
});

const exampleSet = PersistentSet.fromArray(['hello', 'world']);
const emptySet = PersistentSet.fromArray([]);

console.log('Set partial non-empty:', setBuilder.partial(exampleSet));
console.log('Set partial empty:', setBuilder.partial(emptySet)); // undefined

// Complete and test
const completeSetBuilder = setBuilder.with('empty', () => 'empty set').exhaustive();
console.log('Set complete empty:', completeSetBuilder(emptySet)); // "empty set"

console.log('\n=== Exhaustiveness Checking ===');

// Demonstrate exhaustiveness checking with partial builders
try {
  const incompleteBuilder = fromListCases<number, string>({
    cons: (h, t) => `${h}`
  });
  incompleteBuilder.exhaustive(); // Should throw
} catch (error) {
  console.log('Exhaustiveness error:', (error as Error).message);
}

console.log('\n=== Comparison: Record vs Builder vs fromCases ===');

// Record-style (original API)
const recordStyleMatcher = createListMatcher<number, string>({
  empty: () => 'empty list',
  cons: (h, t) => `head ${h}, tail size ${t.size}`
});

// Builder-style (fluent API)
const builderStyleMatcher = createListBuilder<number, string>()
  .with('empty', () => 'empty list')
  .with('cons', (h, t) => `head ${h}, tail size ${t.size}`)
  .exhaustive();

// fromCases-style (partial population + completion)
const fromCasesStyleMatcher = fromListCases<number, string>({
  cons: (h, t) => `head ${h}, tail size ${t.size}`
}).with('empty', () => 'empty list').exhaustive();

const testList = PersistentList.fromArray([42, 43]);
console.log('Record style:', recordStyleMatcher(testList));
console.log('Builder style:', builderStyleMatcher(testList));
console.log('fromCases style:', fromCasesStyleMatcher(testList));

console.log('\nDemo completed successfully!');
