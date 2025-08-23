/**
 * Tests for First-Class Morphisms for Polynomial Functors
 * 
 * Based on "Polynomial functors and polynomial monads" by Nicola Gambino and Joachim Kock
 * 
 * This tests morphisms as first-class objects and their categorical operations.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  // Core morphism interfaces and creation
  Morphism,
  createMorphism,
  identityMorphism,
  
  // Morphism diagram construction
  MorphismDiagram,
  createMorphismDiagram,
  MorphismPolynomialFunctor,
  createMorphismPolynomialFunctor,
  
  // Special morphisms
  constantMorphism,
  projectionMorphism1,
  projectionMorphism2,
  diagonalMorphism,
  
  // Composition operations
  composeMorphisms,
  composeThreeMorphisms,
  productMorphism,
  coproductMorphism,
  
  // Pullback functors and adjoints
  PullbackFunctor,
  createPullbackFunctor,
  DependentSumFunctor,
  createDependentSumFunctor,
  DependentProductFunctor,
  createDependentProductFunctor,
  
  // Adjunctions
  SigmaDeltaAdjunction,
  createSigmaDeltaAdjunction,
  PullbackPiAdjunction,
  createPullbackPiAdjunction,
  
  // Polynomial composition via pullbacks
  PolynomialCompositionViaPullbacks,
  createPolynomialCompositionViaPullbacks,
  
  // Verification functions
  verifyMorphism,
  verifyMorphismDiagram,
  
  // Example functions
  exampleNaturalNumbersMorphism,
  exampleBinaryTreesMorphism,
  exampleIdentityMorphism,
  exampleMorphismComposition,
  examplePullbackFunctorAdjunction,
  examplePolynomialCompositionViaPullbacks
} from '../fp-morphisms';

describe('First-Class Morphisms', () => {
  describe('Core Morphism Interface', () => {
    it('should create a morphism with proper structure', () => {
      const f = createMorphism('A', 'B', (a) => `f(${a})`);
      
      expect(f.kind).toBe('Morphism');
      expect(f.source).toBe('A');
      expect(f.target).toBe('B');
      expect(f.map('test')).toBe('f(test)');
      expect(f.isIdentity).toBe(false);
    });
    
    it('should create identity morphism correctly', () => {
      const id = identityMorphism('A');
      
      expect(id.kind).toBe('Morphism');
      expect(id.source).toBe('A');
      expect(id.target).toBe('A');
      expect(id.map('test')).toBe('test');
      expect(id.isIdentity).toBe(true);
    });
    
    it('should compose morphisms correctly', () => {
      const f = createMorphism('A', 'B', (a) => `f(${a})`);
      const g = createMorphism('B', 'C', (b) => `g(${b})`);
      
      const composition = f.compose(g);
      
      expect(composition.source).toBe('A');
      expect(composition.target).toBe('C');
      expect(composition.map('test')).toBe('g(f(test))');
    });
    
    it('should verify morphism pullback operation', () => {
      const f = createMorphism('A', 'B', (a) => `f(${a})`);
      const pullback = f.pullback('test');
      
      expect(pullback).toHaveLength(1);
      expect(pullback[0].base).toBe('A');
      expect(pullback[0].pullback).toBe('test');
    });
    
    it('should verify morphism dependent sum operation', () => {
      const f = createMorphism('A', 'B', (a) => `f(${a})`);
      const dependentSum = f.dependentSum('test');
      
      expect(dependentSum).toHaveLength(1);
      expect(dependentSum[0].base).toBe('B');
      expect(dependentSum[0].sum).toHaveLength(2);
    });
    
    it('should verify morphism dependent product operation', () => {
      const f = createMorphism('A', 'B', (a) => `f(${a})`);
      const dependentProduct = f.dependentProduct('test');
      
      expect(dependentProduct).toHaveLength(1);
      expect(dependentProduct[0].base).toBe('B');
      expect(dependentProduct[0].product).toHaveLength(3);
    });
  });
  
  describe('Special Morphisms', () => {
    it('should create constant morphism', () => {
      const constant = constantMorphism('A', 'B');
      
      expect(constant.source).toBe('A');
      expect(constant.target).toBe('B');
      expect(constant.map('anything')).toBe('B');
    });
    
    it('should create projection morphisms', () => {
      const proj1 = projectionMorphism1('A', 'B');
      const proj2 = projectionMorphism2('A', 'B');
      
      expect(proj1.map(['x', 'y'])).toBe('x');
      expect(proj2.map(['x', 'y'])).toBe('y');
    });
    
    it('should create diagonal morphism', () => {
      const diagonal = diagonalMorphism('A');
      
      expect(diagonal.source).toBe('A');
      expect(diagonal.target).toEqual(['A', 'A']);
      expect(diagonal.map('test')).toEqual(['test', 'test']);
    });
  });
  
  describe('Morphism Composition Operations', () => {
    it('should compose two morphisms', () => {
      const f = createMorphism('A', 'B', (a) => `f(${a})`);
      const g = createMorphism('B', 'C', (b) => `g(${b})`);
      
      const composition = composeMorphisms(f, g);
      
      expect(composition.source).toBe('A');
      expect(composition.target).toBe('C');
      expect(composition.map('test')).toBe('g(f(test))');
    });
    
    it('should compose three morphisms', () => {
      const f = createMorphism('A', 'B', (a) => `f(${a})`);
      const g = createMorphism('B', 'C', (b) => `g(${b})`);
      const h = createMorphism('C', 'D', (c) => `h(${c})`);
      
      const composition = composeThreeMorphisms(f, g, h);
      
      expect(composition.source).toBe('A');
      expect(composition.target).toBe('D');
      expect(composition.map('test')).toBe('h(g(f(test)))');
    });
    
    it('should create product of morphisms', () => {
      const f = createMorphism('A', 'B', (a) => `f(${a})`);
      const g = createMorphism('C', 'D', (c) => `g(${c})`);
      
      const product = productMorphism(f, g);
      
      expect(product.source).toEqual(['A', 'C']);
      expect(product.target).toEqual(['B', 'D']);
      expect(product.map(['a', 'c'])).toEqual(['f(a)', 'g(c)']);
    });
    
    it('should create coproduct of morphisms', () => {
      const f = createMorphism('A', 'B', (a) => `f(${a})`);
      const g = createMorphism('C', 'D', (c) => `g(${c})`);
      
      const coproduct = coproductMorphism(f, g);
      
      expect(coproduct.source).toBe('A');
      expect(coproduct.target).toBe('B');
      expect(coproduct.map('A')).toBe('f(A)');
    });
  });
  
  describe('Morphism Diagrams', () => {
    it('should create morphism diagram from three morphisms', () => {
      const s = createMorphism('B', 'I', (b) => 'I');
      const f = createMorphism('B', 'A', (b) => 'A');
      const t = createMorphism('A', 'J', (a) => 'J');
      
      const diagram = createMorphismDiagram(s, f, t);
      
      expect(diagram.kind).toBe('MorphismDiagram');
      expect(diagram.s).toBe(s);
      expect(diagram.f).toBe(f);
      expect(diagram.t).toBe(t);
      expect(diagram.I).toBe('I');
      expect(diagram.B).toBe('B');
      expect(diagram.A).toBe('A');
      expect(diagram.J).toBe('J');
    });
    
    it('should create polynomial functor from morphism diagram', () => {
      const s = createMorphism('B', 'I', (b) => 'I');
      const f = createMorphism('B', 'A', (b) => 'A');
      const t = createMorphism('A', 'J', (a) => 'J');
      
      const diagram = createMorphismDiagram(s, f, t);
      const polynomialFunctor = createMorphismPolynomialFunctor(diagram);
      
      expect(polynomialFunctor.kind).toBe('MorphismPolynomialFunctor');
      expect(polynomialFunctor.diagram).toBe(diagram);
      
      const composite = polynomialFunctor.composite('test');
      expect(composite).toHaveLength(1);
      expect(composite[0].base).toBe('J');
    });
  });
  
  describe('Pullback Functors and Adjoints', () => {
    it('should create pullback functor', () => {
      const f = createMorphism('A', 'B', (a) => `f(${a})`);
      const pullbackFunctor = createPullbackFunctor(f);
      
      expect(pullbackFunctor.kind).toBe('PullbackFunctor');
      expect(pullbackFunctor.morphism).toBe(f);
      
      const pullback = pullbackFunctor.pullback('test');
      expect(pullback).toHaveLength(1);
      expect(pullback[0].base).toBe('A');
      expect(pullback[0].pullback).toBe('test');
    });
    
    it('should create dependent sum functor', () => {
      const f = createMorphism('A', 'B', (a) => `f(${a})`);
      const dependentSumFunctor = createDependentSumFunctor(f);
      
      expect(dependentSumFunctor.kind).toBe('DependentSumFunctor');
      expect(dependentSumFunctor.morphism).toBe(f);
      
      const dependentSum = dependentSumFunctor.dependentSum('test');
      expect(dependentSum).toHaveLength(1);
      expect(dependentSum[0].base).toBe('B');
      expect(dependentSum[0].sum).toHaveLength(2);
    });
    
    it('should create dependent product functor', () => {
      const f = createMorphism('A', 'B', (a) => `f(${a})`);
      const dependentProductFunctor = createDependentProductFunctor(f);
      
      expect(dependentProductFunctor.kind).toBe('DependentProductFunctor');
      expect(dependentProductFunctor.morphism).toBe(f);
      
      const dependentProduct = dependentProductFunctor.dependentProduct('test');
      expect(dependentProduct).toHaveLength(1);
      expect(dependentProduct[0].base).toBe('B');
      expect(dependentProduct[0].product).toHaveLength(3);
    });
  });
  
  describe('Adjunctions', () => {
    it('should create Σ_f ⊣ Δ_f adjunction', () => {
      const f = createMorphism('A', 'B', (a) => `f(${a})`);
      const adjunction = createSigmaDeltaAdjunction(f);
      
      expect(adjunction.kind).toBe('SigmaDeltaAdjunction');
      expect(adjunction.morphism).toBe(f);
      expect(adjunction.sigmaFunctor.kind).toBe('DependentSumFunctor');
      expect(adjunction.deltaFunctor.kind).toBe('PullbackFunctor');
      
      const unit = adjunction.unit('test');
      const counit = adjunction.counit('test');
      
      expect(unit).toHaveLength(1);
      expect(unit[0].base).toBe('A');
      expect(counit).toHaveLength(1);
      expect(counit[0].base).toBe('B');
      
      expect(adjunction.verifyTriangleIdentities('test')).toBe(true);
    });
    
    it('should create f* ⊣ Π_f adjunction', () => {
      const f = createMorphism('A', 'B', (a) => `f(${a})`);
      const adjunction = createPullbackPiAdjunction(f);
      
      expect(adjunction.kind).toBe('PullbackPiAdjunction');
      expect(adjunction.morphism).toBe(f);
      expect(adjunction.pullbackFunctor.kind).toBe('PullbackFunctor');
      expect(adjunction.piFunctor.kind).toBe('DependentProductFunctor');
      
      const unit = adjunction.unit('test');
      const counit = adjunction.counit('test');
      
      expect(unit).toHaveLength(1);
      expect(unit[0].base).toBe('A');
      expect(counit).toHaveLength(1);
      expect(counit[0].base).toBe('B');
      
      expect(adjunction.verifyTriangleIdentities('test')).toBe(true);
    });
  });
  
  describe('Polynomial Composition via Pullbacks (Diagram 9)', () => {
    it('should create polynomial composition via pullbacks', () => {
      const idI = identityMorphism('I');
      const idJ = identityMorphism('J');
      const idK = identityMorphism('K');
      
      const F = createMorphismDiagram(idI, idI, idJ);
      const G = createMorphismDiagram(idJ, idJ, idK);
      
      const composition = createPolynomialCompositionViaPullbacks(F, G);
      
      expect(composition.kind).toBe('PolynomialCompositionViaPullbacks');
      expect(composition.F).toBe(F);
      expect(composition.G).toBe(G);
      expect(composition.pullbackDiagram).toBeDefined();
      expect(composition.internalLanguageFormula).toContain('P_G ∘ P_F');
      expect(composition.composition.kind).toBe('MorphismDiagram');
    });
    
    it('should verify pullback diagram structure', () => {
      const idI = identityMorphism('I');
      const idJ = identityMorphism('J');
      const idK = identityMorphism('K');
      
      const F = createMorphismDiagram(idI, idI, idJ);
      const G = createMorphismDiagram(idJ, idJ, idK);
      
      const composition = createPolynomialCompositionViaPullbacks(F, G);
      
      expect(composition.pullbackDiagram.beckChevalleyI).toContain('cartesian square (i)');
      expect(composition.pullbackDiagram.beckChevalleyIII).toContain('cartesian square (iii)');
      expect(composition.pullbackDiagram.beckChevalleyIV).toContain('cartesian square (iv)');
      expect(composition.pullbackDiagram.distributivityII).toContain('distributivity diagram (ii)');
      expect(composition.pullbackDiagram.pullbackD).toContain('pullback of M along g');
      expect(composition.pullbackDiagram.counit).toContain('k-component of counit');
    });
  });
  
  describe('Verification Functions', () => {
    it('should verify morphism properties', () => {
      const f = createMorphism('A', 'B', (a) => `f(${a})`);
      const verification = verifyMorphism(f);
      
      expect(verification.isValid).toBe(true);
      expect(verification.source).toBe('A');
      expect(verification.target).toBe('B');
      expect(verification.isIdentity).toBe(false);
      expect(verification.composition).toBeDefined();
      expect(verification.pullback).toHaveLength(1);
      expect(verification.dependentSum).toHaveLength(1);
      expect(verification.dependentProduct).toHaveLength(1);
    });
    
    it('should verify morphism diagram properties', () => {
      const s = createMorphism('B', 'I', (b) => 'I');
      const f = createMorphism('B', 'A', (b) => 'A');
      const t = createMorphism('A', 'J', (a) => 'J');
      
      const diagram = createMorphismDiagram(s, f, t);
      const verification = verifyMorphismDiagram(diagram);
      
      expect(verification.isValid).toBe(true);
      expect(verification.sourceMap).toBe('I');
      expect(verification.fiberMap).toBe('A');
      expect(verification.targetMap).toBe('J');
      expect(verification.polynomialFunctor).toHaveLength(1);
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
    
    it('should run natural numbers morphism example', () => {
      exampleNaturalNumbersMorphism();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          naturalNumbersMorphism: true,
          diagramValid: true,
          sourceMap: '1',
          fiberMap: expect.any(String),
          targetMap: '1',
          polynomialFunctor: expect.any(Array)
        })
      );
    });
    
    it('should run binary trees morphism example', () => {
      exampleBinaryTreesMorphism();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          binaryTreesMorphism: true,
          diagramValid: true,
          sourceMap: '1',
          fiberMap: expect.any(String),
          targetMap: '1',
          polynomialFunctor: expect.any(Array)
        })
      );
    });
    
    it('should run identity morphism example', () => {
      exampleIdentityMorphism();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          identityMorphism: true,
          diagramValid: true,
          isIdentity: true,
          polynomialFunctor: expect.any(Array)
        })
      );
    });
    
    it('should run morphism composition example', () => {
      exampleMorphismComposition();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          morphismComposition: true,
          isValid: true,
          source: 'A',
          target: 'D',
          composition: expect.any(Object),
          pullback: expect.any(Array),
          dependentSum: expect.any(Array),
          dependentProduct: expect.any(Array)
        })
      );
    });
    
    it('should run pullback functor adjunction example', () => {
      examplePullbackFunctorAdjunction();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          pullbackFunctorAdjunction: true,
          sigmaDeltaAdjunction: expect.objectContaining({
            unit: expect.any(Array),
            counit: expect.any(Array),
            triangleIdentities: true
          }),
          pullbackPiAdjunction: expect.objectContaining({
            unit: expect.any(Array),
            counit: expect.any(Array),
            triangleIdentities: true
          }),
          functorResults: expect.objectContaining({
            sigma: expect.any(Array),
            delta: expect.any(Array),
            pi: expect.any(Array)
          })
        })
      );
    });
    
    it('should run polynomial composition via pullbacks example', () => {
      examplePolynomialCompositionViaPullbacks();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          polynomialCompositionViaPullbacks: true,
          F: 'MorphismDiagram',
          G: 'MorphismDiagram',
          pullbackDiagram: expect.objectContaining({
            beckChevalleyI: 'cartesian square (i)',
            beckChevalleyIII: 'cartesian square (iii)',
            beckChevalleyIV: 'cartesian square (iv)',
            distributivityII: 'distributivity diagram (ii)',
            pullbackD: 'D\' is pullback of M along g',
            counit: 'ε: D\' → A\' is k-component of counit of Σ_g ⊣ Δ_g'
          }),
          internalLanguageFormula: expect.stringContaining('P_G ∘ P_F'),
          composition: 'MorphismDiagram'
        })
      );
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
    it('should handle identity composition correctly', () => {
      const f = createMorphism('A', 'B', (a) => `f(${a})`);
      const id = identityMorphism('B');
      
      const composition = f.compose(id);
      
      expect(composition.source).toBe('A');
      expect(composition.target).toBe('B');
      expect(composition.map('test')).toBe('f(test)');
    });
    
    it('should handle constant morphism composition', () => {
      const constant = constantMorphism('A', 'B');
      const f = createMorphism('B', 'C', (b) => `f(${b})`);
      
      const composition = constant.compose(f);
      
      expect(composition.map('anything')).toBe('f(B)');
    });
    
    it('should verify adjunction triangle identities', () => {
      const f = createMorphism('A', 'B', (a) => `f(${a})`);
      const sigmaDelta = createSigmaDeltaAdjunction(f);
      const pullbackPi = createPullbackPiAdjunction(f);
      
      expect(sigmaDelta.verifyTriangleIdentities('test')).toBe(true);
      expect(pullbackPi.verifyTriangleIdentities('test')).toBe(true);
    });
  });
  
  describe('Mathematical Properties', () => {
    it('should verify associativity of morphism composition', () => {
      const f = createMorphism('A', 'B', (a) => `f(${a})`);
      const g = createMorphism('B', 'C', (b) => `g(${b})`);
      const h = createMorphism('C', 'D', (c) => `h(${c})`);
      
      const leftAssoc = f.compose(g.compose(h));
      const rightAssoc = (f.compose(g)).compose(h);
      
      expect(leftAssoc.map('test')).toBe(rightAssoc.map('test'));
    });
    
    it('should verify identity laws for morphism composition', () => {
      const f = createMorphism('A', 'B', (a) => `f(${a})`);
      const idA = identityMorphism('A');
      const idB = identityMorphism('B');
      
      const leftIdentity = idA.compose(f);
      const rightIdentity = f.compose(idB);
      
      expect(leftIdentity.map('test')).toBe('f(test)');
      expect(rightIdentity.map('test')).toBe('f(test)');
    });
    
    it('should verify functor laws for pullback functors', () => {
      const f = createMorphism('A', 'B', (a) => `f(${a})`);
      const pullbackFunctor = createPullbackFunctor(f);
      
      // Functor should preserve structure
      const result1 = pullbackFunctor.pullback('test1');
      const result2 = pullbackFunctor.pullback('test2');
      
      expect(result1).toHaveLength(1);
      expect(result2).toHaveLength(1);
      expect(result1[0].base).toBe(result2[0].base);
    });
  });
});

