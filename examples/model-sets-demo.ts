import {
  ModelStructure,
  ALL_MODEL_STRUCTURES,
  findModelStructure,
  getModelStructuresByHomotopyCategory,
  getModelStructuresByCof,
  getModelStructuresByFib,
  getWFSForModelStructure,
  getValidModelStructures
} from '../fp-model-sets';

import {
  ALL_WFS,
  findWFS
} from '../fp-wfs-set';

console.log('=== Model Structures for Finite Sets Demo ===\n');

// Display all model structures
console.log('--- All Model Structures ---');
ALL_MODEL_STRUCTURES.forEach((ms, index) => {
  console.log(`${index + 1}. ${ms.name}`);
  console.log(`   Cofibrations: ${ms.cof}`);
  console.log(`   Fibrations: ${ms.fib}`);
  console.log(`   Weak Equivalences: ${ms.weakEq}`);
  console.log(`   Homotopy Category: ${ms.homotopyCategory}`);
  console.log('');
});

// Test helper functions
console.log('--- Helper Function Tests ---');

// Find specific model structure
const monoEpi = findModelStructure('Mono-Epi');
console.log('findModelStructure("Mono-Epi"):', monoEpi ? monoEpi.name : 'Not found');

// Get model structures by homotopy category
const zeroTypes = getModelStructuresByHomotopyCategory('0 types');
console.log('getModelStructuresByHomotopyCategory("0 types"):', 
  zeroTypes.map(ms => ms.name));

const minusTwoTypes = getModelStructuresByHomotopyCategory('-2 types');
console.log('getModelStructuresByHomotopyCategory("-2 types"):', 
  minusTwoTypes.map(ms => ms.name));

// Get model structures by cofibration class
const monoCofs = getModelStructuresByCof('Mono');
console.log('getModelStructuresByCof("Mono"):', 
  monoCofs.map(ms => ms.name));

// Get model structures by fibration class
const epiFibs = getModelStructuresByFib('Epi');
console.log('getModelStructuresByFib("Epi"):', 
  epiFibs.map(ms => ms.name));

// Test WFS correspondence
console.log('\n--- WFS Correspondence Tests ---');

ALL_MODEL_STRUCTURES.forEach(ms => {
  const wfs = getWFSForModelStructure(ms);
  if (wfs) {
    console.log(`${ms.name} → WFS (${wfs.cof}, ${wfs.fib}): ${wfs.description}`);
  } else {
    console.log(`${ms.name} → No corresponding WFS found`);
  }
});

// Get valid model structures (those with corresponding WFS)
console.log('\n--- Valid Model Structures (with corresponding WFS) ---');
const validStructures = getValidModelStructures();
validStructures.forEach(ms => {
  console.log(`✓ ${ms.name} (${ms.homotopyCategory})`);
});

// Show which model structures don't have corresponding WFS
console.log('\n--- Model Structures without corresponding WFS ---');
const invalidStructures = ALL_MODEL_STRUCTURES.filter(ms => {
  const wfs = getWFSForModelStructure(ms);
  return wfs === undefined;
});

if (invalidStructures.length === 0) {
  console.log('All model structures have corresponding WFS!');
} else {
  invalidStructures.forEach(ms => {
    console.log(`✗ ${ms.name} (${ms.cof}, ${ms.fib})`);
  });
}

// Show homotopy category distribution
console.log('\n--- Homotopy Category Distribution ---');
const categories = ['-2 types', '-1 types', '0 types'];
categories.forEach(category => {
  const structures = getModelStructuresByHomotopyCategory(category);
  console.log(`${category}: ${structures.length} model structures`);
  structures.forEach(ms => {
    console.log(`  - ${ms.name}`);
  });
});

// Test specific model structure properties
console.log('\n--- Specific Model Structure Analysis ---');

const discrete = findModelStructure('Discrete');
if (discrete) {
  console.log('Discrete Model Structure:');
  console.log(`  - All maps are both cofibrations and fibrations`);
  console.log(`  - Only isomorphisms are weak equivalences`);
  console.log(`  - Results in contractible homotopy category (-2 types)`);
}

const chaotic = findModelStructure('Chaotic');
if (chaotic) {
  console.log('\nChaotic Model Structure:');
  console.log(`  - All maps are both cofibrations and fibrations`);
  console.log(`  - All maps are weak equivalences`);
  console.log(`  - Results in contractible homotopy category (-2 types)`);
}

const monoEpiStruct = findModelStructure('Mono-Epi');
if (monoEpiStruct) {
  console.log('\nMono-Epi Model Structure:');
  console.log(`  - Monomorphisms are cofibrations`);
  console.log(`  - Epimorphisms are fibrations`);
  console.log(`  - Only isomorphisms are weak equivalences`);
  console.log(`  - Results in standard homotopy category of sets (0 types)`);
}

console.log('\n=== Model Structures Demo Completed ===');
