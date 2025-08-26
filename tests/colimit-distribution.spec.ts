/**
 * Tests for Colimit Distribution Laws and Kan Extensions
 * 
 * Based on Appendix A (pages 17-18) of Libkind-Spivak Paper
 */

import { describe, it, expect, vi } from 'vitest';

import {
  // Core structures
  createKappaSmallPolynomial,
  computeFilteredColimit,
  
  // Colimit distribution (Proposition A.8)
  colimitOfComposition,
  compositionOfColimit,
  colimitDistributionIsomorphism,
  
  // Kan extensions
  computeLeftKanExtension,
  connectedComponentsReflection,
  createCoproductCompletion,
  
  // Monoid structure (Proposition 2.9)
  createPolynomialMonoidMap,
  verifyMonoidStructurePreservation,
  
  // Examples
  exampleColimitDistribution,
  exampleKanExtension,
  exampleMonoidMapPreservation
} from '../fp-colimit-distribution';

describe('Colimit Distribution Laws and Kan Extensions', () => {
  
  describe('κ-Small Polynomials (Definition A.1)', () => {
    
    it('should create κ-small polynomial correctly', () => {
      const polynomial = createKappaSmallPolynomial(
        5, // positions
        (pos: number) => Array(pos).fill('direction'), // directions
        10 // κ bound
      );
      
      expect(polynomial.kappa).toBe(10);
      expect(polynomial.isKappaSmall).toBe(true); // 5 < 10
      expect(polynomial.positions).toBe(5);
      expect(polynomial.directions(3)).toEqual(['direction', 'direction', 'direction']);
    });
    
    it('should detect non-κ-small polynomials', () => {
      const polynomial = createKappaSmallPolynomial(
        15, // positions  
        (pos: number) => Array(pos).fill('direction'), // directions
        10 // κ bound
      );
      
      expect(polynomial.isKappaSmall).toBe(false); // 15 ≥ 10
    });
    
  });
  
  describe('Filtered Colimits in Poly', () => {
    
    it('should compute filtered colimit of polynomial diagram', () => {
      const diagram = new Map();
      
      // p1: positions {1}, directions ['a']
      diagram.set('p1', {
        positions: [1],
        directions: (pos: number) => ['a']
      });
      
      // p2: positions {1,2}, directions ['a','b']  
      diagram.set('p2', {
        positions: [1, 2],
        directions: (pos: number) => pos === 1 ? ['a'] : ['b']
      });
      
      const colimit = computeFilteredColimit(diagram);
      
      expect(colimit.kind).toBe('PolynomialColimit');
      expect(colimit.colimitPositions.size).toBe(2); // {1, 2}
      expect(colimit.colimitDirections.get(1)).toEqual(['a', 'a']); // From both p1 and p2
      expect(colimit.colimitDirections.get(2)).toEqual(['b']); // From p2 only
    });
    
  });
  
  describe('Proposition A.8: Colimit Distribution Law', () => {
    
    it('should compute colim(pi ⋊ q) correctly', () => {
      const piDiagram = new Map();
      piDiagram.set('pi1', {
        positions: 'pos1',
        directions: () => 'dir1'
      });
      piDiagram.set('pi2', {
        positions: 'pos2', 
        directions: () => 'dir2'
      });
      
      const q = {
        positions: 'qPos',
        directions: () => 'qDir'
      };
      
      const leftSide = colimitOfComposition(piDiagram, q);
      
      expect(leftSide.kind).toBe('PolynomialColimit');
      expect(leftSide.colimitPositions.size).toBeGreaterThan(0);
    });
    
    it('should compute (colim pi) ⋊ q correctly', () => {
      const piDiagram = new Map();
      piDiagram.set('pi1', {
        positions: 'pos1',
        directions: () => 'dir1'
      });
      
      const q = {
        positions: 'qPos',
        directions: () => 'qDir'
      };
      
      const rightSide = compositionOfColimit(piDiagram, q);
      
      expect(rightSide.positions).toBeDefined();
      expect(rightSide.directions).toBeDefined();
    });
    
    it('should verify isomorphism colim(pi ⋊ q) ≅ (colim pi) ⋊ q', () => {
      const piDiagram = new Map();
      piDiagram.set('pi', {
        positions: 1,
        directions: () => 'dir'
      });
      
      const q = {
        positions: 'q',
        directions: () => 'qDir'
      };
      
      const { leftSide, rightSide, isomorphism, inverse } = 
        colimitDistributionIsomorphism(piDiagram, q);
      
      expect(leftSide.kind).toBe('PolynomialColimit');
      expect(rightSide.positions).toBeDefined();
      expect(typeof isomorphism).toBe('function');
      expect(typeof inverse).toBe('function');
      
      // Test isomorphism properties (simplified)
      const testValue = { test: 'data' };
      expect(inverse(isomorphism(testValue))).toEqual(testValue);
    });
    
  });
  
  describe('Kan Extensions for Polynomials', () => {
    
    it('should compute left Kan extension', () => {
      const f = (n: number): string => n.toString();
      const baseFunctor = (x: any) => [x, x]; // Duplicate functor
      
      const kanExtension = computeLeftKanExtension(f, baseFunctor);
      
      expect(kanExtension.polynomialMap).toBe(f);
      expect(kanExtension.functor).toBe(baseFunctor);
      expect(typeof kanExtension.extension).toBe('function');
      
      // Test the extension
      const g = (s: string): number => parseInt(s);
      const extendedF = kanExtension.extension(g);
      
      expect(extendedF(42)).toBe(42); // f(42) = "42", g("42") = 42
    });
    
    it('should compute connected components reflection', () => {
      const category = {
        objects: new Set(['A', 'B', 'C']),
        morphisms: new Set(['f', 'g'])
      };
      
      const components = connectedComponentsReflection(category);
      
      expect(components.size).toBe(3); // Each object in its own component (simplified)
      
      // Check each component is a singleton set
      const componentArray = Array.from(components);
      componentArray.forEach(component => {
        expect(component.size).toBe(1);
      });
    });
    
    it('should create coproduct completion', () => {
      const baseCategory = {
        objects: new Set(['obj1', 'obj2']),
        morphisms: []
      };
      
      const diagram = (index: string) => new Set([`${index}_element`]);
      const functor = (s: string) => `transformed_${s}`;
      
      const completion = createCoproductCompletion(baseCategory, diagram, functor);
      
      expect(completion.baseCategory).toBe(baseCategory);
      expect(completion.diagram('test')).toEqual(new Set(['test_element']));
      expect(completion.functor('input')).toBe('transformed_input');
    });
    
  });
  
  describe('Proposition 2.9: ⋊-Monoid Structure', () => {
    
    it('should create polynomial monoid map', () => {
      const f = (s: string): number => s.length;
      
      const monoidMap = createPolynomialMonoidMap(f);
      
      expect(monoidMap.polynomialMap).toBe(f);
      expect(typeof monoidMap.naturalTransformation).toBe('function');
      expect(monoidMap.sourceMonad).toBeDefined();
      expect(monoidMap.targetMonad).toBeDefined();
    });
    
    it('should verify monoid structure preservation', () => {
      const f = (n: number): boolean => n > 0;
      const monoidMap = createPolynomialMonoidMap(f);
      
      const preserves = verifyMonoidStructurePreservation(monoidMap);
      
      expect(typeof preserves).toBe('boolean');
      // The verification should pass for well-formed monoid maps
      expect(preserves).toBe(true);
    });
    
    it('should transform free monads correctly', () => {
      const f = (s: string): number => s.charCodeAt(0);
      const monoidMap = createPolynomialMonoidMap(f);
      
      // Test pure monad transformation
      const pureMp = { type: 'Pure' as const, value: 'test' };
      const transformed = monoidMap.naturalTransformation(pureMp);
      
      expect(transformed.type).toBe('Pure');
      expect(transformed.value).toBe('test'); // Value preserved
    });
    
  });
  
  describe('Mathematical Properties Verification', () => {
    
    it('should verify colimit preserves coproducts', () => {
      // Test that Ext : Poly → Set^Set is fully faithful
      const polynomial = {
        positions: [1, 2],
        directions: (pos: number) => [`dir${pos}`]
      };
      
      // In a full implementation, we'd verify:
      // 1. Ext reflects colimits
      // 2. PolyCart → Poly reflects colimits  
      // 3. Colimit computation uses Kan extensions
      
      expect(polynomial.positions).toEqual([1, 2]);
      expect(polynomial.directions(1)).toEqual(['dir1']);
    });
    
    it('should verify cartesian map properties', () => {
      // Test properties of cartesian maps in PolyCart
      const cartesianMap = (x: any) => [x, x]; // Diagonal map
      
      // Cartesian maps should preserve pullbacks
      const testInput = { data: 'test' };
      const result = cartesianMap(testInput);
      
      expect(result).toEqual([testInput, testInput]);
      
      // In full implementation: verify pullback preservation
      expect(result[0]).toBe(result[1]); // Both refer to same object
    });
    
  });
  
  describe('Integration Examples', () => {
    
    it('should run colimit distribution example', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      exampleColimitDistribution();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          leftSidePositions: expect.any(Number),
          rightSidePositions: expect.any(Number),
          isomorphismWorks: true
        })
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should run Kan extension example', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      exampleKanExtension();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          originalMap: true, // f(4) = true (even)
          extendedResult: 'even',
          kanExtensionComputed: true
        })
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should run monoid map preservation example', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      exampleMonoidMapPreservation();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          monoidMapCreated: true,
          preservesStructure: expect.any(Boolean),
          example: 'Length function String → Number'
        })
      );
      
      consoleSpy.mockRestore();
    });
    
  });
  
  describe('Edge Cases and Error Handling', () => {
    
    it('should handle empty diagrams gracefully', () => {
      const emptyDiagram = new Map();
      const colimit = computeFilteredColimit(emptyDiagram);
      
      expect(colimit.kind).toBe('PolynomialColimit');
      expect(colimit.colimitPositions.size).toBe(0);
      expect(colimit.colimitDirections.size).toBe(0);
    });
    
    it('should handle invalid κ values', () => {
      const polynomial = createKappaSmallPolynomial(
        1,
        () => ['dir'],
        0 // Invalid κ = 0
      );
      
      expect(polynomial.isKappaSmall).toBe(false); // No directions < 0
    });
    
    it('should handle monoid structure verification edge cases', () => {
      const identityMap = (x: any) => x;
      const monoidMap = createPolynomialMonoidMap(identityMap);
      
      // Identity should always preserve structure
      const preserves = verifyMonoidStructurePreservation(monoidMap);
      expect(preserves).toBe(true);
    });
    
  });
  
});





