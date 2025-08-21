#!/usr/bin/env tsx

import { PersistentList } from '../fp-persistent';
import { 
  arrayToList, 
  listToArray, 
  maybeToList, 
  listToMaybe, 
  eitherToList 
} from '../fp-persistent-functionk-bridges';

function main() {
  console.log('=== Testing PersistentList FunctionK Bridges ===');
  
  // Array → List → Array roundtrip
  const originalArray = [1, 2, 3];
  const list = arrayToList(originalArray);
  const roundtripArray = listToArray(list);
  
  console.log('Original array:', originalArray);
  console.log('Roundtrip array:', roundtripArray);
  console.assert(
    JSON.stringify(originalArray) === JSON.stringify(roundtripArray),
    'Array roundtrip failed'
  );
  
  // Maybe → List
  const justValue = { tag: 'Just' as const, value: 42 };
  const nothingValue = { tag: 'Nothing' as const };
  
  const listFromJust = maybeToList(justValue);
  const listFromNothing = maybeToList(nothingValue);
  
  const arrayFromJust = listToArray(listFromJust);
  const arrayFromNothing = listToArray(listFromNothing);
  
  console.log('List from Just(42):', arrayFromJust);
  console.log('List from Nothing:', arrayFromNothing);
  console.assert(JSON.stringify(arrayFromJust) === JSON.stringify([42]), 'Just to list failed');
  console.assert(JSON.stringify(arrayFromNothing) === JSON.stringify([]), 'Nothing to list failed');
  
  // List → Maybe (head)
  const nonEmptyList = arrayToList([1, 2, 3]);
  const emptyList = arrayToList([]);
  
  const headOfNonEmpty = listToMaybe(nonEmptyList);
  const headOfEmpty = listToMaybe(emptyList);
  
  console.log('Head of [1,2,3]:', headOfNonEmpty);
  console.log('Head of []:', headOfEmpty);
  console.assert(
    (headOfNonEmpty as any).tag === 'Just' && (headOfNonEmpty as any).value === 1,
    'Head of non-empty list failed'
  );
  console.assert((headOfEmpty as any).tag === 'Nothing', 'Head of empty list failed');
  
  // Either → List (Right-biased)
  const rightValue = { right: 'success' };
  const leftValue = { left: 'error' };
  
  const listFromRight = eitherToList(rightValue);
  const listFromLeft = eitherToList(leftValue);
  
  const arrayFromRight = listToArray(listFromRight);
  const arrayFromLeft = listToArray(listFromLeft);
  
  console.log('List from Right("success"):', arrayFromRight);
  console.log('List from Left("error"):', arrayFromLeft);
  console.assert(JSON.stringify(arrayFromRight) === JSON.stringify(['success']), 'Right to list failed');
  console.assert(JSON.stringify(arrayFromLeft) === JSON.stringify([]), 'Left to list failed');
  
  console.log('All tests passed! ✓');
  console.log('OK');
}

main();
