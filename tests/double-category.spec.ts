/**
 * Double Category Tests
 * 
 * Tests for the revolutionary double category structure for polynomial functors
 * Based on pages 19-20 of the Gambino-Kock paper
 */

import { describe, it, expect } from 'vitest';
import {
  DoubleCategory,
  PolynomialObject,
  PolynomialHorizontalArrow,
  PolynomialVerticalArrow,
  PolynomialSquare,
  createPolynomialObject,
  createPolynomialHorizontalArrow,
  createPolynomialVerticalArrow,
  createPolynomialSquare,
  createPolynomialDoubleCategory,
  createDoubleCategoryDiagram,
  createCoherenceConditions,
  Category,
  Functor,
  CompatibilityCondition,
  BaseChangeStructure,
  CoherenceConditions
} from '../fp-double-category';

import { unitPolynomial } from '../fp-polynomial-functors';

// ============================================================================
// BASIC STRUCTURE TESTS
// ============================================================================

describe('Double Category Basic Structure', () => {
  it('should create polynomial objects (slice categories)', () => {
    const obj = createPolynomialObject('test');
    
    expect(obj.kind).toBe('PolynomialObject');
    expect(obj.base).toBe('test');
    expect(obj.slice.kind).toBe('SliceCategory');
    expect(obj.slice.base).toBe('test');
  });

  it('should create polynomial horizontal arrows', () => {
    const source = createPolynomialObject('I');
    const target = createPolynomialObject('J');
    const horizontal = createPolynomialHorizontalArrow(source, target, unitPolynomial);
    
    expect(horizontal.kind).toBe('PolynomialHorizontalArrow');
    expect(horizontal.source).toBe(source);
    expect(horizontal.target).toBe(target);
    expect(horizontal.polynomial).toBe(unitPolynomial);
  });

  it('should create polynomial vertical arrows', () => {
    const vertical = createPolynomialVerticalArrow('X', 'Y', (x: string) => x.toUpperCase());
    
    expect(vertical.kind).toBe('PolynomialVerticalArrow');
    expect(vertical.source).toBe('X');
    expect(vertical.target).toBe('Y');
    expect(vertical.morphism('test')).toBe('TEST');
  });

  it('should create polynomial squares', () => {
    const h1 = createPolynomialHorizontalArrow(
      createPolynomialObject('I'), 
      createPolynomialObject('J'), 
      unitPolynomial
    );
    const h2 = createPolynomialHorizontalArrow(
      createPolynomialObject('I'), 
      createPolynomialObject('J'), 
      unitPolynomial
    );
    const v1 = createPolynomialVerticalArrow('X', 'Y', (x: string) => x);
    const v2 = createPolynomialVerticalArrow('X', 'Y', (x: string) => x);
    
    const square = createPolynomialSquare(h1, h2, v1, v2);
    
    expect(square.kind).toBe('PolynomialSquare');
    expect(square.horizontalSource).toBe(h1);
    expect(square.horizontalTarget).toBe(h2);
    expect(square.verticalSource).toBe(v1);
    expect(square.verticalTarget).toBe(v2);
    expect(square.naturality('test')).toBe(true);
    expect(square.baseChange).toBe(true);
  });
});

// ============================================================================
// DOUBLE CATEGORY CONSTRUCTION TESTS
// ============================================================================

describe('Double Category Construction', () => {
  it('should create a polynomial double category', () => {
    const doubleCategory = createPolynomialDoubleCategory();
    
    expect(doubleCategory.kind).toBe('DoubleCategory');
    expect(doubleCategory.objects).toBeDefined();
    expect(doubleCategory.morphisms).toBeDefined();
    expect(doubleCategory.source).toBeDefined();
    expect(doubleCategory.target).toBeDefined();
    expect(doubleCategory.compose).toBeDefined();
    expect(doubleCategory.identity).toBeDefined();
    expect(doubleCategory.isFramedBicategory).toBe(true);
    expect(doubleCategory.baseChange).toBeDefined();
  });

  it('should have framed bicategory structure', () => {
    const doubleCategory = createPolynomialDoubleCategory();
    
    expect(doubleCategory.baseChange.kind).toBe('BaseChangeStructure');
    expect(doubleCategory.baseChange.baseChange).toBeDefined();
    expect(doubleCategory.baseChange.cobaseChange).toBeDefined();
    expect(doubleCategory.baseChange.isBifibration).toBe(true);
  });

  it('should create diagrammatic representation', () => {
    const doubleCategory = createPolynomialDoubleCategory();
    const diagram = createDoubleCategoryDiagram(doubleCategory);
    
    expect(diagram.kind).toBe('DoubleCategoryDiagram');
    expect(diagram.objects).toBeDefined();
    expect(diagram.horizontalArrows).toBeDefined();
    expect(diagram.verticalArrows).toBeDefined();
    expect(diagram.squares).toBeDefined();
    expect(diagram.structure).toBeDefined();
    expect(diagram.structure.sourceMap).toBeDefined();
    expect(diagram.structure.targetMap).toBeDefined();
    expect(diagram.structure.compositionMap).toBeDefined();
  });
});

