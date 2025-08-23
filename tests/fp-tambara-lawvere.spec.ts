/**
 * Tests for Tambara Functors and Lawvere Theory Connection
 * 
 * Based on "Polynomial functors and polynomial monads" by Nicola Gambino and Joachim Kock
 * Page 13 - Section 1.23-1.24: Tambara's Category T and Lawvere Theory for Commutative Semi-rings
 * 
 * This tests the revolutionary connections between:
 * - Tambara's category T (finite polynomials)
 * - Lawvere theories (algebraic structures)
 * - Commutative semi-rings (arithmetic)
 * - Polynomial functors as arithmetic operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  // Finite polynomials
  FinitePolynomial,
  createFinitePolynomial,
  
  // Tambara's category T
  TambaraCategory,
  createTambaraCategory,
  
  // Tambara operations
  RestrictionOperation,
  createRestrictionOperation,
  TraceOperation,
  createTraceOperation,
  NormOperation,
  createNormOperation,
  
  // Lawvere theory
  LawvereTheory,
  CommutativeSemiRing,
  createCommutativeSemiRing,
  LawvereTheoryForCommutativeSemiRings,
  createLawvereTheoryForCommutativeSemiRings,
  
  // Theorem 1.24
  Theorem124,
  createTheorem124,
  
  // Polynomial arithmetic
  PolynomialArithmetic,
  createPolynomialArithmetic,
  
  // Verification
  verifyTambaraCategory,
  verifyLawvereTheory,
  
  // Example functions
  exampleTambaraCategory,
  exampleLawvereTheory,
  exampleTheorem124,
  examplePolynomialArithmetic
} from '../fp-tambara-lawvere';

import { createFiniteSet } from '../fp-species-analytic';

describe('Tambara Functors and Lawvere Theory', () => {
  describe('Finite Polynomials', () => {
    it('should create finite polynomial', () => {
      const I = createFiniteSet(1);
      const B = createFiniteSet(2);
      const A = createFiniteSet(1);
      const J = createFiniteSet(1);
      
      const polynomial = createFinitePolynomial(
        'Test',
        I,
        B,
        A,
        J,
        (x) => 1,
        (x) => 1,
        (x) => 1
      );
      
      expect(polynomial.kind).toBe('FinitePolynomial');
      expect(polynomial.name).toBe('Test');
      expect(polynomial.isFinite).toBe(true);
      expect(polynomial.I).toBe(I);
      expect(polynomial.B).toBe(B);
      expect(polynomial.A).toBe(A);
      expect(polynomial.J).toBe(J);
    });
    
    it('should have correct morphism functions', () => {
      const polynomial = createFinitePolynomial(
        'Test',
        createFiniteSet(1),
        createFiniteSet(2),
        createFiniteSet(1),
        createFiniteSet(1),
        (x) => x % 2,
        (x) => x % 2,
        (x) => x
      );
      
      expect(polynomial.s(0)).toBe(0);
      expect(polynomial.s(1)).toBe(1);
      expect(polynomial.f(0)).toBe(0);
      expect(polynomial.f(1)).toBe(1);
      expect(polynomial.t(0)).toBe(0);
    });
  });
  
  describe('Tambara\'s Category T', () => {
    it('should create Tambara category', () => {
      const category = createTambaraCategory();
      
      expect(category.kind).toBe('TambaraCategory');
      expect(category.name).toBe('T');
      expect(Array.isArray(category.objects)).toBe(true);
      expect(Array.isArray(category.morphisms)).toBe(true);
    });
    
    it('should have correct operations', () => {
      const category = createTambaraCategory();
      
      expect(category.operations.restriction).toBe('Δ');
      expect(category.operations.trace).toBe('Σ');
      expect(category.operations.norm).toBe('Π');
    });
    
    it('should compose finite polynomials', () => {
      const category = createTambaraCategory();
      
      const p1 = createFinitePolynomial(
        'P1',
        createFiniteSet(1),
        createFiniteSet(2),
        createFiniteSet(1),
        createFiniteSet(1),
        (x) => 1,
        (x) => 1,
        (x) => 1
      );
      
      const p2 = createFinitePolynomial(
        'P2',
        createFiniteSet(1),
        createFiniteSet(3),
        createFiniteSet(1),
        createFiniteSet(1),
        (x) => 1,
        (x) => 1,
        (x) => 1
      );
      
      const composition = category.composition(p1, p2);
      
      expect(composition.kind).toBe('FinitePolynomial');
      expect(composition.name).toBe('P1 ∘ P2');
      expect(composition.isFinite).toBe(true);
    });
    
    it('should create identity morphisms', () => {
      const category = createTambaraCategory();
      const set = createFiniteSet(3);
      
      const identity = category.identity(set);
      
      expect(identity.kind).toBe('FinitePolynomial');
      expect(identity.name).toBe('id_3');
      expect(identity.I).toBe(set);
      expect(identity.B).toBe(set);
      expect(identity.A).toBe(set);
      expect(identity.J).toBe(set);
    });
  });
  
  describe('Tambara Operations (Δ, Σ, Π)', () => {
    it('should create restriction operation (Δ)', () => {
      const restriction = createRestrictionOperation();
      
      expect(restriction.kind).toBe('RestrictionOperation');
      expect(restriction.symbol).toBe('Δ');
      expect(restriction.groupCohomologyContext).toBe('Restriction in group cohomology');
    });
    
    it('should perform restriction operation', () => {
      const restriction = createRestrictionOperation();
      const set = createFiniteSet(5);
      const subset = createFiniteSet(3);
      
      const result = restriction.operation(set, subset);
      
      expect(result.kind).toBe('FinitePolynomial');
      expect(result.name).toBe('Δ_5_3');
      expect(result.isFinite).toBe(true);
    });
    
    it('should create trace operation (Σ)', () => {
      const trace = createTraceOperation();
      
      expect(trace.kind).toBe('TraceOperation');
      expect(trace.symbol).toBe('Σ');
      expect(trace.groupCohomologyContext).toBe('Additive transfer (trace)');
    });
    
    it('should perform trace operation', () => {
      const trace = createTraceOperation();
      const set = createFiniteSet(4);
      const partition = [createFiniteSet(2), createFiniteSet(2)];
      
      const result = trace.operation(set, partition);
      
      expect(result.kind).toBe('FinitePolynomial');
      expect(result.name).toBe('Σ_4_4');
      expect(result.isFinite).toBe(true);
    });
    
    it('should create norm operation (Π)', () => {
      const norm = createNormOperation();
      
      expect(norm.kind).toBe('NormOperation');
      expect(norm.symbol).toBe('Π');
      expect(norm.groupCohomologyContext).toBe('Multiplicative transfer (norm)');
    });
    
    it('should perform norm operation', () => {
      const norm = createNormOperation();
      const set = createFiniteSet(3);
      const partition = [createFiniteSet(2), createFiniteSet(3)];
      
      const result = norm.operation(set, partition);
      
      expect(result.kind).toBe('FinitePolynomial');
      expect(result.name).toBe('Π_3_6');
      expect(result.isFinite).toBe(true);
    });
  });
  
  describe('Lawvere Theory for Commutative Semi-rings', () => {
    it('should create commutative semi-ring', () => {
      const semiRing = createCommutativeSemiRing();
      
      expect(semiRing.kind).toBe('CommutativeSemiRing');
      expect(semiRing.additiveIdentity).toBe(0);
      expect(semiRing.multiplicativeIdentity).toBe(1);
      expect(semiRing.isCommutative).toBe(true);
      expect(semiRing.isAssociative).toBe(true);
      expect(semiRing.distributivity).toBe(true);
    });
    
    it('should perform semi-ring operations', () => {
      const semiRing = createCommutativeSemiRing();
      
      expect(semiRing.addition(3, 5)).toBe(8);
      expect(semiRing.multiplication(4, 6)).toBe(24);
    });
    
    it('should create Lawvere theory for commutative semi-rings', () => {
      const theory = createLawvereTheoryForCommutativeSemiRings();
      
      expect(theory.kind).toBe('LawvereTheoryForCommutativeSemiRings');
      expect(theory.name).toBe('Lawvere Theory for Commutative Semi-rings');
      expect(theory.finiteProducts).toBe(true);
      expect(theory.isCommutativeSemiRing).toBe(true);
    });
    
    it('should have polynomial arithmetic operations', () => {
      const theory = createLawvereTheoryForCommutativeSemiRings();
      
      expect(theory.polynomialArithmetic.addition.name).toContain('Addition');
      expect(theory.polynomialArithmetic.multiplication.name).toContain('Multiplication');
      expect(theory.polynomialArithmetic.additiveNeutral.name).toContain('Additive Neutral');
      expect(theory.polynomialArithmetic.multiplicativeNeutral.name).toContain('Multiplicative Neutral');
    });
  });
  
  describe('Theorem 1.24', () => {
    it('should create Theorem 1.24', () => {
      const theorem = createTheorem124();
      
      expect(theorem.kind).toBe('Theorem124');
      expect(theorem.statement).toBe('The skeleton of T is the Lawvere theory for commutative semi-rings');
    });
    
    it('should have Tambara category and Lawvere theory', () => {
      const theorem = createTheorem124();
      
      expect(theorem.tambaraCategory.kind).toBe('TambaraCategory');
      expect(theorem.lawvereTheory.kind).toBe('LawvereTheoryForCommutativeSemiRings');
    });
    
    it('should have isomorphism', () => {
      const theorem = createTheorem124();
      
      expect(theorem.isomorphism.preservesStructure).toBe(true);
      expect(typeof theorem.isomorphism.tambaraToLawvere).toBe('function');
      expect(typeof theorem.isomorphism.lawvereToTambara).toBe('function');
    });
    
    it('should have arithmetic interpretation', () => {
      const theorem = createTheorem124();
      
      expect(theorem.arithmeticInterpretation.addition).toContain('m + n is the product');
      expect(theorem.arithmeticInterpretation.multiplication).toContain('Πm represents multiplication');
      expect(theorem.arithmeticInterpretation.neutralElements).toContain('Σe and Πe represent');
    });
  });
  
  describe('Polynomial Arithmetic', () => {
    it('should create polynomial arithmetic', () => {
      const arithmetic = createPolynomialArithmetic();
      
      expect(arithmetic.kind).toBe('PolynomialArithmetic');
    });
    
    it('should perform polynomial addition', () => {
      const arithmetic = createPolynomialArithmetic();
      
      const addition = arithmetic.addition(2, 3);
      
      expect(addition.kind).toBe('FinitePolynomial');
      expect(addition.name).toBe('Σ2 (Addition)');
      expect(addition.B.size).toBe(5); // 2 + 3
    });
    
    it('should perform polynomial multiplication', () => {
      const arithmetic = createPolynomialArithmetic();
      
      const multiplication = arithmetic.multiplication(4, 5);
      
      expect(multiplication.kind).toBe('FinitePolynomial');
      expect(multiplication.name).toBe('Π4 (Multiplication)');
      expect(multiplication.B.size).toBe(20); // 4 * 5
    });
    
    it('should have neutral elements', () => {
      const arithmetic = createPolynomialArithmetic();
      
      expect(arithmetic.neutralElements.additive.name).toContain('Additive Neutral');
      expect(arithmetic.neutralElements.multiplicative.name).toContain('Multiplicative Neutral');
    });
    
    it('should compute distributivity', () => {
      const arithmetic = createPolynomialArithmetic();
      
      const distributivity = arithmetic.distributivity(3, 4);
      
      expect(distributivity.kind).toBe('FinitePolynomial');
      expect(distributivity.name).toBe('Π3 ∘ Σ4 (Distributivity)');
      expect(distributivity.B.size).toBe(12); // 3 * 4
    });
  });
  
  describe('Verification', () => {
    it('should verify Tambara category properties', () => {
      const category = createTambaraCategory();
      const verification = verifyTambaraCategory(category);
      
      expect(verification.isValid).toBe(true);
      expect(verification.isFinite).toBe(true);
      expect(verification.hasOperations).toBe(true);
      expect(verification.examples).toHaveLength(1);
    });
    
    it('should verify Lawvere theory properties', () => {
      const theory = createLawvereTheoryForCommutativeSemiRings();
      const verification = verifyLawvereTheory(theory);
      
      expect(verification.isValid).toBe(true);
      expect(verification.hasFiniteProducts).toBe(true);
      expect(verification.isCommutativeSemiRing).toBe(true);
      expect(verification.arithmeticValid).toBe(true);
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
    
    it('should run Tambara category example', () => {
      exampleTambaraCategory();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          tambaraCategory: true,
          isValid: true,
          isFinite: true,
          hasOperations: true,
          operations: expect.objectContaining({
            restriction: 'Δ',
            trace: 'Σ',
            norm: 'Π'
          }),
          examples: expect.any(Array)
        })
      );
    });
    
    it('should run Lawvere theory example', () => {
      exampleLawvereTheory();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          lawvereTheory: true,
          isValid: true,
          hasFiniteProducts: true,
          isCommutativeSemiRing: true,
          arithmeticValid: true,
          semiRing: expect.objectContaining({
            additiveIdentity: 0,
            multiplicativeIdentity: 1,
            isCommutative: true
          }),
          examples: expect.any(Array)
        })
      );
    });
    
    it('should run Theorem 1.24 example', () => {
      exampleTheorem124();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          theorem124: true,
          statement: 'The skeleton of T is the Lawvere theory for commutative semi-rings',
          tambaraValid: true,
          lawvereValid: true,
          isomorphism: true,
          arithmeticInterpretation: expect.objectContaining({
            addition: expect.any(String),
            multiplication: expect.any(String),
            neutralElements: expect.any(String)
          })
        })
      );
    });
    
    it('should run polynomial arithmetic example', () => {
      examplePolynomialArithmetic();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          polynomialArithmetic: true,
          addition: expect.stringContaining('Addition'),
          multiplication: expect.stringContaining('Multiplication'),
          additiveNeutral: expect.stringContaining('Additive Neutral'),
          multiplicativeNeutral: expect.stringContaining('Multiplicative Neutral'),
          distributivity: expect.stringContaining('Distributivity'),
          distributivityInterpretation: expect.stringContaining('3 * (a + b + c + d)')
        })
      );
    });
  });
  
  describe('Mathematical Properties', () => {
    it('should verify finite polynomial composition', () => {
      const category = createTambaraCategory();
      
      const p1 = createFinitePolynomial(
        'P1',
        createFiniteSet(1),
        createFiniteSet(2),
        createFiniteSet(1),
        createFiniteSet(1),
        (x) => 1,
        (x) => 1,
        (x) => 1
      );
      
      const p2 = createFinitePolynomial(
        'P2',
        createFiniteSet(1),
        createFiniteSet(3),
        createFiniteSet(1),
        createFiniteSet(1),
        (x) => 1,
        (x) => 1,
        (x) => 1
      );
      
      const composition = category.composition(p1, p2);
      
      // Composition should preserve finiteness
      expect(composition.isFinite).toBe(true);
      
      // Composition should have correct structure
      expect(composition.I).toBe(p2.I);
      expect(composition.J).toBe(p1.J);
    });
    
    it('should verify semi-ring laws', () => {
      const semiRing = createCommutativeSemiRing();
      
      // Commutativity
      expect(semiRing.addition(3, 5)).toBe(semiRing.addition(5, 3));
      expect(semiRing.multiplication(4, 6)).toBe(semiRing.multiplication(6, 4));
      
      // Identity elements
      expect(semiRing.addition(7, semiRing.additiveIdentity)).toBe(7);
      expect(semiRing.multiplication(8, semiRing.multiplicativeIdentity)).toBe(8);
      
      // Distributivity
      const a = 2, b = 3, c = 4;
      const leftDist = semiRing.multiplication(a, semiRing.addition(b, c));
      const rightDist = semiRing.addition(
        semiRing.multiplication(a, b),
        semiRing.multiplication(a, c)
      );
      expect(leftDist).toBe(rightDist);
    });
    
    it('should verify polynomial arithmetic properties', () => {
      const arithmetic = createPolynomialArithmetic();
      
      // Addition should be commutative
      const add1 = arithmetic.addition(2, 3);
      const add2 = arithmetic.addition(3, 2);
      expect(add1.B.size).toBe(add2.B.size); // Both should be 5
      
      // Multiplication should be commutative
      const mult1 = arithmetic.multiplication(4, 5);
      const mult2 = arithmetic.multiplication(5, 4);
      expect(mult1.B.size).toBe(mult2.B.size); // Both should be 20
      
      // Distributivity: Πm ∘ Σk should represent m * (a + b + ... + k)
      const distributivity = arithmetic.distributivity(3, 4);
      expect(distributivity.B.size).toBe(12); // 3 * 4
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
    it('should handle empty finite sets', () => {
      const polynomial = createFinitePolynomial(
        'Empty',
        createFiniteSet(0),
        createFiniteSet(0),
        createFiniteSet(0),
        createFiniteSet(0),
        (x) => 0,
        (x) => 0,
        (x) => 0
      );
      
      expect(polynomial.isFinite).toBe(true);
      expect(polynomial.I.size).toBe(0);
      expect(polynomial.B.size).toBe(0);
    });
    
    it('should handle single element sets', () => {
      const polynomial = createFinitePolynomial(
        'Single',
        createFiniteSet(1),
        createFiniteSet(1),
        createFiniteSet(1),
        createFiniteSet(1),
        (x) => 1,
        (x) => 1,
        (x) => 1
      );
      
      expect(polynomial.isFinite).toBe(true);
      expect(polynomial.I.size).toBe(1);
      expect(polynomial.B.size).toBe(1);
    });
    
    it('should handle large finite sets', () => {
      const polynomial = createFinitePolynomial(
        'Large',
        createFiniteSet(100),
        createFiniteSet(200),
        createFiniteSet(50),
        createFiniteSet(25),
        (x) => x % 100,
        (x) => x % 50,
        (x) => x % 25
      );
      
      expect(polynomial.isFinite).toBe(true);
      expect(polynomial.I.size).toBe(100);
      expect(polynomial.B.size).toBe(200);
    });
  });
});
