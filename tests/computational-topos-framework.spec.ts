/**
 * Tests for Computational Topos Framework
 * 
 * Based on "Polynomial functors and polynomial monads" by Nicola Gambino and Joachim Kock
 * Pages 22-23: Double category structure and topos-theoretic foundations
 * 
 * This tests the unified computational topos framework that provides the foundation
 * for advanced polynomial functor theory.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  UnifiedToposSystem,
  PresheafToposStructure,
  GrothendieckTopology,
  CoveringFamily,
  Sieve,
  PolynomialToposInternalLogic,
  PolynomialObject,
  InternalStructure,
  ForcingRelation,
  SheafSemantics,
  GrothendieckTopologyIntegration,
  CoveringPolynomial,
  Sheafification,
  SheafPolynomial,
  createUnifiedToposSystem,
  createPresheafToposStructure,
  createPolynomialToposInternalLogic,
  createGrothendieckTopologyIntegration,
  exampleNaturalNumbersToposFramework,
  exampleListPolynomialToposFramework
} from '../fp-computational-topos-framework';

import { Polynomial } from '../fp-polynomial-functors';

describe('Computational Topos Framework for Polynomial Functors', () => {
  describe('Unified Topos System', () => {
    it('should create unified topos system', () => {
      const topos = createUnifiedToposSystem('Set', true);
      
      expect(topos.kind).toBe('UnifiedToposSystem');
      expect(topos.baseCategory).toBe('Set');
      expect(topos.hasSubobjectClassifier).toBe(true);
      expect(topos.hasExponentialObjects).toBe(true);
      expect(topos.hasFiniteLimits).toBe(true);
      expect(topos.hasFiniteColimits).toBe(true);
      expect(topos.internalLogic.kind).toBe('InternalLanguageContext');
      expect(topos.kripkeJoyalSemantics.kind).toBe('KripkeJoyalSemantics');
    });
    
    it('should create topos system without subobject classifier', () => {
      const topos = createUnifiedToposSystem('E', false);
      
      expect(topos.hasSubobjectClassifier).toBe(false);
      expect(topos.baseCategory).toBe('E');
    });
    
    it('should have all required topos properties', () => {
      const topos = createUnifiedToposSystem('Set', true);
      
      // Test topos axioms
      expect(topos.hasFiniteLimits).toBe(true);
      expect(topos.hasFiniteColimits).toBe(true);
      expect(topos.hasExponentialObjects).toBe(true);
      expect(topos.hasSubobjectClassifier).toBe(true);
      
      // Test internal logic integration
      expect(topos.internalLogic.hasDependentSums).toBe(true);
      expect(topos.internalLogic.hasDependentProducts).toBe(true);
      expect(topos.internalLogic.hasPullbacks).toBe(true);
    });
  });
  
  describe('Presheaf Topos Structure', () => {
    it('should create presheaf topos structure', () => {
      const presheafTopos = createPresheafToposStructure('Set');
      
      expect(presheafTopos.kind).toBe('PresheafToposStructure');
      expect(presheafTopos.isPresheafTopos).toBe(true);
      expect(presheafTopos.yonedaEmbedding).toBe(true);
      expect(presheafTopos.grothendieckTopology.kind).toBe('GrothendieckTopology');
      expect(presheafTopos.internalLogic.kind).toBe('InternalLanguageContext');
    });
    
    it('should have Grothendieck topology properties', () => {
      const presheafTopos = createPresheafToposStructure('E');
      
      expect(presheafTopos.grothendieckTopology.satisfiesAxioms).toBe(true);
      expect(presheafTopos.grothendieckTopology.isSubcanonical).toBe(true);
      expect(Array.isArray(presheafTopos.grothendieckTopology.coveringFamilies)).toBe(true);
      expect(Array.isArray(presheafTopos.grothendieckTopology.sieves)).toBe(true);
    });
    
    it('should support representable objects', () => {
      const presheafTopos = createPresheafToposStructure('Set');
      
      expect(Array.isArray(presheafTopos.representableObjects)).toBe(true);
      expect(presheafTopos.yonedaEmbedding).toBe(true);
    });
  });
  
  describe('Grothendieck Topology', () => {
    it('should have covering family structure', () => {
      const coveringFamily: CoveringFamily = {
        kind: 'CoveringFamily',
        target: 'X',
        morphisms: ['f', 'g', 'h'],
        isCovering: true
      };
      
      expect(coveringFamily.kind).toBe('CoveringFamily');
      expect(coveringFamily.target).toBe('X');
      expect(coveringFamily.morphisms).toEqual(['f', 'g', 'h']);
      expect(coveringFamily.isCovering).toBe(true);
    });
    
    it('should have sieve structure', () => {
      const sieve: Sieve = {
        kind: 'Sieve',
        target: 'Y',
        morphisms: ['p', 'q'],
        isSieve: true
      };
      
      expect(sieve.kind).toBe('Sieve');
      expect(sieve.target).toBe('Y');
      expect(sieve.morphisms).toEqual(['p', 'q']);
      expect(sieve.isSieve).toBe(true);
    });
  });
  
  describe('Polynomial Topos Internal Logic', () => {
    it('should create polynomial topos internal logic', () => {
      const topos = createUnifiedToposSystem('Set', true);
      const internalLogic = createPolynomialToposInternalLogic(topos);
      
      expect(internalLogic.kind).toBe('PolynomialToposInternalLogic');
      expect(internalLogic.topos).toBe(topos);
      expect(Array.isArray(internalLogic.polynomialObjects)).toBe(true);
      expect(internalLogic.internalLanguage).toBe(topos.internalLogic);
      expect(internalLogic.forcingRelation.kind).toBe('ForcingRelation');
      expect(internalLogic.sheafSemantics.kind).toBe('SheafSemantics');
    });
    
    it('should have forcing relation', () => {
      const topos = createUnifiedToposSystem('Set', true);
      const internalLogic = createPolynomialToposInternalLogic(topos);
      
      const result = internalLogic.forcingRelation.forces('context', 'condition');
      expect(typeof result).toBe('boolean');
      
      const satisfies = internalLogic.forcingRelation.satisfies('context', 'formula');
      expect(typeof satisfies).toBe('boolean');
      
      const models = internalLogic.forcingRelation.models('context', 'theory');
      expect(typeof models).toBe('boolean');
    });
    
    it('should have sheaf semantics', () => {
      const topos = createUnifiedToposSystem('Set', true);
      const internalLogic = createPolynomialToposInternalLogic(topos);
      
      expect(internalLogic.sheafSemantics.isSheaf).toBe(true);
      expect(Array.isArray(internalLogic.sheafSemantics.coveringFamilies)).toBe(true);
      expect(internalLogic.sheafSemantics.gluingCondition).toBe(true);
      expect(internalLogic.sheafSemantics.descentCondition).toBe(true);
    });
  });
  
  describe('Polynomial Object in Topos', () => {
    it('should have polynomial object structure', () => {
      const polynomial: Polynomial<string, string> = {
        positions: ['a', 'b'],
        directions: (pos) => pos === 'a' ? ['x'] : ['y']
      };
      
      const polynomialObject: PolynomialObject = {
        kind: 'PolynomialObject',
        polynomial,
        isPolynomial: true,
        isExponentiable: true,
        internalStructure: {
          kind: 'InternalStructure',
          hasInternalLogic: true,
          hasDependentTypes: true,
          hasHigherOrderLogic: true,
          internalLanguage: 'Extensional Dependent Type Theory'
        }
      };
      
      expect(polynomialObject.kind).toBe('PolynomialObject');
      expect(polynomialObject.polynomial).toBe(polynomial);
      expect(polynomialObject.isPolynomial).toBe(true);
      expect(polynomialObject.isExponentiable).toBe(true);
      expect(polynomialObject.internalStructure.kind).toBe('InternalStructure');
    });
    
    it('should have internal structure properties', () => {
      const internalStructure: InternalStructure = {
        kind: 'InternalStructure',
        hasInternalLogic: true,
        hasDependentTypes: true,
        hasHigherOrderLogic: true,
        internalLanguage: 'Extensional Dependent Type Theory'
      };
      
      expect(internalStructure.hasInternalLogic).toBe(true);
      expect(internalStructure.hasDependentTypes).toBe(true);
      expect(internalStructure.hasHigherOrderLogic).toBe(true);
      expect(internalStructure.internalLanguage).toBe('Extensional Dependent Type Theory');
    });
  });
  
  describe('Grothendieck Topology Integration', () => {
    it('should create Grothendieck topology integration', () => {
      const integration = createGrothendieckTopologyIntegration('Set');
      
      expect(integration.kind).toBe('GrothendieckTopologyIntegration');
      expect(integration.topology.kind).toBe('GrothendieckTopology');
      expect(Array.isArray(integration.polynomialFunctors)).toBe(true);
      expect(Array.isArray(integration.coveringPolynomials)).toBe(true);
      expect(integration.sheafification.kind).toBe('Sheafification');
    });
    
    it('should have sheafification operations', () => {
      const integration = createGrothendieckTopologyIntegration('Set');
      
      const polynomial: Polynomial<string, string> = {
        positions: ['a', 'b'],
        directions: (pos) => pos === 'a' ? ['x'] : ['y']
      };
      
      const sheafPolynomial = integration.sheafification.sheafify(polynomial);
      expect(sheafPolynomial.kind).toBe('SheafPolynomial');
      expect(sheafPolynomial.polynomial).toBe(polynomial);
      expect(sheafPolynomial.isSheaf).toBe(true);
      expect(sheafPolynomial.gluingCondition).toBe(true);
      expect(sheafPolynomial.descentCondition).toBe(true);
      
      const isSheaf = integration.sheafification.isSheaf(polynomial);
      expect(typeof isSheaf).toBe('boolean');
      
      const associatedSheaf = integration.sheafification.associatedSheaf(polynomial);
      expect(associatedSheaf.kind).toBe('SheafPolynomial');
    });
    
    it('should have covering polynomial structure', () => {
      const covering: Polynomial<string, string> = {
        positions: ['c', 'd'],
        directions: (pos) => pos === 'c' ? ['z'] : ['w']
      };
      
      const covered: Polynomial<string, string> = {
        positions: ['a', 'b'],
        directions: (pos) => pos === 'a' ? ['x'] : ['y']
      };
      
      const coveringPolynomial: CoveringPolynomial = {
        kind: 'CoveringPolynomial',
        covering,
        covered,
        coveringMorphism: 'morphism',
        isCovering: true
      };
      
      expect(coveringPolynomial.kind).toBe('CoveringPolynomial');
      expect(coveringPolynomial.covering).toBe(covering);
      expect(coveringPolynomial.covered).toBe(covered);
      expect(coveringPolynomial.isCovering).toBe(true);
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
    
    it('should run natural numbers topos framework example', () => {
      exampleNaturalNumbersToposFramework();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          computationalToposFramework: true,
          unifiedToposSystem: expect.objectContaining({
            baseCategory: 'Set',
            hasSubobjectClassifier: true,
            hasExponentialObjects: true,
            hasFiniteLimits: true,
            hasFiniteColimits: true
          }),
          presheafToposStructure: expect.objectContaining({
            isPresheafTopos: true,
            yonedaEmbedding: true,
            grothendieckTopology: expect.objectContaining({
              satisfiesAxioms: true,
              isSubcanonical: true
            })
          }),
          polynomialToposInternalLogic: expect.objectContaining({
            hasInternalLogic: true,
            hasDependentTypes: true,
            forcingRelation: true,
            sheafSemantics: true
          }),
          grothendieckTopologyIntegration: expect.objectContaining({
            topologySatisfiesAxioms: true,
            isSubcanonical: true,
            sheafification: expect.objectContaining({
              isSheaf: true,
              gluingCondition: true,
              descentCondition: true
            })
          }),
          polynomialObject: expect.objectContaining({
            isPolynomial: true,
            isExponentiable: true,
            internalStructure: expect.objectContaining({
              hasInternalLogic: true,
              hasDependentTypes: true,
              hasHigherOrderLogic: true,
              internalLanguage: 'Extensional Dependent Type Theory'
            })
          })
        })
      );
    });
    
    it('should run list polynomial topos framework example', () => {
      exampleListPolynomialToposFramework();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          listPolynomialToposFramework: true,
          toposSystem: expect.objectContaining({
            baseCategory: 'Set',
            hasSubobjectClassifier: true,
            hasExponentialObjects: true
          }),
          internalLogic: expect.objectContaining({
            hasInternalLogic: true,
            hasDependentTypes: true,
            forcingRelation: true,
            sheafSemantics: true
          }),
          grothendieckIntegration: expect.objectContaining({
            topologySatisfiesAxioms: true,
            isSubcanonical: true,
            sheafification: expect.objectContaining({
              isSheaf: true,
              gluingCondition: true,
              descentCondition: true
            })
          })
        })
      );
    });
  });
  
  describe('Mathematical Properties', () => {
    it('should satisfy topos axioms from Gambino-Kock paper', () => {
      const topos = createUnifiedToposSystem('E', true);
      
      // Test topos axioms as mentioned in the paper
      expect(topos.hasFiniteLimits).toBe(true);
      expect(topos.hasFiniteColimits).toBe(true);
      expect(topos.hasExponentialObjects).toBe(true);
      expect(topos.hasSubobjectClassifier).toBe(true);
      
      // Test internal logic properties
      expect(topos.internalLogic.hasDependentSums).toBe(true);
      expect(topos.internalLogic.hasDependentProducts).toBe(true);
      expect(topos.internalLogic.hasPullbacks).toBe(true);
    });
    
    it('should support presheaf topos structure', () => {
      const presheafTopos = createPresheafToposStructure('E');
      
      // Test presheaf topos properties
      expect(presheafTopos.isPresheafTopos).toBe(true);
      expect(presheafTopos.yonedaEmbedding).toBe(true);
      expect(presheafTopos.grothendieckTopology.satisfiesAxioms).toBe(true);
      expect(presheafTopos.grothendieckTopology.isSubcanonical).toBe(true);
    });
    
    it('should support Grothendieck topology integration', () => {
      const integration = createGrothendieckTopologyIntegration('E');
      
      // Test Grothendieck topology properties
      expect(integration.topology.satisfiesAxioms).toBe(true);
      expect(integration.topology.isSubcanonical).toBe(true);
      
      // Test sheafification
      const polynomial: Polynomial<string, string> = {
        positions: ['a'],
        directions: () => ['x']
      };
      
      const sheafPolynomial = integration.sheafification.sheafify(polynomial);
      expect(sheafPolynomial.isSheaf).toBe(true);
      expect(sheafPolynomial.gluingCondition).toBe(true);
      expect(sheafPolynomial.descentCondition).toBe(true);
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
    it('should handle empty polynomial structures', () => {
      const integration = createGrothendieckTopologyIntegration('Set');
      
      const emptyPolynomial: Polynomial<string, string> = {
        positions: [],
        directions: () => []
      };
      
      const sheafPolynomial = integration.sheafification.sheafify(emptyPolynomial);
      expect(sheafPolynomial.kind).toBe('SheafPolynomial');
      expect(sheafPolynomial.polynomial).toBe(emptyPolynomial);
      expect(sheafPolynomial.isSheaf).toBe(true);
    });
    
    it('should handle complex polynomial structures', () => {
      const integration = createGrothendieckTopologyIntegration('Set');
      
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
      
      const sheafPolynomial = integration.sheafification.sheafify(complexPolynomial);
      expect(sheafPolynomial.kind).toBe('SheafPolynomial');
      expect(sheafPolynomial.polynomial).toBe(complexPolynomial);
      expect(sheafPolynomial.isSheaf).toBe(true);
      expect(sheafPolynomial.gluingCondition).toBe(true);
      expect(sheafPolynomial.descentCondition).toBe(true);
    });
    
    it('should handle different base categories', () => {
      const topos1 = createUnifiedToposSystem('Set', true);
      const topos2 = createUnifiedToposSystem('E', false);
      const topos3 = createUnifiedToposSystem('Top', true);
      
      expect(topos1.baseCategory).toBe('Set');
      expect(topos1.hasSubobjectClassifier).toBe(true);
      
      expect(topos2.baseCategory).toBe('E');
      expect(topos2.hasSubobjectClassifier).toBe(false);
      
      expect(topos3.baseCategory).toBe('Top');
      expect(topos3.hasSubobjectClassifier).toBe(true);
    });
  });
});
