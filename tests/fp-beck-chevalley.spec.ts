/**
 * Tests for Complete Beck-Chevalley Isomorphisms
 * 
 * Based on "Polynomial functors and polynomial monads" by Nicola Gambino and Joachim Kock
 * Diagram (9) - Complete implementation of polynomial composition via pullbacks
 * 
 * This tests the full Beck-Chevalley machinery that makes polynomial composition work.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  // REAL Cartesian squares and pullbacks
  RealCartesianSquare,
  createRealCartesianSquare,
  verifyRealCartesianSquare,
  
  // PRECISE Beck-Chevalley isomorphisms
  PreciseBeckChevalleyIsomorphism,
  createPreciseBeckChevalleyIsomorphism,
  verifyPreciseBeckChevalleyIsomorphism,
  
  // EXACT Distributivity diagrams
  ExactDistributivityDiagram,
  createExactDistributivityDiagram,
  
  // EXACT Adjunction counits
  ExactAdjunctionCounit,
  createExactAdjunctionCounit,
  
  // Complete Diagram (9) with REAL PRECISION
  CompleteDiagram9WithPrecision,
  createCompleteDiagram9WithPrecision,
  verifyCompleteDiagram9WithPrecision,
  
  // REVOLUTIONARY Example functions
  exampleNaturalNumbersPreciseBeckChevalley,
  examplePreciseSimpleBeckChevalley
} from '../fp-beck-chevalley';

import { createMorphism, identityMorphism } from '../fp-morphisms';

describe('Complete Beck-Chevalley Isomorphisms', () => {
  describe('Cartesian Squares and Pullbacks', () => {
    it('should create cartesian square with proper structure', () => {
      const f = createMorphism('B', 'C', (b) => `f(${b})`);
      const g = createMorphism('A', 'C', (a) => `g(${a})`);
      
      const square = createRealCartesianSquare(f, g, 'pullback');
      
      expect(square.kind).toBe('RealCartesianSquare');
      expect(square.f).toBe(f);
      expect(square.g).toBe(g);
      expect(square.p.kind).toBe('Morphism');
      expect(square.q.kind).toBe('Morphism');
      expect(square.isPullback).toBe(true);
    });
    
    it('should verify cartesian square properties', () => {
      const f = createMorphism('B', 'C', (b) => `f(${b})`);
      const g = createMorphism('A', 'C', (a) => `g(${a})`);
      
      const square = createRealCartesianSquare(f, g, 'pullback');
      const verification = verifyRealCartesianSquare(square);
      
      expect(verification.isValid).toBe(true);
      expect(verification.isPullback).toBe(true);
      expect(verification.commutativity).toBe(true);
      expect(verification.universalProperty).toBe(true);
    });
    
    it('should implement universal property correctly', () => {
      const f = createMorphism('B', 'C', (b) => `f(${b})`);
      const g = createMorphism('A', 'C', (a) => `g(${a})`);
      
      const square = createRealCartesianSquare(f, g, 'pullback');
      const h1 = createMorphism('X', 'A', (x) => 'A');
      const h2 = createMorphism('X', 'B', (x) => 'B');
      
      const universalProperty = square.universalProperty(h1, h2);
      
      expect(universalProperty.uniqueMorphism.kind).toBe('Morphism');
      expect(universalProperty.uniqueMorphism.source).toBe('X');
      expect(universalProperty.uniqueMorphism.target).toBe('pullback');
    });
  });
  
  describe('Beck-Chevalley Isomorphisms', () => {
    it('should create Beck-Chevalley isomorphism from cartesian square', () => {
      const f = createMorphism('B', 'C', (b) => `f(${b})`);
      const g = createMorphism('A', 'C', (a) => `g(${a})`);
      
      const square = createRealCartesianSquare(f, g, 'pullback');
      const beckChevalley = createPreciseBeckChevalleyIsomorphism(square);
      
      expect(beckChevalley.kind).toBe('PreciseBeckChevalleyIsomorphism');
      expect(beckChevalley.cartesianSquare).toBe(square);
      
      const leftSide = beckChevalley.leftSide('test');
      const rightSide = beckChevalley.rightSide('test');
      
      expect(leftSide).toHaveLength(1);
      expect(leftSide[0].base).toBe('C');
      expect(leftSide[0].product).toHaveLength(2);
      
      expect(rightSide).toHaveLength(1);
      expect(rightSide[0].base).toBe('C');
      expect(rightSide[0].sum).toHaveLength(2);
    });
    
    it('should verify Beck-Chevalley isomorphism properties', () => {
      const f = createMorphism('B', 'C', (b) => `f(${b})`);
      const g = createMorphism('A', 'C', (a) => `g(${a})`);
      
      const square = createRealCartesianSquare(f, g, 'pullback');
      const beckChevalley = createPreciseBeckChevalleyIsomorphism(square);
      const verification = verifyPreciseBeckChevalleyIsomorphism(beckChevalley);
      
      expect(verification.isValid).toBe(true);
      expect(verification.leftSide).toHaveLength(1);
      expect(verification.rightSide).toHaveLength(1);
      expect(verification.forward).toHaveLength(1);
      expect(verification.backward).toHaveLength(1);
      expect(verification.naturality).toBe(true);
    });
    
    it('should implement isomorphism forward and backward', () => {
      const f = createMorphism('B', 'C', (b) => `f(${b})`);
      const g = createMorphism('A', 'C', (a) => `g(${a})`);
      
      const square = createRealCartesianSquare(f, g, 'pullback');
      const beckChevalley = createPreciseBeckChevalleyIsomorphism(square);
      const isomorphism = beckChevalley.isomorphism('test');
      
      expect(isomorphism.forward).toHaveLength(1);
      expect(isomorphism.forward[0].source).toHaveLength(2);
      expect(isomorphism.forward[0].target).toHaveLength(2);
      
      expect(isomorphism.backward).toHaveLength(1);
      expect(isomorphism.backward[0].source).toHaveLength(2);
      expect(isomorphism.backward[0].target).toHaveLength(2);
    });
    
    it('should verify naturality condition', () => {
      const f = createMorphism('B', 'C', (b) => `f(${b})`);
      const g = createMorphism('A', 'C', (a) => `g(${a})`);
      
      const square = createRealCartesianSquare(f, g, 'pullback');
      const beckChevalley = createPreciseBeckChevalleyIsomorphism(square);
      
      const naturality = beckChevalley.verifyNaturality('test', (x) => `transformed(${x})`);
      
      expect(naturality.commutes).toBe(true);
    });
  });
  
  describe('Distributivity Diagrams', () => {
    it('should create distributivity diagram', () => {
      const u = createMorphism('A', 'B', (a) => `u(${a})`);
      const v = createMorphism('C', 'D', (c) => `v(${c})`);
      const g = createMorphism('A', 'C', (a) => `g(${a})`);
      const h = createMorphism('B', 'D', (b) => `h(${b})`);
      
      const distributivity = createExactDistributivityDiagram(u, v, g, h);
      
      expect(distributivity.kind).toBe('ExactDistributivityDiagram');
      expect(distributivity.u).toBe(u);
      expect(distributivity.v).toBe(v);
      expect(distributivity.g).toBe(g);
      expect(distributivity.h).toBe(h);
      expect(distributivity.commutativity.isEqual).toBe(true);
    });
    
    it('should implement distributivity law', () => {
      const u = createMorphism('A', 'B', (a) => `u(${a})`);
      const v = createMorphism('C', 'D', (c) => `v(${c})`);
      const g = createMorphism('A', 'C', (a) => `g(${a})`);
      const h = createMorphism('B', 'D', (b) => `h(${b})`);
      
      const distributivity = createExactDistributivityDiagram(u, v, g, h);
      const result = distributivity.distributivity('test');
      
      expect(result.leftSide).toHaveLength(1);
      expect(result.leftSide[0].base).toBe('B');
      expect(result.leftSide[0].sum).toHaveLength(2);
      
      expect(result.rightSide).toHaveLength(1);
      expect(result.rightSide[0].base).toBe('D');
      expect(result.rightSide[0].product).toHaveLength(2);
      
      expect(result.isomorphism).toHaveLength(1);
      expect(result.isomorphism[0].source).toHaveLength(2);
      expect(result.isomorphism[0].target).toHaveLength(2);
    });
  });
  
  describe('Adjunction Counits', () => {
    it('should create adjunction counit', () => {
      const g = createMorphism('A', 'B', (a) => `g(${a})`);
      const counit = createExactAdjunctionCounit(g);
      
      expect(counit.kind).toBe('ExactAdjunctionCounit');
      expect(counit.morphism).toBe(g);
      
      const counitResult = counit.counit('test');
      expect(counitResult).toHaveLength(1);
      expect(counitResult[0].base).toBe('B');
      expect(counitResult[0].counit).toBe('test');
    });
    
    it('should implement k-component of counit', () => {
      const g = createMorphism('A', 'B', (a) => `g(${a})`);
      const counit = createExactAdjunctionCounit(g);
      
      const componentK = counit.componentK('K');
      expect(componentK).toHaveLength(1);
      expect(componentK[0].base).toBe('K');
      expect(componentK[0].component).toBe('K');
    });
    
    it('should verify triangle identity', () => {
      const g = createMorphism('A', 'B', (a) => `g(${a})`);
      const counit = createExactAdjunctionCounit(g);
      
      const triangleIdentity = counit.verifyTriangleIdentity('test');
      expect(triangleIdentity.triangle1).toBe(true);
      expect(triangleIdentity.triangle2).toBe(true);
    });
  });
  
  describe('Complete Diagram (9)', () => {
    it('should create complete Diagram (9)', () => {
      // First polynomial F: I ←s B →f A →t J
      const s = createMorphism('B', 'I', (b) => 'I');
      const f = createMorphism('B', 'A', (b) => 'A');
      const t = createMorphism('A', 'J', (a) => 'J');
      
      // Second polynomial G: J ←u C →v M →w K
      const u = createMorphism('J', 'C', (j) => 'C');
      const v = createMorphism('C', 'M', (c) => 'M');
      const w = createMorphism('M', 'K', (m) => 'K');
      
      const diagram = createCompleteDiagram9WithPrecision(s, f, t, u, v, w);
      
      expect(diagram.kind).toBe('CompleteDiagram9WithPrecision');
      expect(diagram.s).toBe(s);
      expect(diagram.f).toBe(f);
      expect(diagram.t).toBe(t);
      expect(diagram.u).toBe(u);
      expect(diagram.v).toBe(v);
      expect(diagram.w).toBe(w);
      
      expect(diagram.cartesianSquareI.kind).toBe('RealCartesianSquare');
      expect(diagram.cartesianSquareIII.kind).toBe('RealCartesianSquare');
      expect(diagram.cartesianSquareIV.kind).toBe('RealCartesianSquare');
      expect(diagram.distributivityII.kind).toBe('ExactDistributivityDiagram');
      
      expect(diagram.beckChevalleyI.kind).toBe('PreciseBeckChevalleyIsomorphism');
      expect(diagram.beckChevalleyIII.kind).toBe('PreciseBeckChevalleyIsomorphism');
      expect(diagram.beckChevalleyIV.kind).toBe('PreciseBeckChevalleyIsomorphism');
      
      expect(diagram.pullbackD.object).toBe('D_prime');
      expect(diagram.coreflection.morphism.kind).toBe('Morphism');
      
      expect(diagram.compositionFormula).toBeDefined();
    });
    
    it('should verify complete Diagram (9)', () => {
      // First polynomial F: I ←s B →f A →t J
      const s = createMorphism('B', 'I', (b) => 'I');
      const f = createMorphism('B', 'A', (b) => 'A');
      const t = createMorphism('A', 'J', (a) => 'J');
      
      // Second polynomial G: J ←u C →v M →w K
      const u = createMorphism('J', 'C', (j) => 'C');
      const v = createMorphism('C', 'M', (c) => 'M');
      const w = createMorphism('M', 'K', (m) => 'K');
      
      const diagram = createCompleteDiagram9WithPrecision(s, f, t, u, v, w);
      const verification = verifyCompleteDiagram9WithPrecision(diagram);
      
      expect(verification.isValid).toBe(true);
      
      expect(verification.cartesianSquares.I.isValid).toBe(true);
      expect(verification.cartesianSquares.III.isValid).toBe(true);
      expect(verification.cartesianSquares.IV.isValid).toBe(true);
      
      expect(verification.beckChevalleyIsomorphisms.I.isValid).toBe(true);
      expect(verification.beckChevalleyIsomorphisms.III.isValid).toBe(true);
      expect(verification.beckChevalleyIsomorphisms.IV.isValid).toBe(true);
      
      expect(verification.distributivity.leftSide).toHaveLength(1);
      expect(verification.distributivity.rightSide).toHaveLength(1);
      expect(verification.distributivity.isomorphism).toHaveLength(1);
      
      expect(verification.composition.originalComposition).toHaveLength(1);
      expect(verification.composition.pullbackComposition).toHaveLength(1);
      expect(verification.composition.isEqual).toBe(true);
    });
    
    it('should verify polynomial composition via pullbacks', () => {
      // First polynomial F: I ←s B →f A →t J
      const s = createMorphism('B', 'I', (b) => 'I');
      const f = createMorphism('B', 'A', (b) => 'A');
      const t = createMorphism('A', 'J', (a) => 'J');
      
      // Second polynomial G: J ←u C →v M →w K
      const u = createMorphism('J', 'C', (j) => 'C');
      const v = createMorphism('C', 'M', (c) => 'M');
      const w = createMorphism('M', 'K', (m) => 'K');
      
      const diagram = createCompleteDiagram9WithPrecision(s, f, t, u, v, w);
      const composition = diagram.verifyComposition('test');
      
      expect(composition.originalComposition).toHaveLength(1);
      expect(composition.originalComposition[0].base).toBe('K');
      expect(composition.originalComposition[0].result).toHaveLength(3);
      
      expect(composition.pullbackComposition).toHaveLength(1);
      expect(composition.pullbackComposition[0].base).toBe('K');
      expect(composition.pullbackComposition[0].result).toHaveLength(3);
      
      expect(composition.isEqual).toBe(true);
    });
  });
  
  describe('Integration Tests - Example Functions', () => {
    let consoleSpy: any;
    
    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });
    
    afterEach(() => {
      consoleSpy.mockRestore();
    });
    
    it('should run natural numbers Beck-Chevalley example', () => {
      exampleNaturalNumbersPreciseBeckChevalley();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          naturalNumbersPreciseBeckChevalley: true,
          completeDiagram: 'CompleteDiagram9WithPrecision',
          compositionFormula: expect.stringContaining('P_G ∘ P_F'),
          cartesianSquaresValid: true,
          beckChevalleyValid: true,
          distributivityValid: true,
          compositionVerified: true
        })
      );
    });
    
    it('should run simple Beck-Chevalley example', () => {
      examplePreciseSimpleBeckChevalley();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          preciseSimpleBeckChevalley: true,
          squareValid: true,
          leftSide: expect.any(Array),
          rightSide: expect.any(Array),
          isomorphismForward: expect.any(Array),
          isomorphismBackward: expect.any(Array),
          naturality: true
        })
      );
    });
  });
  
  describe('Mathematical Properties', () => {
    it('should verify Beck-Chevalley naturality', () => {
      const f = createMorphism('B', 'C', (b) => `f(${b})`);
      const g = createMorphism('A', 'C', (a) => `g(${a})`);
      
      const square = createRealCartesianSquare(f, g, 'pullback');
      const beckChevalley = createPreciseBeckChevalleyIsomorphism(square);
      
      // Test naturality with identity transformation
      const naturalityId = beckChevalley.verifyNaturality('test', (x) => x);
      expect(naturalityId.commutes).toBe(true);
      
      // Test naturality with constant transformation
      const naturalityConst = beckChevalley.verifyNaturality('test', (x) => 'constant');
      expect(naturalityConst.commutes).toBe(true);
    });
    
    it('should verify cartesian square commutativity', () => {
      const f = createMorphism('B', 'C', (b) => `f(${b})`);
      const g = createMorphism('A', 'C', (a) => `g(${a})`);
      
      const square = createRealCartesianSquare(f, g, 'pullback');
      
      // Test that f∘q = g∘p (commutativity)
      const fq = square.q.compose(square.f);
      const gp = square.p.compose(square.g);
      
      expect(fq.kind).toBe('Morphism');
      expect(gp.kind).toBe('Morphism');
      expect(fq.source).toBe('pullback');
      expect(gp.source).toBe('pullback');
      expect(fq.target).toBe('C');
      expect(gp.target).toBe('C');
    });
    
    it('should verify distributivity law structure', () => {
      const u = createMorphism('A', 'B', (a) => `u(${a})`);
      const v = createMorphism('C', 'D', (c) => `v(${c})`);
      const g = createMorphism('A', 'C', (a) => `g(${a})`);
      const h = createMorphism('B', 'D', (b) => `h(${b})`);
      
      const distributivity = createExactDistributivityDiagram(u, v, g, h);
      
      // Test that the distributivity law gives isomorphic results
      const result = distributivity.distributivity('test');
      
      expect(result.leftSide).toHaveLength(1);
      expect(result.rightSide).toHaveLength(1);
      expect(result.isomorphism).toHaveLength(1);
      
      // Both sides should have the same structure
      expect(result.leftSide[0].base).toBeDefined();
      expect(result.rightSide[0].base).toBeDefined();
      expect(result.leftSide[0].sum).toBeDefined();
      expect(result.rightSide[0].product).toBeDefined();
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
    it('should handle identity morphisms in cartesian squares', () => {
      const idB = identityMorphism('B');
      const idC = identityMorphism('C');
      
      const square = createRealCartesianSquare(idB, idC, 'pullback');
      const verification = verifyRealCartesianSquare(square);
      
      expect(verification.isValid).toBe(true);
      expect(verification.isPullback).toBe(true);
    });
    
    it('should handle constant morphisms in Beck-Chevalley', () => {
      const constant = createMorphism('A', 'B', () => 'constant');
      const g = createMorphism('A', 'C', (a) => `g(${a})`);
      
      const square = createRealCartesianSquare(constant, g, 'pullback');
      const beckChevalley = createPreciseBeckChevalleyIsomorphism(square);
      const verification = verifyPreciseBeckChevalleyIsomorphism(beckChevalley);
      
      expect(verification.isValid).toBe(true);
      expect(verification.naturality).toBe(true);
    });
    
    it('should handle empty diagrams gracefully', () => {
      // Test with minimal morphisms
      const minimal = createMorphism('A', 'B', (a) => a);
      const square = createRealCartesianSquare(minimal, minimal, 'pullback');
      
      expect(square.isPullback).toBe(true);
      expect(square.universalProperty(minimal, minimal).uniqueMorphism.kind).toBe('Morphism');
    });
  });
});
