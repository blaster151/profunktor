/**
 * Tests for Seven Equivalent Characterizations of Polynomial Functors
 * 
 * Based on "Polynomial functors and polynomial monads" by Nicola Gambino and Joachim Kock
 * Page 11 - Section 1.18: Seven equivalent conditions for polynomial functors
 * 
 * This tests the complete unified framework for polynomial functor theory.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  SevenEquivalentCharacterizations,
  createSevenEquivalentCharacterizations,
  verifySevenCharacterizations,
  exampleSevenCharacterizations,
  exampleListPolynomial
} from '../fp-seven-equivalent-characterizations';

import { Polynomial } from '../fp-polynomial-functors';

describe('Seven Equivalent Characterizations of Polynomial Functors', () => {
  describe('Core Interface', () => {
    it('should create seven equivalent characterizations', () => {
      const polynomial: Polynomial<string, string> = {
        positions: ['zero', 'succ'],
        directions: (pos) => pos === 'zero' ? [] : ['n']
      };
      
      const characterizations = createSevenEquivalentCharacterizations(polynomial);
      
      expect(characterizations.kind).toBe('SevenEquivalentCharacterizations');
      expect(characterizations.polynomial).toBe(polynomial);
      expect(characterizations.characterizations.isPolynomial).toBe(true);
    });
    
    it('should have all seven characterizations', () => {
      const polynomial: Polynomial<string, string> = {
        positions: ['nil', 'cons'],
        directions: (pos) => pos === 'nil' ? [] : ['head', 'tail']
      };
      
      const characterizations = createSevenEquivalentCharacterizations(polynomial);
      
      // (i) Standard polynomial form
      expect(characterizations.characterizations.isPolynomial).toBe(true);
      expect(characterizations.characterizations.standardForm.kind).toBe('StandardPolynomialForm');
      
      // (ii) Preserves connected limits
      expect(characterizations.characterizations.preservesConnectedLimits).toBe(true);
      expect(characterizations.characterizations.limitPreservation.pullbacks).toBe(true);
      expect(characterizations.characterizations.limitPreservation.cofilteredLimits).toBe(true);
      expect(characterizations.characterizations.limitPreservation.widePullbacks).toBe(true);
      expect(characterizations.characterizations.limitPreservation.cartesian).toBe(true);
      
      // (iii) Familially representable
      expect(characterizations.characterizations.isFamiliallyRepresentable).toBe(true);
      expect(characterizations.characterizations.familiallyRepresentable.kind).toBe('FamiliallyRepresentableFunctor');
      
      // (iv) Comma category is presheaf topos
      expect(characterizations.characterizations.commaCategoryIsPresheafTopos).toBe(true);
      expect(characterizations.characterizations.presheafToposCharacterization.kind).toBe('PolynomialCharacterization');
      
      // (v) Local right adjoint
      expect(characterizations.characterizations.isLocalRightAdjoint).toBe(true);
      expect(characterizations.characterizations.localRightAdjoint.kind).toBe('LocalRightAdjoint');
      
      // (vi) Strict generic factorisations
      expect(characterizations.characterizations.admitsStrictGenericFactorizations).toBe(true);
      expect(characterizations.characterizations.strictGenericFactorizations.hasFactorizations).toBe(true);
      expect(characterizations.characterizations.strictGenericFactorizations.uniqueness).toBe(true);
      
      // (vii) Every slice has initial object
      expect(characterizations.characterizations.everySliceHasInitialObject).toBe(true);
      expect(characterizations.characterizations.normalFormProperty.kind).toBe('NormalFunctor');
    });
  });
  
  describe('Equivalence Proofs', () => {
    it('should verify all characterizations are equivalent', () => {
      const polynomial: Polynomial<string, string> = {
        positions: ['zero', 'succ'],
        directions: (pos) => pos === 'zero' ? [] : ['n']
      };
      
      const characterizations = createSevenEquivalentCharacterizations(polynomial);
      
      expect(characterizations.equivalenceProofs.allEquivalent).toBe(true);
      expect(characterizations.equivalenceProofs.proofSteps).toHaveLength(7);
      expect(characterizations.equivalenceProofs.verificationResults.i_implies_ii).toBe(true);
      expect(characterizations.equivalenceProofs.verificationResults.ii_implies_iii).toBe(true);
      expect(characterizations.equivalenceProofs.verificationResults.iii_implies_iv).toBe(true);
      expect(characterizations.equivalenceProofs.verificationResults.iv_implies_v).toBe(true);
      expect(characterizations.equivalenceProofs.verificationResults.v_implies_vi).toBe(true);
      expect(characterizations.equivalenceProofs.verificationResults.vi_implies_vii).toBe(true);
      expect(characterizations.equivalenceProofs.verificationResults.vii_implies_i).toBe(true);
    });
    
    it('should provide detailed proof steps', () => {
      const polynomial: Polynomial<string, string> = {
        positions: ['nil', 'cons'],
        directions: (pos) => pos === 'nil' ? [] : ['head', 'tail']
      };
      
      const characterizations = createSevenEquivalentCharacterizations(polynomial);
      
      const proofSteps = characterizations.equivalenceProofs.proofSteps;
      
      expect(proofSteps[0]).toContain('(i) → (ii)');
      expect(proofSteps[1]).toContain('(ii) → (iii)');
      expect(proofSteps[2]).toContain('(iii) → (iv)');
      expect(proofSteps[3]).toContain('(iv) → (v)');
      expect(proofSteps[4]).toContain('(v) → (vi)');
      expect(proofSteps[5]).toContain('(vi) → (vii)');
      expect(proofSteps[6]).toContain('(vii) → (i)');
    });
  });
  
  describe('Advanced Connections', () => {
    it('should have topos theory connections', () => {
      const polynomial: Polynomial<string, string> = {
        positions: ['zero', 'succ'],
        directions: (pos) => pos === 'zero' ? [] : ['n']
      };
      
      const characterizations = createSevenEquivalentCharacterizations(polynomial);
      
      expect(characterizations.advancedConnections.toposTheory.isPresheafTopos).toBe(true);
      expect(characterizations.advancedConnections.toposTheory.internalLogic).toBe(true);
      expect(characterizations.advancedConnections.toposTheory.yonedaEmbedding).toBe(true);
      expect(characterizations.advancedConnections.toposTheory.grothendieckFibration).toBe(true);
    });
    
    it('should have synthetic differential geometry connections', () => {
      const polynomial: Polynomial<string, string> = {
        positions: ['nil', 'cons'],
        directions: (pos) => pos === 'nil' ? [] : ['head', 'tail']
      };
      
      const characterizations = createSevenEquivalentCharacterizations(polynomial);
      
      expect(characterizations.advancedConnections.syntheticDifferentialGeometry.exponentiableMaps).toBe(true);
      expect(characterizations.advancedConnections.syntheticDifferentialGeometry.infinitesimalObjects).toBe(true);
      expect(characterizations.advancedConnections.syntheticDifferentialGeometry.tangentSpaces).toBe(true);
      expect(characterizations.advancedConnections.syntheticDifferentialGeometry.smoothTopos).toBe(true);
    });
    
    it('should have internal logic connections', () => {
      const polynomial: Polynomial<string, string> = {
        positions: ['zero', 'succ'],
        directions: (pos) => pos === 'zero' ? [] : ['n']
      };
      
      const characterizations = createSevenEquivalentCharacterizations(polynomial);
      
      expect(characterizations.advancedConnections.internalLogic.hasInternalLanguage).toBe(true);
      expect(characterizations.advancedConnections.internalLogic.kripkeJoyalSemantics).toBe(true);
      expect(characterizations.advancedConnections.internalLogic.forcing).toBe(true);
      expect(characterizations.advancedConnections.internalLogic.sheafSemantics).toBe(true);
    });
  });
  
  describe('Verification Function', () => {
    it('should verify seven characterizations with detailed report', () => {
      const polynomial: Polynomial<string, string> = {
        positions: ['nil', 'cons'],
        directions: (pos) => pos === 'nil' ? [] : ['head', 'tail']
      };
      
      const verification = verifySevenCharacterizations(polynomial);
      
      expect(verification.allEquivalent).toBe(true);
      expect(verification.characterizations.kind).toBe('SevenEquivalentCharacterizations');
      expect(verification.verificationReport).toContain('SEVEN EQUIVALENT CHARACTERIZATIONS VERIFICATION REPORT');
      expect(verification.verificationReport).toContain('ALL SEVEN CHARACTERIZATIONS ARE EQUIVALENT');
      expect(verification.verificationReport).toContain('Topos Theory: ✓');
      expect(verification.verificationReport).toContain('Synthetic Differential Geometry: ✓');
      expect(verification.verificationReport).toContain('Internal Logic: ✓');
    });
    
    it('should provide comprehensive verification results', () => {
      const polynomial: Polynomial<string, string> = {
        positions: ['zero', 'succ'],
        directions: (pos) => pos === 'zero' ? [] : ['n']
      };
      
      const verification = verifySevenCharacterizations(polynomial);
      
      expect(verification.verificationReport).toContain('✓ (i) Standard polynomial form: true');
      expect(verification.verificationReport).toContain('✓ (ii) Preserves connected limits: true');
      expect(verification.verificationReport).toContain('✓ (iii) Familially representable: true');
      expect(verification.verificationReport).toContain('✓ (iv) Comma category is presheaf topos: true');
      expect(verification.verificationReport).toContain('✓ (v) Local right adjoint: true');
      expect(verification.verificationReport).toContain('✓ (vi) Strict generic factorisations: true');
      expect(verification.verificationReport).toContain('✓ (vii) Every slice has initial object: true');
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
    
    it('should run natural numbers polynomial example', () => {
      exampleSevenCharacterizations();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          sevenEquivalentCharacterizations: true,
          allEquivalent: true,
          characterizations: expect.objectContaining({
            isPolynomial: true,
            preservesConnectedLimits: true,
            isFamiliallyRepresentable: true,
            commaCategoryIsPresheafTopos: true,
            isLocalRightAdjoint: true,
            admitsStrictGenericFactorizations: true,
            everySliceHasInitialObject: true
          }),
          advancedConnections: expect.objectContaining({
            toposTheory: true,
            syntheticDifferentialGeometry: true,
            internalLogic: true
          })
        })
      );
    });
    
    it('should run list polynomial example', () => {
      exampleListPolynomial();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          listPolynomialSevenCharacterizations: true,
          allEquivalent: true,
          polynomialStructure: expect.objectContaining({
            positions: ['nil', 'cons'],
            directions: ['head', 'tail']
          })
        })
      );
    });
  });
  
  describe('Mathematical Properties', () => {
    it('should satisfy all seven equivalent conditions', () => {
      const polynomial: Polynomial<string, string> = {
        positions: ['zero', 'succ'],
        directions: (pos) => pos === 'zero' ? [] : ['n']
      };
      
      const verification = verifySevenCharacterizations(polynomial);
      
      // All seven characterizations should be true
      expect(verification.characterizations.characterizations.isPolynomial).toBe(true);
      expect(verification.characterizations.characterizations.preservesConnectedLimits).toBe(true);
      expect(verification.characterizations.characterizations.isFamiliallyRepresentable).toBe(true);
      expect(verification.characterizations.characterizations.commaCategoryIsPresheafTopos).toBe(true);
      expect(verification.characterizations.characterizations.isLocalRightAdjoint).toBe(true);
      expect(verification.characterizations.characterizations.admitsStrictGenericFactorizations).toBe(true);
      expect(verification.characterizations.characterizations.everySliceHasInitialObject).toBe(true);
      
      // All should be equivalent
      expect(verification.allEquivalent).toBe(true);
    });
    
    it('should provide foundation for advanced mathematical structures', () => {
      const polynomial: Polynomial<string, string> = {
        positions: ['nil', 'cons'],
        directions: (pos) => pos === 'nil' ? [] : ['head', 'tail']
      };
      
      const characterizations = createSevenEquivalentCharacterizations(polynomial);
      
      // Foundation for topos theory
      expect(characterizations.advancedConnections.toposTheory.isPresheafTopos).toBe(true);
      
      // Foundation for synthetic differential geometry
      expect(characterizations.advancedConnections.syntheticDifferentialGeometry.exponentiableMaps).toBe(true);
      
      // Foundation for internal logic
      expect(characterizations.advancedConnections.internalLogic.hasInternalLanguage).toBe(true);
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
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
      
      const verification = verifySevenCharacterizations(complexPolynomial);
      
      expect(verification.allEquivalent).toBe(true);
      expect(verification.characterizations.characterizations.isPolynomial).toBe(true);
    });
    
    it('should handle empty polynomial structures', () => {
      const emptyPolynomial: Polynomial<string, string> = {
        positions: [],
        directions: () => []
      };
      
      const verification = verifySevenCharacterizations(emptyPolynomial);
      
      expect(verification.allEquivalent).toBe(true);
      expect(verification.characterizations.characterizations.isPolynomial).toBe(true);
    });
  });
});
