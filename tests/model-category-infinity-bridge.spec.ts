/**
 * Test suite for Model Category ∞-Bridge
 * 
 * Tests the revolutionary bridge between model categories and ∞-categorical structures
 */

import { expect } from 'chai';
import {
  InfinityModelCategory,
  createInfinityModelCategory,
  InfinityQuillenFunctor,
  createInfinityQuillenFunctor,
  InfinityQuillenAdjunction,
  createInfinityQuillenAdjunction,
  InfinityModelCategoryBridge,
  createInfinityModelCategoryBridge,
  validateInfinityModelCategoryBridge,
  createInfinityModelCategoryBridgeForSpaces
} from '../fp-model-category-infinity-bridge';

describe('Model Category ∞-Bridge', () => {
  describe('InfinityModelCategory', () => {
    it('should create ∞-model category with proper structure', () => {
      const modelCategory = createInfinityModelCategory<{ space: string }>();

      expect(modelCategory.kind).to.equal('InfinityModelCategory');
      expect(modelCategory.objects).to.be.instanceOf(Set);
      expect(modelCategory.weakEquivalences.kind).to.equal('InfinityWeakEquivalence');
      expect(modelCategory.fibrations.kind).to.equal('InfinityFibration');
      expect(modelCategory.cofibrations.kind).to.equal('InfinityCofibration');
      expect(modelCategory.factorizationSystem.kind).to.equal('InfinityFactorizationSystem');
      expect(modelCategory.homotopyTheory.kind).to.equal('InfinityHomotopyTheory');
      expect(modelCategory.polynomialInterpretation.kind).to.equal('PolynomialModelCategoryInterpretation');
      expect(modelCategory.revolutionary).to.be.true;
    });

    it('should have ∞-weak equivalences with ∞-categorical structure', () => {
      const modelCategory = createInfinityModelCategory<{ space: string }>();

      expect(modelCategory.weakEquivalences.equivalences).to.be.instanceOf(Map);
      expect(modelCategory.weakEquivalences.infinityCategoricalEquivalences).to.be.instanceOf(Map);
      expect(modelCategory.weakEquivalences.homotopyInverses).to.be.instanceOf(Map);
      expect(modelCategory.weakEquivalences.coherenceData).to.be.instanceOf(Map);
      expect(modelCategory.weakEquivalences.twoOutOfThreeProperty).to.be.true;
      expect(modelCategory.weakEquivalences.infinityCategoricalTwoOutOfThree).to.be.true;
    });

    it('should have ∞-fibrations with ∞-categorical structure', () => {
      const modelCategory = createInfinityModelCategory<{ space: string }>();

      expect(modelCategory.fibrations.fibrations).to.be.instanceOf(Map);
      expect(modelCategory.fibrations.infinityCategoricalFibrations).to.be.instanceOf(Map);
      expect(modelCategory.fibrations.liftingProperties).to.be.instanceOf(Map);
      expect(modelCategory.fibrations.infinityCategoricalLifting).to.be.instanceOf(Map);
      expect(modelCategory.fibrations.stability).to.be.true;
      expect(modelCategory.fibrations.infinityCategoricalStability).to.be.true;
    });

    it('should have ∞-cofibrations with ∞-categorical structure', () => {
      const modelCategory = createInfinityModelCategory<{ space: string }>();

      expect(modelCategory.cofibrations.cofibrations).to.be.instanceOf(Map);
      expect(modelCategory.cofibrations.infinityCategoricalCofibrations).to.be.instanceOf(Map);
      expect(modelCategory.cofibrations.liftingProperties).to.be.instanceOf(Map);
      expect(modelCategory.cofibrations.infinityCategoricalLifting).to.be.instanceOf(Map);
      expect(modelCategory.cofibrations.stability).to.be.true;
      expect(modelCategory.cofibrations.infinityCategoricalStability).to.be.true;
    });

    it('should have ∞-factorization system with ∞-categorical structure', () => {
      const modelCategory = createInfinityModelCategory<{ space: string }>();

      expect(modelCategory.factorizationSystem.factorizations).to.be.instanceOf(Map);
      expect(modelCategory.factorizationSystem.infinityCategoricalFactorizations).to.be.instanceOf(Map);
      expect(modelCategory.factorizationSystem.functoriality).to.be.true;
      expect(modelCategory.factorizationSystem.infinityCategoricalFunctoriality).to.be.true;
      expect(modelCategory.factorizationSystem.coherenceData).to.be.instanceOf(Map);
    });

    it('should have ∞-homotopy theory with ∞-categorical structure', () => {
      const modelCategory = createInfinityModelCategory<{ space: string }>();

      expect(modelCategory.homotopyTheory.homotopyCategory.kind).to.equal('InfinityHomotopyCategory');
      expect(modelCategory.homotopyTheory.homotopyLimits.kind).to.equal('InfinityHomotopyLimits');
      expect(modelCategory.homotopyTheory.homotopyColimits.kind).to.equal('InfinityHomotopyColimits');
      expect(modelCategory.homotopyTheory.mappingSpaces.kind).to.equal('InfinityMappingSpaces');
      expect(modelCategory.homotopyTheory.infinityCategoricalMappingSpaces).to.be.true;
    });

    it('should have ∞-homotopy category with ∞-categorical structure', () => {
      const modelCategory = createInfinityModelCategory<{ space: string }>();

      expect(modelCategory.homotopyTheory.homotopyCategory.objects).to.be.instanceOf(Set);
      expect(modelCategory.homotopyTheory.homotopyCategory.morphisms).to.be.instanceOf(Map);
      expect(typeof modelCategory.homotopyTheory.homotopyCategory.localization).to.equal('function');
      expect(modelCategory.homotopyTheory.homotopyCategory.infinityCategoricalLocalization).to.be.true;
      expect(modelCategory.homotopyTheory.homotopyCategory.coherenceData).to.be.instanceOf(Map);
    });

    it('should have ∞-homotopy limits with ∞-categorical structure', () => {
      const modelCategory = createInfinityModelCategory<{ space: string }>();

      expect(modelCategory.homotopyTheory.homotopyLimits.limits).to.be.instanceOf(Map);
      expect(modelCategory.homotopyTheory.homotopyLimits.infinityCategoricalLimits).to.be.instanceOf(Map);
      expect(modelCategory.homotopyTheory.homotopyLimits.universalProperties).to.be.instanceOf(Map);
      expect(modelCategory.homotopyTheory.homotopyLimits.infinityCategoricalUniversalProperties).to.be.true;
    });

    it('should have ∞-homotopy colimits with ∞-categorical structure', () => {
      const modelCategory = createInfinityModelCategory<{ space: string }>();

      expect(modelCategory.homotopyTheory.homotopyColimits.colimits).to.be.instanceOf(Map);
      expect(modelCategory.homotopyTheory.homotopyColimits.infinityCategoricalColimits).to.be.instanceOf(Map);
      expect(modelCategory.homotopyTheory.homotopyColimits.universalProperties).to.be.instanceOf(Map);
      expect(modelCategory.homotopyTheory.homotopyColimits.infinityCategoricalUniversalProperties).to.be.true;
    });

    it('should have ∞-mapping spaces with ∞-categorical structure', () => {
      const modelCategory = createInfinityModelCategory<{ space: string }>();

      expect(modelCategory.homotopyTheory.mappingSpaces.mappingSpaces).to.be.instanceOf(Map);
      expect(modelCategory.homotopyTheory.mappingSpaces.infinityCategoricalMappingSpaces).to.be.instanceOf(Map);
      expect(modelCategory.homotopyTheory.mappingSpaces.composition).to.be.instanceOf(Map);
      expect(modelCategory.homotopyTheory.mappingSpaces.infinityCategoricalComposition).to.be.true;
    });
  });

  describe('InfinityQuillenFunctor', () => {
    it('should create ∞-Quillen functor with proper structure', () => {
      const sourceModelCategory = createInfinityModelCategory<{ space: string }>();
      const targetModelCategory = createInfinityModelCategory<{ result: string }>();
      const functor = (x: { space: string }) => ({ result: x.space });

      const quillenFunctor = createInfinityQuillenFunctor(sourceModelCategory, targetModelCategory, functor);

      expect(quillenFunctor.kind).to.equal('InfinityQuillenFunctor');
      expect(quillenFunctor.source).to.equal(sourceModelCategory);
      expect(quillenFunctor.target).to.equal(targetModelCategory);
      expect(quillenFunctor.functor({ space: 'test' })).to.deep.equal({ result: 'test' });
      expect(quillenFunctor.preservesWeakEquivalences).to.be.true;
      expect(quillenFunctor.preservesFibrations).to.be.true;
      expect(quillenFunctor.preservesCofibrations).to.be.true;
      expect(quillenFunctor.infinityCategoricalPreservation).to.be.true;
      expect(quillenFunctor.homotopyCoherence).to.be.instanceOf(Map);
      expect(quillenFunctor.polynomialInterpretation.kind).to.equal('PolynomialQuillenFunctorInterpretation');
    });

    it('should have polynomial interpretation', () => {
      const sourceModelCategory = createInfinityModelCategory<{ space: string }>();
      const targetModelCategory = createInfinityModelCategory<{ result: string }>();
      const functor = (x: { space: string }) => ({ result: x.space });

      const quillenFunctor = createInfinityQuillenFunctor(sourceModelCategory, targetModelCategory, functor);

      expect(quillenFunctor.polynomialInterpretation.quillenFunctorPolynomial.positions).to.be.an('array');
      expect(typeof quillenFunctor.polynomialInterpretation.quillenFunctorPolynomial.directions).to.equal('function');
      expect(quillenFunctor.polynomialInterpretation.preservationPolynomial.positions).to.be.an('array');
      expect(typeof quillenFunctor.polynomialInterpretation.preservationPolynomial.directions).to.equal('function');
      expect(quillenFunctor.polynomialInterpretation.homotopyCoherencePolynomial.positions).to.be.an('array');
      expect(typeof quillenFunctor.polynomialInterpretation.homotopyCoherencePolynomial.directions).to.equal('function');
      expect(quillenFunctor.polynomialInterpretation.coherence).to.be.true;
    });
  });

  describe('InfinityQuillenAdjunction', () => {
    it('should create ∞-Quillen adjunction with proper structure', () => {
      const sourceModelCategory = createInfinityModelCategory<{ space: string }>();
      const targetModelCategory = createInfinityModelCategory<{ result: string }>();
      
      const leftAdjoint = createInfinityQuillenFunctor(sourceModelCategory, targetModelCategory, (x) => ({ result: x.space }));
      const rightAdjoint = createInfinityQuillenFunctor(targetModelCategory, sourceModelCategory, (x) => ({ space: x.result }));

      const quillenAdjunction = createInfinityQuillenAdjunction(leftAdjoint, rightAdjoint);

      expect(quillenAdjunction.kind).to.equal('InfinityQuillenAdjunction');
      expect(quillenAdjunction.leftAdjoint).to.equal(leftAdjoint);
      expect(quillenAdjunction.rightAdjoint).to.equal(rightAdjoint);
      expect(typeof quillenAdjunction.unit).to.equal('function');
      expect(typeof quillenAdjunction.counit).to.equal('function');
      expect(quillenAdjunction.infinityCategoricalUnit).to.be.true;
      expect(quillenAdjunction.infinityCategoricalCounit).to.be.true;
      expect(quillenAdjunction.derivedAdjunction.kind).to.equal('InfinityDerivedAdjunction');
      expect(quillenAdjunction.homotopyCoherence).to.be.instanceOf(Map);
    });

    it('should have ∞-derived adjunction', () => {
      const sourceModelCategory = createInfinityModelCategory<{ space: string }>();
      const targetModelCategory = createInfinityModelCategory<{ result: string }>();
      
      const leftAdjoint = createInfinityQuillenFunctor(sourceModelCategory, targetModelCategory, (x) => ({ result: x.space }));
      const rightAdjoint = createInfinityQuillenFunctor(targetModelCategory, sourceModelCategory, (x) => ({ space: x.result }));

      const quillenAdjunction = createInfinityQuillenAdjunction(leftAdjoint, rightAdjoint);

      expect(typeof quillenAdjunction.derivedAdjunction.leftDerived).to.equal('function');
      expect(typeof quillenAdjunction.derivedAdjunction.rightDerived).to.equal('function');
      expect(quillenAdjunction.derivedAdjunction.infinityCategoricalDerived).to.be.true;
      expect(quillenAdjunction.derivedAdjunction.homotopyCoherence).to.be.instanceOf(Map);
    });
  });

  describe('InfinityModelCategoryBridge', () => {
    it('should create revolutionary ∞-model category bridge', () => {
      const bridge = createInfinityModelCategoryBridge<{ space: string }>();

      expect(bridge.kind).to.equal('InfinityModelCategoryBridge');
      expect(bridge.modelCategory.kind).to.equal('InfinityModelCategory');
      expect(bridge.quillenFunctors).to.be.instanceOf(Set);
      expect(bridge.quillenAdjunctions).to.be.instanceOf(Set);
      expect(bridge.homotopyTheory.kind).to.equal('InfinityHomotopyTheory');
      expect(bridge.polynomialInterpretation.kind).to.equal('PolynomialModelCategoryBridge');
      expect(bridge.infinityCategoricalStructure.kind).to.equal('InfinityCategoricalModelStructure');
      expect(bridge.revolutionary).to.be.true;
    });

    it('should have ∞-categorical model structure', () => {
      const bridge = createInfinityModelCategoryBridge<{ space: string }>();

      expect(bridge.infinityCategoricalStructure.infinityCategoricalWeakEquivalences).to.be.instanceOf(Map);
      expect(bridge.infinityCategoricalStructure.infinityCategoricalFibrations).to.be.instanceOf(Map);
      expect(bridge.infinityCategoricalStructure.infinityCategoricalCofibrations).to.be.instanceOf(Map);
      expect(bridge.infinityCategoricalStructure.infinityCategoricalFactorization).to.be.instanceOf(Map);
      expect(bridge.infinityCategoricalStructure.infinityCategoricalHomotopyCategory.kind).to.equal('InfinityHomotopyCategory');
      expect(bridge.infinityCategoricalStructure.coherence).to.be.true;
    });

    it('should have polynomial interpretation', () => {
      const bridge = createInfinityModelCategoryBridge<{ space: string }>();

      expect(bridge.polynomialInterpretation.modelCategoryPolynomial.positions).to.be.an('array');
      expect(typeof bridge.polynomialInterpretation.modelCategoryPolynomial.directions).to.equal('function');
      expect(bridge.polynomialInterpretation.quillenFunctorPolynomial.positions).to.be.an('array');
      expect(typeof bridge.polynomialInterpretation.quillenFunctorPolynomial.directions).to.equal('function');
      expect(bridge.polynomialInterpretation.quillenAdjunctionPolynomial.positions).to.be.an('array');
      expect(typeof bridge.polynomialInterpretation.quillenAdjunctionPolynomial.directions).to.equal('function');
      expect(bridge.polynomialInterpretation.homotopyTheoryPolynomial.positions).to.be.an('array');
      expect(typeof bridge.polynomialInterpretation.homotopyTheoryPolynomial.directions).to.equal('function');
      expect(bridge.polynomialInterpretation.coherence).to.be.true;
    });
  });

  describe('Validation', () => {
    it('should validate ∞-model category bridge correctly', () => {
      const bridge = createInfinityModelCategoryBridge<{ space: string }>();
      const validation = validateInfinityModelCategoryBridge(bridge);

      expect(validation.valid).to.be.true;
      expect(validation.modelCategory).to.be.true;
      expect(validation.quillenFunctors).to.be.true;
      expect(validation.quillenAdjunctions).to.be.true;
      expect(validation.homotopyTheory).to.be.true;
      expect(validation.polynomialConsistency).to.be.true;
      expect(validation.infinityCategoricalStructure).to.be.true;
      expect(validation.revolutionary).to.be.true;
    });
  });

  describe('Examples', () => {
    it('should create ∞-model category bridge for spaces', () => {
      const spaceBridge = createInfinityModelCategoryBridgeForSpaces();

      expect(spaceBridge.kind).to.equal('InfinityModelCategoryBridge');
      expect(spaceBridge.modelCategory.kind).to.equal('InfinityModelCategory');
      expect(spaceBridge.homotopyTheory.kind).to.equal('InfinityHomotopyTheory');
      expect(spaceBridge.polynomialInterpretation.kind).to.equal('PolynomialModelCategoryBridge');
      expect(spaceBridge.infinityCategoricalStructure.kind).to.equal('InfinityCategoricalModelStructure');
      expect(spaceBridge.revolutionary).to.be.true;
    });
  });

  describe('Revolutionary Features', () => {
    it('should demonstrate ∞-categorical model category coherence', () => {
      const bridge = createInfinityModelCategoryBridge<{ space: string }>();

      // Test ∞-categorical structure
      expect(bridge.modelCategory.weakEquivalences.infinityCategoricalTwoOutOfThree).to.be.true;
      expect(bridge.modelCategory.fibrations.infinityCategoricalStability).to.be.true;
      expect(bridge.modelCategory.cofibrations.infinityCategoricalStability).to.be.true;
      expect(bridge.modelCategory.factorizationSystem.infinityCategoricalFunctoriality).to.be.true;
      expect(bridge.modelCategory.homotopyTheory.infinityCategoricalMappingSpaces).to.be.true;

      // Test revolutionary nature
      expect(bridge.revolutionary).to.be.true;
    });

    it('should integrate with polynomial functor framework', () => {
      const bridge = createInfinityModelCategoryBridge<{ space: string }>();

      // Test polynomial integration
      expect(bridge.polynomialInterpretation.modelCategoryPolynomial).to.have.property('positions');
      expect(bridge.polynomialInterpretation.modelCategoryPolynomial).to.have.property('directions');
      expect(bridge.polynomialInterpretation.quillenFunctorPolynomial).to.have.property('positions');
      expect(bridge.polynomialInterpretation.quillenFunctorPolynomial).to.have.property('directions');
      expect(bridge.polynomialInterpretation.quillenAdjunctionPolynomial).to.have.property('positions');
      expect(bridge.polynomialInterpretation.quillenAdjunctionPolynomial).to.have.property('directions');
      expect(bridge.polynomialInterpretation.homotopyTheoryPolynomial).to.have.property('positions');
      expect(bridge.polynomialInterpretation.homotopyTheoryPolynomial).to.have.property('directions');
    });

    it('should support ∞-categorical homotopy theory', () => {
      const bridge = createInfinityModelCategoryBridge<{ space: string }>();

      // Test ∞-categorical homotopy theory structure
      expect(bridge.infinityCategoricalStructure.infinityCategoricalWeakEquivalences).to.be.instanceOf(Map);
      expect(bridge.infinityCategoricalStructure.infinityCategoricalFibrations).to.be.instanceOf(Map);
      expect(bridge.infinityCategoricalStructure.infinityCategoricalCofibrations).to.be.instanceOf(Map);
      expect(bridge.infinityCategoricalStructure.infinityCategoricalFactorization).to.be.instanceOf(Map);
      expect(bridge.infinityCategoricalStructure.infinityCategoricalHomotopyCategory.objects).to.be.instanceOf(Set);
      expect(bridge.infinityCategoricalStructure.infinityCategoricalHomotopyCategory.morphisms).to.be.instanceOf(Map);
      expect(bridge.infinityCategoricalStructure.infinityCategoricalHomotopyCategory.infinityCategoricalLocalization).to.be.true;
    });
  });
});
