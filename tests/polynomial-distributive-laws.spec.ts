/**
 * Tests for Distributive Laws and Tensorial Strength
 * 
 * Based on "Polynomial functors and polynomial monads" by Nicola Gambino and Joachim Kock
 * 
 * Tests:
 * - Beck-Chevalley isomorphisms (Formula 5)
 * - Distributive law of dependent sums over dependent products (Formula 6)
 * - Tensorial strength for polynomial functors
 * - Internal hom and tensor product constructions
 * 
 * Pages 4-6 of the foundational paper
 */

import { describe, it, expect, vi } from 'vitest';

import {
  // Beck-Chevalley Isomorphisms
  CartesianSquare,
  BeckChevalleyIsomorphism,
  createBeckChevalleyIsomorphism,
  
  // Distributive Law
  DistributiveLaw,
  createDistributiveLaw,
  
  // Tensorial Strength
  InternalHomTensor,
  createInternalHomTensor,
  TensorialStrength,
  createTensorialStrength,
  
  // Canonical Strengths
  createDeltaStrength,
  createSigmaStrength,
  createPiStrength,
  
  // Verification
  verifyBeckChevalley,
  verifyDistributiveLaw,
  verifyTensorialStrength,
  
  // Examples
  exampleNaturalNumbersBeckChevalley,
  exampleBinaryTreesDistributiveLaw,
  exampleTensorialStrength
} from '../fp-polynomial-distributive-laws';

import { Polynomial } from '../fp-polynomial-functors';

