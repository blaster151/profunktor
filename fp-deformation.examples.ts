// fp-deformation.examples.ts
// Examples demonstrating deformation complex functionality

import { t, leaf } from './fp-cooperad-trees.js';
import { 
  createTreeDeformationComplex,
  createGradedTreeDeformationComplex,
  testMaurerCartan,
  testChainMaps,
  labelHomomorphism,
  arityHomomorphism,
  polynomialHomomorphism,
  deformationHomomorphism,
  createSimpleTestTree,
  createBinaryTestTree
} from './fp-deformation-integration.js';
import { 
  constantHom,
  zeroHom,
  addHom,
  scaleHom,
  composeHom
} from './fp-deformation-dgla-enhanced.js';

// ============================================================================
// Example 1: Basic Deformation Complex Creation
// ============================================================================

console.log('=== Example 1: Basic Deformation Complex Creation ===');

// Create deformation complex for tree cooperads
const treeDeformationComplex = createTreeDeformationComplex<string>();

// Create some test trees
const simpleTree = t('f', [t('g', [leaf('x'), leaf('y')]), leaf('z')]);
const binaryTree = t('h', [t('f', [leaf('a'), leaf('b')]), t('g', [leaf('c'), leaf('d')])]);

console.log('Tree deformation complex created');
console.log('Test trees:', {
  simple: simpleTree.label,
  binary: binaryTree.label
});

// ============================================================================
// Example 2: Homomorphism Examples
// ============================================================================

console.log('\n=== Example 2: Homomorphism Examples ===');

// Create various homomorphisms
const labelHom = labelHomomorphism<string>();
const arityHom = arityHomomorphism<string>();
const polyHom = polynomialHomomorphism<string>();

// Test homomorphisms on simple tree
console.log('Homomorphism results on simple tree:');
console.log('  Label:', labelHom.run(simpleTree));
console.log('  Arity:', arityHom.run(simpleTree));
console.log('  Polynomial:', polyHom.run(simpleTree));

// Test on binary tree
console.log('Homomorphism results on binary tree:');
console.log('  Label:', labelHom.run(binaryTree));
console.log('  Arity:', arityHom.run(binaryTree));
console.log('  Polynomial:', polyHom.run(binaryTree));

// ============================================================================
// Example 3: Convolution Product
// ============================================================================

console.log('\n=== Example 3: Convolution Product ===');

// Create a deformation complex
const complex = createTreeDeformationComplex<string>();
const P = complex.zero().run(simpleTree); // Get the algebra

// Create two homomorphisms to convolve
const f = labelHomomorphism<string>();
const g = arityHomomorphism<string>();

// Compute convolution product
const fg = complex.compose(f, g);
console.log('Convolution product (f ⋆ g):');
console.log('  f ⋆ g(simpleTree):', fg.run(simpleTree));
console.log('  f ⋆ g(binaryTree):', fg.run(binaryTree));

// ============================================================================
// Example 4: Differential on Homomorphisms
// ============================================================================

console.log('\n=== Example 4: Differential on Homomorphisms ===');

// Compute differential of a homomorphism
const df = complex.d(f);
console.log('Differential of label homomorphism:');
console.log('  d(f)(simpleTree):', df.run(simpleTree));
console.log('  d(f)(binaryTree):', df.run(binaryTree));

// ============================================================================
// Example 5: Lie Bracket
// ============================================================================

console.log('\n=== Example 5: Lie Bracket ===');

// Compute Lie bracket of two homomorphisms
const bracket = complex.bracket(f, g);
console.log('Lie bracket [f, g]:');
console.log('  [f, g](simpleTree):', bracket.run(simpleTree));
console.log('  [f, g](binaryTree):', bracket.run(binaryTree));

// ============================================================================
// Example 6: Maurer-Cartan Testing
// ============================================================================

console.log('\n=== Example 6: Maurer-Cartan Testing ===');

// Create test trees
const testTrees = [
  createSimpleTestTree('x'),
  createBinaryTestTree('f', 'a', 'b'),
  t('g', [leaf('y')])
];

// Test Maurer-Cartan equation on various homomorphisms
const mcResults = testMaurerCartan(testTrees);
console.log('Maurer-Cartan test results:');
for (const result of mcResults.results) {
  console.log(`  ${result.name}: ${result.isMC ? 'PASS' : 'FAIL'}`);
  if (result.details.length > 0) {
    console.log(`    Details: ${result.details.join(', ')}`);
  }
}

