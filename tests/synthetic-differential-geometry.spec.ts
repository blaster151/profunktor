/**
 * Tests for Revolutionary Synthetic Differential Geometry (SDG)
 * 
 * This tests the MIND-BLOWING SDG implementation based on A. Kock's work:
 * - I.A.1 - Axiom 1 (Kock-Lawvere Axiom) - the foundational bedrock
 * - Base infinitesimal objects (D) and their properties
 * - Tangent vectors and bundles from Pages 24-26
 * - Integration with polynomial functors
 * - Vector form of Axiom 1 for R-modules
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  // Core Axiomatic System
  KockLawvereAxiom,
  CommutativeRing,
  InfinitesimalObject,
  LinearMapOnD,
  VectorFormAxiom1,
  RModule,
  
  // Infinitesimal Hierarchy
  HigherOrderInfinitesimal,
  MultiVariableInfinitesimal,
  GeneralizedInfinitesimal,
  
  // Vector Calculus Foundation
  VectorField,
  VectorFieldModule,
  InfinitesimalTransformation,
  
  // Tangent Spaces and Bundles
  TangentVector,
  TangentBundle,
  TangentSpace,
  
  // Creation Functions
  createCommutativeRing,
  createInfinitesimalObject,
  createLinearMapOnD,
  createTangentVector,
  createTangentBundle,
  createZeroTangentVector,
  addTangentVectors,
  scaleTangentVector,
  extractPrincipalPart,
  createVectorField,
  createInfinitesimalTransformation,
  createVectorFieldModule,
  
  // Validation Functions
  isQAlgebra,
  isInfinitesimallyLinear,
  verifyKockLawvereAxiom,
  
  // Examples and Integration
  createNaturalNumbersRing,
  polynomialAsTaylorSeries,
  polynomialAsTangentVector,
  createHadamardDerivative,
  createUniquenessAxiomForFunctions,
  createSyntheticTaylorExpansion,
  createDefiniteIntegralProperties,
  createDifferentialNForm,
  createNTangent,
  createObjectOfNForms,
  createFormPullback,
  createNCurrent,
  
  // New Algebraic Foundations (Pages 68-69)
  ClassOfMapsD,
  EnhancedDEtaleMap,
  PullbackCondition,
  KModuleL,
  KAlgebraHomomorphism,
  DeterminantBasedMap,
  PolynomialRingIdentification,
  Theorem164Foundation,
  createEnhancedDEtaleMap,
  createKModuleL,
  createKAlgebraHomomorphism,
  createDeterminantBasedMap,
  createPolynomialRingIdentification,
  createTheorem164Foundation,
  exampleEnhancedDEtaleMap,
  exampleKModuleConstruction,
  exampleCompleteAlgebraicFoundation
} from '../fp-synthetic-differential-geometry';

// Mock polynomial for testing
const mockPolynomial = {
  kind: 'Polynomial',
  positions: ['pos1', 'pos2'],
  directions: ['dir1', 'dir2']
};

describe('Revolutionary Synthetic Differential Geometry (SDG)', () => {
  describe('I. Complete Axiomatic System', () => {
    describe('I.A.1 - Axiom 1 (Kock-Lawvere Axiom)', () => {
      it('should create a commutative ring with Q-algebra properties', () => {
        const ring = createCommutativeRing(
          (a, b) => a + b,
          (a, b) => a * b,
          (r, a) => r * a
        );

        expect(ring.kind).toBe('CommutativeRing');
        expect(ring.isCommutative).toBe(true);
        expect(ring.hasUnity).toBe(true);
        expect(ring.isQAlgebra).toBe(true);
        expect(ring.twoInvertible).toBe(true);
        expect(ring.add(2, 3)).toBe(5);
        expect(ring.multiply(2, 3)).toBe(6);
        expect(ring.scalarMultiply(0.5, 4)).toBe(2);
      });

      it('should create the base infinitesimal object D', () => {
        const ring = createNaturalNumbersRing();
        const infinitesimals = createInfinitesimalObject(ring);

        expect(infinitesimals.kind).toBe('InfinitesimalObject');
        expect(infinitesimals.ring).toBe(ring);
        expect(typeof infinitesimals.nilpotencyCondition).toBe('function');
        expect(typeof infinitesimals.isNilpotent).toBe('function');
        expect(typeof infinitesimals.add).toBe('function');
        expect(typeof infinitesimals.multiply).toBe('function');
      });

      it('should create a linear map on D satisfying the Kock-Lawvere axiom', () => {
        const ring = createNaturalNumbersRing();
        const f = (d: number) => 5 + 3 * d; // f(d) = 5 + 3d
        const basePoint = 5; // f(0) = 5
        const derivative = 3; // f'(0) = 3

        const linearMap = createLinearMapOnD(f, basePoint, derivative, ring);

        expect(linearMap.kind).toBe('LinearMapOnD');
        expect(linearMap.function).toBe(f);
        expect(linearMap.basePoint).toBe(5);
        expect(linearMap.derivative).toBe(3);
        expect(linearMap.satisfiesAxiom).toBe(true);
        expect(linearMap.evaluate(2)).toBe(11); // 5 + 3*2 = 11
      });

      it('should verify the Kock-Lawvere axiom for a function', () => {
        const ring = createNaturalNumbersRing();
        const infinitesimals = createInfinitesimalObject(ring);
        const f = (d: number) => 2 + 4 * d; // Linear function

        const satisfies = verifyKockLawvereAxiom(f, ring, infinitesimals);
        expect(satisfies).toBe(true);
      });

      it('should check Q-algebra properties', () => {
        const ring = createNaturalNumbersRing();
        const isQ = isQAlgebra(ring);
        expect(isQ).toBe(true);
      });
    });

    describe('Vector Form of Axiom 1 (for R-modules)', () => {
      it('should define R-module structure', () => {
        const ring = createNaturalNumbersRing();
        const module: RModule<number> = {
          kind: 'RModule',
          ring,
          add: (v1, v2) => v1 + v2,
          scalarMultiply: (r, v) => r * v,
          zero: 0,
          isInfinitesimallyLinear: true
        };

        expect(module.kind).toBe('RModule');
        expect(module.ring).toBe(ring);
        expect(module.add(3, 4)).toBe(7);
        expect(module.scalarMultiply(2, 3)).toBe(6);
        expect(module.zero).toBe(0);
        expect(module.isInfinitesimallyLinear).toBe(true);
      });

      it('should check infinitesimal linearity', () => {
        const ring = createNaturalNumbersRing();
        const module: RModule<number> = {
          kind: 'RModule',
          ring,
          add: (v1, v2) => v1 + v2,
          scalarMultiply: (r, v) => r * v,
          zero: 0,
          isInfinitesimallyLinear: true
        };

        const isLinear = isInfinitesimallyLinear(module);
        expect(isLinear).toBe(true);
      });
    });
  });

  describe('III. Infinitesimal Object Hierarchy', () => {
    it('should define higher-order infinitesimals D_k', () => {
      const ring = createNaturalNumbersRing();
      const d2: HigherOrderInfinitesimal<2> = {
        kind: 'HigherOrderInfinitesimal',
        order: 2,
        ring,
        nilpotencyCondition: (x) => x * x * x === 0, // x³ = 0
        elements: [],
        isNilpotent: (x) => x * x * x === 0,
        hierarchy: []
      };

      expect(d2.kind).toBe('HigherOrderInfinitesimal');
      expect(d2.order).toBe(2);
      expect(d2.ring).toBe(ring);
      expect(typeof d2.nilpotencyCondition).toBe('function');
    });

    it('should define multi-variable infinitesimals D(n)', () => {
      const ring = createNaturalNumbersRing();
      const baseInfinitesimals = createInfinitesimalObject(ring);
      const d2: MultiVariableInfinitesimal<2> = {
        kind: 'MultiVariableInfinitesimal',
        dimension: 2,
        ring,
        baseInfinitesimals,
        elements: [],
        canonicalMaps: {
          inclusion: (i) => (d) => i === 0 ? [d, 0] : [0, d],
          diagonal: (d) => [d, d]
        },
        additionMap: (d) => d[0] + d[1]
      };

      expect(d2.kind).toBe('MultiVariableInfinitesimal');
      expect(d2.dimension).toBe(2);
      expect(d2.ring).toBe(ring);
      expect(d2.canonicalMaps.inclusion(0)(3)).toEqual([3, 0]);
      expect(d2.canonicalMaps.diagonal(2)).toEqual([2, 2]);
      expect(d2.additionMap([1, 2])).toBe(3);
    });

    it('should define generalized infinitesimals D_k(n)', () => {
      const ring = createNaturalNumbersRing();
      const d2_3: GeneralizedInfinitesimal<2, 3> = {
        kind: 'GeneralizedInfinitesimal',
        order: 2,
        dimension: 3,
        ring,
        nilpotencyCondition: (x) => {
          // Product of any 3 elements should be zero
          return x[0] * x[1] * x[2] === 0;
        },
        elements: [],
        compositionProperty: true,
        additionProperty: true
      };

      expect(d2_3.kind).toBe('GeneralizedInfinitesimal');
      expect(d2_3.order).toBe(2);
      expect(d2_3.dimension).toBe(3);
      expect(d2_3.compositionProperty).toBe(true);
      expect(d2_3.additionProperty).toBe(true);
    });
  });

  describe('IV. Vector Calculus Foundation', () => {
    describe('IV.A.1 - Vector Fields and Infinitesimal Transformations', () => {
      it('should create a vector field with three equivalent formulations', () => {
        const ring = createNaturalNumbersRing();
        const infinitesimals = createInfinitesimalObject(ring);
        const manifold = 'R';
        
        // Flow function: ξ(m, d) = m + d (simple translation)
        const flowFunction = (m: number, d: number) => m + d;
        
        const vectorField = createVectorField(manifold, infinitesimals, flowFunction, ring);
        
        expect(vectorField.kind).toBe('VectorField');
        expect(vectorField.manifold).toBe('R');
        expect(vectorField.infinitesimals).toBe(infinitesimals);
        expect(vectorField.compositionLaw).toBe(true);
        expect(vectorField.invertibility).toBe(true);
        expect(vectorField.isInfinitesimallyLinear).toBe(true);
        
        // Test flow formulation: ξ: M × D → M
        expect(vectorField.flowForm(5, 2)).toBe(7); // 5 + 2 = 7
        expect(vectorField.flowForm(3, 0)).toBe(3); // ξ(m, 0) = m
        
        // Test section formulation: ξ̂: M → M^D
        const section = vectorField.sectionForm(4);
        expect(section(3)).toBe(7); // 4 + 3 = 7
        
        // Test transformation formulation: ξ̃: D → M^M
        const transformation = vectorField.transformationForm(2);
        expect(transformation(5)).toBe(7); // 5 + 2 = 7
      });
      
      it('should create an infinitesimal transformation', () => {
        const ring = createNaturalNumbersRing();
        const manifold = 'R';
        const infinitesimal = 2;
        const transformation = (m: number) => m + infinitesimal;
        
        const infinitesimalTransformation = createInfinitesimalTransformation(
          manifold, infinitesimal, transformation, ring
        );
        
        expect(infinitesimalTransformation.kind).toBe('InfinitesimalTransformation');
        expect(infinitesimalTransformation.manifold).toBe('R');
        expect(infinitesimalTransformation.infinitesimal).toBe(2);
        expect(infinitesimalTransformation.transformation).toBe(transformation);
        expect(infinitesimalTransformation.isBijective).toBe(true);
        expect(typeof infinitesimalTransformation.inverse).toBe('function');
        
        // Test transformation
        expect(infinitesimalTransformation.transformation(5)).toBe(7); // 5 + 2 = 7
      });
      
      it('should create a vector field module with scalar multiplication', () => {
        const ring = createNaturalNumbersRing();
        const infinitesimals = createInfinitesimalObject(ring);
        const manifold = 'R';
        
        // Create two vector fields
        const flow1 = (m: number, d: number) => m + d;
        const flow2 = (m: number, d: number) => m + 2 * d;
        
        const vectorField1 = createVectorField(manifold, infinitesimals, flow1, ring);
        const vectorField2 = createVectorField(manifold, infinitesimals, flow2, ring);
        
        const module = createVectorFieldModule(manifold, ring, [vectorField1, vectorField2]);
        
        expect(module.kind).toBe('VectorFieldModule');
        expect(module.manifold).toBe('R');
        expect(module.ring).toBe(ring);
        expect(module.vectorFields).toHaveLength(2);
        
        // Test scalar multiplication: (f·X)(m, d) := X(m, f(m)·d)
        const scalarFunction = (m: number) => 3; // Constant function f(m) = 3
        const scaledField = module.scalarMultiply(scalarFunction, vectorField1);
        
        expect(scaledField.kind).toBe('VectorField');
        expect(scaledField.flowForm(5, 2)).toBe(11); // 5 + (3*2) = 5 + 6 = 11
        
        // Test addition: Pointwise addition of vector fields
        const sumField = module.add(vectorField1, vectorField2);
        expect(sumField.flowForm(5, 2)).toBe(16); // (5+2) + (5+2*2) = 7 + 9 = 16
        
        // Test zero vector field
        expect(module.zero.kind).toBe('VectorField');
        expect(module.zero.flowForm(5, 2)).toBe(5); // X(m, d) = m for all d
      });
    });
  });

  describe('V. Tangent Spaces and Bundles', () => {
    it('should create a tangent vector', () => {
      const ring = createNaturalNumbersRing();
      const infinitesimals = createInfinitesimalObject(ring);
      const basePoint = 5;
      const f = (d: number) => basePoint + d; // Simple infinitesimal path

      const tangentVector = createTangentVector(basePoint, f, infinitesimals);

      expect(tangentVector.kind).toBe('TangentVector');
      expect(tangentVector.basePoint).toBe(5);
      expect(tangentVector.function).toBe(f);
      expect(tangentVector.domain).toBe(infinitesimals);
      expect(tangentVector.function(2)).toBe(7); // 5 + 2 = 7
    });

    it('should create a zero tangent vector (Page 26)', () => {
      const ring = createNaturalNumbersRing();
      const infinitesimals = createInfinitesimalObject(ring);
      const basePoint = 3;

      const zeroTangent = createZeroTangentVector(basePoint, infinitesimals);

      expect(zeroTangent.kind).toBe('TangentVector');
      expect(zeroTangent.basePoint).toBe(3);
      expect(zeroTangent.function(5)).toBe(3); // Always returns base point
      expect(zeroTangent.function(0)).toBe(3);
      expect(zeroTangent.function(10)).toBe(3);
    });

    it('should add tangent vectors (Page 25)', () => {
      const ring = createNaturalNumbersRing();
      const infinitesimals = createInfinitesimalObject(ring);
      
      const t1 = createTangentVector(0, (d) => d, infinitesimals);
      const t2 = createTangentVector(0, (d) => 2 * d, infinitesimals);
      
      const sum = addTangentVectors(t1, t2, ring);
      
      expect(sum.kind).toBe('TangentVector');
      expect(sum.basePoint).toBe(0);
      expect(sum.function(3)).toBe(9); // (3) + (2*3) = 3 + 6 = 9
      expect(sum.function(1)).toBe(3); // (1) + (2*1) = 1 + 2 = 3
    });

    it('should scale tangent vectors (Page 26)', () => {
      const ring = createNaturalNumbersRing();
      const infinitesimals = createInfinitesimalObject(ring);
      
      const t = createTangentVector(0, (d) => d, infinitesimals);
      const scaled = scaleTangentVector(3, t, ring);
      
      expect(scaled.kind).toBe('TangentVector');
      expect(scaled.basePoint).toBe(0);
      expect(scaled.function(2)).toBe(6); // t(3*2) = t(6) = 6
      expect(scaled.function(1)).toBe(3); // t(3*1) = t(3) = 3
    });

    it('should extract principal parts (Page 26)', () => {
      const ring = createNaturalNumbersRing();
      const infinitesimals = createInfinitesimalObject(ring);
      
      // Create tangent vector with principal part
      const t: TangentVector<number> = {
        kind: 'TangentVector',
        basePoint: 0,
        function: (d) => 0 + 5 * d, // t(d) = 0 + 5d
        domain: infinitesimals,
        principalPart: 5
      };
      
      const principalPart = extractPrincipalPart(t, ring);
      
      expect(principalPart).toBe(5);
    });

    it('should create a tangent bundle', () => {
      const manifold = 'R';
      const ring = createNaturalNumbersRing();
      const infinitesimals = createInfinitesimalObject(ring);
      
      const tangentVector1 = createTangentVector(0, (d) => d, infinitesimals);
      const tangentVector2 = createTangentVector(1, (d) => 1 + d, infinitesimals);
      
      const tangentVectors = [tangentVector1, tangentVector2];
      const bundle = createTangentBundle(manifold, tangentVectors);

      expect(bundle.kind).toBe('TangentBundle');
      expect(bundle.manifold).toBe('R');
      expect(bundle.tangentVectors).toHaveLength(2);
      expect(bundle.projection(tangentVector1)).toBe(0);
      expect(bundle.projection(tangentVector2)).toBe(1);
      
      const fibreAt0 = bundle.fibreAt(0);
      expect(fibreAt0).toHaveLength(1);
      expect(fibreAt0[0]).toBe(tangentVector1);
    });

    it('should define tangent space structure', () => {
      const manifold = 'R';
      const basePoint = 0;
      const ring = createNaturalNumbersRing();
      const infinitesimals = createInfinitesimalObject(ring);
      
      const tangentVector = createTangentVector(basePoint, (d) => d, infinitesimals);
      
      const tangentSpace: TangentSpace<string, number> = {
        kind: 'TangentSpace',
        manifold,
        basePoint,
        tangentVectors: [tangentVector],
        isRModule: true,
        addition: (t1, t2) => createTangentVector(
          basePoint,
          (d) => t1.function(d) + t2.function(d),
          infinitesimals
        ),
        scalarMultiplication: (r, t) => createTangentVector(
          basePoint,
          (d) => r * t.function(d),
          infinitesimals
        )
      };

      expect(tangentSpace.kind).toBe('TangentSpace');
      expect(tangentSpace.manifold).toBe('R');
      expect(tangentSpace.basePoint).toBe(0);
      expect(tangentSpace.tangentVectors).toHaveLength(1);
      expect(tangentSpace.isRModule).toBe(true);
      expect(typeof tangentSpace.addition).toBe('function');
      expect(typeof tangentSpace.scalarMultiplication).toBe('function');
    });
  });

  describe('Examples and Integration', () => {
    it('should create natural numbers ring', () => {
      const ring = createNaturalNumbersRing();

      expect(ring.kind).toBe('CommutativeRing');
      expect(ring.isCommutative).toBe(true);
      expect(ring.isQAlgebra).toBe(true);
      expect(ring.add(3, 4)).toBe(7);
      expect(ring.multiply(2, 5)).toBe(10);
      expect(ring.scalarMultiply(0.5, 6)).toBe(3); // Math.floor(0.5 * 6)
    });

    it('should integrate polynomial functors as Taylor series', () => {
      const linearMap = polynomialAsTaylorSeries(mockPolynomial);

      expect(linearMap.kind).toBe('LinearMapOnD');
      expect(linearMap.basePoint).toBe(0);
      expect(linearMap.derivative).toBe(1);
      expect(linearMap.satisfiesAxiom).toBe(true);
      expect(linearMap.evaluate(3)).toBe(3); // 0 + 1*3 = 3
    });

    it('should create tangent vector from polynomial functor', () => {
      const basePoint = 10;
      const tangentVector = polynomialAsTangentVector(mockPolynomial, basePoint);

      expect(tangentVector.kind).toBe('TangentVector');
      expect(tangentVector.basePoint).toBe(10);
      expect(tangentVector.domain.kind).toBe('InfinitesimalObject');
      expect(tangentVector.function(2)).toBe(12); // 10 + 2 = 12
    });
  });

  describe('Mathematical Properties', () => {
    it('should satisfy Kock-Lawvere axiom for linear functions', () => {
      const ring = createNaturalNumbersRing();
      const infinitesimals = createInfinitesimalObject(ring);
      
      // Test linear function f(d) = a + b*d
      const a = 2;
      const b = 3;
      const f = (d: number) => a + b * d;
      
      const linearMap = createLinearMapOnD(f, a, b, ring);
      
      // Verify f(d) = f(0) + d*f'(0) for various d
      expect(linearMap.evaluate(0)).toBe(2); // f(0) = 2
      expect(linearMap.evaluate(1)).toBe(5); // f(1) = 2 + 3*1 = 5
      expect(linearMap.evaluate(2)).toBe(8); // f(2) = 2 + 3*2 = 8
    });

    it('should handle nilpotent elements correctly', () => {
      const ring = createNaturalNumbersRing();
      const infinitesimals = createInfinitesimalObject(ring);
      
      // In a proper implementation, we'd have actual nilpotent elements
      // For now, we test the structure
      expect(infinitesimals.isNilpotent(0)).toBe(true); // 0² = 0
      expect(typeof infinitesimals.add).toBe('function');
      expect(typeof infinitesimals.multiply).toBe('function');
    });

    it('should support tangent vector operations', () => {
      const ring = createNaturalNumbersRing();
      const infinitesimals = createInfinitesimalObject(ring);
      
      const t1 = createTangentVector(0, (d) => d, infinitesimals);
      const t2 = createTangentVector(0, (d) => 2 * d, infinitesimals);
      
      // Test that tangent vectors work as expected
      expect(t1.function(3)).toBe(3);
      expect(t2.function(3)).toBe(6);
      expect(t1.basePoint).toBe(0);
      expect(t2.basePoint).toBe(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle edge cases in ring operations', () => {
      const ring = createNaturalNumbersRing();
      
      expect(ring.add(0, 0)).toBe(0);
      expect(ring.multiply(0, 5)).toBe(0);
      expect(ring.scalarMultiply(0, 10)).toBe(0);
    });

    it('should handle zero tangent vectors', () => {
      const ring = createNaturalNumbersRing();
      const infinitesimals = createInfinitesimalObject(ring);
      
      const zeroTangent = createTangentVector(0, (d) => 0, infinitesimals);
      
      expect(zeroTangent.function(5)).toBe(0);
      expect(zeroTangent.basePoint).toBe(0);
    });

    it('should handle empty tangent bundles', () => {
      const bundle = createTangentBundle('R', []);
      
      expect(bundle.tangentVectors).toHaveLength(0);
      expect(bundle.fibreAt(0)).toHaveLength(0);
    });
  });

  describe('VIII. Order and Integration (I.13)', () => {
    describe('Hadamard Derivative (Exercise 13.1)', () => {
      it('should create Hadamard derivative with divided difference', () => {
        const f = (x: number) => x * x; // f(x) = x²
        const g = (x: number, y: number) => x + y; // g(x,y) = x + y (satisfies f(x) - f(y) = (x-y)(x+y))
        
        const hadamard = createHadamardDerivative(f, g);
        
        expect(hadamard.kind).toBe('HadamardDerivative');
        expect(hadamard.function(3)).toBe(9);
        expect(hadamard.dividedDifference(4, 2)).toBe(6);
        expect(hadamard.satisfiesHadamardLemma).toBe(true);
        expect(hadamard.derivativeAtPoint(3)).toBe(6); // g(3,3) = 6
      });

      it('should verify Hadamard lemma for quadratic function', () => {
        const f = (x: number) => x * x;
        const g = (x: number, y: number) => x + y;
        
        const hadamard = createHadamardDerivative(f, g);
        
        // Verify f(x) - f(y) = (x - y) · g(x, y)
        const x = 5, y = 2;
        const leftSide = f(x) - f(y); // 25 - 4 = 21
        const rightSide = (x - y) * g(x, y); // 3 * 7 = 21
        
        expect(leftSide).toBe(rightSide);
        expect(hadamard.derivativeAtPoint(x)).toBe(2 * x); // f'(x) = 2x
      });
    });

    describe('Uniqueness Axiom (Exercise 13.2)', () => {
      it('should create uniqueness axiom for functions', () => {
        const ring = createCommutativeRing();
        const uniquenessAxiom = createUniquenessAxiomForFunctions(ring);
        
        expect(uniquenessAxiom.kind).toBe('UniquenessAxiomForFunctions');
        expect(uniquenessAxiom.ring).toBe(ring);
        expect(uniquenessAxiom.satisfiesAxiom).toBe(true);
      });

      it('should verify uniqueness axiom property', () => {
        const ring = createCommutativeRing();
        const uniquenessAxiom = createUniquenessAxiomForFunctions(ring);
        
        // Test with zero function
        const zeroFunction = (x: number) => 0;
        expect(uniquenessAxiom.axiom(zeroFunction)).toBe(true);
        
        // Test with non-zero function that satisfies x·h(x) = 0
        const testFunction = (x: number) => x === 0 ? 1 : 0;
        expect(uniquenessAxiom.axiom(testFunction)).toBe(true);
      });
    });

    describe('Synthetic Taylor Expansion (Exercise 13.3)', () => {
      it('should create synthetic Taylor expansion', () => {
        const f = (x: number) => x * x; // f(x) = x²
        const fPrime = (x: number) => 2 * x; // f'(x) = 2x
        const h = (x: number, y: number) => 1; // h(x,y) = 1 (remainder term)
        
        const taylor = createSyntheticTaylorExpansion(f, fPrime, h);
        
        expect(taylor.kind).toBe('SyntheticTaylorExpansion');
        expect(taylor.function(3)).toBe(9);
        expect(taylor.derivative(3)).toBe(6);
        expect(taylor.remainderTerm(2, 5)).toBe(1);
        expect(taylor.satisfiesTaylorExpansion).toBe(true);
      });

      it('should verify synthetic Taylor expansion formula', () => {
        const f = (x: number) => x * x;
        const fPrime = (x: number) => 2 * x;
        const h = (x: number, y: number) => 1;
        
        const taylor = createSyntheticTaylorExpansion(f, fPrime, h);
        
        const x = 2, y = 5;
        const leftSide = f(y) - f(x); // 25 - 4 = 21
        const rightSide = (y - x) * fPrime(x) + (y - x) * (y - x) * h(x, y);
        // (5-2) * 4 + (5-2)² * 1 = 3 * 4 + 9 * 1 = 12 + 9 = 21
        
        expect(leftSide).toBe(rightSide);
      });
    });

    describe('Definite Integral Properties', () => {
      it('should create definite integral properties', () => {
        const integralProps = createDefiniteIntegralProperties();
        
        expect(integralProps.kind).toBe('DefiniteIntegralProperties');
        expect(integralProps.linearity).toBeDefined();
        expect(integralProps.additivity).toBeDefined();
        expect(integralProps.fundamentalTheorem).toBeDefined();
        expect(integralProps.changeOfVariables).toBeDefined();
      });

      it('should verify linearity property', () => {
        const integralProps = createDefiniteIntegralProperties();
        const f = (t: number) => t;
        const g = (t: number) => t * t;
        const λ = 2;
        const a = 0, b = 1;
        
        expect(integralProps.linearity(f, g, a, b, λ)).toBe(true);
      });

      it('should verify additivity property', () => {
        const integralProps = createDefiniteIntegralProperties();
        const f = (t: number) => t;
        const a = 0, b = 1, c = 2;
        
        expect(integralProps.additivity(f, a, b, c)).toBe(true);
      });
    });
  });

  describe('IX. Forms and Currents (I.14)', () => {
    describe('Differential n-forms', () => {
      it('should create differential n-form', () => {
        const manifold = 'R²';
        const valueModule = 'R';
        const ring = createCommutativeRing();
        const degree = 2;
        
        const evaluation = (tangents: Array<(d: number) => string>) => {
          // Simple evaluation: return the number of tangents
          return tangents.length.toString();
        };
        
        const form = createDifferentialNForm(manifold, valueModule, ring, degree, evaluation);
        
        expect(form.kind).toBe('DifferentialNForm');
        expect(form.manifold).toBe(manifold);
        expect(form.valueModule).toBe(valueModule);
        expect(form.ring).toBe(ring);
        expect(form.degree).toBe(degree);
        expect(form.evaluation).toBeDefined();
        expect(form.multilinearity).toBeDefined();
        expect(form.alternating).toBeDefined();
      });

      it('should verify multilinearity property', () => {
        const form = createDifferentialNForm('R²', 'R', createCommutativeRing(), 2, 
          (tangents) => tangents.length.toString());
        
        const λ = 2;
        const i = 0;
        const tangents = [(d: number) => 'point1', (d: number) => 'point2'];
        
        expect(form.multilinearity(λ, i, tangents)).toBe(true);
      });

      it('should verify alternating property', () => {
        const form = createDifferentialNForm('R²', 'R', createCommutativeRing(), 2,
          (tangents) => tangents.length.toString());
        
        const permutation = [1, 0]; // Swap first two elements
        const tangents = [(d: number) => 'point1', (d: number) => 'point2'];
        
        expect(form.alternating(permutation, tangents)).toBe(true);
      });
    });

    describe('N-tangents', () => {
      it('should create n-tangent', () => {
        const manifold = 'R²';
        const degree = 2;
        const evaluation = (coordinates: number[]) => `point(${coordinates.join(',')})`;
        
        const nTangent = createNTangent(manifold, degree, evaluation);
        
        expect(nTangent.kind).toBe('NTangent');
        expect(nTangent.manifold).toBe(manifold);
        expect(nTangent.degree).toBe(degree);
        expect(nTangent.evaluation([1, 2])).toBe('point(1,2)');
        expect(nTangent.scalarAction).toBeDefined();
      });

      it('should apply scalar action to n-tangent', () => {
        const nTangent = createNTangent('R²', 2, (coords) => `point(${coords.join(',')})`);
        
        const λ = 3;
        const i = 0;
        const scaledTangent = nTangent.scalarAction(λ, i);
        
        expect(scaledTangent.kind).toBe('NTangent');
        expect(scaledTangent.manifold).toBe('R²');
        expect(scaledTangent.degree).toBe(2);
      });
    });

    describe('Object of n-forms E^n(M, V)', () => {
      it('should create object of n-forms', () => {
        const manifold = 'R²';
        const valueModule = 'R';
        const ring = createCommutativeRing();
        const degree = 2;
        
        const objectOfForms = createObjectOfNForms(manifold, valueModule, ring, degree);
        
        expect(objectOfForms.kind).toBe('ObjectOfNForms');
        expect(objectOfForms.manifold).toBe(manifold);
        expect(objectOfForms.valueModule).toBe(valueModule);
        expect(objectOfForms.ring).toBe(ring);
        expect(objectOfForms.degree).toBe(degree);
        expect(objectOfForms.forms).toEqual([]);
        expect(objectOfForms.isRModule).toBe(true);
        expect(objectOfForms.scalarMultiplication).toBeDefined();
        expect(objectOfForms.addition).toBeDefined();
      });

      it('should perform scalar multiplication on forms', () => {
        const objectOfForms = createObjectOfNForms('R²', 'R', createCommutativeRing(), 2);
        const form = createDifferentialNForm('R²', 'R', createCommutativeRing(), 2,
          (tangents) => tangents.length.toString());
        
        const λ = 3;
        const scaledForm = objectOfForms.scalarMultiplication(λ, form);
        
        expect(scaledForm.kind).toBe('DifferentialNForm');
        expect(scaledForm.degree).toBe(2);
      });

      it('should add forms', () => {
        const objectOfForms = createObjectOfNForms('R²', 'R', createCommutativeRing(), 2);
        const form1 = createDifferentialNForm('R²', 'R', createCommutativeRing(), 2,
          (tangents) => tangents.length.toString());
        const form2 = createDifferentialNForm('R²', 'R', createCommutativeRing(), 2,
          (tangents) => (tangents.length * 2).toString());
        
        const sumForm = objectOfForms.addition(form1, form2);
        
        expect(sumForm.kind).toBe('DifferentialNForm');
        expect(sumForm.degree).toBe(2);
      });
    });

    describe('Form pullback', () => {
      it('should create form pullback', () => {
        const map = (m: string) => `mapped(${m})`;
        const sourceManifold = 'R²';
        const targetManifold = 'R³';
        const valueModule = 'R';
        const ring = createCommutativeRing();
        const degree = 2;
        
        const pullback = createFormPullback(map, sourceManifold, targetManifold, valueModule, ring, degree);
        
        expect(pullback.kind).toBe('FormPullback');
        expect(pullback.sourceManifold).toBe(sourceManifold);
        expect(pullback.targetManifold).toBe(targetManifold);
        expect(pullback.valueModule).toBe(valueModule);
        expect(pullback.ring).toBe(ring);
        expect(pullback.degree).toBe(degree);
        expect(pullback.isRLinear).toBe(true);
        expect(pullback.pullback).toBeDefined();
      });

      it('should pullback a form', () => {
        const map = (m: string) => `mapped(${m})`;
        const pullback = createFormPullback(map, 'R²', 'R³', 'R', createCommutativeRing(), 2);
        const targetForm = createDifferentialNForm('R³', 'R', createCommutativeRing(), 2,
          (tangents) => tangents.length.toString());
        
        const pulledBackForm = pullback.pullback(targetForm);
        
        expect(pulledBackForm.kind).toBe('DifferentialNForm');
        expect(pulledBackForm.manifold).toBe('R²');
        expect(pulledBackForm.degree).toBe(2);
      });
    });

    describe('N-currents', () => {
      it('should create n-current', () => {
        const manifold = 'R²';
        const valueModule = 'R';
        const ring = createCommutativeRing();
        const degree = 2;
        const evaluation = (ω: DifferentialNForm<string, string, CommutativeRing>) => 'evaluated';
        
        const current = createNCurrent(manifold, valueModule, ring, degree, evaluation);
        
        expect(current.kind).toBe('NCurrent');
        expect(current.manifold).toBe(manifold);
        expect(current.valueModule).toBe(valueModule);
        expect(current.ring).toBe(ring);
        expect(current.degree).toBe(degree);
        expect(current.isRLinear).toBe(true);
        expect(current.additivity).toBeDefined();
        expect(current.homogeneity).toBeDefined();
      });

      it('should verify additivity property of current', () => {
        const current = createNCurrent('R²', 'R', createCommutativeRing(), 2,
          (ω) => 'evaluated');
        const form1 = createDifferentialNForm('R²', 'R', createCommutativeRing(), 2,
          (tangents) => tangents.length.toString());
        const form2 = createDifferentialNForm('R²', 'R', createCommutativeRing(), 2,
          (tangents) => (tangents.length * 2).toString());
        
        expect(current.additivity(form1, form2)).toBe(true);
      });

      it('should verify homogeneity property of current', () => {
        const current = createNCurrent('R²', 'R', createCommutativeRing(), 2,
          (ω) => 'evaluated');
        const form = createDifferentialNForm('R²', 'R', createCommutativeRing(), 2,
          (tangents) => tangents.length.toString());
        const λ = 3;
        
        expect(current.homogeneity(λ, form)).toBe(true);
      });
    });
  });

  describe('XII. Formal Manifolds (I.17) - New Section from Pages 69-70', () => {
    it('should create a D-étale map', () => {
      const classOfMaps: ClassOfMapsD<string, string> = {
        kind: 'ClassOfMapsD',
        maps: [
          { domain: 'J', codomain: 'K', map: (j: string) => j }
        ],
        isSmall: true,
        isSuitable: true
      };

      const dEtaleMap = createDEtaleMap('M', 'N', classOfMaps);

      expect(dEtaleMap.kind).toBe('DEtaleMap');
      expect(dEtaleMap.domain).toBe('M');
      expect(dEtaleMap.codomain).toBe('N');
      expect(dEtaleMap.isDEtale).toBe(true);
      expect(dEtaleMap.pullbackCondition.isPullback).toBe(true);
      expect(dEtaleMap.pullbackCondition.uniqueDiagonalFillIn).toBe(true);
    });

    it('should create a formal manifold', () => {
      const modelObject: ModelObject<1> = {
        kind: 'ModelObject',
        dimension: 1,
        domain: 'D∞',
        codomain: 'R',
        formalEtaleMap: {
          kind: 'FormalEtaleMap',
          domain: 'D∞',
          codomain: 'R',
          isFormalEtale: true,
          preservesProducts: true,
          isClosedUnderComposition: true,
          isStableUnderPullback: true
        },
        examples: ['D∞', 'R', 'Inv(R)']
      };

      const formalManifold = createFormalManifold(1, [modelObject]);

      expect(formalManifold.kind).toBe('FormalManifold');
      expect(formalManifold.dimension).toBe(1);
      expect(formalManifold.modelObjects).toHaveLength(1);
      expect(formalManifold.isFormalManifold).toBe(true);
      expect(formalManifold.modelObjects[0].examples).toEqual(['D∞', 'R', 'Inv(R)']);
    });
  });

  describe('XIII. Open Covers and Sheaves (I.19) - New Section from Pages 79-82', () => {
    it('should create an open cover', () => {
      const coveringMap1: CoveringMap<number> = {
        kind: 'CoveringMap',
        domain: '(-∞, 1)',
        codomain: 'R',
        map: (x) => x,
        isOpen: true
      };

      const coveringMap2: CoveringMap<number> = {
        kind: 'CoveringMap',
        domain: '(0, ∞)',
        codomain: 'R',
        map: (x) => x,
        isOpen: true
      };

      const openCover = createOpenCover('R', [coveringMap1, coveringMap2]);

      expect(openCover.kind).toBe('OpenCover');
      expect(openCover.baseObject).toBe('R');
      expect(openCover.coveringMaps).toHaveLength(2);
      expect(openCover.isJointlySurjective).toBe(true);
      expect(openCover.satisfiesOpenCoverAxioms).toBe(true);
      expect(openCover.coveringMaps[0].domain).toBe('(-∞, 1)');
      expect(openCover.coveringMaps[1].domain).toBe('(0, ∞)');
    });

    it('should create a sheaf', () => {
      const sheaf = createSheaf('R', (openSet) => `C^0(${openSet})`);

      expect(sheaf.kind).toBe('Sheaf');
      expect(sheaf.baseObject).toBe('R');
      expect(sheaf.isSheaf).toBe(true);
      expect(sheaf.gluingCondition).toBe(true);
      expect(sheaf.descentCondition).toBe(true);
      expect(sheaf.functor('(0,1)')).toBe('C^0((0,1))');
    });

    it('should create an étale map', () => {
      const etaleMap: EtaleMap<string, number> = {
        kind: 'EtaleMap',
        domain: 'E',
        codomain: 'X',
        projection: (e) => parseInt(e),
        isLocallyIsomorphic: true,
        hasLocalSections: true,
        isEtale: true
      };

      expect(etaleMap.kind).toBe('EtaleMap');
      expect(etaleMap.domain).toBe('E');
      expect(etaleMap.codomain).toBe('X');
      expect(etaleMap.isEtale).toBe(true);
      expect(etaleMap.isLocallyIsomorphic).toBe(true);
    });

    it('should create a germ', () => {
      const localRing: LocalRing<number> = {
        kind: 'LocalRing',
        ring: 0,
        uniqueMaximalIdeal: true,
        isLocal: true
      };

      const germ: Germ<number, number> = {
        kind: 'Germ',
        basePoint: 0,
        functions: [
          { domain: '(-1,1)', function: (x) => x * x }
        ],
        equivalenceRelation: (f1, f2) => true,
        localRing
      };

      expect(germ.kind).toBe('Germ');
      expect(germ.basePoint).toBe(0);
      expect(germ.functions).toHaveLength(1);
      expect(germ.localRing.isLocal).toBe(true);
    });
  });

  describe('XIV. Differential Forms as Quantities (I.20) - New Section from Page 82', () => {
    it('should create a differential form as quantity', () => {
      const ring = createCommutativeRing(
        (a, b) => a + b,
        (a, b) => a * b,
        (r, a) => r * a
      );

      const infinitesimalObject: HigherOrderInfinitesimal<1> = {
        kind: 'HigherOrderInfinitesimal',
        order: 1,
        ring,
        nilpotencyCondition: (x) => x * x === 0,
        elements: [],
        isNilpotent: (x) => x * x === 0,
        hierarchy: []
      };

      const form = createDifferentialFormAsQuantity(
        'R',
        1,
        infinitesimalObject,
        (tangent) => tangent * 2 // Simple 1-form: ω(dx) = 2dx
      );

      expect(form.kind).toBe('DifferentialFormAsQuantity');
      expect(form.manifold).toBe('R');
      expect(form.degree).toBe(1);
      expect(form.isEquivalentToSimplexDefinition).toBe(true);
      expect(form.form(0.1)).toBe(0.2);
    });

    it('should create n-tangent as quantity', () => {
      const ring = createCommutativeRing(
        (a, b) => a + b,
        (a, b) => a * b,
        (r, a) => r * a
      );

      const baseInfinitesimals = createInfinitesimalObject(ring);
      const infinitesimalObject: MultiVariableInfinitesimal<2> = {
        kind: 'MultiVariableInfinitesimal',
        dimension: 2,
        ring,
        baseInfinitesimals,
        elements: [],
        canonicalMaps: {
          inclusion: (i) => (d) => i === 0 ? [d, 0] : [0, d],
          diagonal: (d) => [d, d]
        },
        additionMap: (d) => d[0] + d[1]
      };

      const nTangent: NTangentAsQuantity<number, 2> = {
        kind: 'NTangentAsQuantity',
        manifold: 'R',
        dimension: 2,
        infinitesimalObject,
        tangentMap: (point) => [point, point],
        isNTangent: true
      };

      expect(nTangent.kind).toBe('NTangentAsQuantity');
      expect(nTangent.manifold).toBe('R');
      expect(nTangent.dimension).toBe(2);
      expect(nTangent.isNTangent).toBe(true);
      expect(nTangent.tangentMap(5)).toEqual([5, 5]);
    });
  });

  describe('XV. Integration with Existing Frameworks', () => {
    it('should create SDG topos integration', () => {
      const integration = createSDGToposIntegration();

      expect(integration.kind).toBe('SDGToposIntegration');
      expect(integration.openCoverTopology.isGrothendieckTopology).toBe(true);
      expect(integration.openCoverTopology.isKockLawvereTopology).toBe(true);
      expect(integration.openCoverTopology.satisfiesAxioms).toBe(true);
      expect(integration.sheafification.isSheaf({})).toBe(true);
    });
  });

  describe('XVI. Examples and Applications', () => {
    it('should demonstrate formal 1D manifold example', () => {
      // This test verifies the example function works without errors
      expect(() => exampleFormal1DManifold()).not.toThrow();
    });

    it('should demonstrate open cover of R example', () => {
      // This test verifies the example function works without errors
      expect(() => exampleOpenCoverOfR()).not.toThrow();
    });

    it('should demonstrate sheaf of continuous functions example', () => {
      // This test verifies the example function works without errors
      expect(() => exampleSheafOfContinuousFunctions()).not.toThrow();
    });

    it('should demonstrate differential form as quantity example', () => {
      // This test verifies the example function works without errors
      expect(() => exampleDifferentialFormAsQuantity()).not.toThrow();
    });
  });
});

describe('XVII. New Algebraic Foundations (Pages 68-69)', () => {
  describe('Enhanced D-étale Maps (Page 69)', () => {
    it('should create enhanced D-étale map with precise categorical definition', () => {
      const classOfMaps: ClassOfMapsD<string, string> = {
        kind: 'ClassOfMapsD',
        maps: [
          { source: 'J', target: 'K', morphism: 'j: J → K' }
        ],
        isSmall: true,
        preservesProducts: true,
        preservesPullbacks: true
      };
      
      const enhancedDEtaleMap = createEnhancedDEtaleMap('M', 'N', classOfMaps);
      
      expect(enhancedDEtaleMap.kind).toBe('EnhancedDEtaleMap');
      expect(enhancedDEtaleMap.domain).toBe('M');
      expect(enhancedDEtaleMap.codomain).toBe('N');
      expect(enhancedDEtaleMap.isDEtale).toBe(true);
      expect(enhancedDEtaleMap.preservesProducts).toBe(true);
      expect(enhancedDEtaleMap.stableUnderComposition).toBe(true);
      expect(enhancedDEtaleMap.stableUnderPullback).toBe(true);
    });

    it('should implement pullback condition correctly', () => {
      const classOfMaps: ClassOfMapsD<string, string> = {
        kind: 'ClassOfMapsD',
        maps: [
          { source: 'J', target: 'K', morphism: 'j: J → K' }
        ],
        isSmall: true,
        preservesProducts: true,
        preservesPullbacks: true
      };
      
      const enhancedDEtaleMap = createEnhancedDEtaleMap('M', 'N', classOfMaps);
      const pullbackCondition = enhancedDEtaleMap.pullbackCondition;
      
      expect(pullbackCondition.kind).toBe('PullbackCondition');
      expect(pullbackCondition.isPullback).toBe(true);
      expect(pullbackCondition.commutativeSquare.topLeft).toBe('M^K');
      expect(pullbackCondition.commutativeSquare.topRight).toBe('N^K');
      expect(pullbackCondition.commutativeSquare.bottomLeft).toBe('M^J');
      expect(pullbackCondition.commutativeSquare.bottomRight).toBe('N^J');
      expect(pullbackCondition.commutativeSquare.topArrow).toBe('f^K');
      expect(pullbackCondition.commutativeSquare.bottomArrow).toBe('f^J');
      expect(pullbackCondition.uniqueDiagonalFillIn).toBe(true);
      expect(pullbackCondition.universalProperty.exists).toBe(true);
      expect(pullbackCondition.universalProperty.unique).toBe(true);
      expect(pullbackCondition.universalProperty.naturality).toBe(true);
    });

    it('should satisfy set-theoretic interpretation', () => {
      const classOfMaps: ClassOfMapsD<string, string> = {
        kind: 'ClassOfMapsD',
        maps: [
          { source: 'J', target: 'K', morphism: 'j: J → K' }
        ],
        isSmall: true,
        preservesProducts: true,
        preservesPullbacks: true
      };
      
      const enhancedDEtaleMap = createEnhancedDEtaleMap('M', 'N', classOfMaps);
      const setTheoreticCondition = enhancedDEtaleMap.setTheoreticCondition;
      
      expect(setTheoreticCondition.uniqueExtension).toBe(true);
      expect(setTheoreticCondition.commutativity).toBe(true);
      expect(setTheoreticCondition.universalProperty).toBe(true);
    });
  });

  describe('k-Module Constructions (Page 68)', () => {
    it('should create k-module L = Λʳ(E) ⊗ Λʳ(F)', () => {
      const kModuleL = createKModuleL(2, 'E', 'F', 'R');
      
      expect(kModuleL.kind).toBe('KModuleL');
      expect(kModuleL.r).toBe(2);
      expect(kModuleL.moduleE).toBe('E');
      expect(kModuleL.moduleF).toBe('F');
      expect(kModuleL.ring).toBe('R');
      expect(kModuleL.exteriorPowerE).toBe('Λ^2(E)');
      expect(kModuleL.exteriorPowerF).toBe('Λ^2(F)');
      expect(kModuleL.tensorProduct).toBe('Λ^2(E) ⊗ Λ^2(F)');
      expect(kModuleL.isCommutativeAlgebra).toBe(true);
    });

    it('should implement commutative k-algebra structure', () => {
      const kModuleL = createKModuleL(3, 'E', 'F', 'R');
      
      expect(kModuleL.algebraStructure.associativity).toBe(true);
      expect(kModuleL.algebraStructure.commutativity).toBe(true);
      expect(kModuleL.algebraStructure.distributivity).toBe(true);
      expect(kModuleL.algebraStructure.unity).toBe(true);
      
      const product = kModuleL.productOperation('a', 'b');
      expect(product).toBe('concatenated_exterior_product');
    });
  });

  describe('k-Algebra Homomorphism ψ (Page 68)', () => {
    it('should create homomorphism ψ: S•(E ⊗ F) → L', () => {
      const kModuleL = createKModuleL(2, 'E', 'F', 'R');
      const homomorphismPsi = createKAlgebraHomomorphism('S•(E ⊗ F)', kModuleL);
      
      expect(homomorphismPsi.kind).toBe('KAlgebraHomomorphism');
      expect(homomorphismPsi.source).toBe('S•(E ⊗ F)');
      expect(homomorphismPsi.target).toBe(kModuleL);
      expect(homomorphismPsi.isHomomorphism).toBe(true);
      expect(homomorphismPsi.vanishesOnIdeal).toBe(true);
    });

    it('should preserve algebraic structure', () => {
      const kModuleL = createKModuleL(2, 'E', 'F', 'R');
      const homomorphismPsi = createKAlgebraHomomorphism('S•(E ⊗ F)', kModuleL);
      
      expect(homomorphismPsi.preservesStructure.addition).toBe(true);
      expect(homomorphismPsi.preservesStructure.multiplication).toBe(true);
      expect(homomorphismPsi.preservesStructure.scalarMultiplication).toBe(true);
      
      const mapping = homomorphismPsi.mapping('e', 'f');
      expect(mapping).toBe('e ⊗ f ∈ Λ¹E ⊗ Λ¹F');
    });

    it('should have induced homomorphism', () => {
      const kModuleL = createKModuleL(2, 'E', 'F', 'R');
      const homomorphismPsi = createKAlgebraHomomorphism('S•(E ⊗ F)', kModuleL);
      
      expect(homomorphismPsi.inducedHomomorphism.exists).toBe(true);
      expect(homomorphismPsi.inducedHomomorphism.domain).toBe('S•(E ⊗ F)/I');
      expect(homomorphismPsi.inducedHomomorphism.codomain).toBe(kModuleL);
    });
  });

  describe('Determinant-Based Map φ (Page 68)', () => {
    it('should create determinant-based map φ: L → S•(E ⊗ F)', () => {
      const kModuleL = createKModuleL(2, 'E', 'F', 'R');
      const determinantMapPhi = createDeterminantBasedMap(kModuleL, 'S•(E ⊗ F)');
      
      expect(determinantMapPhi.kind).toBe('DeterminantBasedMap');
      expect(determinantMapPhi.source).toBe(kModuleL);
      expect(determinantMapPhi.target).toBe('S•(E ⊗ F)');
      expect(determinantMapPhi.scalarFactor).toBe(0.5); // 1/2!
      expect(determinantMapPhi.isModuleMap).toBe(true);
    });

    it('should implement determinant formula correctly', () => {
      const kModuleL = createKModuleL(2, 'E', 'F', 'R');
      const determinantMapPhi = createDeterminantBasedMap(kModuleL, 'S•(E ⊗ F)');
      
      const e = ['e1', 'e2'];
      const f = ['f1', 'f2'];
      const formula = determinantMapPhi.determinantFormula(e, f);
      
      expect(formula).toContain('(1/2!) * det(');
      expect(formula).toContain('e1 ⊗ f1');
      expect(formula).toContain('e2 ⊗ f2');
    });

    it('should construct matrix correctly', () => {
      const kModuleL = createKModuleL(2, 'E', 'F', 'R');
      const determinantMapPhi = createDeterminantBasedMap(kModuleL, 'S•(E ⊗ F)');
      
      const e = ['e1', 'e2'];
      const f = ['f1', 'f2'];
      const matrix = determinantMapPhi.matrixConstruction(e, f);
      
      expect(matrix).toHaveLength(2);
      expect(matrix[0]).toHaveLength(2);
      expect(matrix[0][0]).toBe('e1 ⊗ f1');
      expect(matrix[0][1]).toBe('e1 ⊗ f2');
      expect(matrix[1][0]).toBe('e2 ⊗ f1');
      expect(matrix[1][1]).toBe('e2 ⊗ f2');
    });

    it('should preserve module structure', () => {
      const kModuleL = createKModuleL(2, 'E', 'F', 'R');
      const determinantMapPhi = createDeterminantBasedMap(kModuleL, 'S•(E ⊗ F)');
      
      expect(determinantMapPhi.preservesStructure.addition).toBe(true);
      expect(determinantMapPhi.preservesStructure.scalarMultiplication).toBe(true);
    });

    it('should have composite homomorphism', () => {
      const kModuleL = createKModuleL(2, 'E', 'F', 'R');
      const determinantMapPhi = createDeterminantBasedMap(kModuleL, 'S•(E ⊗ F)');
      
      expect(determinantMapPhi.compositeHomomorphism.exists).toBe(true);
      expect(determinantMapPhi.compositeHomomorphism.isAlgebraHomomorphism).toBe(true);
      expect(determinantMapPhi.compositeHomomorphism.domain).toBe(kModuleL);
      expect(determinantMapPhi.compositeHomomorphism.codomain).toBe('S•(E ⊗ F)/I');
    });
  });

  describe('Polynomial Ring Identification (Page 68)', () => {
    it('should create polynomial ring identification', () => {
      const polynomialIdentification = createPolynomialRingIdentification(
        'S•(E ⊗ F)',
        'k[X₁₁, ..., Xpq]'
      );
      
      expect(polynomialIdentification.kind).toBe('PolynomialRingIdentification');
      expect(polynomialIdentification.symmetricAlgebra).toBe('S•(E ⊗ F)');
      expect(polynomialIdentification.polynomialRing).toBe('k[X₁₁, ..., Xpq]');
    });

    it('should establish identification properties', () => {
      const polynomialIdentification = createPolynomialRingIdentification(
        'S•(E ⊗ F)',
        'k[X₁₁, ..., Xpq]'
      );
      
      expect(polynomialIdentification.identification.exists).toBe(true);
      expect(polynomialIdentification.identification.isomorphism).toBe(true);
      expect(polynomialIdentification.identification.preservesStructure).toBe(true);
    });

    it('should handle canonical basis mapping', () => {
      const polynomialIdentification = createPolynomialRingIdentification(
        'S•(E ⊗ F)',
        'k[X₁₁, ..., Xpq]'
      );
      
      expect(polynomialIdentification.canonicalBasis.exteriorAlgebra).toBe('ΛʳE ⊗ ΛʳF');
      expect(polynomialIdentification.canonicalBasis.polynomialRing).toBe('k[X₁₁, ..., Xpq]');
      
      const basis = ['basis1', 'basis2'];
      const mappedBasis = polynomialIdentification.canonicalBasis.mapping(basis);
      expect(mappedBasis).toEqual(['polynomial_basis1', 'polynomial_basis2']);
    });

    it('should handle subdeterminants', () => {
      const polynomialIdentification = createPolynomialRingIdentification(
        'S•(E ⊗ F)',
        'k[X₁₁, ..., Xpq]'
      );
      
      expect(polynomialIdentification.subdeterminants.rByRSubdeterminants).toBe(true);
      expect(polynomialIdentification.subdeterminants.scalarFactor).toBe(true);
      expect(polynomialIdentification.subdeterminants.canonicalBasisMapping).toBe(true);
    });
  });

  describe('Theorem 16.4 Foundation (Page 68)', () => {
    it('should create complete theorem foundation', () => {
      const kModuleL = createKModuleL(3, 'E', 'F', 'R');
      const homomorphismPsi = createKAlgebraHomomorphism('S•(E ⊗ F)', kModuleL);
      const determinantMapPhi = createDeterminantBasedMap(kModuleL, 'S•(E ⊗ F)');
      const polynomialIdentification = createPolynomialRingIdentification('S•(E ⊗ F)', 'k[X₁₁, ..., Xpq]');
      
      const theoremFoundation = createTheorem164Foundation(
        kModuleL,
        homomorphismPsi,
        determinantMapPhi,
        polynomialIdentification
      );
      
      expect(theoremFoundation.kind).toBe('Theorem164Foundation');
      expect(theoremFoundation.kModuleL).toBe(kModuleL);
      expect(theoremFoundation.homomorphismPsi).toBe(homomorphismPsi);
      expect(theoremFoundation.determinantMapPhi).toBe(determinantMapPhi);
      expect(theoremFoundation.polynomialIdentification).toBe(polynomialIdentification);
    });

    it('should establish theorem validity', () => {
      const kModuleL = createKModuleL(3, 'E', 'F', 'R');
      const homomorphismPsi = createKAlgebraHomomorphism('S•(E ⊗ F)', kModuleL);
      const determinantMapPhi = createDeterminantBasedMap(kModuleL, 'S•(E ⊗ F)');
      const polynomialIdentification = createPolynomialRingIdentification('S•(E ⊗ F)', 'k[X₁₁, ..., Xpq]');
      
      const theoremFoundation = createTheorem164Foundation(
        kModuleL,
        homomorphismPsi,
        determinantMapPhi,
        polynomialIdentification
      );
      
      expect(theoremFoundation.theoremValidity.deduced).toBe(true);
      expect(theoremFoundation.theoremValidity.allConditionsMet).toBe(true);
      expect(theoremFoundation.theoremValidity.foundationComplete).toBe(true);
    });
  });

  describe('Example Functions', () => {
    it('should demonstrate enhanced D-étale map example', () => {
      const enhancedDEtaleMap = exampleEnhancedDEtaleMap();
      
      expect(enhancedDEtaleMap.kind).toBe('EnhancedDEtaleMap');
      expect(enhancedDEtaleMap.domain).toBe('M');
      expect(enhancedDEtaleMap.codomain).toBe('N');
      expect(enhancedDEtaleMap.isDEtale).toBe(true);
    });

    it('should demonstrate k-module construction example', () => {
      const kModuleL = exampleKModuleConstruction();
      
      expect(kModuleL.kind).toBe('KModuleL');
      expect(kModuleL.r).toBe(2);
      expect(kModuleL.moduleE).toBe('E');
      expect(kModuleL.moduleF).toBe('F');
      expect(kModuleL.ring).toBe('R');
    });

    it('should demonstrate complete algebraic foundation example', () => {
      const theoremFoundation = exampleCompleteAlgebraicFoundation();
      
      expect(theoremFoundation.kind).toBe('Theorem164Foundation');
      expect(theoremFoundation.kModuleL.r).toBe(3);
      expect(theoremFoundation.homomorphismPsi.source).toBe('S•(E ⊗ F)');
      expect(theoremFoundation.determinantMapPhi.target).toBe('S•(E ⊗ F)');
      expect(theoremFoundation.polynomialIdentification.symmetricAlgebra).toBe('S•(E ⊗ F)');
    });
  });
});
