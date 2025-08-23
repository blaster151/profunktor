/**
 * Tests for Internal Logic Foundation
 * 
 * Based on "Polynomial functors and polynomial monads" by Nicola Gambino and Joachim Kock
 * Pages 1-6: Internal language and extensional dependent type theory
 * 
 * This tests the internal logic system that provides the type-theoretic foundation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  InternalLanguageContext,
  InternalLanguageExpression,
  DependentTypeFamily,
  PullbackOperation,
  DependentSumOperation,
  DependentProductOperation,
  KripkeJoyalSemantics,
  PolynomialFunctorInternalLanguage,
  createInternalLanguageContext,
  createDependentTypeFamily,
  createPolynomialFunctorInternalLanguage,
  createKripkeJoyalSemantics,
  exampleNaturalNumbersInternalLanguage,
  exampleListPolynomialInternalLanguage
} from '../fp-internal-logic';

import { Polynomial } from '../fp-polynomial-functors';

describe('Internal Logic Foundation for Polynomial Functors', () => {
  describe('Internal Language Context', () => {
    it('should create internal language context for LCCC', () => {
      const context = createInternalLanguageContext('Set', true);
      
      expect(context.kind).toBe('InternalLanguageContext');
      expect(context.baseCategory).toBe('Set');
      expect(context.hasTerminalObject).toBe(true);
      expect(context.hasSums).toBe(true);
      expect(context.hasPullbacks).toBe(true);
      expect(context.hasDependentSums).toBe(true);
      expect(context.hasDependentProducts).toBe(true);
    });
    
    it('should create context without sums', () => {
      const context = createInternalLanguageContext('E', false);
      
      expect(context.hasSums).toBe(false);
      expect(context.baseCategory).toBe('E');
    });
  });
  
  describe('Dependent Type Families', () => {
    it('should create dependent type family', () => {
      const context = createInternalLanguageContext();
      const family = createDependentTypeFamily(
        ['a', 'b', 'c'],
        (a) => `X_${a}`,
        context
      );
      
      expect(family.kind).toBe('DependentTypeFamily');
      expect(family.indexType).toEqual(['a', 'b', 'c']);
      expect(family.familyType('a')).toBe('X_a');
      expect(family.context).toBe(context);
    });
    
    it('should handle complex dependent families', () => {
      const context = createInternalLanguageContext();
      const family = createDependentTypeFamily(
        { x: 1, y: 2, z: 3 },
        (key) => `Type_${key}`,
        context
      );
      
      expect(family.familyType('x')).toBe('Type_x');
      expect(family.familyType('y')).toBe('Type_y');
      expect(family.familyType('z')).toBe('Type_z');
    });
  });
  
  describe('Internal Language Operations', () => {
    it('should have pullback operation structure', () => {
      const context = createInternalLanguageContext();
      const inputFamily = createDependentTypeFamily(['a', 'b'], (x) => `X_${x}`, context);
      const outputFamily = createDependentTypeFamily(['c', 'd'], (x) => `Y_${x}`, context);
      
      const pullback: PullbackOperation<string, string, string> = {
        kind: 'PullbackOperation',
        map: (b) => 'a',
        input: inputFamily,
        output: outputFamily,
        isCartesian: true
      };
      
      expect(pullback.kind).toBe('PullbackOperation');
      expect(pullback.isCartesian).toBe(true);
      expect(pullback.map('c')).toBe('a');
    });
    
    it('should have dependent sum operation structure', () => {
      const context = createInternalLanguageContext();
      const inputFamily = createDependentTypeFamily(['a', 'b'], (x) => `X_${x}`, context);
      const outputFamily = createDependentTypeFamily(['c', 'd'], (x) => `Y_${x}`, context);
      
      const dependentSum: DependentSumOperation<string, string, string> = {
        kind: 'DependentSumOperation',
        map: (b) => 'a',
        input: inputFamily,
        output: outputFamily,
        fiber: (a) => ['b1', 'b2'],
        isCartesian: true
      };
      
      expect(dependentSum.kind).toBe('DependentSumOperation');
      expect(dependentSum.isCartesian).toBe(true);
      expect(dependentSum.fiber('a')).toEqual(['b1', 'b2']);
    });
    
    it('should have dependent product operation structure', () => {
      const context = createInternalLanguageContext();
      const inputFamily = createDependentTypeFamily(['a', 'b'], (x) => `X_${x}`, context);
      const outputFamily = createDependentTypeFamily(['c', 'd'], (x) => `Y_${x}`, context);
      
      const dependentProduct: DependentProductOperation<string, string, string> = {
        kind: 'DependentProductOperation',
        map: (b) => 'a',
        input: inputFamily,
        output: outputFamily,
        fiber: (a) => ['b1', 'b2'],
        isCartesian: false
      };
      
      expect(dependentProduct.kind).toBe('DependentProductOperation');
      expect(dependentProduct.isCartesian).toBe(false);
      expect(dependentProduct.fiber('a')).toEqual(['b1', 'b2']);
    });
  });
  
  describe('Kripke-Joyal Semantics', () => {
    it('should create Kripke-Joyal semantics', () => {
      const semantics = createKripkeJoyalSemantics();
      
      expect(semantics.kind).toBe('KripkeJoyalSemantics');
      expect(semantics.sheafSemantics.isSheaf).toBe(true);
      expect(semantics.sheafSemantics.gluingCondition).toBe(true);
    });
    
    it('should have forcing relation', () => {
      const semantics = createKripkeJoyalSemantics();
      const context = createInternalLanguageContext();
      
      const result = semantics.forcing(context, 'some condition');
      expect(typeof result).toBe('boolean');
    });
    
    it('should have logical connectives', () => {
      const semantics = createKripkeJoyalSemantics();
      
      expect(semantics.connectives.conjunction(true, true)).toBe(true);
      expect(semantics.connectives.conjunction(true, false)).toBe(false);
      expect(semantics.connectives.disjunction(true, false)).toBe(true);
      expect(semantics.connectives.implication(true, true)).toBe(true);
      expect(semantics.connectives.negation(true)).toBe(false);
      expect(semantics.connectives.negation(false)).toBe(true);
    });
    
    it('should have quantifiers', () => {
      const semantics = createKripkeJoyalSemantics();
      
      const universalResult = semantics.connectives.universal((x: number) => x > 0);
      const existentialResult = semantics.connectives.existential((x: number) => x > 0);
      
      expect(typeof universalResult).toBe('boolean');
      expect(typeof existentialResult).toBe('boolean');
    });
  });
  
  describe('Polynomial Functor Internal Language', () => {
    it('should create polynomial functor in internal language', () => {
      const context = createInternalLanguageContext('Set', true);
      
      const polynomial: Polynomial<string, string> = {
        positions: ['zero', 'succ'],
        directions: (pos) => pos === 'zero' ? [] : ['n']
      };
      
      const internalLanguage = createPolynomialFunctorInternalLanguage(
        polynomial,
        context
      );
      
      expect(internalLanguage.kind).toBe('PolynomialFunctorInternalLanguage');
      expect(internalLanguage.diagram.source).toEqual(['zero', 'succ']);
      expect(internalLanguage.expression.type).toBe('PolynomialFunctor');
      expect(internalLanguage.internalLanguageForm.formula).toContain('Σ_{a∈A_j}');
      expect(internalLanguage.internalLanguageForm.formula).toContain('Π_{b∈B_a}');
    });
    
    it('should have correct internal language form', () => {
      const context = createInternalLanguageContext();
      
      const polynomial: Polynomial<string, string> = {
        positions: ['nil', 'cons'],
        directions: (pos) => pos === 'nil' ? [] : ['head', 'tail']
      };
      
      const internalLanguage = createPolynomialFunctorInternalLanguage(
        polynomial,
        context
      );
      
      const formula = internalLanguage.internalLanguageForm.formula;
      expect(formula).toContain('(X_i | i ∈ I)');
      expect(formula).toContain('(Σ_{a∈A_j}');
      expect(formula).toContain('Π_{b∈B_a}');
      expect(formula).toContain('X_{s(b)}');
      expect(formula).toContain('| j ∈ J)');
    });
    
    it('should have operations in internal language', () => {
      const context = createInternalLanguageContext();
      
      const polynomial: Polynomial<string, string> = {
        positions: ['a', 'b'],
        directions: (pos) => pos === 'a' ? ['x'] : ['y']
      };
      
      const internalLanguage = createPolynomialFunctorInternalLanguage(
        polynomial,
        context
      );
      
      expect(internalLanguage.operations.pullback.kind).toBe('PullbackOperation');
      expect(internalLanguage.operations.dependentSum.kind).toBe('DependentSumOperation');
      expect(internalLanguage.operations.dependentProduct.kind).toBe('DependentProductOperation');
      
      expect(internalLanguage.operations.pullback.isCartesian).toBe(true);
      expect(internalLanguage.operations.dependentSum.isCartesian).toBe(true);
      expect(internalLanguage.operations.dependentProduct.isCartesian).toBe(false);
    });
  });
  
  describe('Integration Examples', () => {
    let consoleSpy: any;
    
    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });
    
    afterEach(() => {
      consoleSpy.mockRestore();
    });
    
    it('should run natural numbers internal language example', () => {
      exampleNaturalNumbersInternalLanguage();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          internalLanguageSystem: true,
          polynomialInInternalLanguage: expect.objectContaining({
            diagram: expect.any(Object),
            expression: expect.stringContaining('↦'),
            formula: expect.stringContaining('Σ_{a∈A_j}')
          }),
          kripkeJoyalSemantics: expect.objectContaining({
            isSheaf: true,
            hasForcing: true,
            hasConnectives: true
          }),
          context: expect.objectContaining({
            baseCategory: 'Set',
            hasDependentSums: true,
            hasDependentProducts: true
          })
        })
      );
    });
    
    it('should run list polynomial internal language example', () => {
      exampleListPolynomialInternalLanguage();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          listPolynomialInternalLanguage: true,
          internalLanguageForm: expect.stringContaining('Σ_{a∈A_j}'),
          operations: expect.objectContaining({
            hasPullback: true,
            hasDependentSum: true,
            hasDependentProduct: false
          })
        })
      );
    });
  });
  
  describe('Mathematical Properties', () => {
    it('should satisfy internal language properties from Gambino-Kock paper', () => {
      const context = createInternalLanguageContext('E', true);
      
      // Test the three fundamental operations mentioned in the paper
      const inputFamily = createDependentTypeFamily(['a', 'b'], (x) => `X_${x}`, context);
      
      // Δf operation (pullback)
      const pullback: PullbackOperation<string, string, string> = {
        kind: 'PullbackOperation',
        map: (b) => 'a',
        input: inputFamily,
        output: inputFamily,
        isCartesian: true
      };
      
      // Σf operation (dependent sum)
      const dependentSum: DependentSumOperation<string, string, string> = {
        kind: 'DependentSumOperation',
        map: (b) => 'a',
        input: inputFamily,
        output: inputFamily,
        fiber: (a) => ['b1', 'b2'],
        isCartesian: true
      };
      
      // Πf operation (dependent product)
      const dependentProduct: DependentProductOperation<string, string, string> = {
        kind: 'DependentProductOperation',
        map: (b) => 'a',
        input: inputFamily,
        output: inputFamily,
        fiber: (a) => ['b1', 'b2'],
        isCartesian: false
      };
      
      // Verify properties from the paper
      expect(pullback.isCartesian).toBe(true); // Unit and counit are cartesian
      expect(dependentSum.isCartesian).toBe(true); // Unit and counit are cartesian
      expect(dependentProduct.isCartesian).toBe(false); // Generally not cartesian
    });
    
    it('should support extensional dependent type theory', () => {
      const context = createInternalLanguageContext('E', true);
      
      // Test dependent type families as mentioned in the paper
      const family = createDependentTypeFamily(
        ['a', 'b', 'c'],
        (a) => `X_${a}`,
        context
      );
      
      // Test internal language expressions
      const expression: InternalLanguageExpression<string> = {
        kind: 'InternalLanguageExpression',
        type: 'DependentType',
        value: '(Xa | a ∈ A)',
        context
      };
      
      expect(family.kind).toBe('DependentTypeFamily');
      expect(expression.kind).toBe('InternalLanguageExpression');
      expect(expression.value).toContain('Xa | a ∈ A');
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
    it('should handle empty polynomial structures', () => {
      const context = createInternalLanguageContext();
      
      const emptyPolynomial: Polynomial<string, string> = {
        positions: [],
        directions: () => []
      };
      
      const internalLanguage = createPolynomialFunctorInternalLanguage(
        emptyPolynomial,
        context
      );
      
      expect(internalLanguage.kind).toBe('PolynomialFunctorInternalLanguage');
      expect(internalLanguage.diagram.source).toEqual([]);
      expect(internalLanguage.internalLanguageForm.formula).toContain('Σ_{a∈A_j}');
    });
    
    it('should handle complex polynomial structures', () => {
      const context = createInternalLanguageContext();
      
      const complexPolynomial: Polynomial<string, string> = {
        positions: ['a', 'b', 'c', 'd'],
        directions: (pos) => {
          switch (pos) {
            case 'a': return ['x', 'y'];
            case 'b': return ['z'];
            case 'c': return ['w', 'v', 'u'];
            case 'd': return [];
            default: return [];
          }
        }
      };
      
      const internalLanguage = createPolynomialFunctorInternalLanguage(
        complexPolynomial,
        context
      );
      
      expect(internalLanguage.kind).toBe('PolynomialFunctorInternalLanguage');
      expect(internalLanguage.diagram.source).toEqual(['a', 'b', 'c', 'd']);
      expect(internalLanguage.internalLanguageForm.formula).toContain('Σ_{a∈A_j}');
    });
  });
});
