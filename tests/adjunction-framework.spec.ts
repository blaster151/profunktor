/**
 * Tests for Adjunction Framework and Higher-Level Polynomial Types
 * 
 * Based on "Pattern runs on matter: The free monad monad as a module
 * over the cofree comonad comonad" by Sophie Libkind and David I. Spivak
 * https://arxiv.org/pdf/2404.16321
 * 
 * Tests:
 * - Theorem 2.10 (pages 22-23): Poly ⇄ Mod(Poly) adjunction
 * - Theorem 3.2 (pages 24-26): Cat# ⇄ Poly adjunction
 * - Proposition 3.3 (page 27): Module structure m_p ⊗ c_q → m_{p⊗q}
 * - Page 28: Lax monoidal compatibility diagrams
 */

import { describe, it, expect, vi } from 'vitest';

import {
  // Core Types
  PolynomialMonad,
  Cocone,
  NaturalTransformation,
  Adjunction,
  CommutativeDiagram,
  
  // Theorem 2.10: Poly ⇄ Mod(Poly) Adjunction
  freeMonadFunctor,
  forgetfulFunctor,
  adjunctionUnit,
  adjunctionCounit,
  createPolyModAdjunction,
  
  // Theorem 3.2: Cat# ⇄ Poly Adjunction (Pages 24-26)
  ComonoidInCat,
  CofreeComonadConstruction,
  createCofreeComonadConstruction,
  cofreeCounit,
  cofreeUnit,
  createCatPolyAdjunction,
  
  // Proposition 3.3: Module Structure (Page 27)
  ModuleStructure,
  createModuleStructure,
  
  // Page 28: Lax Monoidal Compatibility
  LaxMonoidalCompatibility,
  verifyLaxMonoidalCompatibility,
  
  // Cocone Verification
  createPolynomialCocone,
  verifyCoconeProperty,
  verifyUniversalProperty,
  
  // Diagram Verification
  verifyDiagramCommutes,
  verifyMonadLaws,
  
  // Utilities
  composeNaturalTransformations,
  
  // Examples
  examplePolynomialMonad,
  exampleAdjunctionVerification,
  exampleCoconeVerification,
  exampleCatPolyAdjunction,
  exampleModuleStructure,
  exampleLaxMonoidalCompatibility
} from '../fp-adjunction-framework';

import { Polynomial } from '../fp-polynomial-functors';

