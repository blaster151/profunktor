import {
  SetMap,
  WFS,
  isMono,
  isEpi,
  isIso,
  isSplitMono,
  isSplitEpi,
  createSetMap,
  ALL_WFS,
  findWFS,
  getWFSByCof,
  getWFSByFib
} from '../fp-wfs-set';

console.log('=== Weak Factorization Systems for Finite Sets Demo ===\n');

// Create some test sets
const setA = new Set(['a', 'b', 'c']);
const setB = new Set(['x', 'y', 'z']);
const setC = new Set(['p', 'q']);

console.log('--- Test Sets ---');
console.log('Set A:', Array.from(setA));
console.log('Set B:', Array.from(setB));
console.log('Set C:', Array.from(setC));

// Create various test morphisms
const injectiveMap = createSetMap(setA, setB, (x: string) => {
  switch (x) {
    case 'a': return 'x';
    case 'b': return 'y';
    case 'c': return 'z';
    default: return 'x';
  }
});

const surjectiveMap = createSetMap(setA, setC, (x: string) => {
  switch (x) {
    case 'a': return 'p';
    case 'b': return 'p';
    case 'c': return 'q';
    default: return 'p';
  }
});

const bijectiveMap = createSetMap(setA, setB, (x: string) => {
  switch (x) {
    case 'a': return 'x';
    case 'b': return 'y';
    case 'c': return 'z';
    default: return 'x';
  }
});

const constantMap = createSetMap(setA, setB, (x: string) => 'x');

console.log('\n--- Test Morphisms ---');
console.log('Injective map: a→x, b→y, c→z');
console.log('Surjective map: a→p, b→p, c→q');
console.log('Bijective map: a→x, b→y, c→z');
console.log('Constant map: all → x');

// Test predicates
console.log('\n--- Predicate Tests ---');

console.log('isMono(injectiveMap):', isMono(injectiveMap));
console.log('isMono(surjectiveMap):', isMono(surjectiveMap));
console.log('isMono(bijectiveMap):', isMono(bijectiveMap));
console.log('isMono(constantMap):', isMono(constantMap));

console.log('\nisEpi(injectiveMap):', isEpi(injectiveMap));
console.log('isEpi(surjectiveMap):', isEpi(surjectiveMap));
console.log('isEpi(bijectiveMap):', isEpi(bijectiveMap));
console.log('isEpi(constantMap):', isEpi(constantMap));

console.log('\nisIso(injectiveMap):', isIso(injectiveMap));
console.log('isIso(surjectiveMap):', isIso(surjectiveMap));
console.log('isIso(bijectiveMap):', isIso(bijectiveMap));
console.log('isIso(constantMap):', isIso(constantMap));

console.log('\nisSplitMono(injectiveMap):', isSplitMono(injectiveMap));
console.log('isSplitMono(surjectiveMap):', isSplitMono(surjectiveMap));
console.log('isSplitMono(bijectiveMap):', isSplitMono(bijectiveMap));
console.log('isSplitMono(constantMap):', isSplitMono(constantMap));

console.log('\nisSplitEpi(injectiveMap):', isSplitEpi(injectiveMap));
console.log('isSplitEpi(surjectiveMap):', isSplitEpi(surjectiveMap));
console.log('isSplitEpi(bijectiveMap):', isSplitEpi(bijectiveMap));
console.log('isSplitEpi(constantMap):', isSplitEpi(constantMap));

// Test the six WFS
console.log('\n--- The Six Weak Factorization Systems ---');

ALL_WFS.forEach((wfs, index) => {
  console.log(`${index + 1}. (${wfs.cof}, ${wfs.fib})`);
  console.log(`   Description: ${wfs.description}`);
  
  // Test lifting with our example maps
  const liftingResult = wfs.liftingTest(injectiveMap, surjectiveMap);
  console.log(`   Lifting test (injective, surjective): ${liftingResult}`);
  
  console.log('');
});

// Test helper functions
console.log('--- Helper Function Tests ---');

const foundWFS = findWFS('Mono', 'Epi');
console.log('findWFS("Mono", "Epi"):', foundWFS ? foundWFS.description : 'Not found');

const monoWFS = getWFSByCof('Mono');
console.log('getWFSByCof("Mono"):', monoWFS.map(wfs => `(${wfs.cof}, ${wfs.fib})`));

const epiWFS = getWFSByFib('Epi');
console.log('getWFSByFib("Epi"):', epiWFS.map(wfs => `(${wfs.cof}, ${wfs.fib})`));

// Test specific WFS lifting properties
console.log('\n--- WFS Lifting Property Tests ---');

// Test (Mono, Epi) WFS
const monoEpiWFS = findWFS('Mono', 'Epi');
if (monoEpiWFS) {
  console.log('Testing (Mono, Epi) WFS:');
  console.log('  f = injective, g = surjective');
  console.log('  Expected: true (mono + epi should lift)');
  console.log('  Result:', monoEpiWFS.liftingTest(injectiveMap, surjectiveMap));
  
  console.log('  f = surjective, g = injective');
  console.log('  Expected: false (epi + mono should not lift in this WFS)');
  console.log('  Result:', monoEpiWFS.liftingTest(surjectiveMap, injectiveMap));
}

// Test (Epi, Mono) WFS
const epiMonoWFS = findWFS('Epi', 'Mono');
if (epiMonoWFS) {
  console.log('\nTesting (Epi, Mono) WFS:');
  console.log('  f = surjective, g = injective');
  console.log('  Expected: true (epi + mono should lift)');
  console.log('  Result:', epiMonoWFS.liftingTest(surjectiveMap, injectiveMap));
  
  console.log('  f = injective, g = surjective');
  console.log('  Expected: false (mono + epi should not lift in this WFS)');
  console.log('  Result:', epiMonoWFS.liftingTest(injectiveMap, surjectiveMap));
}

console.log('\n=== WFS Demo Completed ===');
