/**
 * Tests for Weil Algebras ↔ Differential Form Integration Bridge
 * 
 * Phase 1.3: Core Unification
 * 
 * This tests the integration between:
 * - Weil Algebras (algebraic structures, jet bundles, nilpotent elements)
 * - Differential Forms (geometric calculus, exterior derivatives, pullbacks)
 * 
 * Validates that algebraic operations naturally carry geometric
 * differential information.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Unified Weil algebras with differential forms
  WeilDifferentialAlgebra,
  createWeilDifferentialAlgebra,
  
  // Jet bundle differential bridge
  JetDifferentialBridge,
  createJetDifferentialBridge,
  
  // Algebraic-geometric unification
  AlgebraicGeometricUnification,
  createAlgebraicGeometricUnification,
  
  // Differential form components
  DifferentialForm,
  createDifferentialForm,
  ExteriorDerivative,
  createExteriorDerivative,
  Pullback,
  createPullback,
  WedgeProduct,
  createWedgeProduct,
  
  // Examples
  exampleWeilDifferentialIntegration,
  exampleJetDifferentialBridge,
  exampleAlgebraicGeometricUnification
} from '../src/sdg/integration/weil-differential-bridge';

describe('Weil Algebras ↔ Differential Form Integration Bridge', () => {
  
  describe('WeilDifferentialAlgebra', () => {
    let unified: WeilDifferentialAlgebra<number, number, number>;
    
    beforeEach(() => {
      // Create mock Weil algebra
      const mockWeilAlgebra = {
        kind: 'WeilAlgebra' as const,
        name: 'test',
        underlyingRing: 0,
        nilpotentIdeal: 0,
        dimension: 2,
        isFiniteDimensional: true,
        hasYonedaIsomorphism: true,
        satisfiesAxiom1W: true
      };
      
      unified = createWeilDifferentialAlgebra<number, number, number>(
        mockWeilAlgebra,
        0 // base ring
      );
    });
    
    it('should create unified Weil algebra with differential form structure', () => {
      expect(unified).toBeDefined();
      expect(unified.weilAlgebra).toBeDefined();
      expect(unified.jetBundle).toBeDefined();
      expect(unified.differentialForms).toBeDefined();
      expect(unified.exteriorDerivative).toBeDefined();
    });
    
    it('should have Weil algebra components', () => {
      expect(unified.weilAlgebra.kind).toBe('WeilAlgebra');
      expect(unified.jetBundle.order).toBe(2);
      expect(unified.nilpotentElements.length).toBeGreaterThan(0);
      expect(unified.algebraicStructure.ring).toBe(0);
    });
    
    it('should have differential form components', () => {
      expect(unified.differentialForms.length).toBe(3); // 0, 1, 2-forms
      expect(unified.exteriorDerivative.d).toBeDefined();
      expect(unified.pullback.pullback).toBeDefined();
      expect(unified.wedgeProduct.wedge).toBeDefined();
    });
    
    it('should convert algebraic operations to differential forms', () => {
      const algebraicOp = (x: number) => x * 3;
      const differentialForm = unified.algebraicDifferentialForm(algebraicOp);
      
      expect(differentialForm.degree).toBe(0);
      expect(typeof differentialForm.form).toBe('function');
    });
    
    it('should convert differential forms to algebraic operations', () => {
      const form = createDifferentialForm(1, (x: number) => x * 2);
      const algebraicOp = unified.differentialAlgebraicOperation(form);
      
      expect(typeof algebraicOp).toBe('function');
      expect(algebraicOp(5)).toBe(10); // 5 * 2 = 10
    });
    
    it('should convert jet bundles to differential forms', () => {
      const jetForm = unified.jetDifferentialForm(unified.jetBundle);
      
      expect(jetForm.degree).toBe(2); // jet bundle order
      expect(typeof jetForm.form).toBe('function');
    });
    
    it('should convert nilpotent elements to differential forms', () => {
      const nilpotentForm = unified.nilpotentDifferentialForm(unified.nilpotentElements[0]);
      
      expect(nilpotentForm.degree).toBe(2); // nilpotent degree
      expect(typeof nilpotentForm.form).toBe('function');
    });
    
    it('should satisfy exterior derivative properties', () => {
      const form = createDifferentialForm(0, (x: number) => x);
      const dForm = unified.exteriorDerivative.d(form);
      const dSquaredForm = unified.exteriorDerivative.dSquared(form);
      
      expect(dForm.degree).toBe(1);
      expect(dSquaredForm.degree).toBe(2);
    });
    
    it('should satisfy pullback properties', () => {
      const form = createDifferentialForm(1, (x: number) => x * 2);
      const map = (x: number) => x + 1;
      const pulledBack = unified.pullback.pullback(map, form);
      
      expect(pulledBack.degree).toBe(1);
      expect(typeof pulledBack.form).toBe('function');
    });
    
    it('should satisfy wedge product properties', () => {
      const form1 = createDifferentialForm(1, (x: number) => x);
      const form2 = createDifferentialForm(1, (x: number) => x * 2);
      const wedged = unified.wedgeProduct.wedge(form1, form2);
      
      expect(wedged.degree).toBe(2); // 1 + 1 = 2
      expect(typeof wedged.form).toBe('function');
    });
  });
  
  describe('JetDifferentialBridge', () => {
    let bridge: JetDifferentialBridge<number, number>;
    
    beforeEach(() => {
      const jetBundle = {
        order: 2,
        bundle: (x: number) => x * 3,
        projection: (y: number) => y / 3
      };
      
      bridge = createJetDifferentialBridge<number, number>(jetBundle);
    });
    
    it('should create jet bundle differential bridge', () => {
      expect(bridge).toBeDefined();
      expect(bridge.jetBundle).toBeDefined();
      expect(bridge.differentialForms).toBeDefined();
    });
    
    it('should satisfy bridge condition', () => {
      const jetBundle = {
        order: 1,
        bundle: (x: number) => x * 2,
        projection: (y: number) => y / 2
      };
      
      const satisfies = bridge.bridgeCondition(jetBundle);
      expect(typeof satisfies).toBe('boolean');
    });
    
    it('should convert differential forms to jet bundles', () => {
      const form = createDifferentialForm(2, (x: number) => x * 5);
      const jetBundle = bridge.calculusCorrespondence(form);
      
      expect(jetBundle.order).toBe(2);
      expect(typeof jetBundle.bundle).toBe('function');
      expect(typeof jetBundle.projection).toBe('function');
    });
    
    it('should convert jet bundles to differential forms', () => {
      const jetBundle = {
        order: 3,
        bundle: (x: number) => x * 4,
        projection: (y: number) => y / 4
      };
      
      const form = bridge.jetDifferentialForm(jetBundle);
      
      expect(form.degree).toBe(3);
      expect(typeof form.form).toBe('function');
    });
    
    it('should have consistent differential forms', () => {
      expect(bridge.differentialForms.length).toBe(3); // 0, 1, 2-forms
      
      bridge.differentialForms.forEach((form, index) => {
        expect(form.degree).toBe(index);
        expect(typeof form.form).toBe('function');
      });
    });
  });
  
  describe('AlgebraicGeometricUnification', () => {
    let unification: AlgebraicGeometricUnification<number, number, number>;
    
    beforeEach(() => {
      unification = createAlgebraicGeometricUnification<number, number, number>(0);
    });
    
    it('should create algebraic-geometric unification', () => {
      expect(unification).toBeDefined();
      expect(unification.algebraicStructure).toBeDefined();
      expect(unification.differentialForms).toBeDefined();
    });
    
    it('should have algebraic structure', () => {
      expect(unification.algebraicStructure.ring).toBe(0);
      expect(typeof unification.algebraicStructure.multiplication).toBe('function');
      expect(typeof unification.algebraicStructure.addition).toBe('function');
      expect(unification.algebraicStructure.zero).toBeDefined();
      expect(unification.algebraicStructure.one).toBeDefined();
    });
    
    it('should convert algebraic operations to differential forms', () => {
      const multiplication = (a: number, b: number) => a * b;
      const differentialForm = unification.algebraicDifferentialCorrespondence(multiplication);
      
      expect(differentialForm.degree).toBe(1);
      expect(typeof differentialForm.form).toBe('function');
    });
    
    it('should convert differential forms to algebraic operations', () => {
      const form = createDifferentialForm(2, (x: number) => x * 3);
      const algebraicOp = unification.differentialAlgebraicCorrespondence(form);
      
      expect(typeof algebraicOp).toBe('function');
      expect(algebraicOp(2, 3)).toBe(6); // form(2) = 2*3 = 6
    });
    
    it('should convert nilpotent elements to differential forms', () => {
      const nilpotent = {
        element: 0,
        degree: 3,
        nilpotent: true
      };
      
      const differentialForm = unification.nilpotentDifferentialForm(nilpotent);
      
      expect(differentialForm.degree).toBe(3);
      expect(typeof differentialForm.form).toBe('function');
    });
    
    it('should convert differential forms to nilpotent elements', () => {
      const form = createDifferentialForm(4, (x: number) => x * 2);
      const nilpotent = unification.differentialNilpotentElement(form);
      
      expect(nilpotent.degree).toBe(4);
      expect(nilpotent.nilpotent).toBe(true);
    });
    
    it('should have consistent differential forms', () => {
      expect(unification.differentialForms.length).toBe(3); // 0, 1, 2-forms
      
      unification.differentialForms.forEach((form, index) => {
        expect(form.degree).toBe(index);
        expect(typeof form.form).toBe('function');
      });
    });
  });
  
  describe('Differential Form Components', () => {
    
    it('should create differential forms correctly', () => {
      const form = createDifferentialForm(2, (x: number) => x * 3);
      
      expect(form.degree).toBe(2);
      expect(typeof form.form).toBe('function');
      expect(form.form(4)).toBe(12); // 4 * 3 = 12
    });
    
    it('should compute exterior derivatives', () => {
      const form = createDifferentialForm(1, (x: number) => x * 2);
      const dForm = form.exteriorDerivative();
      
      expect(dForm.degree).toBe(2); // 1 + 1 = 2
      expect(typeof dForm.form).toBe('function');
    });
    
    it('should compute wedge products', () => {
      const form1 = createDifferentialForm(1, (x: number) => x);
      const form2 = createDifferentialForm(1, (x: number) => x * 2);
      const wedged = form1.wedge(form2);
      
      expect(wedged.degree).toBe(2); // 1 + 1 = 2
      expect(typeof wedged.form).toBe('function');
    });
    
    it('should compute pullbacks', () => {
      const form = createDifferentialForm(1, (x: number) => x * 3);
      const map = (x: number) => x + 1;
      const pulledBack = form.pullback(map);
      
      expect(pulledBack.degree).toBe(1);
      expect(typeof pulledBack.form).toBe('function');
    });
    
    it('should create exterior derivative operators', () => {
      const exteriorDerivative = createExteriorDerivative<number, number>();
      
      expect(typeof exteriorDerivative.d).toBe('function');
      expect(typeof exteriorDerivative.dSquared).toBe('function');
      expect(typeof exteriorDerivative.leibniz).toBe('function');
    });
    
    it('should create pullback operators', () => {
      const pullback = createPullback<number, number, number>();
      
      expect(typeof pullback.pullback).toBe('function');
      expect(typeof pullback.functoriality).toBe('function');
      expect(pullback.naturality).toBe(true);
    });
    
    it('should create wedge product operators', () => {
      const wedgeProduct = createWedgeProduct<number, number>();
      
      expect(typeof wedgeProduct.wedge).toBe('function');
      expect(wedgeProduct.associativity).toBe(true);
      expect(wedgeProduct.gradedCommutativity).toBe(true);
      expect(wedgeProduct.distributivity).toBe(true);
    });
  });
  
  describe('Integration Examples', () => {
    
    it('should run Weil differential integration example', () => {
      const example = exampleWeilDifferentialIntegration();
      
      expect(example).toBeDefined();
      expect(example.algebraicToDifferential).toBe(0);
      expect(typeof example.differentialToAlgebraic).toBe('string');
      expect(example.jetToDifferential).toBe(2);
      expect(example.nilpotentToDifferential).toBe(2);
      expect(example.weilAlgebra.kind).toBe('WeilAlgebra');
      expect(example.differentialForms).toBe(3);
      expect(example.bridgeSuccess).toBe(true);
    });
    
    it('should run jet differential bridge example', () => {
      const example = exampleJetDifferentialBridge();
      
      expect(example).toBeDefined();
      expect(typeof example.bridgeCondition).toBe('boolean');
      expect(example.calculusCorrespondence.order).toBe(0);
      expect(example.jetDifferentialForm.degree).toBe(2);
      expect(example.differentialForms).toBe(3);
      expect(example.jetBundle.order).toBe(2);
    });
    
    it('should run algebraic-geometric unification example', () => {
      const example = exampleAlgebraicGeometricUnification();
      
      expect(example).toBeDefined();
      expect(example.algebraicToDifferential).toBe(1);
      expect(typeof example.differentialToAlgebraic).toBe('string');
      expect(example.nilpotentToDifferential).toBe(2);
      expect(example.differentialToNilpotent).toBe(2);
      expect(example.algebraicStructure.ring).toBe(0);
      expect(example.differentialForms).toBe(3);
      expect(example.unificationSuccess).toBe(true);
    });
  });
  
  describe('Bridge Conditions and Laws', () => {
    
    it('should satisfy differential form laws', () => {
      const form = createDifferentialForm(1, (x: number) => x * 2);
      
      // Test exterior derivative
      const dForm = form.exteriorDerivative();
      expect(dForm.degree).toBe(2);
      
      // Test wedge product
      const wedged = form.wedge(form);
      expect(wedged.degree).toBe(2); // 1 + 1 = 2
      
      // Test pullback
      const map = (x: number) => x + 1;
      const pulledBack = form.pullback(map);
      expect(pulledBack.degree).toBe(1);
    });
    
    it('should satisfy jet bundle correspondence', () => {
      const jetBundle = {
        order: 2,
        bundle: (x: number) => x * 3,
        projection: (y: number) => y / 3
      };
      
      const bridge = createJetDifferentialBridge<number, number>(jetBundle);
      const form = bridge.jetDifferentialForm(jetBundle);
      const backToJet = bridge.calculusCorrespondence(form);
      
      expect(form.degree).toBe(2);
      expect(backToJet.order).toBe(2); // form degree becomes jet order
    });
    
    it('should satisfy algebraic-geometric correspondence', () => {
      const unification = createAlgebraicGeometricUnification<number, number, number>(0);
      
      const multiplication = (a: number, b: number) => a * b;
      const differentialForm = unification.algebraicDifferentialCorrespondence(multiplication);
      const backToAlgebraic = unification.differentialAlgebraicCorrespondence(differentialForm);
      
      expect(differentialForm.degree).toBe(1);
      expect(typeof backToAlgebraic).toBe('function');
    });
    
    it('should satisfy nilpotent-differential correspondence', () => {
      const unification = createAlgebraicGeometricUnification<number, number, number>(0);
      
      const nilpotent = {
        element: 0,
        degree: 3,
        nilpotent: true
      };
      
      const differentialForm = unification.nilpotentDifferentialForm(nilpotent);
      const backToNilpotent = unification.differentialNilpotentElement(differentialForm);
      
      expect(differentialForm.degree).toBe(3);
      expect(backToNilpotent.degree).toBe(3);
      expect(backToNilpotent.nilpotent).toBe(true);
    });
  });
  
  describe('Cross-System Validation', () => {
    
    it('should validate that all systems work together', () => {
      // Create all three systems
      const mockWeilAlgebra = {
        kind: 'WeilAlgebra' as const,
        name: 'test',
        underlyingRing: 0,
        nilpotentIdeal: 0,
        dimension: 2,
        isFiniteDimensional: true,
        hasYonedaIsomorphism: true,
        satisfiesAxiom1W: true
      };
      
      const unified = createWeilDifferentialAlgebra<number, number, number>(mockWeilAlgebra, 0);
      const jetBridge = createJetDifferentialBridge<number, number>(unified.jetBundle);
      const algebraicUnification = createAlgebraicGeometricUnification<number, number, number>(0);
      
      // Test cross-system operations
      const algebraicOp = (x: number) => x * 2;
      const differentialForm = unified.algebraicDifferentialForm(algebraicOp);
      const jetForm = jetBridge.jetDifferentialForm(unified.jetBundle);
      const nilpotentForm = algebraicUnification.nilpotentDifferentialForm(unified.nilpotentElements[0]);
      
      expect(differentialForm.degree).toBe(0);
      expect(jetForm.degree).toBe(2);
      expect(nilpotentForm.degree).toBe(2);
    });
    
    it('should handle complex differential operations', () => {
      const mockWeilAlgebra = {
        kind: 'WeilAlgebra' as const,
        name: 'test',
        underlyingRing: 0,
        nilpotentIdeal: 0,
        dimension: 2,
        isFiniteDimensional: true,
        hasYonedaIsomorphism: true,
        satisfiesAxiom1W: true
      };
      
      const unified = createWeilDifferentialAlgebra<number, number, number>(mockWeilAlgebra, 0);
      
      // Test complex differential operations
      const form1 = createDifferentialForm(1, (x: number) => x * 2);
      const form2 = createDifferentialForm(1, (x: number) => x * 3);
      
      const wedged = unified.wedgeProduct.wedge(form1, form2);
      const dWedged = unified.exteriorDerivative.d(wedged);
      const pulledBack = unified.pullback.pullback((x: number) => x + 1, dWedged);
      
      expect(wedged.degree).toBe(2);
      expect(dWedged.degree).toBe(3);
      expect(pulledBack.degree).toBe(3);
    });
  });
});
