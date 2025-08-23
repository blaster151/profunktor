/**
 * Tests for Flat Species and Catalan Trees
 * 
 * Based on "Polynomial functors and polynomial monads" by Nicola Gambino and Joachim Kock
 * Page 12 - Section 1.21-1.22: Flat Species, Binary Trees, and Normal Functors
 * 
 * This tests the revolutionary connections between:
 * - Flat species with FREE group actions
 * - Catalan numbers and binary trees
 * - The direct bridge to polynomial functors
 * - Normal functors and lambda calculus
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  // Flat species
  FlatSpecies,
  createFlatSpecies,
  
  // Catalan numbers
  catalanNumber,
  catalanSequence,
  
  // Binary trees
  BinaryTree,
  leaf,
  node,
  generateBinaryTrees,
  createBinaryTreeSpecies,
  
  // Polynomial diagrams
  BinaryTreePolynomialDiagram,
  createBinaryTreePolynomialDiagram,
  BinaryTreeWithMarkedNode,
  
  // Normal functors
  NormalFunctor,
  createNormalFunctor,
  createIdentityNormalFunctor,
  createConstantNormalFunctor,
  createBinaryTreeNormalFunctor,
  
  // Slice categories
  FunctorElement,
  SliceCategory,
  sliceHasInitialObject,
  isPolynomialFunctor,
  
  // Verification
  verifyFlatSpecies,
  verifyCatalanNumbers,
  verifyBinaryTreeGeneration,
  
  // Example functions
  exampleBinaryTreeSpecies,
  exampleCatalanNumbers,
  exampleBinaryTreeGeneration,
  examplePolynomialDiagram,
  exampleNormalFunctors,
  examplePolynomialTesting
} from '../fp-flat-species-catalan';

import { createFiniteSet } from '../fp-species-analytic';

describe('Flat Species and Catalan Trees', () => {
  describe('Flat Species (Free Group Actions)', () => {
    it('should create flat species with free group actions', () => {
      const catalanCoeffs = [1, 1, 2, 5, 14];
      const flatSpecies = createFlatSpecies(
        'TestFlat',
        catalanCoeffs,
        (set) => Array(set.size < catalanCoeffs.length ? catalanCoeffs[set.size] : 0).fill('element')
      );
      
      expect(flatSpecies.kind).toBe('FlatSpecies');
      expect(flatSpecies.isFree).toBe(true);
      expect(flatSpecies.strictPullbackPreservation).toBe(true);
      expect(flatSpecies.coefficients).toEqual(catalanCoeffs);
    });
    
    it('should compute ordinary generating function', () => {
      const coeffs = [1, 2, 3, 4]; // 1 + 2x + 3x² + 4x³
      const flatSpecies = createFlatSpecies('TestOGF', coeffs, () => []);
      
      const ogf = flatSpecies.ordinaryGeneratingFunction;
      expect(ogf(0)).toBe(1); // Constant term
      expect(ogf(1)).toBe(10); // 1 + 2 + 3 + 4
      expect(ogf(2)).toBe(49); // 1 + 4 + 12 + 32
    });
    
    it('should have free transport (no fixed structure)', () => {
      const flatSpecies = createFlatSpecies('TestTransport', [1, 1, 2], (set) => 
        Array(set.size).fill(0).map((_, i) => `elem${i}`)
      );
      
      const set = createFiniteSet(2);
      const bijection = { 
        kind: 'Bijection' as const,
        domain: set,
        codomain: set,
        permutation: [2, 1],
        inverse: [2, 1]
      };
      
      const transported = flatSpecies.transport(set, bijection);
      expect(Array.isArray(transported)).toBe(true);
      expect(transported.length).toBe(2);
    });
    
    it('should verify flat species properties', () => {
      const binaryTreeSpecies = createBinaryTreeSpecies();
      const verification = verifyFlatSpecies(binaryTreeSpecies);
      
      expect(verification.isValid).toBe(true);
      expect(verification.isFree).toBe(true);
      expect(verification.strictPullbackPreservation).toBe(true);
      expect(verification.examples).toHaveLength(6); // n = 0,1,2,3,4,5
    });
  });
  
  describe('Catalan Numbers', () => {
    it('should compute correct Catalan numbers', () => {
      expect(catalanNumber(0)).toBe(1);
      expect(catalanNumber(1)).toBe(1);
      expect(catalanNumber(2)).toBe(2);
      expect(catalanNumber(3)).toBe(5);
      expect(catalanNumber(4)).toBe(14);
      expect(catalanNumber(5)).toBe(42);
    });
    
    it('should generate Catalan sequence', () => {
      const sequence = catalanSequence(8);
      expect(sequence).toEqual([1, 1, 2, 5, 14, 42, 132, 429]);
    });
    
    it('should verify Catalan number properties', () => {
      const verification = verifyCatalanNumbers(8);
      
      expect(verification.isValid).toBe(true);
      expect(verification.sequence).toEqual([1, 1, 2, 5, 14, 42, 132, 429]);
      expect(verification.examples.every(ex => ex.matches)).toBe(true);
    });
    
    it('should compute generating function', () => {
      const verification = verifyCatalanNumbers(5);
      const gf = verification.generatingFunction;
      
      // C(x) = (1 - √(1-4x)) / (2x)
      expect(gf(0.1)).toBeCloseTo(1.127, 2); // Approximate value for x=0.1
      expect(typeof gf(0.2)).toBe('number');
    });
  });
  
  describe('Binary Trees', () => {
    it('should create binary tree leaf', () => {
      const tree = leaf();
      
      expect(tree.kind).toBe('BinaryTree');
      expect(tree.size).toBe(0);
      expect(tree.isLeaf).toBe(true);
      expect(tree.left).toBeUndefined();
      expect(tree.right).toBeUndefined();
    });
    
    it('should create binary tree node', () => {
      const leftChild = leaf();
      const rightChild = leaf();
      const tree = node(leftChild, rightChild, 'root');
      
      expect(tree.kind).toBe('BinaryTree');
      expect(tree.size).toBe(1);
      expect(tree.isLeaf).toBe(false);
      expect(tree.value).toBe('root');
      expect(tree.left).toBe(leftChild);
      expect(tree.right).toBe(rightChild);
    });
    
    it('should generate correct number of binary trees', () => {
      expect(generateBinaryTrees(0)).toHaveLength(1); // Just leaf
      expect(generateBinaryTrees(1)).toHaveLength(1); // One structure
      expect(generateBinaryTrees(2)).toHaveLength(2); // Two structures
      expect(generateBinaryTrees(3)).toHaveLength(5); // Five structures (Catalan!)
    });
    
    it('should verify binary tree generation matches Catalan', () => {
      const verification = verifyBinaryTreeGeneration(5);
      
      expect(verification.isValid).toBe(true);
      expect(verification.catalanMatch).toBe(true);
      expect(verification.treeCounts).toEqual([1, 1, 2, 5, 14, 42]);
    });
    
    it('should create binary tree species', () => {
      const species = createBinaryTreeSpecies();
      
      expect(species.kind).toBe('FlatSpecies');
      expect(species.name).toBe('BinaryTree');
      expect(species.isFree).toBe(true);
      expect(species.coefficients.slice(0, 6)).toEqual([1, 1, 2, 5, 14, 42]);
    });
    
    it('should evaluate binary tree species correctly', () => {
      const species = createBinaryTreeSpecies();
      
      const result0 = species.evaluate(createFiniteSet(0));
      const result1 = species.evaluate(createFiniteSet(1));
      const result2 = species.evaluate(createFiniteSet(2));
      
      expect(result0).toHaveLength(1); // C_0 = 1
      expect(result1).toHaveLength(1); // C_1 = 1
      expect(result2).toHaveLength(2); // C_2 = 2
    });
  });
  
  describe('Polynomial Diagrams', () => {
    it('should create binary tree polynomial diagram', () => {
      const diagram = createBinaryTreePolynomialDiagram(3);
      
      expect(diagram.kind).toBe('BinaryTreePolynomialDiagram');
      expect(diagram.I).toBe('1');
      expect(diagram.J).toBe('1');
      expect(Array.isArray(diagram.A)).toBe(true);
      expect(Array.isArray(diagram.B)).toBe(true);
    });
    
    it('should have correct morphisms in diagram', () => {
      const diagram = createBinaryTreePolynomialDiagram(2);
      
      // Test s: B → I
      if (diagram.B.length > 0) {
        const result = diagram.s(diagram.B[0]);
        expect(result).toBe('1');
      }
      
      // Test f: B → A  
      if (diagram.B.length > 0) {
        const result = diagram.f(diagram.B[0]);
        expect(result.kind).toBe('BinaryTree');
      }
      
      // Test t: A → J
      if (diagram.A.length > 0) {
        const result = diagram.t(diagram.A[0]);
        expect(result).toBe('1');
      }
    });
    
    it('should include trees with marked nodes', () => {
      const diagram = createBinaryTreePolynomialDiagram(3);
      
      // Should have trees with marked nodes
      expect(diagram.B.length).toBeGreaterThan(0);
      
      // Each marked tree should have a path and value
      for (const markedTree of diagram.B.slice(0, 3)) {
        expect(markedTree.kind).toBe('BinaryTreeWithMarkedNode');
        expect(markedTree.tree.kind).toBe('BinaryTree');
        expect(Array.isArray(markedTree.markedPath)).toBe(true);
      }
    });
  });
  
  describe('Normal Functors (Girard\'s Work)', () => {
    it('should create normal functor', () => {
      const nf = createNormalFunctor(
        'Test',
        'Set^I',
        'Set^J',
        (x) => x * x,
        'λx.x²'
      );
      
      expect(nf.kind).toBe('NormalFunctor');
      expect(nf.name).toBe('Test');
      expect(nf.preservesPullbacks).toBe(true);
      expect(nf.preservesColimits).toBe(true);
      expect(nf.isAnalytic).toBe(true);
      expect(nf.powerSeriesExpansion(2)).toBe(4);
    });
    
    it('should create identity normal functor', () => {
      const identity = createIdentityNormalFunctor();
      
      expect(identity.name).toBe('Identity');
      expect(identity.source).toBe('Set^I');
      expect(identity.target).toBe('Set^I');
      expect(identity.powerSeriesExpansion(5)).toBe(5);
      expect(identity.lambdaCalculusInterpretation).toBe('λx.x');
    });
    
    it('should create constant normal functor', () => {
      const constant = createConstantNormalFunctor();
      
      expect(constant.name).toBe('Constant');
      expect(constant.powerSeriesExpansion(42)).toBe(1);
      expect(constant.lambdaCalculusInterpretation).toBe('λx.c');
    });
    
    it('should create binary tree normal functor', () => {
      const binaryTree = createBinaryTreeNormalFunctor();
      
      expect(binaryTree.name).toBe('BinaryTree');
      expect(binaryTree.lambdaCalculusInterpretation).toBe('λf.μt.leaf | node(t,t)');
      
      // Should compute Catalan generating function
      const result = binaryTree.powerSeriesExpansion(0.1);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });
  });
  
  describe('Slice Categories and Polynomial Testing', () => {
    it('should create functor elements', () => {
      const element: FunctorElement = {
        kind: 'FunctorElement',
        set: 'X',
        index: 'a',
        structureMap: (fiber) => `map(${fiber})`
      };
      
      expect(element.kind).toBe('FunctorElement');
      expect(element.set).toBe('X');
      expect(element.index).toBe('a');
      expect(element.structureMap('test')).toBe('map(test)');
    });
    
    it('should check if slice has initial object', () => {
      const elements: FunctorElement[] = [
        {
          kind: 'FunctorElement',
          set: 'X1',
          index: 'a1',
          structureMap: (f) => f
        },
        {
          kind: 'FunctorElement',
          set: 'X2', 
          index: 'a2',
          structureMap: (f) => f
        }
      ];
      
      const slice: SliceCategory = {
        kind: 'SliceCategory',
        baseElement: 'x',
        objects: elements,
        hasInitialObject: false
      };
      
      const hasInitial = sliceHasInitialObject(slice);
      expect(typeof hasInitial).toBe('boolean');
    });
    
    it('should test if functor is polynomial', () => {
      const elements: FunctorElement[] = [
        {
          kind: 'FunctorElement',
          set: 'X1',
          index: 'a1',
          structureMap: (f) => f
        },
        {
          kind: 'FunctorElement',
          set: 'X1', // Same base
          index: 'a2',
          structureMap: (f) => f
        }
      ];
      
      const isPolynomial = isPolynomialFunctor(elements);
      expect(typeof isPolynomial).toBe('boolean');
    });
  });
  
  describe('Integration Tests - Example Functions', () => {
    let consoleSpy: any;
    
    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });
    
    afterEach(() => {
      consoleSpy.mockRestore();
    });
    
    it('should run binary tree species example', () => {
      exampleBinaryTreeSpecies();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          binaryTreeSpecies: true,
          isFlat: true,
          isFree: true,
          strictPullbackPreservation: true,
          coefficientsMatch: expect.any(Boolean),
          examples: expect.any(Array),
          catalanNumbers: expect.any(Array)
        })
      );
    });
    
    it('should run Catalan numbers example', () => {
      exampleCatalanNumbers();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          catalanNumbers: true,
          sequenceValid: true,
          sequence: expect.arrayContaining([1, 1, 2, 5, 14]),
          generatingFunction: expect.any(Number),
          examples: expect.any(Array)
        })
      );
    });
    
    it('should run binary tree generation example', () => {
      exampleBinaryTreeGeneration();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          binaryTreeGeneration: true,
          treesValid: true,
          treeCounts: expect.arrayContaining([1, 1, 2, 5, 14]),
          catalanMatch: true,
          examples: expect.any(Array)
        })
      );
    });
    
    it('should run polynomial diagram example', () => {
      examplePolynomialDiagram();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          polynomialDiagram: true,
          treesCount: expect.any(Number),
          markedTreesCount: expect.any(Number),
          diagramStructure: expect.objectContaining({
            I: '1',
            J: '1',
            morphismsValid: true
          })
        })
      );
    });
    
    it('should run normal functors example', () => {
      exampleNormalFunctors();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          normalFunctors: true,
          identity: expect.objectContaining({
            name: 'Identity',
            preservesPullbacks: true,
            lambdaInterpretation: 'λx.x'
          }),
          constant: expect.objectContaining({
            name: 'Constant',
            preservesPullbacks: true,
            lambdaInterpretation: 'λx.c'
          }),
          binaryTree: expect.objectContaining({
            name: 'BinaryTree',
            preservesPullbacks: true,
            lambdaInterpretation: 'λf.μt.leaf | node(t,t)'
          })
        })
      );
    });
    
    it('should run polynomial testing example', () => {
      examplePolynomialTesting();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          polynomialTesting: true,
          isPolynomial: expect.any(Boolean),
          elementsCount: expect.any(Number),
          slicesAnalyzed: true
        })
      );
    });
  });
  
  describe('Mathematical Properties', () => {
    it('should verify flat species preserve strict pullbacks', () => {
      const flatSpecies = createFlatSpecies('TestStrict', [1, 2, 3], () => []);
      
      expect(flatSpecies.strictPullbackPreservation).toBe(true);
      expect(flatSpecies.isFree).toBe(true);
      
      // This is the key distinction from regular species
      // Flat species preserve STRICT pullbacks, not just weak ones
    });
    
    it('should verify Catalan recurrence relation', () => {
      // C_n = Σ_{k=0}^{n-1} C_k * C_{n-1-k}
      for (let n = 2; n <= 6; n++) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
          sum += catalanNumber(k) * catalanNumber(n - 1 - k);
        }
        expect(sum).toBe(catalanNumber(n));
      }
    });
    
    it('should verify binary trees match Catalan exactly', () => {
      for (let n = 0; n <= 6; n++) {
        const trees = generateBinaryTrees(n);
        const catalan = catalanNumber(n);
        expect(trees.length).toBe(catalan);
      }
    });
    
    it('should verify polynomial diagram structure', () => {
      const diagram = createBinaryTreePolynomialDiagram(3);
      
      // 1 ← B → A → 1 structure
      expect(diagram.I).toBe('1');
      expect(diagram.J).toBe('1');
      
      // B should be trees with marked nodes
      for (const marked of diagram.B) {
        expect(marked.kind).toBe('BinaryTreeWithMarkedNode');
        expect(marked.tree.kind).toBe('BinaryTree');
      }
      
      // A should be all trees
      for (const tree of diagram.A) {
        expect(tree.kind).toBe('BinaryTree');
      }
    });
    
    it('should verify normal functor properties', () => {
      const nf = createBinaryTreeNormalFunctor();
      
      // Normal functors preserve pullbacks and colimits
      expect(nf.preservesPullbacks).toBe(true);
      expect(nf.preservesColimits).toBe(true);
      expect(nf.isAnalytic).toBe(true);
      
      // Connected to lambda calculus
      expect(nf.lambdaCalculusInterpretation).toContain('λ');
      expect(nf.lambdaCalculusInterpretation).toContain('μ');
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
    it('should handle empty Catalan sequence', () => {
      const sequence = catalanSequence(0);
      expect(sequence).toEqual([]);
    });
    
    it('should handle negative Catalan numbers', () => {
      expect(catalanNumber(-1)).toBe(1); // Fallback to base case
    });
    
    it('should handle empty tree generation', () => {
      const trees = generateBinaryTrees(0);
      expect(trees).toHaveLength(1);
      expect(trees[0].isLeaf).toBe(true);
    });
    
    it('should handle flat species with empty coefficients', () => {
      const flatSpecies = createFlatSpecies('Empty', [], () => []);
      
      expect(flatSpecies.coefficients).toEqual([]);
      expect(flatSpecies.ordinaryGeneratingFunction(1)).toBe(0);
    });
    
    it('should handle polynomial testing with no elements', () => {
      const isPolynomial = isPolynomialFunctor([]);
      expect(isPolynomial).toBe(true); // Vacuously true
    });
  });
});