describe('Adjunction Framework and Higher-Level Types', () => {
  
  describe('Theorem 2.10: Poly ⇄ Mod(Poly) Adjunction', () => {
    
    it('should create polynomial monad from polynomial', () => {
      const polynomial: Polynomial<string, number> = {
        positions: 'test',
        directions: (pos) => 42
      };
      
      const monad = freeMonadFunctor(polynomial);
      
      expect(monad.kind).toBe('PolynomialMonad');
      expect(monad.underlying).toBe(polynomial);
      expect(typeof monad.unit).toBe('function');
      expect(typeof monad.multiplication).toBe('function');
      expect(typeof monad.bind).toBe('function');
    });
    
    it('should extract polynomial from monad via forgetful functor', () => {
      const originalPolynomial: Polynomial<string, number> = {
        positions: 'original',
        directions: () => 123
      };
      
      const monad = freeMonadFunctor(originalPolynomial);
      const extractedPolynomial = forgetfulFunctor(monad);
      
      expect(extractedPolynomial).toBe(originalPolynomial);
      expect(extractedPolynomial.positions).toBe('original');
      expect(extractedPolynomial.directions('original')).toBe(123);
    });
    
    it('should create adjunction unit ζ_p : p → m_p', () => {
      const polynomial: Polynomial<number, string> = {
        positions: 5,
        directions: (pos) => `dir${pos}`
      };
      
      const unit = adjunctionUnit(polynomial);
      
      expect(unit.source).toBe('Polynomial');
      expect(unit.target).toBe('FreeMonad');
      expect(typeof unit.component).toBe('function');
      expect(typeof unit.naturality).toBe('function');
      
      // Test the component
      const freeMonad = unit.component(polynomial);
      expect(freeMonad.type).toBe('Suspend');
    });
    
    it('should create adjunction counit ε_q : m_q → q', () => {
      const testMonad = { type: 'Pure' as const, value: 'test_value' };
      const polynomial = adjunctionCounit(testMonad);
      
      expect(polynomial.positions).toBe('unit');
      expect(polynomial.directions('unit')).toBe('test_value');
    });
    
    it('should create full Poly ⇄ Mod(Poly) adjunction', () => {
      const adjunction = createPolyModAdjunction();
      
      expect(adjunction.leftAdjoint).toBe('FreeMonadFunctor');
      expect(adjunction.rightAdjoint).toBe('ForgetfulFunctor');
      expect(adjunction.unit).toBeDefined();
      expect(adjunction.counit).toBeDefined();
      expect(typeof adjunction.triangleIdentities.left).toBe('function');
      expect(typeof adjunction.triangleIdentities.right).toBe('function');
    });
    
    it('should verify triangle identities for adjunction', () => {
      const adjunction = createPolyModAdjunction();
      
      const leftTriangle = adjunction.triangleIdentities.left();
      const rightTriangle = adjunction.triangleIdentities.right();
      
      expect(leftTriangle).toBe(true);
      expect(rightTriangle).toBe(true);
    });
    
  });
  
  describe('Theorem 3.2: Cat# ⇄ Poly Adjunction (Pages 24-26)', () => {
    
    it('should create cofree comonad construction c_p', () => {
      const polynomial: Polynomial<string, number> = {
        positions: 'test_pos',
        directions: () => 42
      };
      
      const construction = createCofreeComonadConstruction(polynomial);
      
      expect(construction.basePolynomial).toBe(polynomial);
      expect(construction.inductiveSequence.size).toBeGreaterThan(0);
      expect(construction.projectionMaps.size).toBeGreaterThan(0);
      expect(construction.limit).toBeDefined();
    });
    
    it('should create inductive sequence p^(i) for i ∈ ℕ', () => {
      const polynomial: Polynomial<string, number> = {
        positions: 'base',
        directions: () => 1
      };
      
      const construction = createCofreeComonadConstruction(polynomial);
      
      // Check base case: p^(0) := y
      const p0 = construction.inductiveSequence.get(0);
      expect(p0).toBeDefined();
      expect(p0!.positions).toBe('unit');
      
      // Check inductive step: p^(1+i) := y × (p ◁ p^(i))
      const p1 = construction.inductiveSequence.get(1);
      expect(p1).toBeDefined();
      expect(Array.isArray(p1!.positions)).toBe(true);
      if (Array.isArray(p1!.positions)) {
        expect(p1!.positions.length).toBe(2);
      }
    });
    
    it('should create projection maps π^(i)', () => {
      const polynomial: Polynomial<string, number> = {
        positions: 'test',
        directions: () => 5
      };
      
      const construction = createCofreeComonadConstruction(polynomial);
      
      expect(construction.projectionMaps.size).toBeGreaterThan(0);
      
      // Test that projection maps are functions
      const projection0 = construction.projectionMaps.get(0);
      expect(typeof projection0).toBe('function');
    });
    
    it('should create cofree counit ε_p : c_p → p', () => {
      const polynomial: Polynomial<string, number> = {
        positions: 'test',
        directions: () => 42
      };
      
      const construction = createCofreeComonadConstruction(polynomial);
      const counit = cofreeCounit(construction);
      
      expect(typeof counit).toBe('function');
      
      // Test the counit function
      const result = counit(construction.limit);
      expect(result).toBe(polynomial);
    });
    
    it('should create cofree unit η_c : c → c_c', () => {
      const comonoid: ComonoidInCat<Polynomial<string, number>> = {
        carrier: { positions: 'carrier', directions: () => 1 },
        counit: (p) => 'counit_result',
        comultiplication: (p) => 'comultiplication_result'
      };
      
      const unit = cofreeUnit(comonoid);
      
      expect(typeof unit).toBe('function');
      
      // Test the unit function
      const result = unit(comonoid.carrier);
      expect(result.positions).toBe('eta_result');
      expect(typeof result.directions).toBe('function');
    });
    
    it('should create Cat# ⇄ Poly adjunction', () => {
      const adjunction = createCatPolyAdjunction();
      
      expect(adjunction.leftAdjoint).toBe('CofreeComonadFunctor');
      expect(adjunction.rightAdjoint).toBe('ForgetfulFunctor');
      expect(adjunction.unit).toBeDefined();
      expect(adjunction.counit).toBeDefined();
      expect(typeof adjunction.triangleIdentities.left).toBe('function');
      expect(typeof adjunction.triangleIdentities.right).toBe('function');
    });
    
    it('should verify Cat# ⇄ Poly triangle identities', () => {
      const adjunction = createCatPolyAdjunction();
      
      const leftTriangle = adjunction.triangleIdentities.left();
      const rightTriangle = adjunction.triangleIdentities.right();
      
      expect(leftTriangle).toBe(true);
      expect(rightTriangle).toBe(true);
    });
    
  });
  
  describe('Proposition 3.3: Module Structure (Page 27)', () => {
    
    it('should create module structure m_p ⊗ c_q → m_{p⊗q}', () => {
      const p: Polynomial<string, number> = {
        positions: 'p_pos',
        directions: () => 1
      };
      
      const q: Polynomial<string, number> = {
        positions: 'q_pos',
        directions: () => 2
      };
      
      const moduleStructure = createModuleStructure(p, q);
      
      expect(moduleStructure.freeMonad).toBeDefined();
      expect(moduleStructure.cofreeComonad).toBeDefined();
      expect(typeof moduleStructure.moduleAction).toBe('function');
      expect(moduleStructure.naturality).toBe(true);
    });
    
    it('should have module action function', () => {
      const p: Polynomial<string, number> = {
        positions: 'p_pos',
        directions: () => 1
      };
      
      const q: Polynomial<string, number> = {
        positions: 'q_pos',
        directions: () => 2
      };
      
      const moduleStructure = createModuleStructure(p, q);
      const moduleAction = moduleStructure.moduleAction;
      
      // Test with pure monad
      const pureMonad = { type: 'Pure' as const, value: 'test' };
      const pureResult = moduleAction(pureMonad, q);
      expect(pureResult.type).toBe('Pure');
      if (pureResult.type === 'Pure') {
        expect(pureResult.value).toBe('test');
      }
      
      // Test with suspend monad
      const suspendMonad = { 
        type: 'Suspend' as const, 
        position: 'suspend_pos',
        continuation: () => pureMonad
      };
      const suspendResult = moduleAction(suspendMonad, q);
      expect(suspendResult.type).toBe('Suspend');
    });
    
    it('should verify module structure naturality', () => {
      const p: Polynomial<string, number> = {
        positions: 'p_pos',
        directions: () => 1
      };
      
      const q: Polynomial<string, number> = {
        positions: 'q_pos',
        directions: () => 2
      };
      
      const moduleStructure = createModuleStructure(p, q);
      
      expect(moduleStructure.naturality).toBe(true);
    });
    
  });
  
  describe('Page 28: Lax Monoidal Functor Compatibility', () => {
    
    it('should verify lax monoidal compatibility diagram', () => {
      const p: Polynomial<string, number> = {
        positions: 'p_pos',
        directions: () => 1
      };
      
      const q: Polynomial<string, number> = {
        positions: 'q_pos',
        directions: () => 2
      };
      
      const r: Polynomial<string, number> = {
        positions: 'r_pos',
        directions: () => 3
      };
      
      const compatibility = verifyLaxMonoidalCompatibility(p, q, r);
      
      expect(compatibility.diagram).toBeDefined();
      expect(compatibility.leftSquareCommutes).toBe(true);
      expect(compatibility.rightSquareCommutes).toBe(true);
      expect(compatibility.overallCommutativity).toBe(true);
    });
    
    it('should have correct diagram structure', () => {
      const p: Polynomial<string, number> = {
        positions: 'p_pos',
        directions: () => 1
      };
      
      const q: Polynomial<string, number> = {
        positions: 'q_pos',
        directions: () => 2
      };
      
      const r: Polynomial<string, number> = {
        positions: 'r_pos',
        directions: () => 3
      };
      
      const compatibility = verifyLaxMonoidalCompatibility(p, q, r);
      
      expect(compatibility.diagram.topLeft).toBe('c_p ⊗ c_q ⊗ r');
      expect(compatibility.diagram.topMiddle).toBe('c_p ⊗ q ⊗ r');
      expect(compatibility.diagram.topRight).toBe('c_p ⊗ m_{q⊗r}');
      expect(compatibility.diagram.bottomLeft).toBe('c_{p⊗q} ⊗ r');
      expect(compatibility.diagram.bottomMiddle).toBe('p ⊗ q ⊗ r');
      expect(compatibility.diagram.bottomRight).toBe('m_{p⊗q⊗r}');
    });
    
    it('should verify left square commutativity', () => {
      const p: Polynomial<string, number> = {
        positions: 'p_pos',
        directions: () => 1
      };
      
      const q: Polynomial<string, number> = {
        positions: 'q_pos',
        directions: () => 2
      };
      
      const r: Polynomial<string, number> = {
        positions: 'r_pos',
        directions: () => 3
      };
      
      const compatibility = verifyLaxMonoidalCompatibility(p, q, r);
      
      // "by definition of the laxator of c_"
      expect(compatibility.leftSquareCommutes).toBe(true);
    });
    
    it('should verify right square commutativity', () => {
      const p: Polynomial<string, number> = {
        positions: 'p_pos',
        directions: () => 1
      };
      
      const q: Polynomial<string, number> = {
        positions: 'q_pos',
        directions: () => 2
      };
      
      const r: Polynomial<string, number> = {
        positions: 'r_pos',
        directions: () => 3
      };
      
      const compatibility = verifyLaxMonoidalCompatibility(p, q, r);
      
      // "by definition of Ξ_{p,q⊗r}"
      expect(compatibility.rightSquareCommutes).toBe(true);
    });
    
  });
  
  describe('Cocone Verification Framework', () => {
    
    it('should create polynomial cocone from diagram', () => {
      const diagram = new Map<string, Polynomial<string, number>>();
      diagram.set('p1', { positions: 'pos1', directions: () => 1 });
      diagram.set('p2', { positions: 'pos2', directions: () => 2 });
      diagram.set('p3', { positions: 'pos3', directions: () => 3 });
      
      const vertex: Polynomial<string, number> = {
        positions: 'colimit_vertex',
        directions: () => 0
      };
      
      const cocone = createPolynomialCocone(diagram, vertex);
      
      expect(cocone.vertex).toBe(vertex);
      expect(cocone.diagram).toBe(diagram);
      expect(typeof cocone.coneMap).toBe('function');
      expect(typeof cocone.commutingCondition).toBe('function');
    });
    
    it('should verify cocone property with morphisms', () => {
      const diagram = new Map<string, Polynomial<string, number>>();
      diagram.set('p1', { positions: 'pos1', directions: () => 1 });
      diagram.set('p2', { positions: 'pos2', directions: () => 2 });
      
      const vertex: Polynomial<string, number> = {
        positions: 'vertex',
        directions: () => 42
      };
      
      const cocone = createPolynomialCocone(diagram, vertex);
      const morphisms = new Map<string, (d: any) => any>();
      morphisms.set('p1_to_p2', (d) => d);
      
      const isValid = verifyCoconeProperty(cocone, morphisms);
      
      expect(typeof isValid).toBe('boolean');
      expect(isValid).toBe(true); // Should pass with simplified implementation
    });
    
    it('should verify universal property for colimits', () => {
      const diagram = new Map<string, Polynomial<string, number>>();
      diagram.set('obj1', { positions: 'pos1', directions: () => 1 });
      
      const colimitVertex: Polynomial<string, number> = {
        positions: 'colimit',
        directions: () => 0
      };
      
      const otherVertex: Polynomial<string, number> = {
        positions: 'other',
        directions: () => 99
      };
      
      const colimitCocone = createPolynomialCocone(diagram, colimitVertex);
      const otherCocone = createPolynomialCocone(diagram, otherVertex);
      
      const universalProperty = verifyUniversalProperty(colimitCocone, otherCocone);
      
      expect(universalProperty.hasUniqueMap).toBe(true);
      expect(typeof universalProperty.uniqueMap).toBe('function');
    });
    
  });
  
  describe('Commutative Diagram Verification', () => {
    
    it('should verify diagram commutation', () => {
      const vertices = new Set(['A', 'B', 'C']);
      const edges = new Map();
      edges.set('f', { source: 'A', target: 'B', morphism: (v: string) => 'B' });
      edges.set('g', { source: 'B', target: 'C', morphism: (v: string) => 'C' });
      edges.set('h', { source: 'A', target: 'C', morphism: (v: string) => 'C' });
      
      const diagram: CommutativeDiagram<string, any> = {
        vertices,
        edges,
        paths: new Map([
          ['path1', ['f', 'g']], // A → B → C
          ['path2', ['h']]       // A → C
        ])
      };
      
      const commutes = verifyDiagramCommutes(diagram, 'A', ['f', 'g'], ['h']);
      
      expect(typeof commutes).toBe('boolean');
      expect(commutes).toBe(true); // Both paths lead to 'C'
    });
    
    it('should detect non-commuting diagrams', () => {
      const vertices = new Set(['A', 'B', 'C']);
      const edges = new Map();
      edges.set('f', { source: 'A', target: 'B', morphism: (v: string) => 'B' });
      edges.set('g', { source: 'B', target: 'C', morphism: (v: string) => 'C' });
      edges.set('h', { source: 'A', target: 'C', morphism: (v: string) => 'DIFFERENT' });
      
      const diagram: CommutativeDiagram<string, any> = {
        vertices,
        edges,
        paths: new Map()
      };
      
      const commutes = verifyDiagramCommutes(diagram, 'A', ['f', 'g'], ['h']);
      
      expect(commutes).toBe(false); // 'C' ≠ 'DIFFERENT'
    });
    
  });
  
  describe('Monad Law Verification', () => {
    
    it('should verify monad laws for polynomial monad', () => {
      const polynomial: Polynomial<string, string> = {
        positions: 'test_pos',
        directions: () => 'test_dir'
      };
      
      const monad = freeMonadFunctor(polynomial);
      const laws = verifyMonadLaws(monad);
      
      expect(typeof laws.associativity).toBe('boolean');
      expect(typeof laws.leftUnit).toBe('boolean');
      expect(typeof laws.rightUnit).toBe('boolean');
      
      // Should satisfy monad laws
      expect(laws.associativity).toBe(true);
      expect(laws.leftUnit).toBe(true);
      expect(laws.rightUnit).toBe(true);
    });
    
    it('should handle monad operations correctly', () => {
      const polynomial: Polynomial<number, string> = {
        positions: 42,
        directions: (pos) => `direction_${pos}`
      };
      
      const monad = freeMonadFunctor(polynomial);
      
      // Test unit
      const unitResult = monad.unit('test_value');
      expect(unitResult.type).toBe('Pure');
      if (unitResult.type === 'Pure') {
        expect(unitResult.value).toBe('test_value');
      }
      
      // Test bind (Kleisli composition)
      const boundResult = monad.bind(unitResult, (x) => monad.unit(`bound_${x}`));
      expect(boundResult.type).toBe('Pure');
      if (boundResult.type === 'Pure') {
        expect(boundResult.value).toBe('bound_test_value');
      }
    });
    
  });
  
  describe('Natural Transformation Composition', () => {
    
    it('should compose natural transformations correctly', () => {
      const eta: NaturalTransformation<string, number> = {
        source: 'String',
        target: 'Number',
        component: (s: string) => s.length,
        naturality: () => true
      };
      
      const mu: NaturalTransformation<number, boolean> = {
        source: 'Number',
        target: 'Boolean',
        component: (n: number) => n > 0,
        naturality: () => true
      };
      
      const composed = composeNaturalTransformations(eta, mu);
      
      expect(composed.source).toBe('String');
      expect(composed.target).toBe('Boolean');
      expect(composed.component('hello')).toBe(true); // 'hello'.length = 5 > 0
      expect(composed.component('')).toBe(false);     // ''.length = 0 ≯ 0
      expect(composed.naturality(() => {}, 'test')).toBe(true);
    });
    
  });
  
  describe('Integration Examples', () => {
    
    it('should run polynomial monad example', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      examplePolynomialMonad();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          monadKind: 'PolynomialMonad',
          lawsVerified: expect.objectContaining({
            associativity: expect.any(Boolean),
            leftUnit: expect.any(Boolean),
            rightUnit: expect.any(Boolean)
          }),
          hasUnit: true,
          hasMultiplication: true
        })
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should run adjunction verification example', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      exampleAdjunctionVerification();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          leftTriangle: true,
          rightTriangle: true,
          adjunctionCreated: true,
          leftAdjoint: 'FreeMonadFunctor',
          rightAdjoint: 'ForgetfulFunctor'
        })
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should run cocone verification example', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      exampleCoconeVerification();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          coconeCreated: true,
          diagramSize: 2,
          isValidCocone: expect.any(Boolean),
          vertexPositions: 'colimit'
        })
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should run Cat# ⇄ Poly adjunction example', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      exampleCatPolyAdjunction();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          constructionCreated: true,
          inductiveSequenceSize: expect.any(Number),
          projectionMapsSize: expect.any(Number),
          adjunctionCreated: true,
          leftAdjoint: 'CofreeComonadFunctor',
          rightAdjoint: 'ForgetfulFunctor'
        })
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should run module structure example', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      exampleModuleStructure();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          moduleStructureCreated: true,
          hasModuleAction: true,
          naturality: true,
          freeMonadType: 'Pure',
          cofreeComonadBase: 'q_pos'
        })
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should run lax monoidal compatibility example', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      exampleLaxMonoidalCompatibility();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          compatibilityVerified: true,
          leftSquareCommutes: true,
          rightSquareCommutes: true,
          overallCommutativity: true,
          diagram: expect.objectContaining({
            topLeft: 'c_p ⊗ c_q ⊗ r',
            topMiddle: 'c_p ⊗ q ⊗ r',
            topRight: 'c_p ⊗ m_{q⊗r}',
            bottomLeft: 'c_{p⊗q} ⊗ r',
            bottomMiddle: 'p ⊗ q ⊗ r',
            bottomRight: 'm_{p⊗q⊗r}'
          })
        })
      );
      
      consoleSpy.mockRestore();
    });
    
  });
  
  describe('Edge Cases and Advanced Properties', () => {
    
    it('should handle empty diagrams in cocones', () => {
      const emptyDiagram = new Map<string, Polynomial<string, number>>();
      const vertex: Polynomial<string, number> = {
        positions: 'empty_vertex',
        directions: () => 0
      };
      
      const cocone = createPolynomialCocone(emptyDiagram, vertex);
      const morphisms = new Map();
      const isValid = verifyCoconeProperty(cocone, morphisms);
      
      expect(cocone.diagram.size).toBe(0);
      expect(isValid).toBe(true); // Vacuously true for empty diagrams
    });
    
    it('should handle complex polynomial positions', () => {
      const complexPolynomial: Polynomial<{x: number, y: string}, boolean[]> = {
        positions: { x: 42, y: 'complex' },
        directions: (pos) => [true, false, pos.x > 0]
      };
      
      const monad = freeMonadFunctor(complexPolynomial);
      
      expect(monad.underlying).toBe(complexPolynomial);
      expect(monad.underlying.positions).toEqual({ x: 42, y: 'complex' });
    });
    
    it('should verify adjunction coherence conditions', () => {
      const adjunction = createPolyModAdjunction();
      
      // Triangle identities are fundamental coherence conditions
      const leftCoherent = adjunction.triangleIdentities.left();
      const rightCoherent = adjunction.triangleIdentities.right();
      
      expect(leftCoherent).toBe(true);
      expect(rightCoherent).toBe(true);
      
      // Both should hold for a proper adjunction
      expect(leftCoherent && rightCoherent).toBe(true);
    });
    
    it('should verify Cat# ⇄ Poly coherence conditions', () => {
      const adjunction = createCatPolyAdjunction();
      
      // Triangle identities for Cat# ⇄ Poly adjunction
      const leftCoherent = adjunction.triangleIdentities.left();
      const rightCoherent = adjunction.triangleIdentities.right();
      
      expect(leftCoherent).toBe(true);
      expect(rightCoherent).toBe(true);
      
      // Both should hold for a proper adjunction
      expect(leftCoherent && rightCoherent).toBe(true);
    });
    
  });
  
});
