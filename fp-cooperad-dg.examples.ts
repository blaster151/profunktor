// fp-cooperad-dg.examples.ts
// Examples demonstrating DG extensions for cooperad infrastructure

import { t, leaf } from './fp-cooperad-trees';
import { 
  GradedTree, gradedTree, edgeDegree, dgDelta, gradedTreeDgModule,
  deltaWGraded, checkHomotopyLaws, cooperadToDgDelta, cooperadAsDg,
  GradedSymmetryMode
} from './fp-cooperad-dg';
import { sum, zero, scale, plus, koszul } from './fp-dg-core';

// ============================================================================
// Example 1: Basic Graded Trees
// ============================================================================

console.log('=== Example 1: Basic Graded Trees ===');

// Create a simple tree
const simpleTree = t('f', [t('g', [leaf('x'), leaf('y')]), leaf('z')]);

// Convert to graded tree with edge degree
const gradedSimpleTree = gradedTree(simpleTree, edgeDegree);
console.log('Graded tree:', {
  label: gradedSimpleTree.label,
  degree: gradedSimpleTree.degree,
  kids: gradedSimpleTree.kids.length
});

// ============================================================================
// Example 2: DG Differential Computation
// ============================================================================

console.log('\n=== Example 2: DG Differential Computation ===');

// Create a more complex tree for differential computation
const complexTree = t('h', [
  t('f', [leaf('a'), leaf('b')]),
  t('g', [leaf('c')])
]);

const gradedComplexTree = gradedTree(complexTree, edgeDegree);
const differential = dgDelta(gradedComplexTree);

console.log('Original tree degree:', gradedComplexTree.degree);
console.log('Differential terms:', differential.length);

for (const { coef, term } of differential) {
  console.log(`  ${coef > 0 ? '+' : ''}${coef} * ${term.label} (degree ${term.degree})`);
}

// ============================================================================
// Example 3: DG Module Usage
// ============================================================================

console.log('\n=== Example 3: DG Module Usage ===');

const dgModule = gradedTreeDgModule<string>();

// Test the DG module interface
const testTree = gradedTree(t('test', [leaf('x')]), edgeDegree);
console.log('Test tree degree:', dgModule.degree(testTree));
console.log('Test tree differential:', dgModule.d(testTree).length, 'terms');

// ============================================================================
// Example 4: Graded Symmetry Modes
// ============================================================================

console.log('\n=== Example 4: Graded Symmetry Modes ===');

const symmetryModes: GradedSymmetryMode[] = [
  { kind: 'planar', graded: false },
  { kind: 'planar', graded: true },
  { kind: 'symmetric-agg', graded: true }
];

for (const mode of symmetryModes) {
  const result = deltaWGraded(gradedComplexTree, mode);
  console.log(`${mode.kind} (graded: ${mode.graded}): ${result.length} terms`);
}

// ============================================================================
// Example 5: Homotopy Law Checking
// ============================================================================

console.log('\n=== Example 5: Homotopy Law Checking ===');

// Define a simple operation (identity)
const identityOperation = (tree: GradedTree<string>): typeof zero<string>() => {
  return sum({ coef: 1, term: tree });
};

// Test trees for law checking
const testTrees = [
  gradedTree(t('op1', [leaf('x')]), edgeDegree),
  gradedTree(t('op2', [leaf('y'), leaf('z')]), edgeDegree)
];

const lawResult = checkHomotopyLaws(identityOperation, gradedTreeDgModule(), testTrees);
console.log('Identity operation law check:');
console.log('  Is chain map:', lawResult.isChainMap);
console.log('  Boundary terms:', lawResult.boundary.length);
console.log('  Max degree:', lawResult.degree);
console.log('  Details:', lawResult.details);

// ============================================================================
// Example 6: Integration with Existing Cooperad Code
// ============================================================================

console.log('\n=== Example 6: Integration with Existing Cooperad Code ===');

// Convert existing cooperad delta to DG delta
const existingTree = t('existing', [leaf('a'), leaf('b'), leaf('c')]);
const dgDeltaResult = cooperadToDgDelta(existingTree, edgeDegree);

console.log('Existing tree converted to DG:');
console.log('  Original:', existingTree.label, 'with', existingTree.kids.length, 'children');
console.log('  DG terms:', dgDeltaResult.length);

// Strict cooperad as DG module
const strictDgModule = cooperadAsDg<string>();
console.log('Strict DG module degree:', strictDgModule.degree(existingTree));
console.log('Strict DG module differential:', strictDgModule.d(existingTree).length, 'terms');

// ============================================================================
// Example 7: Koszul Sign Computations
// ============================================================================

console.log('\n=== Example 7: Koszul Sign Computations ===');

// Demonstrate Koszul sign computations
const degrees = [0, 1, 2, 3, 4, 5];
console.log('Koszul signs for various degree combinations:');

for (const deg1 of degrees.slice(0, 3)) {
  for (const deg2 of degrees.slice(0, 3)) {
    const sign = koszul(deg1, deg2);
    console.log(`  koszul(${deg1}, ${deg2}) = ${sign > 0 ? '+' : ''}${sign}`);
  }
}

// ============================================================================
// Example 8: Complex Differential Chain
// ============================================================================

console.log('\n=== Example 8: Complex Differential Chain ===');

// Create a tree with multiple levels
const multiLevelTree = t('root', [
  t('level1', [
    t('level2a', [leaf('x'), leaf('y')]),
    t('level2b', [leaf('z')])
  ]),
  t('level1b', [leaf('w')])
]);

const gradedMultiTree = gradedTree(multiLevelTree, edgeDegree);
const multiDifferential = dgDelta(gradedMultiTree);

console.log('Multi-level tree differential:');
console.log('  Original degree:', gradedMultiTree.degree);
console.log('  Differential terms:', multiDifferential.length);

// Group terms by coefficient
const positiveTerms = multiDifferential.filter(t => t.coef > 0);
const negativeTerms = multiDifferential.filter(t => t.coef < 0);

console.log('  Positive terms:', positiveTerms.length);
console.log('  Negative terms:', negativeTerms.length);

// ============================================================================
// Example 9: Custom Degree Functions
// ============================================================================

console.log('\n=== Example 9: Custom Degree Functions ===');

// Custom degree function: count total nodes
const nodeCountDegree = (tree: any): number => {
  return 1 + tree.kids.reduce((sum: number, kid: any) => sum + nodeCountDegree(kid), 0);
};

const customGradedTree = gradedTree(simpleTree, nodeCountDegree);
const customDifferential = dgDelta(customGradedTree);

console.log('Custom degree function (node count):');
console.log('  Tree degree:', customGradedTree.degree);
console.log('  Differential terms:', customDifferential.length);

// ============================================================================
// Example 10: Homotopy Theory Basics
// ============================================================================

console.log('\n=== Example 10: Homotopy Theory Basics ===');

// Demonstrate that d² = 0 (differential squares to zero)
const testTreeForD2 = gradedTree(t('test', [leaf('x')]), edgeDegree);
const d1 = dgDelta(testTreeForD2);
const d2 = d1.flatMap(({ coef, term }) => 
  dgDelta(term).map(t => ({ coef: coef * t.coef, term: t.term }))
);

console.log('Testing d² = 0:');
console.log('  d² terms:', d2.length);
console.log('  Should be 0 (or cancel out):', d2.length === 0 || 
  d2.reduce((sum, t) => sum + t.coef, 0) === 0);

console.log('\n=== DG Cooperad Integration Complete ===');
