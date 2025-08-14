// fp-dg-cooperad.examples.ts
// Examples demonstrating DG cooperad wrapper usage

import { t, leaf } from './fp-cooperad-trees';
import { 
  createTreeDgCooperad, 
  createGradedTreeDgCooperad,
  leafDifferential,
  binaryNodeDifferential,
  labelSpecificDifferential,
  validateCoLeibnizLaw,
  createTestTree,
  createTestGradedTree
} from './fp-dg-cooperad-integration';
import { sum, zero } from './fp-dg-core';

// ============================================================================
// Example 1: Basic DG Cooperad Creation
// ============================================================================

console.log('=== Example 1: Basic DG Cooperad Creation ===');

// Create a simple tree
const simpleTree = t('f', [t('g', [leaf('x'), leaf('y')]), leaf('z')]);

// Create a DG cooperad with leaf differential
const dgCooperad = createTreeDgCooperad(leafDifferential);

// Test the differential
const differential = dgCooperad.d(simpleTree);
console.log('Original tree:', simpleTree.label);
console.log('Differential terms:', differential.length);

for (const { coef, term } of differential) {
  console.log(`  ${coef > 0 ? '+' : ''}${coef} * ${term.label}`);
}

// ============================================================================
// Example 2: Binary Node Differential
// ============================================================================

console.log('\n=== Example 2: Binary Node Differential ===');

// Create a tree with binary nodes
const binaryTree = t('h', [
  t('f', [leaf('a'), leaf('b')]),
  t('g', [leaf('c'), leaf('d')])
]);

// Create DG cooperad with binary node differential
const binaryDgCooperad = createTreeDgCooperad(binaryNodeDifferential);

// Test the differential
const binaryDiff = binaryDgCooperad.d(binaryTree);
console.log('Binary tree differential terms:', binaryDiff.length);

for (const { coef, term } of binaryDiff) {
  console.log(`  ${coef > 0 ? '+' : ''}${coef} * ${term.label}`);
}

// ============================================================================
// Example 3: Label-Specific Differential
// ============================================================================

console.log('\n=== Example 3: Label-Specific Differential ===');

// Create a tree with specific labels
const labeledTree = t('target', [
  t('other', [leaf('x')]),
  t('target', [leaf('y')])
]);

// Create DG cooperad that replaces 'target' with 'replaced'
const labelDgCooperad = createTreeDgCooperad(
  labelSpecificDifferential('target', 'replaced' as any)
);

// Test the differential
const labelDiff = labelDgCooperad.d(labeledTree);
console.log('Label-specific differential terms:', labelDiff.length);

for (const { coef, term } of labelDiff) {
  console.log(`  ${coef > 0 ? '+' : ''}${coef} * ${term.label}`);
}

// ============================================================================
// Example 4: Graded Tree DG Cooperad
// ============================================================================

console.log('\n=== Example 4: Graded Tree DG Cooperad ===');

// Create a graded tree
const gradedTree = createTestGradedTree('root', [
  createTestGradedTree('child1', []),
  createTestGradedTree('child2', [])
]);

// Create a local differential for graded trees
const gradedLocalDiff = (t: any) => {
  if (t.degree === 0) {
    return sum({ coef: 1, term: { ...t, label: `d(${t.label})` } });
  }
  return zero();
};

// Create DG cooperad for graded trees
const gradedDgCooperad = createGradedTreeDgCooperad(gradedLocalDiff);

// Test the differential
const gradedDiff = gradedDgCooperad.d(gradedTree);
console.log('Graded tree degree:', gradedTree.degree);
console.log('Graded differential terms:', gradedDiff.length);

// ============================================================================
// Example 5: Co-Leibniz Law Validation
// ============================================================================

console.log('\n=== Example 5: Co-Leibniz Law Validation ===');

// Create test trees for validation
const testTrees = [
  t('test1', [leaf('x')]),
  t('test2', [leaf('y'), leaf('z')]),
  t('test3', [t('f', [leaf('a')]), leaf('b')])
];

// Validate co-Leibniz law
const validation = validateCoLeibnizLaw(dgCooperad, testTrees);
console.log('Co-Leibniz validation:');
console.log(`  Passed: ${validation.passed}`);
if (!validation.passed) {
  console.log('  Failures:', validation.failures);
}

// ============================================================================
// Example 6: Complex Local Differential
// ============================================================================

console.log('\n=== Example 6: Complex Local Differential ===');