// ============================================================================
// Example 7: Chain Map Testing
// ============================================================================

console.log('\n=== Example 7: Chain Map Testing ===');

// Test chain map property
const cmResults = testChainMaps(testTrees);
console.log('Chain map test results:');
for (const result of cmResults.results) {
  console.log(`  ${result.name}: ${result.isChainMap ? 'PASS' : 'FAIL'}`);
  if (result.details.length > 0) {
    console.log(`    Details: ${result.details.join(', ')}`);
  }
}

// ============================================================================
// Example 8: Deformation Homomorphisms
// ============================================================================

console.log('\n=== Example 8: Deformation Homomorphisms ===');

// Create a deformation homomorphism
const base = labelHomomorphism<string>();
const perturbation = arityHomomorphism<string>();
const deformation = deformationHomomorphism(base, perturbation);

console.log('Deformation homomorphism:');
console.log('  Base + ε * Perturbation(simpleTree):', deformation.run(simpleTree));
console.log('  Base + ε * Perturbation(binaryTree):', deformation.run(binaryTree));

// ============================================================================
// Example 9: Homomorphism Operations
// ============================================================================

console.log('\n=== Example 9: Homomorphism Operations ===');

// Create the algebra for operations
const algebra = complex.zero().run(simpleTree); // Get algebra instance

// Add two homomorphisms
const sum = addHom(algebra, f, g);
console.log('Sum of homomorphisms:');
console.log('  f + g(simpleTree):', sum.run(simpleTree));

// Scale a homomorphism
const scaled = scaleHom(algebra, 2, f);
console.log('Scaled homomorphism:');
console.log('  2 * f(simpleTree):', scaled.run(simpleTree));

// Compose homomorphisms
const composed = composeHom(algebra, f, g);
console.log('Composed homomorphisms:');
console.log('  f ∘ g(simpleTree):', composed.run(simpleTree));

// ============================================================================
// Example 10: Constant and Zero Homomorphisms
// ============================================================================

console.log('\n=== Example 10: Constant and Zero Homomorphisms ===');

// Create constant homomorphism
const constHom = constantHom(algebra, 'constant', 0);
console.log('Constant homomorphism:');
console.log('  const(simpleTree):', constHom.run(simpleTree));

// Create zero homomorphism
const zeroHom = complex.zero();
console.log('Zero homomorphism:');
console.log('  zero(simpleTree):', zeroHom.run(simpleTree));

// ============================================================================
// Example 11: Graded Tree Deformation Complex
// ============================================================================

console.log('\n=== Example 11: Graded Tree Deformation Complex ===');

// Create deformation complex for graded trees
const gradedComplex = createGradedTreeDeformationComplex<string>();

console.log('Graded tree deformation complex created');
console.log('Note: This uses the enhanced DG structure with grading');

// ============================================================================
// Example 12: Complex Mathematical Operations
// ============================================================================

console.log('\n=== Example 12: Complex Mathematical Operations ===');

// Create a more complex homomorphism
const complexHom = {
  degree: 1,
  run: (t: any) => {
    if (t.kids.length === 0) {
      return `d(${t.label})`;
    }
    return `d(${t.label})(${t.kids.map((k: any) => k.label).join(', ')})`;
  }
};

// Test differential
const dComplex = complex.d(complexHom);
console.log('Differential of complex homomorphism:');
console.log('  d(complex)(simpleTree):', dComplex.run(simpleTree));

// Test bracket with complex homomorphism
const bracketComplex = complex.bracket(complexHom, f);
console.log('Bracket with complex homomorphism:');
console.log('  [complex, f](simpleTree):', bracketComplex.run(simpleTree));

// ============================================================================
// Example 13: Validation Summary
// ============================================================================

console.log('\n=== Example 13: Validation Summary ===');

console.log('Deformation complex validation:');
console.log('✅ Convolution product implemented');
console.log('✅ Differential on homomorphisms implemented');
console.log('✅ Lie bracket implemented');
console.log('✅ Maurer-Cartan equation checker implemented');
console.log('✅ Chain map property checker implemented');
console.log('✅ Homomorphism operations (add, scale, compose) implemented');
console.log('✅ Integration with existing cooperad infrastructure');

console.log('\n=== Deformation Complex Examples Complete ===');
