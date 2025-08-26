/**
 * Test suite for Dense Class & Yoneda Polynomial Bridge
 * 
 * Tests the revolutionary bridge between dense classes of generators, Yoneda embeddings,
 * Isbell's adequacy, strengthened Kock-Lawvere axioms, and topological density
 * with polynomial functor framework
 */

import { expect } from 'chai';
import {
  DenseClassPolynomial,
  createDenseClassPolynomial,
  YonedaPolynomialFunctor,
  createYonedaPolynomialFunctor,
  StrengthenedKockLawverePolynomial,
  createStrengthenedKockLawverePolynomial,
  TopologicalDensityPolynomial,
  createTopologicalDensityPolynomial,
  DenseClassYonedaPolynomialBridge,
  createDenseClassYonedaPolynomialBridge,
  validateDenseClassYonedaPolynomialBridge,
  createDenseClassYonedaPolynomialBridgeForReals
} from '../fp-dense-class-yoneda-polynomial-bridge';

describe('Dense Class & Yoneda Polynomial Bridge', () => {
  describe('DenseClassPolynomial', () => {
    it('should create dense class polynomial with correct structure', () => {
      const denseClass = new Set([1, 2, 3]);
      const polynomial = createDenseClassPolynomial(denseClass, 0);

      expect(polynomial.kind).to.equal('DenseClassPolynomial');
      expect(polynomial.denseClass).to.deep.equal(denseClass);
      expect(polynomial.revolutionary).to.be.true;
    });

    it('should have Yoneda map construction principle', () => {
      const polynomial = createDenseClassPolynomial(new Set([1]), 0);

      expect(polynomial.yonedaMapConstruction.kind).to.equal('YonedaMapConstruction');
      expect(polynomial.yonedaMapConstruction.principle).to.include('Natural transformation');
      expect(polynomial.yonedaMapConstruction.density).to.be.true;
    });

    it('should have stable formulae equivalence', () => {
      const polynomial = createDenseClassPolynomial(new Set([1]), 0);

      expect(polynomial.stableFormulae.kind).to.equal('StableFormulae');
      expect(polynomial.stableFormulae.formula).to.include('⊢ₓ (φ₁ ⇒ φ₂)');
      expect(polynomial.stableFormulae.equivalence).to.be.true;
    });

    it('should have unique existence with density', () => {
      const polynomial = createDenseClassPolynomial(new Set([1]), 0);

      expect(polynomial.uniqueExistence.kind).to.equal('UniqueExistence');
      expect(polynomial.uniqueExistence.formula).to.include('⊢ₓ ∃!x φ(x)');
      expect(polynomial.uniqueExistence.equivalence).to.be.true;
    });
  });

  describe('YonedaPolynomialFunctor', () => {
    it('should create Yoneda polynomial functor with correct structure', () => {
      const functor = createYonedaPolynomialFunctor(0);

      expect(functor.kind).to.equal('YonedaPolynomialFunctor');
      expect(functor.revolutionary).to.be.true;
    });

    it('should have Yoneda embedding', () => {
      const functor = createYonedaPolynomialFunctor(0);

      expect(functor.yonedaEmbedding.kind).to.equal('YonedaEmbedding');
      expect(functor.yonedaEmbedding.embedding).to.include('E --(y)--> Set^E^op');
      expect(functor.yonedaEmbedding.fullAndFaithful).to.be.true;
      expect(functor.yonedaEmbedding.yonedaLemma).to.include('Hom(Hom(-, X), F)');
    });

    it('should have Isbell adequacy', () => {
      const functor = createYonedaPolynomialFunctor(0);

      expect(functor.isbellAdequacy.kind).to.equal('IsbellAdequacy');
      expect(functor.isbellAdequacy.composite).to.include('Set^A^op');
      expect(functor.isbellAdequacy.fullAndFaithful).to.be.true;
      expect(functor.isbellAdequacy.denseClass).to.be.true;
    });

    it('should have restriction functor', () => {
      const functor = createYonedaPolynomialFunctor(0);

      expect(functor.restrictionFunctor.kind).to.equal('RestrictionFunctor');
      expect(functor.restrictionFunctor.restriction).to.include('Set^E^op → Set^A^op');
      expect(functor.restrictionFunctor.inclusion).to.include('A^op ↪ E^op');
    });
  });

  describe('StrengthenedKockLawverePolynomial', () => {
    it('should create strengthened Kock-Lawvere polynomial with correct structure', () => {
      const polynomial = createStrengthenedKockLawverePolynomial(0);

      expect(polynomial.kind).to.equal('StrengthenedKockLawverePolynomial');
      expect(polynomial.revolutionary).to.be.true;
    });

    it('should have strengthened axiom', () => {
      const polynomial = createStrengthenedKockLawverePolynomial(0);

      expect(polynomial.axiom.kind).to.equal('StrengthenedAxiom');
      expect(polynomial.axiom.formula).to.include('For any X ∈ A and f: X × D → R');
      expect(polynomial.axiom.equation).to.include('f ∘ (β, d) = a ∘ β + d ⋅ (b ∘ β)');
    });

    it('should have cartesian closed category', () => {
      const polynomial = createStrengthenedKockLawverePolynomial(0);

      expect(polynomial.cartesianClosed.kind).to.equal('CartesianClosed');
      expect(polynomial.cartesianClosed.cartesianClosed).to.be.true;
      expect(polynomial.cartesianClosed.functionObjects).to.be.true;
    });

    it('should have commutative ring object', () => {
      const polynomial = createStrengthenedKockLawverePolynomial(0);

      expect(polynomial.commutativeRing.kind).to.equal('CommutativeRing');
      expect(polynomial.commutativeRing.commutative).to.be.true;
      expect(polynomial.commutativeRing.lineObject).to.be.true;
    });
  });

  describe('TopologicalDensityPolynomial', () => {
    it('should create topological density polynomial with correct structure', () => {
      const polynomial = createTopologicalDensityPolynomial(0);

      expect(polynomial.kind).to.equal('TopologicalDensityPolynomial');
      expect(polynomial.revolutionary).to.be.true;
    });

    it('should have satisfaction relation', () => {
      const polynomial = createTopologicalDensityPolynomial(0);

      expect(polynomial.satisfaction.kind).to.equal('Satisfaction');
      expect(polynomial.satisfaction.relation).to.equal('⊢');
      expect(polynomial.satisfaction.topologicalDensity).to.be.true;
      expect(polynomial.satisfaction.syntheticConsiderations).to.include('Synthetic Differential Geometry');
    });

    it('should have geometric logic', () => {
      const polynomial = createTopologicalDensityPolynomial(0);

      expect(polynomial.geometricLogic.kind).to.equal('GeometricLogic');
      expect(polynomial.geometricLogic.geometric).to.be.true;
      expect(polynomial.geometricLogic.toposTheory).to.be.true;
      expect(polynomial.geometricLogic.sheafTheory).to.be.true;
    });

    it('should have full first-order logic', () => {
      const polynomial = createTopologicalDensityPolynomial(0);

      expect(polynomial.fullFirstOrderLogic.kind).to.equal('FullFirstOrderLogic');
      expect(polynomial.fullFirstOrderLogic.fullFirstOrder).to.be.true;
      expect(polynomial.fullFirstOrderLogic.classicalLogic).to.be.true;
      expect(polynomial.fullFirstOrderLogic.completeness).to.be.true;
    });

    it('should have logical constructs distinction', () => {
      const polynomial = createTopologicalDensityPolynomial(0);

      expect(polynomial.satisfaction.logicalConstructs.kind).to.equal('LogicalConstructs');
      expect(polynomial.satisfaction.logicalConstructs.distinction).to.equal('geometric vs full first-order');
    });
  });

  describe('DenseClassYonedaPolynomialBridge', () => {
    it('should create bridge with correct structure', () => {
      const bridge = createDenseClassYonedaPolynomialBridge(0);

      expect(bridge.kind).to.equal('DenseClassYonedaPolynomialBridge');
      expect(bridge.revolutionary).to.be.true;
    });

    it('should have dense class polynomials', () => {
      const bridge = createDenseClassYonedaPolynomialBridge(0);

      expect(bridge.denseClassPolynomials.length).to.be.above(0);
      expect(bridge.denseClassPolynomials[0].kind).to.equal('DenseClassPolynomial');
    });

    it('should have Yoneda polynomial functors', () => {
      const bridge = createDenseClassYonedaPolynomialBridge(0);

      expect(bridge.yonedaPolynomialFunctors.length).to.be.above(0);
      expect(bridge.yonedaPolynomialFunctors[0].kind).to.equal('YonedaPolynomialFunctor');
    });

    it('should have strengthened Kock-Lawvere polynomials', () => {
      const bridge = createDenseClassYonedaPolynomialBridge(0);

      expect(bridge.strengthenedKockLawverePolynomials.length).to.be.above(0);
      expect(bridge.strengthenedKockLawverePolynomials[0].kind).to.equal('StrengthenedKockLawverePolynomial');
    });

    it('should have topological density polynomials', () => {
      const bridge = createDenseClassYonedaPolynomialBridge(0);

      expect(bridge.topologicalDensityPolynomials.length).to.be.above(0);
      expect(bridge.topologicalDensityPolynomials[0].kind).to.equal('TopologicalDensityPolynomial');
    });

    it('should have Isbell adequacy polynomials', () => {
      const bridge = createDenseClassYonedaPolynomialBridge(0);

      expect(bridge.isbellAdequacyPolynomials.length).to.be.above(0);
      expect(bridge.isbellAdequacyPolynomials[0].kind).to.equal('IsbellAdequacyPolynomial');
      expect(bridge.isbellAdequacyPolynomials[0].fullAndFaithful).to.be.true;
    });

    it('should have Yoneda map construction polynomials', () => {
      const bridge = createDenseClassYonedaPolynomialBridge(0);

      expect(bridge.yonedaMapConstructionPolynomials.length).to.be.above(0);
      expect(bridge.yonedaMapConstructionPolynomials[0].kind).to.equal('YonedaMapConstructionPolynomial');
      expect(bridge.yonedaMapConstructionPolynomials[0].naturalTransformation).to.be.true;
    });
  });

  describe('Validation', () => {
    it('should validate bridge correctly', () => {
      const bridge = createDenseClassYonedaPolynomialBridge(0);
      const validation = validateDenseClassYonedaPolynomialBridge(bridge);

      expect(validation.valid).to.be.true;
      expect(validation.denseClassPolynomials).to.be.true;
      expect(validation.yonedaPolynomialFunctors).to.be.true;
      expect(validation.strengthenedKockLawverePolynomials).to.be.true;
      expect(validation.topologicalDensityPolynomials).to.be.true;
      expect(validation.isbellAdequacyPolynomials).to.be.true;
      expect(validation.yonedaMapConstructionPolynomials).to.be.true;
      expect(validation.revolutionary).to.be.true;
    });
  });

  describe('Examples', () => {
    it('should create bridge for real numbers', () => {
      const bridge = createDenseClassYonedaPolynomialBridgeForReals();

      expect(bridge.kind).to.equal('DenseClassYonedaPolynomialBridge');
      expect(bridge.revolutionary).to.be.true;
    });
  });

  describe('Revolutionary Features', () => {
    it('should have dense class optimization', () => {
      const denseClass = new Set([1, 2, 3]);
      const polynomial = createDenseClassPolynomial(denseClass, 0);

      // Only need to check A-elements instead of all elements
      expect(polynomial.yonedaMapConstruction.density).to.be.true;
      expect(polynomial.stableFormulae.equivalence).to.be.true;
      expect(polynomial.uniqueExistence.equivalence).to.be.true;
    });

    it('should have Yoneda polynomial functor interpretation', () => {
      const functor = createYonedaPolynomialFunctor(0);

      // Yoneda embedding as polynomial functor
      expect(functor.yonedaEmbedding.fullAndFaithful).to.be.true;
      expect(functor.isbellAdequacy.fullAndFaithful).to.be.true;
      expect(functor.restrictionFunctor.restriction).to.include('Set^E^op → Set^A^op');
    });

    it('should have strengthened SDG polynomials', () => {
      const polynomial = createStrengthenedKockLawverePolynomial(0);

      // Kock-Lawvere axiom as polynomial structure
      expect(polynomial.axiom.formula).to.include('X × D → R');
      expect(polynomial.axiom.equation).to.include('a ∘ β + d ⋅ (b ∘ β)');
      expect(polynomial.cartesianClosed.cartesianClosed).to.be.true;
      expect(polynomial.commutativeRing.lineObject).to.be.true;
    });

    it('should have topological density polynomials', () => {
      const polynomial = createTopologicalDensityPolynomial(0);

      // Geometric vs full first-order logic as polynomial functors
      expect(polynomial.satisfaction.logicalConstructs.distinction).to.equal('geometric vs full first-order');
      expect(polynomial.geometricLogic.geometric).to.be.true;
      expect(polynomial.fullFirstOrderLogic.fullFirstOrder).to.be.true;
    });

    it('should have polynomial functor integration', () => {
      const bridge = createDenseClassYonedaPolynomialBridge(0);

      // All components have polynomial interpretations
      expect(bridge.denseClassPolynomials[0].polynomialInterpretation).to.exist;
      expect(bridge.yonedaPolynomialFunctors[0].polynomialInterpretation).to.exist;
      expect(bridge.strengthenedKockLawverePolynomials[0].polynomialInterpretation).to.exist;
      expect(bridge.topologicalDensityPolynomials[0].polynomialInterpretation).to.exist;
    });

    it('should have Isbell adequacy and Yoneda map construction polynomials', () => {
      const bridge = createDenseClassYonedaPolynomialBridge(0);

      // Isbell's adequacy as polynomial functors
      expect(bridge.isbellAdequacyPolynomials[0].fullAndFaithful).to.be.true;
      expect(bridge.yonedaMapConstructionPolynomials[0].naturalTransformation).to.be.true;
    });
  });
});
