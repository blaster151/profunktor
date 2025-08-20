# Homotopy System Examples

## Table of Contents

1. [Basic Usage Examples](#basic-usage-examples)
2. [DG Core Examples](#dg-core-examples)
3. [DG Cooperad Examples](#dg-cooperad-examples)
4. [Deformation Complex Examples](#deformation-complex-examples)
5. [Mod-Boundary Law Checking Examples](#mod-boundary-law-checking-examples)
6. [Integration Examples](#integration-examples)
7. [Advanced Examples](#advanced-examples)

## Basic Usage Examples

### Example 1: Adding Homotopy Power to Existing Cooperad

```typescript
import { makeDgCooperad } from './fp-dg-cooperad.js';
import { Tree, admissibleCuts } from './fp-cooperad-trees.js';

// Your existing cooperad (unchanged)
const existingCooperad = {
  delta: (t: Tree<string>) => admissibleCuts(t),
  key: (t: Tree<string>) => t.label,
  degree: (t: Tree<string>) => t.kids.length
};

// Define local differential rules
const dLocal = (t: Tree<string>) => {
  if (t.kids.length === 0) {
    // Apply differential to leaves
    return [{ coef: 1, term: { ...t, label: `d(${t.label})` } }];
  }
  return [];
};

// Wrap with single function call
const dgCooperad = makeDgCooperad(existingCooperad, dLocal);

// Now you have DG structure!
console.log(dgCooperad.degree({ label: 'x', kids: [] })); // 0
console.log(dgCooperad.d({ label: 'x', kids: [] })); // [{ coef: 1, term: { label: 'd(x)', kids: [] } }]
```

### Example 2: Creating a Deformation Complex

```typescript
import { deformationComplex } from './fp-deformation-dgla-enhanced.js';

// Create algebra for the deformation complex
const algebra = {
  mul: (x: string, y: string) => `(${x}) * (${y})`,
  unit: () => '1',
  add: (x: string, y: string) => `(${x}) + (${y})`,
  sub: (x: string, y: string) => `(${x}) - (${y})`,
  scale: (k: number, x: string) => `${k} * (${x})`,
  zero: () => '0',
  degree: () => 0,
  dP: () => [],
  equals: (x: string, y: string) => x === y
};

// Create deformation complex
const complex = deformationComplex(dgCooperad, algebra);

// Create a homomorphism
const alpha = {
  degree: 1,
  run: (c: Tree<string>) => c.label
};

// Check Maurer-Cartan equation
const mcResult = complex.isMaurerCartan(alpha, []);
console.log(mcResult.isMC); // true/false
```

## DG Core Examples

### Example 3: Working with Degrees and Koszul Signs

```typescript
import { parity, koszul, signPow, Degree } from './fp-dg-core.js';

// Compute parity of degrees
console.log(parity(0)); // 0 (even)
console.log(parity(1)); // 1 (odd)
console.log(parity(2)); // 0 (even)
console.log(parity(-1)); // 1 (odd)

// Compute Koszul signs for permuting graded objects
console.log(koszul(0, 0)); // +1 (even + even = even)
console.log(koszul(1, 1)); // +1 (odd + odd = even)
console.log(koszul(0, 1)); // -1 (even + odd = odd)
console.log(koszul(1, 0)); // -1 (odd + even = odd)

// Compute sign powers
console.log(signPow(1, 0)); // +1
console.log(signPow(1, 1)); // +1
console.log(signPow(-1, 0)); // +1
console.log(signPow(-1, 1)); // -1
console.log(signPow(-1, 2)); // +1
```

### Example 4: Working with Formal Sums

```typescript
import { sum, zero, scale, plus, normalizeByKey } from './fp-dg-core.js';

// Create formal sums
const s1 = sum(
  { coef: 2, term: 'x' },
  { coef: -1, term: 'y' }
);

const s2 = sum(
  { coef: 1, term: 'y' },
  { coef: 3, term: 'z' }
);

// Scale a sum
const scaled = scale(2, s1);
console.log(scaled); // [{ coef: 4, term: 'x' }, { coef: -2, term: 'y' }]

// Add sums
const added = plus(s1, s2);
console.log(added); // [{ coef: 2, term: 'x' }, { coef: -1, term: 'y' }, { coef: 1, term: 'y' }, { coef: 3, term: 'z' }]

// Normalize by key (merge like terms)
const normalized = normalizeByKey(added, (term) => term);
console.log(normalized); // [{ coef: 2, term: 'x' }, { coef: 0, term: 'y' }, { coef: 3, term: 'z' }]
```

### Example 5: Creating DG Modules

```typescript
import { strictAsDG, signByDeg } from './fp-dg-core.js';

// Create a DG module with zero differential
const dgModule = strictAsDG((term: string) => term.length);

console.log(dgModule.degree('abc')); // 3
console.log(dgModule.d('abc')); // [] (zero differential)

// Apply sign by degree
const s = sum({ coef: 1, term: 'x' }, { coef: 2, term: 'y' });
const signed = signByDeg(1, s);
console.log(signed); // [{ coef: -1, term: 'x' }, { coef: -2, term: 'y' }]
```

## DG Cooperad Examples

### Example 6: Building Coderivations

```typescript
import { coderivationFromLocal } from './fp-dg-cooperad.js';

// Define a local differential rule
const dLocal = (t: Tree<string>) => {
  if (t.kids.length === 0) {
    // Apply differential to leaves
    return [{ coef: 1, term: { ...t, label: `d(${t.label})` } }];
  } else if (t.kids.length === 1) {
    // Apply differential to unary nodes
    return [{ coef: 1, term: { ...t, label: `d(${t.label})` } }];
  }
  return [];
};

// Build the full coderivation
const d = coderivationFromLocal(cooperad, dLocal);

// Test on a tree
const tree = { label: 'f', kids: [{ label: 'x', kids: [] }] };
const result = d(tree);
console.log(result); // Contains terms with proper Koszul signs
```

### Example 7: Creating Different Types of DG Cooperads

```typescript
// Example 1: Trivial differential
const trivialDgCooperad = makeDgCooperad(
  existingCooperad,
  (t: Tree<string>) => [] // Zero differential
);

// Example 2: Leaf-only differential
const leafDgCooperad = makeDgCooperad(
  existingCooperad,
  (t: Tree<string>) => {
    if (t.kids.length === 0) {
      return [{ coef: 1, term: { ...t, label: `d(${t.label})` } }];
    }
    return [];
  }
);

// Example 3: Full differential
const fullDgCooperad = makeDgCooperad(
  existingCooperad,
  (t: Tree<string>) => {
    // Apply differential to all nodes
    return [{ coef: 1, term: { ...t, label: `d(${t.label})` } }];
  }
);
```

## Deformation Complex Examples

### Example 8: Convolution Product

```typescript
import { convProduct } from './fp-deformation-dgla-enhanced.js';

// Create two homomorphisms
const f = {
  degree: 0,
  run: (c: Tree<string>) => c.label
};

const g = {
  degree: 1,
  run: (c: Tree<string>) => `g(${c.label})`
};

// Compute convolution product
const fg = convProduct(dgCooperad, algebra, f, g);

// Test on a tree
const tree = { label: 'f', kids: [{ label: 'x', kids: [] }] };
const result = fg.run(tree);
console.log(result); // Convolution product with proper Koszul signs
```

### Example 9: Differential on Homomorphisms

```typescript
import { dHom } from './fp-deformation-dgla-enhanced.js';

// Create a homomorphism
const alpha = {
  degree: 0,
  run: (c: Tree<string>) => c.label
};

// Compute its differential
const dAlpha = dHom(dgCooperad, algebra, alpha);

// Test on a tree
const tree = { label: 'f', kids: [{ label: 'x', kids: [] }] };
const result = dAlpha.run(tree);
console.log(result); // d(α)(tree) = dP(α(tree)) - α(dC(tree))
```

### Example 10: Lie Bracket

```typescript
import { bracket } from './fp-deformation-dgla-enhanced.js';

// Create two homomorphisms
const f = {
  degree: 0,
  run: (c: Tree<string>) => c.label
};

const g = {
  degree: 1,
  run: (c: Tree<string>) => `g(${c.label})`
};

// Compute Lie bracket
const bracket_fg = bracket(dgCooperad, algebra, f, g);

// Test on a tree
const tree = { label: 'f', kids: [{ label: 'x', kids: [] }] };
const result = bracket_fg.run(tree);
console.log(result); // [f,g](tree) = f⋆g(tree) - (-1)^{|f||g|} g⋆f(tree)
```

### Example 11: Maurer-Cartan Equation

```typescript
import { isMaurerCartan } from './fp-deformation-dgla-enhanced.js';

// Create a homomorphism to test
const alpha = {
  degree: 1,
  run: (c: Tree<string>) => {
    if (c.kids.length === 0) {
      return `ε * ${c.label}`;
    }
    return '0';
  }
};

// Test trees
const testTrees = [
  { label: 'x', kids: [] },
  { label: 'f', kids: [{ label: 'x', kids: [] }] }
];

// Check Maurer-Cartan equation
const mcResult = isMaurerCartan(dgCooperad, algebra, alpha, testTrees);
console.log(mcResult.isMC); // true/false
console.log(mcResult.details); // Details about which tests passed/failed
```

## Mod-Boundary Law Checking Examples

### Example 12: Basic Law Checking

```typescript
import { homotopyLawRunner } from './fp-homotopy-ergonomics.js';

// Create DG context
const context = {
  dgModule: {
    degree: (x: string) => x.length,
    d: (x: string) => [{ coef: 1, term: `d(${x})` }]
  },
  isExact: (term: string) => term.startsWith('d(')
};

// Create law runner
const lawRunner = homotopyLawRunner<string>();

// Test strict equality
const strictResult = lawRunner.assertStrict('same', 'same', context);
console.log(strictResult.passed); // true

// Test mod-boundary equality
const modBoundaryResult = lawRunner.assertModBoundary('term', 'term + d(boundary)', context);
console.log(modBoundaryResult.passed); // true
console.log(modBoundaryResult.strict); // false
console.log(modBoundaryResult.details); // "Equality holds modulo boundary"
```

### Example 13: Batch Law Checking

```typescript
// Define multiple laws
const laws = [
  { name: 'Associativity', lhs: 'left_assoc', rhs: 'right_assoc' },
  { name: 'Coassociativity', lhs: 'left_coassoc', rhs: 'right_coassoc' },
  { name: 'Counit', lhs: 'counit_left', rhs: 'counit_right' }
];

// Test all laws at once
const batchResults = lawRunner.assertBatch(laws, context);

// Process results
batchResults.forEach(({ name, result }) => {
  console.log(`${name}: ${result.passed ? 'PASS' : 'FAIL'} (${result.strict ? 'strict' : 'mod-boundary'})`);
  if (!result.passed) {
    console.log(`  Details: ${result.details}`);
  }
});
```

### Example 14: Sophisticated Law Checking

```typescript
// Create a more sophisticated DG context
const sophisticatedContext = {
  dgModule: {
    degree: (x: string) => x.length % 2,
    d: (x: string) => {
      if (x.length % 2 === 1) {
        return [{ coef: 1, term: `d(${x})` }];
      }
      return [];
    }
  },
  isExact: (term: string) => term.startsWith('d(') || term === '0'
};

// Test various scenarios
const scenarios = [
  { name: 'Exact Equality', lhs: 'term', rhs: 'term' },
  { name: 'Mod Boundary', lhs: 'term', rhs: 'term + d(boundary)' },
  { name: 'Not Exact', lhs: 'term1', rhs: 'term2' },
  { name: 'Zero Difference', lhs: 'term', rhs: 'term + 0' }
];

scenarios.forEach(scenario => {
  const result = lawRunner.assert(scenario.lhs, scenario.rhs, sophisticatedContext);
  console.log(`${scenario.name}: ${result.passed ? 'PASS' : 'FAIL'} - ${result.details}`);
});
```

## Integration Examples

### Example 15: Integration with Existing Tree Cooperads

```typescript
import { createTreeDeformationComplex } from './fp-deformation-integration.js';
import { t, leaf } from './fp-cooperad-trees.js';

// Create deformation complex for existing tree cooperad
const complex = createTreeDeformationComplex<string>();

// Your existing code continues to work
const tree = t('f', [t('g', [leaf('x'), leaf('y')]), leaf('z')]);
console.log(tree.label); // 'f'

// New homotopy features are available
const homomorphism = labelHomomorphism<string>();
const result = homomorphism.run(tree);
console.log(result); // 'f'
```

### Example 16: Using Pre-built Homomorphisms

```typescript
import { 
  labelHomomorphism, 
  arityHomomorphism, 
  polynomialHomomorphism 
} from './fp-deformation-integration.js';

// Create different types of homomorphisms
const labelHom = labelHomomorphism<string>();
const arityHom = arityHomomorphism<string>();
const polyHom = polynomialHomomorphism<string>();

// Test on a tree
const tree = t('f', [t('g', [leaf('x'), leaf('y')]), leaf('z')]);

console.log(labelHom.run(tree)); // 'f'
console.log(arityHom.run(tree)); // '2'
console.log(polyHom.run(tree)); // 'f(g(x, y), z)'
```

### Example 17: Creating Custom Homomorphisms

```typescript
// Create a custom homomorphism
const customHom = {
  degree: 1,
  run: (t: Tree<string>) => {
    if (t.kids.length === 0) {
      return `ε * ${t.label}`;
    } else if (t.kids.length === 1) {
      return `ε * ${t.label}(${t.kids[0].label})`;
    } else {
      return `ε * ${t.label}(${t.kids.map(k => k.label).join(', ')})`;
    }
  }
};

// Test on various trees
const trees = [
  leaf('x'),
  t('f', [leaf('x')]),
  t('g', [leaf('a'), leaf('b')])
];

trees.forEach(tree => {
  console.log(customHom.run(tree));
});
```

## Advanced Examples

### Example 18: Deformation Theory Workflow

```typescript
// Complete deformation theory workflow
const workflow = () => {
  // 1. Start with existing cooperad
  const existingCooperad = { /* your existing implementation */ };
  
  // 2. Add homotopy power
  const dgCooperad = makeDgCooperad(existingCooperad, dLocal);
  
  // 3. Create deformation complex
  const complex = deformationComplex(dgCooperad, algebra);
  
  // 4. Define deformation homomorphism
  const base = labelHomomorphism<string>();
  const perturbation = {
    degree: 1,
    run: (t: Tree<string>) => `ε * ${t.label}`
  };
  
  // 5. Check Maurer-Cartan equation
  const mcResult = complex.isMaurerCartan(perturbation, testTrees);
  
  // 6. Use mod-boundary law checking
  const lawRunner = homotopyLawRunner<string>();
  const lawResult = lawRunner.assertModBoundary(lhs, rhs, context);
  
  return { mcResult, lawResult };
};
```

### Example 19: Chain Map Validation

```typescript
import { isChainMap } from './fp-deformation-dgla-enhanced.js';

// Create a chain map
const chainMap = {
  degree: 0,
  run: (c: Tree<string>) => `f(${c.label})`
};

// Validate chain map property
const cmResult = isChainMap(dgCooperad, algebra, chainMap, testTrees);
console.log(cmResult.isChainMap); // true/false
console.log(cmResult.details); // Details about validation
```

### Example 20: Performance Comparison

```typescript
// Compare performance of strict vs DG cooperads
const performanceTest = () => {
  const testTree = t('f', [t('g', [leaf('x'), leaf('y')]), leaf('z')]);
  
  // Test strict cooperad
  const startStrict = Date.now();
  for (let i = 0; i < 1000; i++) {
    existingCooperad.delta(testTree);
  }
  const strictTime = Date.now() - startStrict;
  
  // Test DG cooperad
  const startDG = Date.now();
  for (let i = 0; i < 1000; i++) {
    dgCooperad.delta(testTree);
  }
  const dgTime = Date.now() - startDG;
  
  console.log(`Strict cooperad: ${strictTime}ms`);
  console.log(`DG cooperad: ${dgTime}ms`);
  console.log(`Performance impact: ${((dgTime - strictTime) / strictTime * 100).toFixed(2)}%`);
};
```

## Summary

These examples demonstrate the complete range of functionality provided by the homotopy system:

1. **Basic Usage**: Adding homotopy power to existing cooperads
2. **DG Core**: Working with degrees, Koszul signs, and formal sums
3. **DG Cooperad**: Building coderivations and DG cooperads
4. **Deformation Complex**: Convolution products, differentials, and Maurer-Cartan equations
5. **Mod-Boundary Law Checking**: Homotopy-aware law validation
6. **Integration**: Seamless integration with existing code
7. **Advanced Features**: Complete deformation theory workflows

The system maintains complete backward compatibility while providing powerful homotopy-theoretic capabilities when needed.
