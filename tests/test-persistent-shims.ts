/**
 * Test file to verify persistent collection shims work correctly
 */

import { PersistentList, PersistentMap, PersistentSet } from './fp-persistent';

// Test PersistentList.length
const list = PersistentList.fromArray([1, 2, 3, 4, 5]);
console.log('PersistentList.size:', list.size);
console.log('PersistentList.length:', list.length);
console.log('length === size:', list.length === list.size);

// Test PersistentMap.of
const map1 = PersistentMap.of([['a', 1], ['b', 2], ['c', 3]]);
console.log('PersistentMap.of size:', map1.size);
console.log('PersistentMap.of get("a"):', map1.get('a'));

// Test PersistentMap instance methods
const map2 = map1.mapValues(v => v * 2);
console.log('mapValues result:', Array.from(map2.entries()));

const map3 = map1.mapKeys(k => k.toUpperCase());
console.log('mapKeys result:', Array.from(map3.entries()));

const map4 = map1.bimap(k => k.toUpperCase(), v => v * 10);
console.log('bimap result:', Array.from(map4.entries()));

// Test PersistentSet.of
const set1 = PersistentSet.of([1, 2, 3, 2, 1]);
console.log('PersistentSet.of size:', set1.size);
console.log('PersistentSet.of contents:', Array.from(set1));

// Test PersistentSet.values()
const values = set1.values();
console.log('PersistentSet.values() type:', typeof values);
console.log('PersistentSet.values() contents:', Array.from(values));