// Define a more complex local differential
const complexLocalDiff = (t: any) => {
  const result = [];
  
  // Act on leaves
  if (t.kids.length === 0) {
    result.push({ coef: 1, term: { ...t, label: `d_leaf(${t.label})` } });
  }
  
  // Act on binary nodes
  if (t.kids.length === 2) {
    result.push({ 
      coef: -1, 
      term: { ...t, kids: [t.kids[1], t.kids[0]] } 
    });
  }
  
  // Act on nodes with specific labels
  if (t.label === 'special') {
    result.push({ coef: 2, term: { ...t, label: 'transformed' } });
  }
  
  return result.length > 0 ? result : zero();
};

// Create DG cooperad with complex differential
const complexDgCooperad = createTreeDgCooperad(complexLocalDiff);

// Test on a complex tree
const complexTree = t('special', [
  t('f', [leaf('x'), leaf('y')]),
  t('g', [leaf('z')])
]);

const complexDiff = complexDgCooperad.d(complexTree);
console.log('Complex differential terms:', complexDiff.length);

for (const { coef, term } of complexDiff) {
  console.log(`  ${coef > 0 ? '+' : ''}${coef} * ${term.label}`);
}

// ============================================================================
// Example 7: Zero Differential (Strict Cooperad)
// ============================================================================

console.log('\n=== Example 7: Zero Differential (Strict Cooperad) ===');

// Create a DG cooperad with zero differential (strict case)
const strictDgCooperad = createTreeDgCooperad(() => zero());

// Test on a tree
const strictDiff = strictDgCooperad.d(simpleTree);
console.log('Strict differential terms:', strictDiff.length);
console.log('  Should be 0:', strictDiff.length === 0);

// ============================================================================
// Example 8: Composition of Local Differentials
// ============================================================================

console.log('\n=== Example 8: Composition of Local Differentials ===');

// Compose multiple local differentials
const composeLocalDiffs = (...diffs: ((t: any) => any[])[]) => {
  return (t: any) => {
    let result = zero();
    for (const diff of diffs) {
      result = [...result, ...diff(t)];
    }
    return result;
  };
};

// Create DG cooperad with composed differentials
const composedDgCooperad = createTreeDgCooperad(
  composeLocalDiffs(leafDifferential, binaryNodeDifferential)
);

// Test the composed differential
const composedDiff = composedDgCooperad.d(binaryTree);
console.log('Composed differential terms:', composedDiff.length);

// ============================================================================
// Example 9: Degree-Aware Local Differential
// ============================================================================

console.log('\n=== Example 9: Degree-Aware Local Differential ===');

// Create a degree-aware local differential
const degreeAwareDiff = (t: any) => {
  const degree = t.kids.length;
  
  if (degree === 0) {
    // Leaves: no action
    return zero();
  } else if (degree === 1) {
    // Unary nodes: duplicate
    return sum({ coef: 1, term: t }, { coef: 1, term: t });
  } else if (degree === 2) {
    // Binary nodes: swap children
    return sum({ coef: -1, term: { ...t, kids: [t.kids[1], t.kids[0]] } });
  } else {
    // Higher arity: no action
    return zero();
  }
};

// Create DG cooperad with degree-aware differential
const degreeAwareDgCooperad = createTreeDgCooperad(degreeAwareDiff);

// Test on various trees
const unaryTree = t('unary', [leaf('x')]);
const ternaryTree = t('ternary', [leaf('a'), leaf('b'), leaf('c')]);

console.log('Degree-aware differentials:');
console.log('  Unary tree:', degreeAwareDgCooperad.d(unaryTree).length, 'terms');
console.log('  Binary tree:', degreeAwareDgCooperad.d(binaryTree).length, 'terms');
console.log('  Ternary tree:', degreeAwareDgCooperad.d(ternaryTree).length, 'terms');

// ============================================================================
// Example 10: Validation on Multiple DG Cooperads
// ============================================================================

console.log('\n=== Example 10: Validation on Multiple DG Cooperads ===');

// Test co-Leibniz law on multiple DG cooperads
const dgCooperads = [
  { name: 'Leaf', cooperad: dgCooperad },
  { name: 'Binary', cooperad: binaryDgCooperad },
  { name: 'Label', cooperad: labelDgCooperad },
  { name: 'Complex', cooperad: complexDgCooperad },
  { name: 'Strict', cooperad: strictDgCooperad }
];

const simpleTestTrees = [t('test', [leaf('x')])];

console.log('Co-Leibniz validation results:');
for (const { name, cooperad } of dgCooperads) {
  const validation = validateCoLeibnizLaw(cooperad, simpleTestTrees);
  console.log(`  ${name}: ${validation.passed ? 'PASS' : 'FAIL'}`);
}

console.log('\n=== DG Cooperad Examples Complete ===');