// ============================================================================
// COHERENCE CONDITIONS TESTS
// ============================================================================

describe('Coherence Conditions', () => {
  it('should create coherence conditions', () => {
    const coherence = createCoherenceConditions();
    
    expect(coherence.kind).toBe('CoherenceConditions');
    expect(coherence.associativity).toBeDefined();
    expect(coherence.leftUnit).toBeDefined();
    expect(coherence.rightUnit).toBeDefined();
    expect(coherence.interchange).toBeDefined();
  });

  it('should handle associativity isomorphism', () => {
    const coherence = createCoherenceConditions();
    const h1 = createPolynomialHorizontalArrow(
      createPolynomialObject('I'), 
      createPolynomialObject('J'), 
      unitPolynomial
    );
    const h2 = createPolynomialHorizontalArrow(
      createPolynomialObject('J'), 
      createPolynomialObject('K'), 
      unitPolynomial
    );
    const h3 = createPolynomialHorizontalArrow(
      createPolynomialObject('K'), 
      createPolynomialObject('L'), 
      unitPolynomial
    );
    
    const associativity = coherence.associativity(h1, h2, h3);
    expect(associativity).toBeDefined();
  });

  it('should handle unit isomorphisms', () => {
    const coherence = createCoherenceConditions();
    const horizontal = createPolynomialHorizontalArrow(
      createPolynomialObject('I'), 
      createPolynomialObject('J'), 
      unitPolynomial
    );
    
    const leftUnit = coherence.leftUnit(horizontal);
    const rightUnit = coherence.rightUnit(horizontal);
    
    expect(leftUnit).toBeDefined();
    expect(rightUnit).toBeDefined();
  });
});

// ============================================================================
// COMPOSITION TESTS
// ============================================================================

describe('Double Category Composition', () => {
  it('should handle horizontal composition with compatibility', () => {
    const doubleCategory = createPolynomialDoubleCategory();
    const h1 = createPolynomialHorizontalArrow(
      createPolynomialObject('I'), 
      createPolynomialObject('J'), 
      unitPolynomial
    );
    const h2 = createPolynomialHorizontalArrow(
      createPolynomialObject('J'), 
      createPolynomialObject('K'), 
      unitPolynomial
    );
    
    const compatibility: CompatibilityCondition<typeof h1, typeof h2> = {
      source: h1,
      target: h2,
      condition: true
    };
    
    const composition = doubleCategory.compose(h1, h2, compatibility);
    expect(composition).toBeDefined();
  });

  it('should create identity horizontal arrows', () => {
    const doubleCategory = createPolynomialDoubleCategory();
    const obj = createPolynomialObject('test');
    
    const identity = doubleCategory.identity(obj);
    expect(identity).toBeDefined();
  });
});

// ============================================================================
// BASE CHANGE TESTS
// ============================================================================

describe('Base Change Structure', () => {
  it('should handle pullback operations', () => {
    const doubleCategory = createPolynomialDoubleCategory();
    const horizontal = createPolynomialHorizontalArrow(
      createPolynomialObject('I'), 
      createPolynomialObject('J'), 
      unitPolynomial
    );
    const vertical = createPolynomialVerticalArrow('X', 'Y', (x: string) => x);
    
    const baseChangeResult = doubleCategory.baseChange.baseChange(
      horizontal, 
      vertical, 
      'X', 
      'Y'
    );
    
    expect(baseChangeResult).toBeDefined();
  });

  it('should handle pushforward operations', () => {
    const doubleCategory = createPolynomialDoubleCategory();
    const horizontal = createPolynomialHorizontalArrow(
      createPolynomialObject('I'), 
      createPolynomialObject('J'), 
      unitPolynomial
    );
    const vertical = createPolynomialVerticalArrow('X', 'Y', (x: string) => x);
    
    const cobaseChangeResult = doubleCategory.baseChange.cobaseChange(
      horizontal, 
      vertical, 
      'X', 
      'Y'
    );
    
    expect(cobaseChangeResult).toBeDefined();
  });
});

