#!/usr/bin/env tsx

import { PersistentSet, PersistentMap } from '../fp-persistent';
import { 
  arrayToSet, 
  setToArray, 
  maybeToSet, 
  eitherToSet,
  entriesArrayToMap,
  mapToEntriesArray,
  type Entry
} from '../fp-persistent-functionk-bridges';

function main() {
  console.log('=== Testing PersistentSet and PersistentMap FunctionK Bridges ===');
  
  // Array ↔ Set roundtrip (with deduplication)
  const originalArrayWithDupes = [1, 2, 2, 3, 1];
  const set = arrayToSet(originalArrayWithDupes);
  const uniqueArray = setToArray(set);
  
  console.log('Original array with dupes:', originalArrayWithDupes);
  console.log('Deduplicated array from set:', uniqueArray.sort()); // Sort for consistent order
  
  // Check that deduplication happened
  const uniqueExpected = [1, 2, 3];
  console.assert(
    JSON.stringify(uniqueArray.sort()) === JSON.stringify(uniqueExpected),
    'Set deduplication failed'
  );
  
  // Maybe → Set
  const justValue = { tag: 'Just' as const, value: 42 };
  const nothingValue = { tag: 'Nothing' as const };
  
  const setFromJust = maybeToSet(justValue);
  const setFromNothing = maybeToSet(nothingValue);
  
  const arrayFromJustSet = setToArray(setFromJust);
  const arrayFromNothingSet = setToArray(setFromNothing);
  
  console.log('Set from Just(42):', arrayFromJustSet);
  console.log('Set from Nothing:', arrayFromNothingSet);
  console.assert(JSON.stringify(arrayFromJustSet) === JSON.stringify([42]), 'Just to set failed');
  console.assert(JSON.stringify(arrayFromNothingSet) === JSON.stringify([]), 'Nothing to set failed');
  
  // Either → Set
  const rightValue = { right: 'success' };
  const leftValue = { left: 'error' };
  
  const setFromRight = eitherToSet(rightValue);
  const setFromLeft = eitherToSet(leftValue);
  
  const arrayFromRightSet = setToArray(setFromRight);
  const arrayFromLeftSet = setToArray(setFromLeft);
  
  console.log('Set from Right("success"):', arrayFromRightSet);
  console.log('Set from Left("error"):', arrayFromLeftSet);
  console.assert(JSON.stringify(arrayFromRightSet) === JSON.stringify(['success']), 'Right to set failed');
  console.assert(JSON.stringify(arrayFromLeftSet) === JSON.stringify([]), 'Left to set failed');
  
  // Array<[K,V]> ↔ Map roundtrip
  const originalEntries: Entry<string, number>[] = [['a', 1], ['b', 2], ['c', 3]];
  const map = entriesArrayToMap(originalEntries);
  const roundtripEntries = mapToEntriesArray(map);
  
  console.log('Original entries:', originalEntries);
  console.log('Roundtrip entries:', roundtripEntries);
  
  // Sort both arrays for comparison (Map iteration order may vary)
  const sortedOriginal = [...originalEntries].sort((a, b) => a[0].localeCompare(b[0]));
  const sortedRoundtrip = [...roundtripEntries].sort((a, b) => a[0].localeCompare(b[0]));
  
  console.assert(
    JSON.stringify(sortedOriginal) === JSON.stringify(sortedRoundtrip),
    'Map entries roundtrip failed'
  );
  
  console.log('All tests passed! ✓');
  console.log('OK');
}

main();
