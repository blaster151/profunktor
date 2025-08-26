/**
 * Tests for Khavkine-Schreiber Formal Smooth Sets Implementation
 * Based on pages 6-8 of "Synthetic geometry of differential equations: I. Jets and comonad structure"
 */

import {
  // Core categories
  SmthMfd,
  CartSp, 
  SmoothSet,
  FormalSmoothSet,
  FormalCartSp,
  
  // Infinitesimal structures
  InfThPoints,
  InfThPoint,
  StandardInfinitesimalDisk,
  JetAlgebra,
  NilpotentIdeal,
  
  // Creation functions
  createCartSp,
  createStandardInfinitesimalDisk,
  createJetAlgebra,
  createInfThPoint,
  createFormalSmoothSet,
  createFormalCartSp,
  
  // Validation functions
  validateInfThPoint,
  validateNilpotentIdeal,
  validateStandardInfinitesimalDisk,
  validateJetAlgebra,
  validateFormalSmoothSet,
  validateFormalCartSp
} from '../fp-khavkine-schreiber-formal-smooth-sets';

describe('Khavkine-Schreiber Formal Smooth Sets (Pages 6-8)', () => {
  
  describe('Foundational Categories (Section 2.1)', () => {
    
    it('should create CartSp category with Cartesian spaces', () => {
      const cartSp = createCartSp();
      expect(cartSp.kind).toBe('CartSp');
      expect(cartSp.objects.length).toBeGreaterThan(0);
      
      // Check we have ℝ⁰, ℝ¹, ℝ², etc.
      const dimensions = cartSp.objects.map(obj => obj.dimension);
      expect(dimensions).toContain(0); // ℝ⁰ (point)
      expect(dimensions).toContain(1); // ℝ¹ (line)
      expect(dimensions).toContain(2); // ℝ² (plane)
      expect(dimensions).toContain(3); // ℝ³ (space)
    });
    
    it('should create FormalCartSp with both Cartesian spaces and infinitesimal disks', () => {
      const formalCartSp = createFormalCartSp();
      expect(formalCartSp.kind).toBe('FormalCartSp');
      expect(validateFormalCartSp(formalCartSp)).toBe(true);
      
      // Should contain both types of objects
      const hasCartesian = formalCartSp.objects.some(obj => obj.kind === 'CartesianSpace');
      const hasInfinitesimal = formalCartSp.objects.some(obj => obj.kind === 'StandardInfinitesimalDisk');
      
      expect(hasCartesian).toBe(true);
      expect(hasInfinitesimal).toBe(true);
      expect(formalCartSp.terminalObject).toBeDefined();
    });
    
    it('should create FormalSmoothSet topos', () => {
      const formalSmoothSet = createFormalSmoothSet();
      expect(formalSmoothSet.kind).toBe('FormalSmoothSet');
      expect(validateFormalSmoothSet(formalSmoothSet)).toBe(true);
      expect(formalSmoothSet.baseCategory.kind).toBe('FormalCartSp');
      expect(formalSmoothSet.underlyingTopos).toBeDefined();
    });
  });
  
  describe('Infinitesimally Thickened Points (Definition 2.6)', () => {
    
    it('should create infinitesimally thickened point', () => {
      const point = createInfThPoint(2, 3); // 2-dimensional, nilpotency degree 3
      expect(point.kind).toBe('InfThPoint');
      expect(validateInfThPoint(point)).toBe(true);
      expect(point.dimension).toBe(2);
      expect(point.nilpotentIdeal.nilpotencyDegree).toBe(3);
    });
    
    it('should validate nilpotent ideal structure', () => {
      const point = createInfThPoint(3, 2);
      const ideal = point.nilpotentIdeal;
      
      expect(ideal.kind).toBe('NilpotentIdeal');
      expect(validateNilpotentIdeal(ideal)).toBe(true);
      expect(ideal.nilpotencyDegree).toBe(2);
      expect(ideal.generators.length).toBe(3);
      expect(typeof ideal.multiplication).toBe('function');
    });
    
    it('should represent C^∞(D) := ℝ ⊕ V structure', () => {
      const point = createInfThPoint(1, 2); // One nilpotent generator, degree 2
      
      expect(point.baseField.name).toBe('ℝ');
      expect(point.nilpotentIdeal.generators.length).toBe(1);
      expect(point.algebra.base).toBe(point.baseField);
      expect(point.algebra.ideal).toBe(point.nilpotentIdeal);
    });
  });
  
  describe('Standard Infinitesimal Disks (Definition 2.8)', () => {
    
    it('should create standard infinitesimal n-disk D^n(k)', () => {
      const disk = createStandardInfinitesimalDisk(2, 3); // D²(3)
      expect(disk.kind).toBe('StandardInfinitesimalDisk');
      expect(validateStandardInfinitesimalDisk(disk)).toBe(true);
      expect(disk.dimension).toBe(2);
      expect(disk.order).toBe(3);
      expect(disk.coordinates).toEqual(['x1', 'x2']);
    });
    
    it('should create jet algebra C^∞(ℝⁿ)/(x¹,...,xⁿ)^(k+1)', () => {
      const algebra = createJetAlgebra(3, 2); // 3 variables, order 2
      expect(algebra.kind).toBe('JetAlgebra');
      expect(validateJetAlgebra(algebra)).toBe(true);
      expect(algebra.baseAlgebra).toBe('C^∞(ℝ^3)');
      expect(algebra.ideal).toBe('(x1,x2,x3)^3');
      expect(algebra.maximalOrder).toBe(2);
      expect(algebra.standardCoordinates).toEqual(['x1', 'x2', 'x3']);
    });
    
    it('should enforce nilpotency relation (x¹,...,xⁿ)^(k+1) = 0', () => {
      const disk = createStandardInfinitesimalDisk(2, 2); // D²(2)
      expect(disk.nilpotencyRelation).toBe('(x1,x2)^3 = 0');
      
      const disk3 = createStandardInfinitesimalDisk(3, 1); // D³(1)  
      expect(disk3.nilpotencyRelation).toBe('(x1,x2,x3)^2 = 0');
    });
    
    it('should create infinitesimal disks of various dimensions and orders', () => {
      // D¹(1) - first-order infinitesimal line
      const disk1 = createStandardInfinitesimalDisk(1, 1);
      expect(disk1.dimension).toBe(1);
      expect(disk1.order).toBe(1);
      expect(disk1.coordinates).toEqual(['x1']);
      
      // D³(2) - second-order infinitesimal 3-space
      const disk3 = createStandardInfinitesimalDisk(3, 2);
      expect(disk3.dimension).toBe(3);
      expect(disk3.order).toBe(2);
      expect(disk3.coordinates).toEqual(['x1', 'x2', 'x3']);
    });
  });
  
  describe('Jet Algebra Structure', () => {
    
    it('should create multiplication table for jet algebra', () => {
      const algebra = createJetAlgebra(2, 2);
      expect(algebra.multiplicationTable.kind).toBe('MultiplicationTable');
      expect(algebra.multiplicationTable.monomials).toBeDefined();
      expect(algebra.multiplicationTable.products).toBeDefined();
      expect(algebra.multiplicationTable.nilpotencyRules).toBeDefined();
    });
    
    it('should handle quotient algebra structure correctly', () => {
      const algebra = createJetAlgebra(2, 1); // C^∞(ℝ²)/(x,y)²
      
      expect(algebra.baseAlgebra).toBe('C^∞(ℝ^2)');
      expect(algebra.ideal).toBe('(x1,x2)^2');
      expect(algebra.quotient).toBe('C^∞(ℝ^2)/(x1,x2)^2');
      
      // This means x², y², xy all vanish in the quotient
      expect(algebra.maximalOrder).toBe(1);
    });
    
    it('should create different jet algebras for different orders', () => {
      const firstOrder = createJetAlgebra(1, 1);   // C^∞(ℝ)/(x²)
      const secondOrder = createJetAlgebra(1, 2);  // C^∞(ℝ)/(x³)
      const thirdOrder = createJetAlgebra(1, 3);   // C^∞(ℝ)/(x⁴)
      
      expect(firstOrder.ideal).toBe('(x1)^2');
      expect(secondOrder.ideal).toBe('(x1)^3');
      expect(thirdOrder.ideal).toBe('(x1)^4');
      
      expect(firstOrder.maximalOrder).toBe(1);
      expect(secondOrder.maximalOrder).toBe(2);
      expect(thirdOrder.maximalOrder).toBe(3);
    });
  });
  
  describe('Categorical Structure Validation', () => {
    
    it('should validate infinitesimally thickened point structure', () => {
      const validPoint = createInfThPoint(2, 3);
      expect(validateInfThPoint(validPoint)).toBe(true);
      
      // Test invalid cases
      const invalidPoint1 = { ...validPoint, dimension: -1 };
      expect(validateInfThPoint(invalidPoint1 as InfThPoint)).toBe(false);
      
      const invalidPoint2 = { ...validPoint, kind: 'WrongKind' as any };
      expect(validateInfThPoint(invalidPoint2 as InfThPoint)).toBe(false);
    });
    
    it('should validate standard infinitesimal disk structure', () => {
      const validDisk = createStandardInfinitesimalDisk(2, 2);
      expect(validateStandardInfinitesimalDisk(validDisk)).toBe(true);
      
      // Test invalid cases
      const invalidDisk1 = { ...validDisk, dimension: 0 };
      expect(validateStandardInfinitesimalDisk(invalidDisk1 as StandardInfinitesimalDisk)).toBe(false);
      
      const invalidDisk2 = { ...validDisk, order: 0 };
      expect(validateStandardInfinitesimalDisk(invalidDisk2 as StandardInfinitesimalDisk)).toBe(false);
    });
    
    it('should validate formal smooth set topos structure', () => {
      const validTopos = createFormalSmoothSet();
      expect(validateFormalSmoothSet(validTopos)).toBe(true);
      
      const invalidTopos = { ...validTopos, kind: 'WrongKind' as any };
      expect(validateFormalSmoothSet(invalidTopos as FormalSmoothSet)).toBe(false);
    });
  });
  
  describe('Mathematical Properties', () => {
    
    it('should demonstrate inclusion chain SmthMfd ↪ DiffSp ↪ SmoothSet ↪ FormalSmoothSet', () => {
      const formalSmoothSet = createFormalSmoothSet();
      
      // The topos should contain all these subcategories via embeddings
      expect(formalSmoothSet.kind).toBe('FormalSmoothSet');
      expect(formalSmoothSet.baseCategory.kind).toBe('FormalCartSp');
      
      // FormalCartSp contains both ordinary Cartesian spaces and infinitesimal disks
      const baseCategory = formalSmoothSet.baseCategory;
      const hasOrdinarySpaces = baseCategory.objects.some(obj => obj.kind === 'CartesianSpace');
      const hasInfinitesimalSpaces = baseCategory.objects.some(obj => obj.kind === 'StandardInfinitesimalDisk');
      
      expect(hasOrdinarySpaces).toBe(true);
      expect(hasInfinitesimalSpaces).toBe(true);
    });
    
    it('should demonstrate Hadamard lemma structure', () => {
      // While we don't implement the full analysis, we can verify the structure exists
      const disk = createStandardInfinitesimalDisk(1, 2);
      
      // The jet algebra should encode Taylor expansion capability
      expect(disk.algebra.baseAlgebra).toContain('C^∞');
      expect(disk.algebra.maximalOrder).toBe(2);
      
      // This means we can represent f(x) = f(0) + f'(0)x + ½f''(0)x² + x³·h(x)
      // where x³ = 0 in the quotient algebra
    });
    
    it('should support the synthetic differential geometry paradigm', () => {
      // The key insight: infinitesimal objects allow synthetic reasoning
      const point = createInfThPoint(1, 2); // Single nilpotent generator ε with ε² = 0
      const disk = createStandardInfinitesimalDisk(1, 1); // D¹(1) ≅ Spec(ℝ[ε]/(ε²))
      
      expect(point.nilpotentIdeal.nilpotencyDegree).toBe(2);
      expect(disk.order).toBe(1);
      
      // Both represent "infinitesimal neighborhoods" synthetically
      expect(validateInfThPoint(point)).toBe(true);
      expect(validateStandardInfinitesimalDisk(disk)).toBe(true);
    });
  });
  
  describe('Integration with Existing Framework', () => {
    
    it('should connect with our synthetic differential geometry', () => {
      const disk = createStandardInfinitesimalDisk(2, 1);
      
      // This should integrate with our existing InfinitesimalObject from SDG
      expect(disk.kind).toBe('StandardInfinitesimalDisk');
      expect(disk.dimension).toBe(2);
      expect(disk.nilpotencyRelation).toContain('= 0');
    });
    
    it('should prepare foundation for jet comonad (coming in next sections)', () => {
      const formalSmoothSet = createFormalSmoothSet();
      
      // This topos will be the context where jet bundles live as comonads
      expect(formalSmoothSet.underlyingTopos).toBeDefined();
      expect(formalSmoothSet.baseCategory.objects.length).toBeGreaterThan(0);
      
      // The infinitesimal disks will be crucial for jet bundle construction
      const hasInfinitesimalDisks = formalSmoothSet.baseCategory.objects
        .some(obj => obj.kind === 'StandardInfinitesimalDisk');
      expect(hasInfinitesimalDisks).toBe(true);
    });
  });
});
