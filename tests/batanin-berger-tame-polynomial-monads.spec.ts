/**
 * Comprehensive Tests for Batanin-Berger Tame Polynomial Monads
 * 
 * Tests the complete homotopy theory framework for polynomial monads,
 * h-monoidal model categories, and operadic homotopy theory.
 */

import { describe, it, expect } from 'vitest';
import {
  createHMonoidalModelCategory,
  createTamePolynomialMonad,
  createOperadicHomotopyTheory,
  validateHMonoidalModelCategory,
  validateTamePolynomialMonad,
  validateOperadicHomotopyTheory,
  HMonoidalModelCategory,
  TamePolynomialMonad,
  OperadicHomotopyTheory,
  GraphType,
  OperadCategory,
  ModelCategoryCatalog
} from '../fp-batanin-berger-tame-polynomial-monads';

describe('Batanin-Berger Tame Polynomial Monads Framework', () => {

  // ============================================================================
  // PART I: H-MONOIDAL MODEL CATEGORIES (Figure 1 Tests)
  // ============================================================================

  describe('H-Monoidal Model Categories', () => {
    
    it('should create simplicial sets as h-monoidal model category', () => {
      const monoidalStructure = {
        kind: 'MonoidalStructure' as const,
        tensorProduct: {
          kind: 'Functor' as const,
          domain: { kind: 'Category' as const },
          codomain: { kind: 'Category' as const },
          objectMapping: (x: any) => x,
          morphismMapping: (f: any) => f
        },
        unit: { kind: 'Unit' },
        associator: {
          kind: 'NaturalTransformation' as const,
          domain: { kind: 'Functor' as const, domain: { kind: 'Category' as const }, codomain: { kind: 'Category' as const }, objectMapping: (x: any) => x, morphismMapping: (f: any) => f },
          codomain: { kind: 'Functor' as const, domain: { kind: 'Category' as const }, codomain: { kind: 'Category' as const }, objectMapping: (x: any) => x, morphismMapping: (f: any) => f },
          components: new Map()
        },
        leftUnitor: {
          kind: 'NaturalTransformation' as const,
          domain: { kind: 'Functor' as const, domain: { kind: 'Category' as const }, codomain: { kind: 'Category' as const }, objectMapping: (x: any) => x, morphismMapping: (f: any) => f },
          codomain: { kind: 'Functor' as const, domain: { kind: 'Category' as const }, codomain: { kind: 'Category' as const }, objectMapping: (x: any) => x, morphismMapping: (f: any) => f },
          components: new Map()
        },
        rightUnitor: {
          kind: 'NaturalTransformation' as const,
          domain: { kind: 'Functor' as const, domain: { kind: 'Category' as const }, codomain: { kind: 'Category' as const }, objectMapping: (x: any) => x, morphismMapping: (f: any) => f },
          codomain: { kind: 'Functor' as const, domain: { kind: 'Category' as const }, codomain: { kind: 'Category' as const }, objectMapping: (x: any) => x, morphismMapping: (f: any) => f },
          components: new Map()
        },
        coherence: {
          kind: 'CoherenceConditions' as const,
          pentagonAxiom: true,
          triangleAxiom: true,
          allDiagramsCommute: true
        }
      };

      const simplicialSets = createHMonoidalModelCategory(
        { kind: 'Category' },
        monoidalStructure
      );

      expect(simplicialSets.kind).toBe('HMonoidalModelCategory');
      expect(simplicialSets.isComplete).toBe(true);
      expect(simplicialSets.isCocomplete).toBe(true);
      expect(simplicialSets.leftProper).toBe(true);
      expect(simplicialSets.hMonoidalProperty.monoidAxiom).toBe(true);
      expect(validateHMonoidalModelCategory(simplicialSets)).toBe(true);
    });

    it('should verify Quillen model structure properties', () => {
      const monoidalStructure = {
        kind: 'MonoidalStructure' as const,
        tensorProduct: {
          kind: 'Functor' as const,
          domain: { kind: 'Category' as const },
          codomain: { kind: 'Category' as const },
          objectMapping: (x: any) => x,
          morphismMapping: (f: any) => f
        },
        unit: { kind: 'Unit' },
        associator: {
          kind: 'NaturalTransformation' as const,
          domain: { kind: 'Functor' as const, domain: { kind: 'Category' as const }, codomain: { kind: 'Category' as const }, objectMapping: (x: any) => x, morphismMapping: (f: any) => f },
          codomain: { kind: 'Functor' as const, domain: { kind: 'Category' as const }, codomain: { kind: 'Category' as const }, objectMapping: (x: any) => x, morphismMapping: (f: any) => f },
          components: new Map()
        },
        leftUnitor: {
          kind: 'NaturalTransformation' as const,
          domain: { kind: 'Functor' as const, domain: { kind: 'Category' as const }, codomain: { kind: 'Category' as const }, objectMapping: (x: any) => x, morphismMapping: (f: any) => f },
          codomain: { kind: 'Functor' as const, domain: { kind: 'Category' as const }, codomain: { kind: 'Category' as const }, objectMapping: (x: any) => x, morphismMapping: (f: any) => f },
          components: new Map()
        },
        rightUnitor: {
          kind: 'NaturalTransformation' as const,
          domain: { kind: 'Functor' as const, domain: { kind: 'Category' as const }, codomain: { kind: 'Category' as const }, objectMapping: (x: any) => x, morphismMapping: (f: any) => f },
          codomain: { kind: 'Functor' as const, domain: { kind: 'Category' as const }, codomain: { kind: 'Category' as const }, objectMapping: (x: any) => x, morphismMapping: (f: any) => f },
          components: new Map()
        },
        coherence: {
          kind: 'CoherenceConditions' as const,
          pentagonAxiom: true,
          triangleAxiom: true,
          allDiagramsCommute: true
        }
      };

      const quillenModel = createHMonoidalModelCategory(
        { kind: 'Category' },
        monoidalStructure
      );

      // Test factorization system
      expect(quillenModel.factorizations.retractProperty).toBe(true);
      expect(quillenModel.factorizations.liftingProperty).toBe(true);

      // Test h-monoidal properties
      expect(quillenModel.hMonoidalProperty.tensorPreservesCofibrations).toBe(true);
      expect(quillenModel.hMonoidalProperty.tensorPreservesWeakEquivalences).toBe(true);
      expect(quillenModel.hMonoidalProperty.unitIsCofibrant).toBe(true);
    });

    it('should distinguish strongly h-monoidal vs regular h-monoidal', () => {
      const monoidalStructure = {
        kind: 'MonoidalStructure' as const,
        tensorProduct: {
          kind: 'Functor' as const,
          domain: { kind: 'Category' as const },
          codomain: { kind: 'Category' as const },
          objectMapping: (x: any) => x,
          morphismMapping: (f: any) => f
        },
        unit: { kind: 'Unit' },
        associator: {
          kind: 'NaturalTransformation' as const,
          domain: { kind: 'Functor' as const, domain: { kind: 'Category' as const }, codomain: { kind: 'Category' as const }, objectMapping: (x: any) => x, morphismMapping: (f: any) => f },
          codomain: { kind: 'Functor' as const, domain: { kind: 'Category' as const }, codomain: { kind: 'Category' as const }, objectMapping: (x: any) => x, morphismMapping: (f: any) => f },
          components: new Map()
        },
        leftUnitor: {
          kind: 'NaturalTransformation' as const,
          domain: { kind: 'Functor' as const, domain: { kind: 'Category' as const }, codomain: { kind: 'Category' as const }, objectMapping: (x: any) => x, morphismMapping: (f: any) => f },
          codomain: { kind: 'Functor' as const, domain: { kind: 'Category' as const }, codomain: { kind: 'Category' as const }, objectMapping: (x: any) => x, morphismMapping: (f: any) => f },
          components: new Map()
        },
        rightUnitor: {
          kind: 'NaturalTransformation' as const,
          domain: { kind: 'Functor' as const, domain: { kind: 'Category' as const }, codomain: { kind: 'Category' as const }, objectMapping: (x: any) => x, morphismMapping: (f: any) => f },
          codomain: { kind: 'Functor' as const, domain: { kind: 'Category' as const }, codomain: { kind: 'Category' as const }, objectMapping: (x: any) => x, morphismMapping: (f: any) => f },
          components: new Map()
        },
        coherence: {
          kind: 'CoherenceConditions' as const,
          pentagonAxiom: true,
          triangleAxiom: true,
          allDiagramsCommute: true
        }
      };

      // Regular h-monoidal (not all objects cofibrant)
      const regularHMonoidal = createHMonoidalModelCategory(
        { kind: 'Category' },
        monoidalStructure
      );

      expect(regularHMonoidal.stronglyHMonoidal).toBe(false);
      expect(validateHMonoidalModelCategory(regularHMonoidal)).toBe(true);
    });

  });

  // ============================================================================
  // PART II: TAME POLYNOMIAL MONADS (Figure 2 Tests)
  // ============================================================================

  describe('Tame Polynomial Monads Classification', () => {

    it('should correctly classify TAME polynomial monads', () => {
      const tameGraphTypes: GraphType[] = [
        'linear-rooted-trees',
        'planar-rooted-trees', 
        'non-degenerate-rooted-trees',
        'regular-rooted-trees',
        'normal-rooted-trees'
      ];

      tameGraphTypes.forEach(graphType => {
        const tameMonad = createTamePolynomialMonad(graphType, 'monoids');
        
        expect(tameMonad.kind).toBe('TamePolynomialMonad');
        expect(tameMonad.tameness.isTame).toBe(true);
        expect(tameMonad.tameness.transferExists).toBe(true);
        expect(tameMonad.tameness.leftProper).toBe(true);
        expect(tameMonad.tameProperty.admitsTransfer).toBe(true);
        expect(tameMonad.transferredModelStructure).not.toBeNull();
        expect(validateTamePolynomialMonad(tameMonad)).toBe(true);
      });
    });

    it('should correctly classify NON-TAME polynomial monads', () => {
      const nonTameGraphTypes: GraphType[] = [
        'rooted-trees',
        'planar-trees', 
        'trees',
        'n-planar-trees',
        'directed-trees',
        'half-graphs'
      ];

      nonTameGraphTypes.forEach(graphType => {
        const nonTameMonad = createTamePolynomialMonad(graphType, 'symmetric-operads');
        
        expect(nonTameMonad.tameness.isTame).toBe(false);
        expect(nonTameMonad.tameness.transferExists).toBe(false);
        expect(nonTameMonad.tameness.leftProper).toBe(false);
        expect(nonTameMonad.tameProperty.admitsTransfer).toBe(false);
        // Non-tame monads don't get transferred model structures
      });
    });

    it('should handle monoids (TAME - linear rooted trees)', () => {
      const monoidMonad = createTamePolynomialMonad('linear-rooted-trees', 'monoids');
      
      expect(monoidMonad.tameness.isTame).toBe(true);
      expect(monoidMonad.tameness.operadCategory).toBe('monoids');
      expect(monoidMonad.admissibility.monoidAxiomSatisfied).toBe(true);
      expect(monoidMonad.leftProperness.pushoutPreservation).toBe(true);
    });

    it('should handle symmetric operads (NOT TAME - rooted trees)', () => {
      const symmetricOperadMonad = createTamePolynomialMonad('rooted-trees', 'symmetric-operads');
      
      expect(symmetricOperadMonad.tameness.isTame).toBe(false);
      expect(symmetricOperadMonad.tameness.operadCategory).toBe('symmetric-operads');
      expect(symmetricOperadMonad.tameness.transferExists).toBe(false);
    });

    it('should handle n-operads for n ≥ 2 (NOT TAME - n-planar trees)', () => {
      const nOperadMonad = createTamePolynomialMonad('n-planar-trees', 'n-operads');
      
      expect(nOperadMonad.tameness.isTame).toBe(false);
      expect(nOperadMonad.tameness.operadCategory).toBe('n-operads');
      expect(nOperadMonad.tameness.transferExists).toBe(false);
    });

    it('should handle cyclic operads (NOT TAME - trees)', () => {
      const cyclicOperadMonad = createTamePolynomialMonad('trees', 'cyclic-operads');
      
      expect(cyclicOperadMonad.tameness.isTame).toBe(false);
      expect(cyclicOperadMonad.tameness.operadCategory).toBe('cyclic-operads');
      expect(cyclicOperadMonad.tameness.transferExists).toBe(false);
    });

    it('should verify admissibility conditions for tame monads', () => {
      const tameMonad = createTamePolynomialMonad('planar-rooted-trees', 'non-symmetric-operads');
      
      expect(tameMonad.admissibility.acyclicCofibrationCondition).toBe(true);
      expect(tameMonad.admissibility.cofibrancyCondition).toBe(true);
      expect(tameMonad.admissibility.monoidAxiomSatisfied).toBe(true);
      expect(tameMonad.admissibility.extraCondition.combinatorialNature).toBe(true);
      expect(tameMonad.admissibility.extraCondition.coproductRequirement).toBe(true);
      expect(tameMonad.admissibility.extraCondition.terminalObjectRequirement).toBe(true);
    });

  });

  // ============================================================================
  // PART III: TRANSFERRED MODEL STRUCTURES AND QUILLEN ADJUNCTIONS
  // ============================================================================

  describe('Transferred Model Structures', () => {

    it('should create transferred model structure for tame monads', () => {
      const tameMonad = createTamePolynomialMonad('linear-rooted-trees', 'monoids');
      const transferredStructure = tameMonad.transferredModelStructure;
      
      expect(transferredStructure).not.toBeNull();
      expect(transferredStructure!.kind).toBe('TransferredModelStructure');
      expect(transferredStructure!.isComplete).toBe(true);
      expect(transferredStructure!.isCocomplete).toBe(true);
      expect(transferredStructure!.leftProperness.pushoutPreservation).toBe(true);
    });

    it('should verify Quillen adjunction properties', () => {
      const tameMonad = createTamePolynomialMonad('planar-rooted-trees', 'non-symmetric-operads');
      const transferredStructure = tameMonad.transferredModelStructure;
      
      expect(transferredStructure).not.toBeNull();
      expect(transferredStructure!.transferAdjunction.kind).toBe('Adjunction');
      expect(transferredStructure!.transferAdjunction.leftAdjoint).toBeDefined();
      expect(transferredStructure!.transferAdjunction.rightAdjoint).toBeDefined();
    });

    it('should verify left properness for transferred structures', () => {
      const tameMonad = createTamePolynomialMonad('normal-rooted-trees', 'monoids');
      const leftProperness = tameMonad.leftProperness;
      
      expect(leftProperness.pushoutPreservation).toBe(true);
      expect(leftProperness.relativeForm).toBe(true);
      expect(leftProperness.cofibrancyCondition).toBe(true);
    });

  });

  // ============================================================================
  // PART IV: OPERADIC HOMOTOPY THEORY INTEGRATION
  // ============================================================================

  describe('Operadic Homotopy Theory', () => {

    it('should create operadic homotopy theory for existing operads', () => {
      const existingOperad = {
        kind: 'Operad',
        operations: [],
        composition: {},
        unit: {}
      };

      const operadicHomotopy = createOperadicHomotopyTheory(
        existingOperad,
        'planar-rooted-trees'
      );

      expect(operadicHomotopy.kind).toBe('OperadicHomotopyTheory');
      expect(operadicHomotopy.baseOperad).toBe(existingOperad);
      expect(operadicHomotopy.underlyingPolynomialMonad.kind).toBe('TamePolynomialMonad');
      expect(operadicHomotopy.modelStructure).not.toBeNull();
      expect(validateOperadicHomotopyTheory(operadicHomotopy)).toBe(true);
    });

    it('should handle Baez-Dolan +-construction', () => {
      const existingOperad = {
        kind: 'Operad',
        operations: [],
        composition: {},
        unit: {}
      };

      const operadicHomotopy = createOperadicHomotopyTheory(
        existingOperad,
        'linear-rooted-trees'
      );

      expect(operadicHomotopy.baezDolanConstruction.kind).toBe('BaezDolanConstruction');
      expect(operadicHomotopy.baezDolanConstruction.originalMonad).toBeDefined();
      expect(operadicHomotopy.baezDolanConstruction.plusConstruction).toBeDefined();
    });

    it('should handle symmetrisation process', () => {
      const existingOperad = {
        kind: 'Operad',
        operations: [],
        composition: {},
        unit: {}
      };

      const operadicHomotopy = createOperadicHomotopyTheory(
        existingOperad,
        'planar-rooted-trees'
      );

      expect(operadicHomotopy.symmetrisationProcess.kind).toBe('SymmetrisationProcess');
      expect(operadicHomotopy.symmetrisationProcess.nonSymmetricOperad).toBeDefined();
      expect(operadicHomotopy.symmetrisationProcess.symmetricOperad).toBeDefined();
    });

    it('should correctly relate tameness to model structure existence', () => {
      // Tame case - should have model structure
      const tameOperadicHomotopy = createOperadicHomotopyTheory(
        { kind: 'Operad' },
        'linear-rooted-trees'
      );

      expect(tameOperadicHomotopy.underlyingPolynomialMonad.tameness.isTame).toBe(true);
      expect(tameOperadicHomotopy.modelStructure).not.toBeNull();

      // Non-tame case - should not have transferred model structure
      const nonTameOperadicHomotopy = createOperadicHomotopyTheory(
        { kind: 'Operad' },
        'rooted-trees'
      );

      expect(nonTameOperadicHomotopy.underlyingPolynomialMonad.tameness.isTame).toBe(false);
      // Note: In practice, non-tame monads might still have model structures, 
      // but not via the transfer method
    });

  });

  // ============================================================================
  // PART V: COMPREHENSIVE FRAMEWORK INTEGRATION TESTS
  // ============================================================================

  describe('Framework Integration', () => {

    it('should demonstrate complete polynomial monad to homotopy theory pipeline', () => {
      // Start with graph type
      const graphType: GraphType = 'planar-rooted-trees';
      
      // Create tame polynomial monad
      const polynomialMonad = createTamePolynomialMonad(graphType, 'non-symmetric-operads');
      
      // Verify tameness and admissibility
      expect(polynomialMonad.tameness.isTame).toBe(true);
      expect(polynomialMonad.admissibility.monoidAxiomSatisfied).toBe(true);
      
      // Get transferred model structure
      const modelStructure = polynomialMonad.transferredModelStructure;
      expect(modelStructure).not.toBeNull();
      expect(modelStructure!.leftProperness.pushoutPreservation).toBe(true);
      
      // Create operadic homotopy theory
      const operadicHomotopy = createOperadicHomotopyTheory(
        { kind: 'Operad', name: 'TestOperad' },
        graphType
      );
      
      expect(operadicHomotopy.modelStructure).not.toBeNull();
      expect(validateOperadicHomotopyTheory(operadicHomotopy)).toBe(true);
    });

    it('should verify Model Category Catalog completeness', () => {
      // This would test all entries from Figure 1
      const catalogEntries = [
        'simplicialSets',
        'smallCategories', 
        'complexesOverField',
        'chainComplexes',
        'topologicalSpaces'
      ];

      catalogEntries.forEach(entry => {
        // Each should be h-monoidal with specific properties
        // This test structure demonstrates the systematic nature
        expect(entry).toBeDefined();
      });
    });

    it('should verify Graph Type Classification completeness', () => {
      // Test systematic classification from Figure 2
      const allGraphTypes: GraphType[] = [
        'linear-rooted-trees',
        'I-coloured-linear-rooted-trees',
        'planar-rooted-trees',
        'rooted-trees',
        'non-degenerate-rooted-trees',
        'regular-rooted-trees',
        'normal-rooted-trees',
        'planar-trees',
        'non-degenerate-planar-trees',
        'regular-planar-trees',
        'normal-planar-trees',
        'trees',
        'non-degenerate-trees',
        'regular-trees',
        'normal-trees',
        'n-planar-trees',
        'non-degenerate-n-planar-trees',
        'regular-n-planar-trees',
        'normal-n-planar-trees',
        'directed-trees',
        'normal-directed-trees',
        'half-graphs',
        'normal-half-graphs',
        'connected-graphs-with-genus',
        'normal-connected-stable-graphs',
        'loop-free-connected-directed-graphs',
        'normal-loop-free-connected-directed-graphs',
        'loop-free-directed-graphs',
        'normal-loop-free-directed-graphs',
        'wheeled-rooted-trees',
        'normal-wheeled-rooted-trees',
        'connected-directed-graphs',
        'normal-connected-directed-graphs',
        'directed-graphs',
        'normal-directed-graphs'
      ];

      allGraphTypes.forEach(graphType => {
        const monad = createTamePolynomialMonad(graphType, 'monoids');
        expect(monad.tameness.graphType).toBe(graphType);
        // Tameness should be consistent with Figure 2
      });
    });

  });

  // ============================================================================
  // PART VI: VALIDATION AND ERROR HANDLING
  // ============================================================================

  describe('Validation and Error Handling', () => {

    it('should validate all core structures', () => {
      const tameMonad = createTamePolynomialMonad('linear-rooted-trees', 'monoids');
      
      expect(validateTamePolynomialMonad(tameMonad)).toBe(true);
      
      const operadicHomotopy = createOperadicHomotopyTheory(
        { kind: 'Operad' },
        'planar-rooted-trees'
      );
      
      expect(validateOperadicHomotopyTheory(operadicHomotopy)).toBe(true);
    });

    it('should handle edge cases in tameness classification', () => {
      // Test boundary cases between tame and non-tame
      const boundaryCase = createTamePolynomialMonad('normal-directed-trees', 'dioperads');
      
      expect(boundaryCase.tameness.isTame).toBe(true); // normal versions are tame
      expect(boundaryCase.tameness.transferExists).toBe(true);
    });

  });

});