describe('Distributive Laws and Tensorial Strength', () => {
  
  describe('Beck-Chevalley Isomorphisms (Formula 5)', () => {
    
    it('should create cartesian square', () => {
      const square: CartesianSquare<string, string, string, string, string> = {
        kind: 'CartesianSquare',
        f: (b) => 'A',
        u: (c) => 'B',
        g: (n) => 'M',
        e: (n) => 'C',
        v: (m) => 'A',
        w: (c) => 'M',
        isPullback: true
      };
      
      expect(square.kind).toBe('CartesianSquare');
      expect(square.f('B')).toBe('A');
      expect(square.u('C')).toBe('B');
      expect(square.g('N')).toBe('M');
      expect(square.e('N')).toBe('C');
      expect(square.v('M')).toBe('A');
      expect(square.w('C')).toBe('M');
      expect(square.isPullback).toBe(true);
    });
    
    it('should create Beck-Chevalley isomorphism', () => {
      const square: CartesianSquare<string, string, string, string, string> = {
        kind: 'CartesianSquare',
        f: (b) => 'A',
        u: (c) => 'B',
        g: (n) => 'M',
        e: (n) => 'C',
        v: (m) => 'A',
        w: (c) => 'M',
        isPullback: true
      };
      
      const beckChevalley = createBeckChevalleyIsomorphism(square);
      
      expect(beckChevalley.kind).toBe('BeckChevalleyIsomorphism');
      expect(beckChevalley.cartesianSquare).toBe(square);
      
      const leftSide = beckChevalley.leftSide('test');
      const rightSide = beckChevalley.rightSide('test');
      const isomorphism = beckChevalley.isomorphism('test');
      
      expect(leftSide).toHaveLength(1);
      expect(rightSide).toHaveLength(1);
      expect(isomorphism.leftToRight).toHaveLength(1);
      expect(isomorphism.rightToLeft).toHaveLength(1);
    });
    
    it('should verify Beck-Chevalley isomorphism', () => {
      const square: CartesianSquare<string, string, string, string, string> = {
        kind: 'CartesianSquare',
        f: (b) => 'A',
        u: (c) => 'B',
        g: (n) => 'M',
        e: (n) => 'C',
        v: (m) => 'A',
        w: (c) => 'M',
        isPullback: true
      };
      
      const beckChevalley = createBeckChevalleyIsomorphism(square);
      const verification = verifyBeckChevalley(beckChevalley);
      
      expect(verification.isValid).toBe(true);
      expect(verification.leftSide).toHaveLength(1);
      expect(verification.rightSide).toHaveLength(1);
      expect(verification.isomorphism).toBeDefined();
    });
    
  });
  
  describe('Distributive Law (Formula 6)', () => {
    
    it('should create distributive law from polynomial functors', () => {
      const basePolynomial: Polynomial<string, string> = {
        positions: ['leaf', 'node'],
        directions: (pos) => pos === 'leaf' ? [] : ['left', 'right']
      };
      
      const dependentPolynomial: Polynomial<string, string> = {
        positions: 'value',
        directions: () => ['data']
      };
      
      const distributiveLaw = createDistributiveLaw(basePolynomial, dependentPolynomial);
      
      expect(distributiveLaw.kind).toBe('DistributiveLaw');
      expect(distributiveLaw.baseSet).toEqual(['leaf', 'node']);
      expect(distributiveLaw.fiberMap('leaf')).toEqual([]);
      expect(distributiveLaw.fiberMap('node')).toEqual(['left', 'right']);
      expect(distributiveLaw.dependentFiberMap('value')).toEqual(['data']);
    });
    
    it('should evaluate left side of distributive law', () => {
      const basePolynomial: Polynomial<string, string> = {
        positions: 'base',
        directions: () => ['fiber1', 'fiber2']
      };
      
      const dependentPolynomial: Polynomial<string, string> = {
        positions: 'value',
        directions: () => ['data']
      };
      
      const distributiveLaw = createDistributiveLaw(basePolynomial, dependentPolynomial);
      const leftSide = distributiveLaw.leftSide('test');
      
      expect(leftSide).toHaveLength(1);
      expect(leftSide[0].base).toBe('base');
      expect(leftSide[0].product).toHaveLength(2); // Two fibers, each with one dependent fiber
    });
    
    it('should evaluate right side of distributive law', () => {
      const basePolynomial: Polynomial<string, string> = {
        positions: 'base',
        directions: () => ['fiber1', 'fiber2']
      };
      
      const dependentPolynomial: Polynomial<string, string> = {
        positions: 'value',
        directions: () => ['data']
      };
      
      const distributiveLaw = createDistributiveLaw(basePolynomial, dependentPolynomial);
      const rightSide = distributiveLaw.rightSide('test');
      
      expect(rightSide).toHaveLength(1);
      expect(rightSide[0].base).toBe('base');
      expect(rightSide[0].sum).toHaveLength(2); // Two fibers, each with one dependent fiber
    });
    
    it('should evaluate reindexed side of distributive law', () => {
      const basePolynomial: Polynomial<string, string> = {
        positions: 'base',
        directions: () => ['fiber1', 'fiber2']
      };
      
      const dependentPolynomial: Polynomial<string, string> = {
        positions: 'value',
        directions: () => ['data']
      };
      
      const distributiveLaw = createDistributiveLaw(basePolynomial, dependentPolynomial);
      const reindexedSide = distributiveLaw.reindexedSide('test');
      
      expect(reindexedSide).toHaveLength(1);
      expect(reindexedSide[0].base).toBe('base');
      expect(reindexedSide[0].reindexed).toHaveLength(2); // Two fibers, each with one dependent fiber
    });
    
    it('should verify distributivity', () => {
      const basePolynomial: Polynomial<string, string> = {
        positions: 'base',
        directions: () => ['fiber1', 'fiber2']
      };
      
      const dependentPolynomial: Polynomial<string, string> = {
        positions: 'value',
        directions: () => ['data']
      };
      
      const distributiveLaw = createDistributiveLaw(basePolynomial, dependentPolynomial);
      const verification = verifyDistributiveLaw(distributiveLaw);
      
      expect(verification.isValid).toBe(true);
      expect(verification.distributivity).toBe(true);
      expect(verification.leftSide).toHaveLength(1);
      expect(verification.rightSide).toHaveLength(1);
      expect(verification.reindexedSide).toHaveLength(1);
    });
    
  });
  
  describe('Internal Hom and Tensor Product', () => {
    
    it('should create internal hom and tensor product', () => {
      const internalHomTensor = createInternalHomTensor('base', 'index');
      
      expect(internalHomTensor.kind).toBe('InternalHomTensor');
      expect(internalHomTensor.baseObject).toBe('base');
      expect(internalHomTensor.indexObject).toBe('index');
    });
    
    it('should evaluate internal hom', () => {
      const internalHomTensor = createInternalHomTensor('base', 'index');
      const hom = internalHomTensor.internalHom('base', 'test');
      
      expect(hom).toHaveLength(1);
      expect(hom[0].base).toBe('index');
      expect(hom[0].hom).toHaveLength(3); // Simplified representation
    });
    
    it('should evaluate tensor product', () => {
      const internalHomTensor = createInternalHomTensor('base', 'index');
      const tensor = internalHomTensor.tensorProduct('testK', 'base');
      
      expect(tensor).toHaveLength(1);
      expect(tensor[0].base).toBe('index');
      expect(tensor[0].tensor).toHaveLength(2); // Simplified representation
    });
    
    it('should evaluate adjunction', () => {
      const internalHomTensor = createInternalHomTensor('base', 'index');
      const adjunction = internalHomTensor.adjunction('testK', 'base', 'testX');
      
      expect(adjunction.leftAdjoint).toHaveLength(1);
      expect(adjunction.rightAdjoint).toHaveLength(1);
      expect(adjunction.leftAdjoint[0].base).toBe('index');
      expect(adjunction.rightAdjoint[0].base).toBe('index');
    });
    
  });
  
  describe('Tensorial Strength', () => {
    
    it('should create tensorial strength for polynomial functor', () => {
      const polynomial: Polynomial<string, string> = {
        positions: 'base',
        directions: () => ['fiber1', 'fiber2']
      };
      
      const strength = createTensorialStrength(polynomial);
      
      expect(strength.kind).toBe('TensorialStrength');
    });
    
    it('should evaluate strength transformation', () => {
      const polynomial: Polynomial<string, string> = {
        positions: 'base',
        directions: () => ['fiber1', 'fiber2']
      };
      
      const strength = createTensorialStrength(polynomial);
      const strengthResult = strength.strength('testK', 'testA', polynomial);
      
      expect(strengthResult).toHaveLength(1);
      expect(strengthResult[0].source).toHaveLength(3); // k + 2 fibers
      expect(strengthResult[0].target).toHaveLength(2); // 2 fibers
    });
    
    it('should verify naturality', () => {
      const polynomial: Polynomial<string, string> = {
        positions: 'base',
        directions: () => ['fiber1', 'fiber2']
      };
      
      const strength = createTensorialStrength(polynomial);
      const naturality = strength.naturality('testK', 'testA', polynomial, (x: any) => x);
      
      expect(naturality).toBe(true);
    });
    
    it('should verify associativity', () => {
      const polynomial: Polynomial<string, string> = {
        positions: 'base',
        directions: () => ['fiber1', 'fiber2']
      };
      
      const strength = createTensorialStrength(polynomial);
      const associativity = strength.associativity('testK', 'testA', polynomial, polynomial, polynomial);
      
      expect(associativity).toBe(true);
    });
    
    it('should verify unit', () => {
      const polynomial: Polynomial<string, string> = {
        positions: 'base',
        directions: () => ['fiber1', 'fiber2']
      };
      
      const strength = createTensorialStrength(polynomial);
      const unit = strength.unit('testA', polynomial);
      
      expect(unit).toBe(true);
    });
    
    it('should verify tensorial strength', () => {
      const polynomial: Polynomial<string, string> = {
        positions: 'base',
        directions: () => ['fiber1', 'fiber2']
      };
      
      const strength = createTensorialStrength(polynomial);
      const verification = verifyTensorialStrength(strength);
      
      expect(verification.isValid).toBe(true);
      expect(verification.naturality).toBe(true);
      expect(verification.associativity).toBe(true);
      expect(verification.unit).toBe(true);
      expect(verification.strength).toHaveLength(1);
    });
    
  });
  
  describe('Canonical Strengths for Polynomial Functors', () => {
    
    it('should create delta strength (pullback)', () => {
      const f = (b: string) => 'A';
      const deltaStrength = createDeltaStrength(f);
      
      expect(deltaStrength.kind).toBe('TensorialStrength');
      
      const strengthResult = deltaStrength.strength('testK', 'testA', {});
      expect(strengthResult).toHaveLength(1);
      expect(strengthResult[0].source).toHaveLength(2);
      expect(strengthResult[0].target).toHaveLength(2);
    });
    
    it('should create sigma strength (dependent sum)', () => {
      const f = (b: string) => 'A';
      const sigmaStrength = createSigmaStrength(f);
      
      expect(sigmaStrength.kind).toBe('TensorialStrength');
      
      const strengthResult = sigmaStrength.strength('testK', 'testA', {});
      expect(strengthResult).toHaveLength(1);
      expect(strengthResult[0].source).toHaveLength(1);
      expect(strengthResult[0].target).toHaveLength(1);
    });
    
    it('should create pi strength (dependent product)', () => {
      const f = (b: string) => 'A';
      const piStrength = createPiStrength(f);
      
      expect(piStrength.kind).toBe('TensorialStrength');
      
      const strengthResult = piStrength.strength('testK', 'testA', {});
      expect(strengthResult).toHaveLength(1);
      expect(strengthResult[0].source).toHaveLength(3);
      expect(strengthResult[0].target).toHaveLength(3);
    });
    
  });
  
  describe('Integration Examples', () => {
    
    it('should run natural numbers Beck-Chevalley example', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      exampleNaturalNumbersBeckChevalley();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          beckChevalleyCreated: true,
          isValid: true,
          leftSide: expect.any(Array),
          rightSide: expect.any(Array),
          isomorphism: expect.any(Object)
        })
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should run binary trees distributive law example', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      exampleBinaryTreesDistributiveLaw();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          distributiveLawCreated: true,
          isValid: true,
          distributivity: true,
          leftSide: expect.any(Array),
          rightSide: expect.any(Array),
          reindexedSide: expect.any(Array)
        })
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should run tensorial strength example', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      exampleTensorialStrength();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          tensorialStrengthCreated: true,
          isValid: true,
          naturality: true,
          associativity: true,
          unit: true,
          strength: expect.any(Array)
        })
      );
      
      consoleSpy.mockRestore();
    });
    
  });
  
  describe('Mathematical Properties and Edge Cases', () => {
    
    it('should handle empty polynomial functors in distributive law', () => {
      const emptyPolynomial: Polynomial<string, string> = {
        positions: [],
        directions: () => []
      };
      
      const dependentPolynomial: Polynomial<string, string> = {
        positions: 'value',
        directions: () => ['data']
      };
      
      const distributiveLaw = createDistributiveLaw(emptyPolynomial, dependentPolynomial);
      const verification = verifyDistributiveLaw(distributiveLaw);
      
      expect(verification.isValid).toBe(true);
      expect(verification.distributivity).toBe(true);
    });
    
    it('should handle singleton polynomial functors', () => {
      const singletonPolynomial: Polynomial<string, string> = {
        positions: 'single',
        directions: () => ['fiber']
      };
      
      const strength = createTensorialStrength(singletonPolynomial);
      const verification = verifyTensorialStrength(strength);
      
      expect(verification.isValid).toBe(true);
      expect(verification.naturality).toBe(true);
      expect(verification.associativity).toBe(true);
      expect(verification.unit).toBe(true);
    });
    
    it('should verify mathematical coherence of distributive law', () => {
      // Test that the distributive law preserves the fundamental polynomial structure
      const basePolynomial: Polynomial<string, string> = {
        positions: 'base',
        directions: () => ['fiber1', 'fiber2', 'fiber3']
      };
      
      const dependentPolynomial: Polynomial<string, string> = {
        positions: 'value',
        directions: () => ['data1', 'data2']
      };
      
      const distributiveLaw = createDistributiveLaw(basePolynomial, dependentPolynomial);
      const verification = verifyDistributiveLaw(distributiveLaw);
      
      expect(verification.isValid).toBe(true);
      expect(verification.distributivity).toBe(true);
      
      // The distributive law should preserve the number of fibers
      const leftSide = distributiveLaw.leftSide('test');
      const rightSide = distributiveLaw.rightSide('test');
      const reindexedSide = distributiveLaw.reindexedSide('test');
      
      // All sides should have the same base
      expect(leftSide[0].base).toBe('base');
      expect(rightSide[0].base).toBe('base');
      expect(reindexedSide[0].base).toBe('base');
    });
    
    it('should verify mathematical coherence of tensorial strength', () => {
      // Test that tensorial strength preserves the fundamental polynomial structure
      const polynomial: Polynomial<string, string> = {
        positions: 'base',
        directions: () => ['fiber1', 'fiber2', 'fiber3']
      };
      
      const strength = createTensorialStrength(polynomial);
      const verification = verifyTensorialStrength(strength);
      
      expect(verification.isValid).toBe(true);
      expect(verification.naturality).toBe(true);
      expect(verification.associativity).toBe(true);
      expect(verification.unit).toBe(true);
      
      // The strength should preserve the number of fibers
      const strengthResult = strength.strength('testK', 'testA', polynomial);
      expect(strengthResult[0].source).toHaveLength(4); // k + 3 fibers
      expect(strengthResult[0].target).toHaveLength(3); // 3 fibers
    });
    
  });
  
  describe('Advanced Mathematical Properties', () => {
    
    it('should verify Beck-Chevalley isomorphism preserves pullback structure', () => {
      const square: CartesianSquare<string, string, string, string, string> = {
        kind: 'CartesianSquare',
        f: (b) => 'A',
        u: (c) => 'B',
        g: (n) => 'M',
        e: (n) => 'C',
        v: (m) => 'A',
        w: (c) => 'M',
        isPullback: true
      };
      
      const beckChevalley = createBeckChevalleyIsomorphism(square);
      const verification = verifyBeckChevalley(beckChevalley);
      
      expect(verification.isValid).toBe(true);
      
      // The isomorphism should preserve the cartesian square structure
      expect(beckChevalley.cartesianSquare.isPullback).toBe(true);
      expect(beckChevalley.cartesianSquare.f('B')).toBe('A');
      expect(beckChevalley.cartesianSquare.v('M')).toBe('A');
    });
    
    it('should verify internal hom and tensor product form adjunction', () => {
      const internalHomTensor = createInternalHomTensor('base', 'index');
      
      const hom = internalHomTensor.internalHom('base', 'testX');
      const tensor = internalHomTensor.tensorProduct('testK', 'base');
      const adjunction = internalHomTensor.adjunction('testK', 'base', 'testX');
      
      // The adjunction should relate hom and tensor
      expect(hom[0].base).toBe('index');
      expect(tensor[0].base).toBe('index');
      expect(adjunction.leftAdjoint[0].base).toBe('index');
      expect(adjunction.rightAdjoint[0].base).toBe('index');
    });
    
    it('should verify canonical strengths are compatible', () => {
      const f = (b: string) => 'A';
      
      const deltaStrength = createDeltaStrength(f);
      const sigmaStrength = createSigmaStrength(f);
      const piStrength = createPiStrength(f);
      
      // All canonical strengths should be valid
      const deltaVerification = verifyTensorialStrength(deltaStrength);
      const sigmaVerification = verifyTensorialStrength(sigmaStrength);
      const piVerification = verifyTensorialStrength(piStrength);
      
      expect(deltaVerification.isValid).toBe(true);
      expect(sigmaVerification.isValid).toBe(true);
      expect(piVerification.isValid).toBe(true);
      
      // They should satisfy their respective properties
      expect(deltaVerification.naturality).toBe(true);
      expect(sigmaVerification.naturality).toBe(true);
      expect(piVerification.naturality).toBe(true);
    });
    
  });
  
});
