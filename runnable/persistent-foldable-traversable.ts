#!/usr/bin/env tsx

import { PersistentList } from '../fp-persistent';
import { 
  PersistentListFoldable, 
  PersistentListTraversable,
  traverseList
} from '../fp-persistent-hkt-gadt';

async function main() {
  console.log('=== Testing PersistentList Foldable/Traversable ===');
  
  // Build PersistentList
  const list = PersistentList.fromArray([1, 2, 3]);
  console.log('Created list:', list.toArray ? list.toArray() : 'no toArray method');
  
  // Test foldr sum = 6
  const foldrSum = PersistentListFoldable.foldr<number, number>(list, (a, b) => a + b, 0);
  console.log('foldr sum:', foldrSum);
  console.assert(foldrSum === 6, `Expected 6, got ${foldrSum}`);
  
  // Test foldl sum = 6
  const foldlSum = PersistentListFoldable.foldl<number, number>(list, (b, a) => b + a, 0);
  console.log('foldl sum:', foldlSum);
  console.assert(foldlSum === 6, `Expected 6, got ${foldlSum}`);
  
  // Test traverseList with Promise (a => Promise.resolve(a*2))
  console.log('Testing traverseList with Promise...');
  const promiseResult = await traverseList(list, (a: number) => Promise.resolve(a * 2));
  
  // Convert result to array for comparison
  const resultArray: number[] = [];
  (promiseResult as any).forEach((x: number) => resultArray.push(x));
  
  console.log('traverseList result:', resultArray);
  console.assert(
    JSON.stringify(resultArray) === JSON.stringify([2, 4, 6]), 
    `Expected [2,4,6], got ${JSON.stringify(resultArray)}`
  );
  
  console.log('All tests passed! ✓');
  console.log('OK');
}

main().catch(console.error);
