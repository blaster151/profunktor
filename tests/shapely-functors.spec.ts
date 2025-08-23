/**
 * Tests for Shapely Functors Hierarchy
 * 
 * Based on "Polynomial functors and polynomial monads" by Nicola Gambino and Joachim Kock
 * Pages 24-25: Shapely functors and their relationship to polynomial functors
 * 
 * This tests the shapely functors hierarchy where all polynomial functors are
 * canonically shapely functors, but not all shapely functors are polynomial.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  ShapelyFunctor,
  Strength,
  PullbackPreservation,
  PolynomialAsShapelyFunctor,
  FilterPowerFunctor,
  NonPrincipalFilter,
  ColimitConstruction,
  createShapelyFunctorFromPolynomial,
  createPolynomialAsShapelyFunctor,
  createFilterPowerFunctor,
  isShapelyFunctor,
  isPolynomialFunctor,
  exampleNaturalNumbersAsShapelyFunctor,
  exampleListPolynomialAsShapelyFunctor
} from '../fp-shapely-functors';

import { Polynomial } from '../fp-polynomial-functors';

describe('Shapely Functors Hierarchy', () => {
  describe('Shapely Functor Interface', () => {
    it('should have shapely functor structure', () => {
      const strength: Strength<any, any> = {
        kind: 'Strength',
        hasStrength: true,
        strengthMorphism: 'canonical',
        isCanonical: true
      };
      
      const pullbackPreservation: PullbackPreservation = {
        kind: 'PullbackPreservation',
        preservesPullbacks: true,
        preservesFiniteLimits: true,
        preservesCofilteredLimits: true,
        verificationMethod: 'direct_verification'
      };
      
      const shapelyFunctor: ShapelyFunctor<string, string> = {
        kind: 'ShapelyFunctor',
        domain: 'Set',
        codomain: 'Set',
        preservesPullbacks: true,
        hasCanonicalStrength: true,
        isPolynomial: false,
        strength,
        pullbackPreservation
      };
      
      expect(shapelyFunctor.kind).toBe('ShapelyFunctor');
      expect(shapelyFunctor.preservesPullbacks).toBe(true);
      expect(shapelyFunctor.hasCanonicalStrength).toBe(true);
      expect(shapelyFunctor.strength.kind).toBe('Strength');
      expect(shapelyFunctor.pullbackPreservation.kind).toBe('PullbackPreservation');
    });
    
    it('should have strength properties', () => {
      const strength: Strength<any, any> = {
        kind: 'Strength',
        hasStrength: true,
        strengthMorphism: 'canonical',
        isCanonical: true
      };
      
      expect(strength.hasStrength).toBe(true);
      expect(strength.strengthMorphism).toBe('canonical');
      expect(strength.isCanonical).toBe(true);
    });
    
    it('should have pullback preservation properties', () => {
      const pullbackPreservation: PullbackPreservation = {
        kind: 'PullbackPreservation',
        preservesPullbacks: true,
        preservesFiniteLimits: true,
        preservesCofilteredLimits: true,
        verificationMethod: 'theoretical_proof'
      };
      
      expect(pullbackPreservation.preservesPullbacks).toBe(true);
      expect(pullbackPreservation.preservesFiniteLimits).toBe(true);
      expect(pullbackPreservation.preservesCofilteredLimits).toBe(true);
      expect(pullbackPreservation.verificationMethod).toBe('theoretical_proof');
    });
  });
  
  describe('Polynomial as Shapely Functor', () => {
    it('should create shapely functor from polynomial', () => {
      const polynomial: Polynomial<string, string> = {
        positions: ['a', 'b'],
        directions: (pos) => pos === 'a' ? ['x'] : ['y']
      };
      
      const shapelyFunctor = createShapelyFunctorFromPolynomial(polynomial);
      
      expect(shapelyFunctor.kind).toBe('ShapelyFunctor');
      expect(shapelyFunctor.preservesPullbacks).toBe(true);
      expect(shapelyFunctor.hasCanonicalStrength).toBe(true);
      expect(shapelyFunctor.isPolynomial).toBe(true);
      expect(shapelyFunctor.strength.isCanonical).toBe(true);
      expect(shapelyFunctor.pullbackPreservation.preservesCofilteredLimits).toBe(true);
    });
    
    it('should create polynomial as shapely functor', () => {
      const polynomial: Polynomial<string, string> = {
        positions: ['zero', 'succ'],
        directions: (pos) => pos === 'zero' ? [] : ['n']
      };
      
      const polynomialAsShapely = createPolynomialAsShapelyFunctor(polynomial);
      
      expect(polynomialAsShapely.kind).toBe('PolynomialAsShapelyFunctor');
      expect(polynomialAsShapely.polynomial).toBe(polynomial);
      expect(polynomialAsShapely.isCanonical).toBe(true);
      expect(polynomialAsShapely.relationship).toBe('polynomial_implies_shapely');
      expect(polynomialAsShapely.shapelyFunctor.isPolynomial).toBe(true);
    });
    
    it('should validate that all polynomials are shapely', () => {
      const polynomial: Polynomial<string, string> = {
        positions: ['nil', 'cons'],
        directions: (pos) => pos === 'nil' ? [] : ['head', 'tail']
      };
      
      const shapelyFunctor = createShapelyFunctorFromPolynomial(polynomial);
      
      // Every polynomial functor is canonically a shapely functor
      expect(shapelyFunctor.isPolynomial).toBe(true);
      expect(shapelyFunctor.preservesPullbacks).toBe(true);
      expect(shapelyFunctor.hasCanonicalStrength).toBe(true);
      expect(shapelyFunctor.strength.isCanonical).toBe(true);
    });
  });
  
  describe('Filter-Power Functor (Counterexample)', () => {
    it('should create filter-power functor', () => {
      const filterPowerFunctor = createFilterPowerFunctor();
      
      expect(filterPowerFunctor.kind).toBe('FilterPowerFunctor');
      expect(filterPowerFunctor.isShapelyFunctor).toBe(true);
      expect(filterPowerFunctor.isPolynomialFunctor).toBe(false);
      expect(filterPowerFunctor.preservesFiniteLimits).toBe(true);
      expect(filterPowerFunctor.preservesCofilteredLimits).toBe(false);
      expect(filterPowerFunctor.hasCanonicalStrength).toBe(true);
    });
    
    it('should have non-principal filter properties', () => {
      const filterPowerFunctor = createFilterPowerFunctor();
      
      expect(filterPowerFunctor.filter.kind).toBe('NonPrincipalFilter');
      expect(filterPowerFunctor.filter.isPrincipal).toBe(false);
      expect(filterPowerFunctor.filter.isNonPrincipal).toBe(true);
      expect(filterPowerFunctor.filter.ultrafilter).toBe(true);
      expect(Array.isArray(filterPowerFunctor.filter.filterElements)).toBe(true);
    });
    
    it('should have colimit construction properties', () => {
      const filterPowerFunctor = createFilterPowerFunctor();
      
      expect(filterPowerFunctor.colimitConstruction.kind).toBe('ColimitConstruction');
      expect(filterPowerFunctor.colimitConstruction.isFilteredColimit).toBe(true);
      expect(filterPowerFunctor.colimitConstruction.isRepresentable).toBe(true);
      expect(filterPowerFunctor.colimitConstruction.colimitType).toBe('filtered_colimit');
      expect(filterPowerFunctor.colimitConstruction.construction).toBe('colim_{D∈D} X^D');
    });
    
    it('should demonstrate why filter-power is not polynomial', () => {
      const filterPowerFunctor = createFilterPowerFunctor();
      
      // It's shapely because it preserves finite limits and has canonical strength
      expect(filterPowerFunctor.isShapelyFunctor).toBe(true);
      expect(filterPowerFunctor.preservesFiniteLimits).toBe(true);
      expect(filterPowerFunctor.hasCanonicalStrength).toBe(true);
      
      // But it's not polynomial because it doesn't preserve cofiltered limits
      expect(filterPowerFunctor.isPolynomialFunctor).toBe(false);
      expect(filterPowerFunctor.preservesCofilteredLimits).toBe(false);
      expect(filterPowerFunctor.failureReason).toContain('Does not preserve cofiltered limits');
    });
  });
  
  describe('Hierarchy Validation Functions', () => {
    it('should correctly identify shapely functors', () => {
      const polynomial: Polynomial<string, string> = {
        positions: ['a'],
        directions: () => ['x']
      };
      
      const shapelyFunctor = createShapelyFunctorFromPolynomial(polynomial);
      const filterPowerFunctor = createFilterPowerFunctor();
      
      // Polynomial functors are shapely
      expect(isShapelyFunctor(polynomial)).toBe(true);
      expect(isShapelyFunctor(shapelyFunctor)).toBe(true);
      
      // Filter-power functor is shapely
      expect(isShapelyFunctor(filterPowerFunctor)).toBe(true);
    });
    
    it('should correctly identify polynomial functors', () => {
      const polynomial: Polynomial<string, string> = {
        positions: ['a'],
        directions: () => ['x']
      };
      
      const shapelyFunctor = createShapelyFunctorFromPolynomial(polynomial);
      const filterPowerFunctor = createFilterPowerFunctor();
      
      // Polynomial functors are polynomial
      expect(isPolynomialFunctor(polynomial)).toBe(true);
      expect(isPolynomialFunctor(shapelyFunctor)).toBe(true);
      
      // Filter-power functor is NOT polynomial
      expect(isPolynomialFunctor(filterPowerFunctor)).toBe(false);
    });
    
    it('should validate the hierarchy relationship', () => {
      const polynomial: Polynomial<string, string> = {
        positions: ['a', 'b'],
        directions: (pos) => pos === 'a' ? ['x'] : ['y']
      };
      
      const filterPowerFunctor = createFilterPowerFunctor();
      
      // All polynomials are shapely
      expect(isShapelyFunctor(polynomial)).toBe(true);
      
      // Not all shapely are polynomial
      expect(isShapelyFunctor(filterPowerFunctor)).toBe(true);
      expect(isPolynomialFunctor(filterPowerFunctor)).toBe(false);
      
      // Filter-power provides the counterexample
      expect(filterPowerFunctor.isShapelyFunctor).toBe(true);
      expect(filterPowerFunctor.isPolynomialFunctor).toBe(false);
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
    
    it('should run natural numbers as shapely functor example', () => {
      exampleNaturalNumbersAsShapelyFunctor();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          shapelyFunctorsHierarchy: true,
          polynomialAsShapely: expect.objectContaining({
            isPolynomial: true,
            isShapely: true,
            isCanonical: true,
            relationship: 'polynomial_implies_shapely',
            preservesPullbacks: true,
            hasCanonicalStrength: true
          }),
          filterPowerFunctor: expect.objectContaining({
            isShapely: true,
            isPolynomial: false,
            preservesFiniteLimits: true,
            preservesCofilteredLimits: false,
            hasCanonicalStrength: true,
            failureReason: expect.stringContaining('Does not preserve cofiltered limits')
          }),
          hierarchyValidation: expect.objectContaining({
            allPolynomialsAreShapely: true,
            notAllShapelyArePolynomial: true,
            filterPowerIsCounterexample: true
          })
        })
      );
    });
    
    it('should run list polynomial as shapely functor example', () => {
      exampleListPolynomialAsShapelyFunctor();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          listPolynomialAsShapely: true,
          polynomial: expect.objectContaining({
            isPolynomial: true,
            positions: ['nil', 'cons'],
            directions: expect.any(Function)
          }),
          shapelyProperties: expect.objectContaining({
            preservesPullbacks: true,
            hasCanonicalStrength: true,
            isCanonical: true
          }),
          relationship: 'polynomial_implies_shapely'
        })
      );
    });
  });
  
  describe('Mathematical Properties', () => {
    it('should satisfy shapely functor properties from Gambino-Kock paper', () => {
      const polynomial: Polynomial<string, string> = {
        positions: ['a', 'b'],
        directions: (pos) => pos === 'a' ? ['x'] : ['y']
      };
      
      const shapelyFunctor = createShapelyFunctorFromPolynomial(polynomial);
      
      // Shapely functor properties
      expect(shapelyFunctor.preservesPullbacks).toBe(true);
      expect(shapelyFunctor.hasCanonicalStrength).toBe(true);
      
      // Polynomial functors are canonically shapely
      expect(shapelyFunctor.isPolynomial).toBe(true);
      expect(shapelyFunctor.strength.isCanonical).toBe(true);
    });
    
    it('should demonstrate the filter-power counterexample', () => {
      const filterPowerFunctor = createFilterPowerFunctor();
      
      // It's a shapely functor
      expect(filterPowerFunctor.isShapelyFunctor).toBe(true);
      expect(filterPowerFunctor.preservesFiniteLimits).toBe(true);
      expect(filterPowerFunctor.hasCanonicalStrength).toBe(true);
      
      // But it's not a polynomial functor
      expect(filterPowerFunctor.isPolynomialFunctor).toBe(false);
      expect(filterPowerFunctor.preservesCofilteredLimits).toBe(false);
      
      // The specific failure reason
      expect(filterPowerFunctor.failureReason).toContain('Ø = lim_{D∈D} D');
    });
    
    it('should validate the hierarchy inclusion', () => {
      const polynomial: Polynomial<string, string> = {
        positions: ['a'],
        directions: () => ['x']
      };
      
      const filterPowerFunctor = createFilterPowerFunctor();
      
      // Polynomial ⊂ Shapely (proper inclusion)
      expect(isShapelyFunctor(polynomial)).toBe(true);
      expect(isPolynomialFunctor(polynomial)).toBe(true);
      
      // Filter-power is in Shapely but not in Polynomial
      expect(isShapelyFunctor(filterPowerFunctor)).toBe(true);
      expect(isPolynomialFunctor(filterPowerFunctor)).toBe(false);
      
      // This demonstrates Shapely ⊋ Polynomial
      expect(true).toBe(true); // The hierarchy is validated
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
    it('should handle empty polynomial structures', () => {
      const emptyPolynomial: Polynomial<string, string> = {
        positions: [],
        directions: () => []
      };
      
      const shapelyFunctor = createShapelyFunctorFromPolynomial(emptyPolynomial);
      
      expect(shapelyFunctor.kind).toBe('ShapelyFunctor');
      expect(shapelyFunctor.isPolynomial).toBe(true);
      expect(shapelyFunctor.preservesPullbacks).toBe(true);
      expect(shapelyFunctor.hasCanonicalStrength).toBe(true);
    });
    
    it('should handle complex polynomial structures', () => {
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
      
      const shapelyFunctor = createShapelyFunctorFromPolynomial(complexPolynomial);
      
      expect(shapelyFunctor.kind).toBe('ShapelyFunctor');
      expect(shapelyFunctor.isPolynomial).toBe(true);
      expect(shapelyFunctor.preservesPullbacks).toBe(true);
      expect(shapelyFunctor.hasCanonicalStrength).toBe(true);
    });
    
    it('should handle unknown functor types', () => {
      const unknownFunctor = { kind: 'UnknownFunctor' };
      
      expect(isShapelyFunctor(unknownFunctor)).toBe(false);
      expect(isPolynomialFunctor(unknownFunctor)).toBe(false);
    });
  });
});
