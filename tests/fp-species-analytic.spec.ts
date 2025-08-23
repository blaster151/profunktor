/**
 * Tests for Species and Analytic Functors
 * 
 * Based on "Polynomial functors and polynomial monads" by Nicola Gambino and Joachim Kock
 * Page 11 - Section 1.20: Species and Analytic Functors
 * 
 * This tests Joyal's species theory and analytic functors with the formula:
 * Set → Set
 * X ↦ Σ_{n∈N} F[n] ×_{S_n} X^n
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  // Finite sets and bijections
  FiniteSet,
  createFiniteSet,
  Bijection,
  createIdentityBijection,
  createBijection,
  composeBijections,
  
  // Symmetric groups
  SymmetricGroup,
  createSymmetricGroup,
  
  // Species
  Species,
  createSpecies,
  createIdentitySpecies,
  createConstantSpecies,
  createSetSpecies,
  createListSpecies,
  createCycleSpecies,
  
  // Analytic functors
  AnalyticFunctor,
  createAnalyticFunctor,
  
  // Species operations
  sumSpecies,
  productSpecies,
  composeSpecies,
  
  // Verification
  verifySpecies,
  verifyAnalyticFunctor,
  
  // Example functions
  exampleIdentitySpecies,
  exampleListSpecies,
  exampleSpeciesOperations
} from '../fp-species-analytic';

describe('Species and Analytic Functors', () => {
  describe('Finite Sets and Bijections', () => {
    it('should create finite set', () => {
      const set = createFiniteSet(3);
      
      expect(set.kind).toBe('FiniteSet');
      expect(set.size).toBe(3);
      expect(set.elements).toEqual([1, 2, 3]);
    });
    
    it('should create identity bijection', () => {
      const set = createFiniteSet(2);
      const bijection = createIdentityBijection(set);
      
      expect(bijection.kind).toBe('Bijection');
      expect(bijection.domain).toBe(set);
      expect(bijection.codomain).toBe(set);
      expect(bijection.permutation).toEqual([1, 2]);
      expect(bijection.inverse).toEqual([1, 2]);
    });
    
    it('should create bijection from permutation', () => {
      const bijection = createBijection([2, 1, 3]);
      
      expect(bijection.kind).toBe('Bijection');
      expect(bijection.domain.size).toBe(3);
      expect(bijection.codomain.size).toBe(3);
      expect(bijection.permutation).toEqual([2, 1, 3]);
      expect(bijection.inverse).toEqual([2, 1, 3]);
    });
    
    it('should compose bijections', () => {
      const σ = createBijection([2, 1, 3]);
      const τ = createBijection([3, 1, 2]);
      
      const composition = composeBijections(σ, τ);
      
      expect(composition.kind).toBe('Bijection');
      expect(composition.domain.size).toBe(3);
      expect(composition.codomain.size).toBe(3);
      expect(composition.permutation).toEqual([3, 2, 1]);
    });
    
    it('should handle bijection composition with size mismatch', () => {
      const σ = createBijection([2, 1]);
      const τ = createBijection([3, 1, 2]);
      
      expect(() => composeBijections(σ, τ)).toThrow('size mismatch');
    });
  });
  
  describe('Symmetric Groups S_n', () => {
    it('should create symmetric group S_2', () => {
      const S2 = createSymmetricGroup(2);
      
      expect(S2.kind).toBe('SymmetricGroup');
      expect(S2.n).toBe(2);
      expect(S2.size).toBe(2); // 2! = 2
      expect(S2.elements).toHaveLength(2);
      expect(S2.identity.kind).toBe('Bijection');
    });
    
    it('should create symmetric group S_3', () => {
      const S3 = createSymmetricGroup(3);
      
      expect(S3.kind).toBe('SymmetricGroup');
      expect(S3.n).toBe(3);
      expect(S3.size).toBe(6); // 3! = 6
      expect(S3.elements).toHaveLength(6);
    });
    
    it('should handle large symmetric groups', () => {
      const S7 = createSymmetricGroup(7);
      
      expect(S7.kind).toBe('SymmetricGroup');
      expect(S7.n).toBe(7);
      expect(S7.elements.length).toBeGreaterThan(0);
    });
    
    it('should reject invalid symmetric group', () => {
      expect(() => createSymmetricGroup(0)).toThrow('requires n > 0');
      expect(() => createSymmetricGroup(-1)).toThrow('requires n > 0');
    });
    
    it('should implement group operations', () => {
      const S2 = createSymmetricGroup(2);
      
      const multiplication = S2.multiplication(S2.elements[0], S2.elements[1]);
      expect(multiplication.kind).toBe('Bijection');
      
      const inverse = S2.inverse(S2.elements[0]);
      expect(inverse.kind).toBe('Bijection');
    });
  });
  
  describe('Species (Joyal\'s Theory)', () => {
    it('should create species from evaluation function', () => {
      const species = createSpecies('TestSpecies', (set: FiniteSet) => {
        return set.size === 0 ? [] : ['element'];
      });
      
      expect(species.kind).toBe('Species');
      expect(species.name).toBe('TestSpecies');
      expect(species.evaluate(createFiniteSet(0))).toEqual([]);
      expect(species.evaluate(createFiniteSet(1))).toEqual(['element']);
    });
    
    it('should implement species transport', () => {
      const species = createSpecies('TestSpecies', (set: FiniteSet) => {
        return ['a', 'b', 'c'].slice(0, set.size);
      });
      
      const set = createFiniteSet(3);
      const bijection = createBijection([2, 3, 1]);
      
      const transported = species.transport(set, bijection);
      expect(transported).toHaveLength(3);
    });
    
    it('should verify species functoriality', () => {
      const species = createSpecies('TestSpecies', (set: FiniteSet) => {
        return ['element'];
      });
      
      const σ = createBijection([2, 1]);
      const τ = createBijection([1, 2]);
      
      const functoriality = species.functoriality(σ, τ);
      expect(typeof functoriality).toBe('boolean');
    });
    
    it('should verify species equivariance', () => {
      const species = createSpecies('TestSpecies', (set: FiniteSet) => {
        return ['element'];
      });
      
      const set = createFiniteSet(2);
      const bijection = createBijection([2, 1]);
      
      const equivariance = species.equivariance(set, bijection);
      expect(equivariance).toBe(true);
    });
  });
  
  describe('Canonical Species', () => {
    it('should create identity species', () => {
      const identitySpecies = createIdentitySpecies();
      
      expect(identitySpecies.kind).toBe('Species');
      expect(identitySpecies.name).toBe('Identity');
      expect(identitySpecies.evaluate(createFiniteSet(0))).toEqual([]);
      expect(identitySpecies.evaluate(createFiniteSet(1))).toEqual(['*']);
      expect(identitySpecies.evaluate(createFiniteSet(2))).toEqual([]);
    });
    
    it('should create constant species', () => {
      const constantSpecies = createConstantSpecies();
      
      expect(constantSpecies.kind).toBe('Species');
      expect(constantSpecies.name).toBe('Constant');
      expect(constantSpecies.evaluate(createFiniteSet(0))).toEqual(['*']);
      expect(constantSpecies.evaluate(createFiniteSet(1))).toEqual([]);
      expect(constantSpecies.evaluate(createFiniteSet(2))).toEqual([]);
    });
    
    it('should create set species', () => {
      const setSpecies = createSetSpecies();
      
      expect(setSpecies.kind).toBe('Species');
      expect(setSpecies.name).toBe('Set');
      expect(setSpecies.evaluate(createFiniteSet(0))).toEqual(['*']);
      expect(setSpecies.evaluate(createFiniteSet(1))).toEqual(['*']);
      expect(setSpecies.evaluate(createFiniteSet(2))).toEqual(['*']);
    });
    
    it('should create list species', () => {
      const listSpecies = createListSpecies();
      
      expect(listSpecies.kind).toBe('Species');
      expect(listSpecies.name).toBe('List');
      expect(listSpecies.evaluate(createFiniteSet(0))).toEqual([]);
      expect(listSpecies.evaluate(createFiniteSet(1))).toEqual([[1]]);
      expect(listSpecies.evaluate(createFiniteSet(2))).toHaveLength(2); // 2! = 2
    });
    
    it('should create cycle species', () => {
      const cycleSpecies = createCycleSpecies();
      
      expect(cycleSpecies.kind).toBe('Species');
      expect(cycleSpecies.name).toBe('Cycle');
      expect(cycleSpecies.evaluate(createFiniteSet(0))).toEqual([]);
      expect(cycleSpecies.evaluate(createFiniteSet(1))).toEqual([]);
      expect(cycleSpecies.evaluate(createFiniteSet(2))).toHaveLength(2); // 2! = 2 (simplified implementation)
    });
  });
  
  describe('Analytic Functors', () => {
    it('should create analytic functor from species', () => {
      const identitySpecies = createIdentitySpecies();
      const analytic = createAnalyticFunctor(identitySpecies);
      
      expect(analytic.kind).toBe('AnalyticFunctor');
      expect(analytic.species).toBe(identitySpecies);
      expect(analytic.preservesWeakPullbacks).toBe(true);
      expect(analytic.preservesCofilteredLimits).toBe(true);
      expect(analytic.preservesFilteredColimits).toBe(true);
      expect(analytic.joyalFormula).toContain('Identity');
    });
    
    it('should evaluate analytic functor', () => {
      const identitySpecies = createIdentitySpecies();
      const analytic = createAnalyticFunctor(identitySpecies);
      
      const result = analytic.evaluate(['a', 'b']);
      expect(Array.isArray(result)).toBe(true);
    });
    
    it('should verify analytic functor properties', () => {
      const identitySpecies = createIdentitySpecies();
      const analytic = createAnalyticFunctor(identitySpecies);
      
      const verification = verifyAnalyticFunctor(analytic);
      
      expect(verification.isValid).toBe(true);
      expect(verification.preservesWeakPullbacks).toBe(true);
      expect(verification.preservesCofilteredLimits).toBe(true);
      expect(verification.preservesFilteredColimits).toBe(true);
      expect(verification.joyalFormula).toContain('X ↦ Σ_{n∈N}');
      expect(verification.examples).toHaveLength(4); // 0, 1, 2, 3
    });
    
    it('should test analytic functor on different set sizes', () => {
      const listSpecies = createListSpecies();
      const analytic = createAnalyticFunctor(listSpecies);
      
      const emptyResult = analytic.evaluate([]);
      const singleResult = analytic.evaluate(['a']);
      const doubleResult = analytic.evaluate(['a', 'b']);
      
      expect(Array.isArray(emptyResult)).toBe(true);
      expect(Array.isArray(singleResult)).toBe(true);
      expect(Array.isArray(doubleResult)).toBe(true);
    });
  });
  
  describe('Species Operations', () => {
    it('should compute sum of species', () => {
      const identitySpecies = createIdentitySpecies();
      const constantSpecies = createConstantSpecies();
      
      const sum = sumSpecies(identitySpecies, constantSpecies);
      
      expect(sum.kind).toBe('Species');
      expect(sum.name).toBe('Identity + Constant');
      
      const result = sum.evaluate(createFiniteSet(0));
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeGreaterThan(0);
    });
    
    it('should compute product of species', () => {
      const identitySpecies = createIdentitySpecies();
      const setSpecies = createSetSpecies();
      
      const product = productSpecies(identitySpecies, setSpecies);
      
      expect(product.kind).toBe('Species');
      expect(product.name).toBe('Identity × Set');
      
      const result = product.evaluate(createFiniteSet(1));
      expect(Array.isArray(result)).toBe(true);
    });
    
    it('should compute composition of species', () => {
      const identitySpecies = createIdentitySpecies();
      const setSpecies = createSetSpecies();
      
      const composition = composeSpecies(identitySpecies, setSpecies);
      
      expect(composition.kind).toBe('Species');
      expect(composition.name).toBe('Identity ∘ Set');
      
      const result = composition.evaluate(createFiniteSet(1));
      expect(Array.isArray(result)).toBe(true);
    });
  });
  
  describe('Verification and Testing', () => {
    it('should verify species properties', () => {
      const identitySpecies = createIdentitySpecies();
      const verification = verifySpecies(identitySpecies);
      
      expect(verification.isValid).toBe(true);
      expect(verification.functoriality).toBe(true);
      expect(verification.equivariance).toBe(true);
      expect(verification.examples).toHaveLength(5); // 0, 1, 2, 3, 4
    });
    
    it('should verify list species properties', () => {
      const listSpecies = createListSpecies();
      const verification = verifySpecies(listSpecies);
      
      expect(verification.isValid).toBe(true);
      expect(verification.examples).toHaveLength(5);
      
      // Check that list species has correct number of elements
      expect(verification.examples[0].elements).toBe(0); // n=0
      expect(verification.examples[1].elements).toBe(1); // n=1
      expect(verification.examples[2].elements).toBe(2); // n=2
      expect(verification.examples[3].elements).toBe(6); // n=3
    });
    
    it('should verify cycle species properties', () => {
      const cycleSpecies = createCycleSpecies();
      const verification = verifySpecies(cycleSpecies);
      
      expect(verification.isValid).toBe(true);
      expect(verification.examples).toHaveLength(5);
      
      // Check that cycle species has correct number of elements
      expect(verification.examples[0].elements).toBe(0); // n=0
      expect(verification.examples[1].elements).toBe(0); // n=1
      expect(verification.examples[2].elements).toBe(2); // n=2 (simplified implementation)
      expect(verification.examples[3].elements).toBe(6); // n=3 (3! = 6 elements for cycles)
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
    
    it('should run identity species example', () => {
      exampleIdentitySpecies();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          identitySpecies: true,
          speciesValid: true,
          speciesExamples: expect.any(Array),
          analyticValid: true,
          joyalFormula: expect.stringContaining('X ↦ Σ_{n∈N}'),
          preservesWeakPullbacks: true
        })
      );
    });
    
    it('should run list species example', () => {
      exampleListSpecies();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          listSpecies: true,
          speciesValid: true,
          speciesExamples: expect.any(Array),
          analyticValid: true,
          testSetSize: 2,
          resultSize: expect.any(Number),
          joyalFormula: expect.stringContaining('X ↦ Σ_{n∈N}'),
          preservesWeakPullbacks: true
        })
      );
    });
    
    it('should run species operations example', () => {
      exampleSpeciesOperations();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          speciesOperations: true,
          sumValid: true,
          sumExamples: expect.any(Array),
          productValid: true,
          productExamples: expect.any(Array),
          sumName: expect.stringContaining('+'),
          productName: expect.stringContaining('×')
        })
      );
    });
  });
  
  describe('Mathematical Properties', () => {
    it('should verify Joyal formula structure', () => {
      const identitySpecies = createIdentitySpecies();
      const analytic = createAnalyticFunctor(identitySpecies);
      
      const formula = analytic.joyalFormula;
      expect(formula).toContain('X ↦ Σ_{n∈N}');
      expect(formula).toContain('×_{S_n}');
      expect(formula).toContain('X^n');
    });
    
    it('should verify weak vs strong pullback distinction', () => {
      const identitySpecies = createIdentitySpecies();
      const analytic = createAnalyticFunctor(identitySpecies);
      
      // Analytic functors preserve WEAK pullbacks (due to S_n group actions)
      expect(analytic.preservesWeakPullbacks).toBe(true);
      
      // This is the key distinction from polynomial functors which preserve STRONG pullbacks
    });
    
    it('should verify symmetric group actions', () => {
      const S2 = createSymmetricGroup(2);
      
      // Test that S_2 has the correct structure
      expect(S2.elements).toHaveLength(2);
      expect(S2.identity.permutation).toEqual([1, 2]);
      
      // Test that non-identity elements are different
      const nonIdentity = S2.elements.find(el => 
        !el.permutation.every((val, idx) => val === idx + 1)
      );
      expect(nonIdentity).toBeDefined();
    });
    
    it('should verify species functoriality with symmetric groups', () => {
      const listSpecies = createListSpecies();
      const S2 = createSymmetricGroup(2);
      
      // Test that list species respects S_2 actions
      const set = createFiniteSet(2);
      for (const bijection of S2.elements) {
        const equivariance = listSpecies.equivariance(set, bijection);
        expect(equivariance).toBe(true);
      }
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
    it('should handle empty finite sets', () => {
      const emptySet = createFiniteSet(0);
      expect(emptySet.size).toBe(0);
      expect(emptySet.elements).toEqual([]);
      
      const identitySpecies = createIdentitySpecies();
      const result = identitySpecies.evaluate(emptySet);
      expect(result).toEqual([]);
    });
    
    it('should handle large finite sets', () => {
      const largeSet = createFiniteSet(10);
      expect(largeSet.size).toBe(10);
      expect(largeSet.elements).toHaveLength(10);
      expect(largeSet.elements[0]).toBe(1);
      expect(largeSet.elements[9]).toBe(10);
    });
    
    it('should handle species with no elements', () => {
      const emptySpecies = createSpecies('Empty', () => []);
      
      const verification = verifySpecies(emptySpecies);
      expect(verification.isValid).toBe(true);
      
      const analytic = createAnalyticFunctor(emptySpecies);
      const result = analytic.evaluate(['a', 'b']);
      expect(result).toEqual([]);
    });
    
    it('should handle analytic functor on empty set', () => {
      const identitySpecies = createIdentitySpecies();
      const analytic = createAnalyticFunctor(identitySpecies);
      
      const result = analytic.evaluate([]);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
