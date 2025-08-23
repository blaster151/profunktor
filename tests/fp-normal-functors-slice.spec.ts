/**
 * Tests for Normal Functors and Slice Categories
 * 
 * Based on "Polynomial functors and polynomial monads" by Nicola Gambino and Joachim Kock
 * Page 14 - Section 1.21-1.22: Girard's Normal Functors and Slice Category Proposition
 * 
 * This tests the revolutionary connections between:
 * - Normal Functors (Girard's work on lambda calculus models)
 * - Normal-form property (like Cantor's normal form for ordinals)
 * - Power series expansion for normal functors
 * - Slice category proposition: P is polynomial iff every slice of el(P) has initial object
 * - Connected components of el(P) in bijection with P(1) = A
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  // Normal Functors (Girard's Work)
  NormalFunctor,
  createNormalFunctor,
  
  // Slice Categories and Proposition 1.22
  PolynomialElement,
  createPolynomialElement,
  CategoryOfElements,
  createCategoryOfElements,
  SliceOfElements,
  createSliceOfElements,
  Proposition122,
  createProposition122,
  
  // Flat Species and Binary Trees
  FlatSpecies,
  createFlatSpecies,
  BinaryTreeSpecies,
  createBinaryTreeSpecies,
  
  // Verification
  verifyNormalFunctor,
  verifyProposition122,
  
  // Example functions
  exampleNormalFunctor,
  exampleProposition122,
  exampleBinaryTreeSpecies,
  exampleCategoryOfElements
} from '../fp-normal-functors-slice';

import { createFiniteSet } from '../fp-species-analytic';

describe('Normal Functors and Slice Categories', () => {
  describe('Normal Functors (Girard\'s Work)', () => {
    it('should create normal functor', () => {
      const functor = createNormalFunctor('Lambda Calculus Model', 'Set^I', 'Set^J');
      
      expect(functor.kind).toBe('NormalFunctor');
      expect(functor.name).toBe('Lambda Calculus Model');
      expect(functor.domain).toBe('Set^I');
      expect(functor.codomain).toBe('Set^J');
    });
    
    it('should preserve required properties', () => {
      const functor = createNormalFunctor('Test', 'Set^I', 'Set^J');
      
      expect(functor.preservesPullbacks).toBe(true);
      expect(functor.preservesCofilteredLimits).toBe(true);
      expect(functor.preservesFilteredColimits).toBe(true);
      expect(functor.isFinitaryPolynomial).toBe(true);
    });
    
    it('should have normal-form property', () => {
      const functor = createNormalFunctor('Test', 'Set^I', 'Set^J');
      
      expect(functor.normalFormProperty.hasNormalForms).toBe(true);
      expect(functor.normalFormProperty.initialObjectsInSlices).toBe(true);
      expect(functor.normalFormProperty.normalFormDescription).toContain('Normal forms are initial objects');
    });
    
    it('should have power series expansion', () => {
      const functor = createNormalFunctor('Test', 'Set^I', 'Set^J');
      
      expect(functor.powerSeriesExpansion.hasExpansion).toBe(true);
      expect(functor.powerSeriesExpansion.expansionFormula).toBe('P(X) ≅ Σ_{n∈ℕ} P[n] ×_{S_n} X^n');
      expect(functor.powerSeriesExpansion.associatedFlatAnalyticFunctor).toBe('X ↦ Σ_{n∈ℕ} P[n] ×_{S_n} X^n');
    });
    
    it('should have direct equivalence', () => {
      const functor = createNormalFunctor('Test', 'Set^I', 'Set^J');
      
      expect(functor.directEquivalence.conditionI).toBe(true);
      expect(functor.directEquivalence.conditionVII).toBe(true);
      expect(functor.directEquivalence.equivalenceIndependent).toBe(true);
    });
    
    it('should have lambda calculus interpretation', () => {
      const functor = createNormalFunctor('Test', 'Set^I', 'Set^J');
      
      expect(functor.lambdaCalculusInterpretation.modelsLambdaCalculus).toBe(true);
      expect(functor.lambdaCalculusInterpretation.normalFormProperty).toContain('Cantor normal form');
      expect(functor.lambdaCalculusInterpretation.powerSeriesConnection).toContain('Power series expansion');
    });
  });
  
  describe('Polynomial Elements', () => {
    it('should create polynomial element', () => {
      const set = createFiniteSet(3);
      const element = 1;
      const section = (b: number) => b % 3;
      
      const polynomialElement = createPolynomialElement(set, element, section);
      
      expect(polynomialElement.kind).toBe('PolynomialElement');
      expect(polynomialElement.set).toBe(set);
      expect(polynomialElement.element).toBe(element);
      expect(typeof polynomialElement.section).toBe('function');
    });
    
    it('should have correct section function', () => {
      const set = createFiniteSet(2);
      const element = 0;
      const section = (b: number) => b % 2;
      
      const polynomialElement = createPolynomialElement(set, element, section);
      
      expect(polynomialElement.section(0)).toBe(0);
      expect(polynomialElement.section(1)).toBe(1);
      expect(polynomialElement.section(2)).toBe(0);
      expect(polynomialElement.section(3)).toBe(1);
    });
  });
  
  describe('Category of Elements', () => {
    it('should create category of elements', () => {
      const polynomial = createFinitePolynomial('Test', createFiniteSet(1), createFiniteSet(2), createFiniteSet(1), createFiniteSet(1), (x) => 1, (x) => 1, (x) => 1);
      const categoryOfElements = createCategoryOfElements(polynomial);
      
      expect(categoryOfElements.kind).toBe('CategoryOfElements');
      expect(categoryOfElements.polynomial).toBe(polynomial);
      expect(Array.isArray(categoryOfElements.elements)).toBe(true);
      expect(Array.isArray(categoryOfElements.connectedComponents)).toBe(true);
      expect(Array.isArray(categoryOfElements.initialObjects)).toBe(true);
    });
    
    it('should have connected components bijection', () => {
      const polynomial = createFinitePolynomial('Test', createFiniteSet(1), createFiniteSet(2), createFiniteSet(1), createFiniteSet(1), (x) => 1, (x) => 1, (x) => 1);
      const categoryOfElements = createCategoryOfElements(polynomial);
      
      expect(categoryOfElements.connectedComponentsBijection.withP1).toBe(true);
      expect(categoryOfElements.connectedComponentsBijection.withA).toBe(true);
      expect(categoryOfElements.connectedComponentsBijection.bijectionDescription).toContain('Connected components of el(P) in bijection with P(1) = A');
    });
  });
  
  describe('Slice of Elements', () => {
    it('should create slice of elements', () => {
      const polynomial = createFinitePolynomial('Test', createFiniteSet(1), createFiniteSet(2), createFiniteSet(1), createFiniteSet(1), (x) => 1, (x) => 1, (x) => 1);
      const categoryOfElements = createCategoryOfElements(polynomial);
      const slice = createSliceOfElements(categoryOfElements);
      
      expect(slice.kind).toBe('SliceOfElements');
      expect(slice.categoryOfElements).toBe(categoryOfElements);
      expect(slice.hasInitialObject).toBe(true);
    });
  });
  
  describe('Proposition 1.22', () => {
    it('should create Proposition 1.22', () => {
      const proposition = createProposition122();
      
      expect(proposition.kind).toBe('Proposition122');
      expect(proposition.statement).toBe('A functor P: Set → Set is polynomial if and only if every slice of el(P) has an initial object');
    });
    
    it('should have correct proof structure', () => {
      const proposition = createProposition122();
      
      expect(proposition.proof.assumption).toContain('Assume P is polynomial, represented by B → A');
      expect(proposition.proof.elementDefinition).toContain('An element of P is a triple (X, a, s)');
      expect(proposition.proof.connectedComponentsBijection).toContain('Connected components of el(P) in bijection with P(1) = A');
      expect(proposition.proof.conclusion).toContain('Every slice has initial object');
    });
    
    it('should have correct implications', () => {
      const proposition = createProposition122();
      
      expect(proposition.implications.polynomialImpliesInitialObjects).toBe(true);
      expect(proposition.implications.initialObjectsImpliesPolynomial).toBe(true);
    });
  });
  
  describe('Flat Species', () => {
    it('should create flat species', () => {
      const flatSpecies = createFlatSpecies('Binary Trees');
      
      expect(flatSpecies.kind).toBe('FlatSpecies');
      expect(flatSpecies.name).toBe('Binary Trees');
      expect(flatSpecies.groupActionsFree).toBe(true);
      expect(flatSpecies.encodesRigidStructures).toBe(true);
      expect(flatSpecies.correspondsToGeneratingFunctions).toBe(true);
    });
    
    it('should have analytic functor properties', () => {
      const flatSpecies = createFlatSpecies('Test');
      
      expect(flatSpecies.analyticFunctor.preservesPullbacks).toBe(true);
      expect(flatSpecies.analyticFunctor.isFinitaryPolynomial).toBe(true);
      expect(flatSpecies.analyticFunctor.onSet).toBe(true);
    });
  });
  
  describe('Binary Tree Species', () => {
    it('should create binary tree species', () => {
      const binaryTreeSpecies = createBinaryTreeSpecies();
      
      expect(binaryTreeSpecies.kind).toBe('BinaryTreeSpecies');
      expect(binaryTreeSpecies.name).toBe('Binary Planar Rooted Trees');
    });
    
    it('should have correct organization description', () => {
      const binaryTreeSpecies = createBinaryTreeSpecies();
      
      expect(binaryTreeSpecies.organizationDescription).toContain('Set of ways to organize an n-element set as the set of nodes of a binary planar rooted tree');
    });
    
    it('should have correct cardinality formula', () => {
      const binaryTreeSpecies = createBinaryTreeSpecies();
      
      expect(binaryTreeSpecies.cardinalityFormula).toBe('|C[n]| = n! c_n where c_n are Catalan numbers');
    });
    
    it('should have Catalan numbers', () => {
      const binaryTreeSpecies = createBinaryTreeSpecies();
      
      expect(binaryTreeSpecies.catalanNumbers).toEqual([1, 1, 2, 5, 14, 42, 132, 429, 1430, 4862]);
    });
    
    it('should have correct analytic functor', () => {
      const binaryTreeSpecies = createBinaryTreeSpecies();
      
      expect(binaryTreeSpecies.analyticFunctor).toBe('X ↦ Σ_{n∈ℕ} C[n] ×_{S_n} X^n');
    });
    
    it('should have polynomial representation', () => {
      const binaryTreeSpecies = createBinaryTreeSpecies();
      
      expect(binaryTreeSpecies.polynomialRepresentation.A).toBe('Set of isomorphism classes of binary planar rooted trees');
      expect(binaryTreeSpecies.polynomialRepresentation.B).toBe('Set of isomorphism classes of binary planar rooted trees with marked node');
    });
  });
  
  describe('Verification', () => {
    it('should verify normal functor properties', () => {
      const functor = createNormalFunctor('Test', 'Set^I', 'Set^J');
      const verification = verifyNormalFunctor(functor);
      
      expect(verification.isValid).toBe(true);
      expect(verification.preservesRequiredProperties).toBe(true);
      expect(verification.hasNormalFormProperty).toBe(true);
      expect(verification.hasPowerSeriesExpansion).toBe(true);
      expect(verification.directEquivalenceValid).toBe(true);
      expect(verification.lambdaCalculusInterpretation).toBe(true);
      expect(verification.examples).toHaveLength(1);
    });
    
    it('should verify Proposition 1.22', () => {
      const proposition = createProposition122();
      const verification = verifyProposition122(proposition);
      
      expect(verification.isValid).toBe(true);
      expect(verification.statementCorrect).toBe(true);
      expect(verification.proofValid).toBe(true);
      expect(verification.implicationsValid).toBe(true);
      expect(verification.examples).toHaveLength(1);
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
    
    it('should run normal functor example', () => {
      exampleNormalFunctor();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          normalFunctor: true,
          isValid: true,
          preservesRequiredProperties: true,
          hasNormalFormProperty: true,
          hasPowerSeriesExpansion: true,
          directEquivalenceValid: true,
          lambdaCalculusInterpretation: true,
          normalFormDescription: expect.any(String),
          powerSeriesFormula: expect.any(String),
          examples: expect.any(Array)
        })
      );
    });
    
    it('should run Proposition 1.22 example', () => {
      exampleProposition122();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          proposition122: true,
          isValid: true,
          statementCorrect: true,
          proofValid: true,
          implicationsValid: true,
          statement: expect.any(String),
          proof: expect.objectContaining({
            assumption: expect.any(String),
            elementDefinition: expect.any(String),
            connectedComponentsBijection: expect.any(String),
            conclusion: expect.any(String)
          }),
          examples: expect.any(Array)
        })
      );
    });
    
    it('should run binary tree species example', () => {
      exampleBinaryTreeSpecies();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          binaryTreeSpecies: true,
          flatSpecies: true,
          name: 'Binary Planar Rooted Trees',
          cardinalityFormula: expect.any(String),
          catalanNumbers: expect.any(Array),
          analyticFunctor: expect.any(String),
          polynomialRepresentation: expect.objectContaining({
            A: expect.any(String),
            B: expect.any(String)
          }),
          groupActionsFree: true,
          encodesRigidStructures: true,
          preservesPullbacks: true
        })
      );
    });
    
    it('should run category of elements example', () => {
      exampleCategoryOfElements();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          categoryOfElements: true,
          slice: true,
          hasInitialObject: true,
          connectedComponentsBijection: expect.any(String),
          polynomialKind: 'FinitePolynomial',
          examples: expect.any(Array)
        })
      );
    });
  });
  
  describe('Mathematical Properties', () => {
    it('should verify normal functor mathematical properties', () => {
      const functor = createNormalFunctor('Test', 'Set^I', 'Set^J');
      
      // Normal functors preserve all required limits and colimits
      expect(functor.preservesPullbacks).toBe(true);
      expect(functor.preservesCofilteredLimits).toBe(true);
      expect(functor.preservesFilteredColimits).toBe(true);
      
      // They are finitary polynomial functors
      expect(functor.isFinitaryPolynomial).toBe(true);
      
      // They have normal forms as initial objects
      expect(functor.normalFormProperty.hasNormalForms).toBe(true);
      expect(functor.normalFormProperty.initialObjectsInSlices).toBe(true);
    });
    
    it('should verify Proposition 1.22 mathematical properties', () => {
      const proposition = createProposition122();
      
      // The proposition establishes an equivalence
      expect(proposition.implications.polynomialImpliesInitialObjects).toBe(true);
      expect(proposition.implications.initialObjectsImpliesPolynomial).toBe(true);
      
      // The proof uses the category of elements
      expect(proposition.proof.elementDefinition).toContain('triple (X, a, s)');
      expect(proposition.proof.connectedComponentsBijection).toContain('P(1) = A');
    });
    
    it('should verify binary tree species mathematical properties', () => {
      const binaryTreeSpecies = createBinaryTreeSpecies();
      
      // Catalan numbers are correct
      expect(binaryTreeSpecies.catalanNumbers[0]).toBe(1);
      expect(binaryTreeSpecies.catalanNumbers[1]).toBe(1);
      expect(binaryTreeSpecies.catalanNumbers[2]).toBe(2);
      expect(binaryTreeSpecies.catalanNumbers[3]).toBe(5);
      expect(binaryTreeSpecies.catalanNumbers[4]).toBe(14);
      
      // The analytic functor formula is correct
      expect(binaryTreeSpecies.analyticFunctor).toBe('X ↦ Σ_{n∈ℕ} C[n] ×_{S_n} X^n');
      
      // The polynomial representation is correct
      expect(binaryTreeSpecies.polynomialRepresentation.A).toContain('isomorphism classes');
      expect(binaryTreeSpecies.polynomialRepresentation.B).toContain('marked node');
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
    it('should handle empty polynomial elements', () => {
      const set = createFiniteSet(0);
      const element = 0;
      const section = (b: number) => 0;
      
      const polynomialElement = createPolynomialElement(set, element, section);
      
      expect(polynomialElement.kind).toBe('PolynomialElement');
      expect(polynomialElement.set.size).toBe(0);
      expect(polynomialElement.section(0)).toBe(0);
    });
    
    it('should handle single element sets', () => {
      const set = createFiniteSet(1);
      const element = 0;
      const section = (b: number) => 0;
      
      const polynomialElement = createPolynomialElement(set, element, section);
      
      expect(polynomialElement.kind).toBe('PolynomialElement');
      expect(polynomialElement.set.size).toBe(1);
      expect(polynomialElement.section(0)).toBe(0);
      expect(polynomialElement.section(1)).toBe(0);
    });
    
    it('should handle large finite sets', () => {
      const set = createFiniteSet(100);
      const element = 50;
      const section = (b: number) => b % 100;
      
      const polynomialElement = createPolynomialElement(set, element, section);
      
      expect(polynomialElement.kind).toBe('PolynomialElement');
      expect(polynomialElement.set.size).toBe(100);
      expect(polynomialElement.section(0)).toBe(0);
      expect(polynomialElement.section(100)).toBe(0);
      expect(polynomialElement.section(101)).toBe(1);
    });
  });
});

// Helper function for creating finite polynomials (reused from other files)
function createFinitePolynomial(
  name: string,
  I: any,
  B: any,
  A: any,
  J: any,
  s: (x: number) => number,
  f: (x: number) => number,
  t: (x: number) => number
) {
  return {
    kind: 'FinitePolynomial',
    name,
    I,
    B,
    A,
    J,
    s,
    f,
    t,
    isFinite: true
  };
}