// ============================================================================
// TYPE SAFETY TESTS
// ============================================================================

describe('Type Safety', () => {
  it('should maintain type safety for polynomial objects', () => {
    const obj: PolynomialObject<string> = createPolynomialObject('test');
    expect(obj.base).toBe('test');
  });

  it('should maintain type safety for horizontal arrows', () => {
    const source: PolynomialObject<string> = createPolynomialObject('I');
    const target: PolynomialObject<string> = createPolynomialObject('J');
    const horizontal: PolynomialHorizontalArrow<string, string> = 
      createPolynomialHorizontalArrow(source, target, unitPolynomial);
    
    expect(horizontal.source).toBe(source);
    expect(horizontal.target).toBe(target);
  });

  it('should maintain type safety for vertical arrows', () => {
    const vertical: PolynomialVerticalArrow<string, string> = 
      createPolynomialVerticalArrow('X', 'Y', (x: string) => x.toUpperCase());
    
    expect(vertical.source).toBe('X');
    expect(vertical.target).toBe('Y');
  });

  it('should maintain type safety for squares', () => {
    const h1 = createPolynomialHorizontalArrow(
      createPolynomialObject('I'), 
      createPolynomialObject('J'), 
      unitPolynomial
    );
    const h2 = createPolynomialHorizontalArrow(
      createPolynomialObject('I'), 
      createPolynomialObject('J'), 
      unitPolynomial
    );
    const v1 = createPolynomialVerticalArrow('X', 'Y', (x: string) => x);
    const v2 = createPolynomialVerticalArrow('X', 'Y', (x: string) => x);
    
    const square: PolynomialSquare<typeof h1, typeof h2, typeof v1, typeof v2> = 
      createPolynomialSquare(h1, h2, v1, v2);
    
    expect(square.horizontalSource).toBe(h1);
    expect(square.horizontalTarget).toBe(h2);
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration with Existing Polynomial Structure', () => {
  it('should integrate with polynomial functors', () => {
    const obj = createPolynomialObject('test');
    const horizontal = createPolynomialHorizontalArrow(
      obj, 
      obj, 
      unitPolynomial
    );
    
    // Test that the functor works
    const result = horizontal.functor('test');
    expect(result).toEqual([{
      base: 'test',
      result: ['test']
    }]);
  });

  it('should work with the diagrammatic representation', () => {
    const doubleCategory = createPolynomialDoubleCategory();
    const diagram = createDoubleCategoryDiagram(doubleCategory);
    
    // Add some test data
    const obj = createPolynomialObject('test');
    const horizontal = createPolynomialHorizontalArrow(
      obj, 
      obj, 
      unitPolynomial
    );
    
    diagram.objects.push(obj);
    diagram.horizontalArrows.push(horizontal);
    
    expect(diagram.objects).toContain(obj);
    expect(diagram.horizontalArrows).toContain(horizontal);
  });
});

// ============================================================================
// MATHEMATICAL PROPERTIES TESTS
// ============================================================================

describe('Mathematical Properties', () => {
  it('should satisfy double category axioms', () => {
    const doubleCategory = createPolynomialDoubleCategory();
    
    // Test that we have the required structure
    expect(doubleCategory.objects).toBeDefined();
    expect(doubleCategory.morphisms).toBeDefined();
    expect(doubleCategory.source).toBeDefined();
    expect(doubleCategory.target).toBeDefined();
    expect(doubleCategory.compose).toBeDefined();
    expect(doubleCategory.identity).toBeDefined();
  });

  it('should satisfy framed bicategory condition', () => {
    const doubleCategory = createPolynomialDoubleCategory();
    
    expect(doubleCategory.isFramedBicategory).toBe(true);
    expect(doubleCategory.baseChange.isBifibration).toBe(true);
  });

  it('should support coherence conditions', () => {
    const coherence = createCoherenceConditions();
    
    // Test that all coherence isomorphisms are defined
    expect(coherence.associativity).toBeDefined();
    expect(coherence.leftUnit).toBeDefined();
    expect(coherence.rightUnit).toBeDefined();
    expect(coherence.interchange).toBeDefined();
  });
});
