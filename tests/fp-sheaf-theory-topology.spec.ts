/**
 * Tests for Sheaf Theory & Topology
 * 
 * Based on "Polynomial functors and polynomial monads" by Nicola Gambino and Joachim Kock
 * Page 16 - Sections 2.8-2.10: Pasting Diagrams, Vertical/Cartesian Transformations, and Topological Connections
 * 
 * This tests the revolutionary connections between:
 * - Pasting diagrams for strong natural transformations
 * - Vertical and cartesian strong natural transformations
 * - Sheaf theory via polynomial functors
 * - Topological spaces and sheaves
 * - Grothendieck fibrations in topology
 * - Yoneda Lemma applications to topology
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  // Pasting Diagrams
  PastingDiagram,
  createPastingDiagram,
  
  // Propositions 2.8-2.9
  Proposition28,
  createProposition28,
  Proposition29,
  createProposition29,
  
  // Section 2.10
  Section210,
  createSection210,
  
  // Sheaf Theory
  TopologicalSpace,
  createTopologicalSpace,
  Sheaf,
  createSheaf,
  SheafMorphism,
  createSheafMorphism,
  
  // Topological Invariants
  TopologicalInvariant,
  createTopologicalInvariant,
  
  // Verification
  verifyPastingDiagram,
  verifySheaf,
  
  // Example functions
  examplePastingDiagram,
  exampleProposition28,
  exampleProposition29,
  exampleSection210,
  exampleSheafTheory,
  exampleTopologicalInvariant
} from '../fp-sheaf-theory-topology';

describe('Sheaf Theory & Topology', () => {
  describe('Pasting Diagrams (Section 2.8-2.9)', () => {
    it('should create pasting diagram', () => {
      const diagram = createPastingDiagram();
      
      expect(diagram.kind).toBe('PastingDiagram');
      expect(diagram.name).toBe('Pasting Diagram for Strong Natural Transformations');
    });
    
    it('should have transformation properties', () => {
      const diagram = createPastingDiagram();
      
      expect(diagram.transformation.domain).toBe('P_F\'');
      expect(diagram.transformation.codomain).toBe('P_F');
      expect(diagram.transformation.notation).toBe('φ: P_F\' ⇒ P_F');
    });
    
    it('should have categories', () => {
      const diagram = createPastingDiagram();
      
      expect(diagram.categories.EBPrime).toBe('E/B\'');
      expect(diagram.categories.EI).toBe('E/I');
      expect(diagram.categories.EB).toBe('E/B');
      expect(diagram.categories.EA).toBe('E/A');
      expect(diagram.categories.EJ).toBe('E/J');
    });
    
    it('should have functors', () => {
      const diagram = createPastingDiagram();
      
      expect(diagram.functors.deltaSPrime).toBe('Δs\'');
      expect(diagram.functors.deltaW).toBe('Δw');
      expect(diagram.functors.piW).toBe('Πw');
      expect(diagram.functors.piFPrime).toBe('Πf\'');
      expect(diagram.functors.deltaS).toBe('Δs');
      expect(diagram.functors.piF).toBe('Πf');
      expect(diagram.functors.sigmaT).toBe('Σt');
    });
    
    it('should have natural transformations', () => {
      const diagram = createPastingDiagram();
      
      expect(diagram.naturalTransformations.isomorphisms).toHaveLength(2);
      expect(diagram.naturalTransformations.isomorphisms[0]).toBe('≈ (E/I ↔ E/B\')');
      expect(diagram.naturalTransformations.isomorphisms[1]).toBe('≈ (E/B ↔ E/A)');
      expect(diagram.naturalTransformations.eta).toBe('↓η');
    });
    
    it('should have internal language', () => {
      const diagram = createPastingDiagram();
      
      expect(diagram.internalLanguage.componentDefinition).toContain('φX : (Σ_{a∈A_J}');
      expect(diagram.internalLanguage.actionFormula).toBe('φX(a, x) = (a, x · w_a)');
      expect(diagram.internalLanguage.grothendieckContext).toContain('φ1 = Id_A');
    });
  });
  
  describe('Proposition 2.8: Vertical Strong Natural Transformations', () => {
    it('should create Proposition 2.8', () => {
      const proposition = createProposition28();
      
      expect(proposition.kind).toBe('Proposition28');
      expect(proposition.statement).toContain('vertical strong natural transformation');
    });
    
    it('should have proof structure', () => {
      const proposition = createProposition28();
      
      expect(proposition.proof.diagramReference).toBe('Diagram (13) provides the outline');
      expect(proposition.proof.construction).toBe('Construct the map w: B → B\'');
      expect(proposition.proof.mapConstruction).toContain('w must be an A-map');
      expect(proposition.proof.reduction).toBe('Reduces to the case where A = 1 (single position)');
      expect(proposition.proof.yonedaLemma).toBe(true);
    });
    
    it('should have correct properties', () => {
      const proposition = createProposition28();
      
      expect(proposition.properties.isVertical).toBe(true);
      expect(proposition.properties.isStrong).toBe(true);
      expect(proposition.properties.uniqueRepresentation).toBe(true);
      expect(proposition.properties.diagramForm).toBe('Diagram (13)');
    });
  });
  
  describe('Proposition 2.9: Cartesian Strong Natural Transformations', () => {
    it('should create Proposition 2.9', () => {
      const proposition = createProposition29();
      
      expect(proposition.kind).toBe('Proposition29');
      expect(proposition.statement).toContain('cartesian strong natural transformation');
    });
    
    it('should have proof structure', () => {
      const proposition = createProposition29();
      
      expect(proposition.proof.isomorphismSetup).toBe('A\' ≈ P_F\'(1) and A ≈ P_F(1)');
      expect(proposition.proof.alphaDefinition).toContain('Define α: A\' → A');
      expect(proposition.proof.betaConstruction).toContain('Construct β: B\' → B');
      expect(proposition.proof.reduction).toBe('Reduces to case where A\' = A = 1');
      expect(proposition.proof.invertibility).toContain('φ is invertible');
      expect(proposition.proof.yonedaLemma).toBe(true);
    });
    
    it('should have correct properties', () => {
      const proposition = createProposition29();
      
      expect(proposition.properties.isCartesian).toBe(true);
      expect(proposition.properties.isStrong).toBe(true);
      expect(proposition.properties.uniqueRepresentation).toBe(true);
      expect(proposition.properties.diagramForm).toBe('Diagram (12)');
    });
  });
  
  describe('Section 2.10: Non-Representable Example', () => {
    it('should create Section 2.10', () => {
      const section = createSection210();
      
      expect(section.kind).toBe('Section210');
      expect(section.name).toBe('Non-Representable Natural Transformation Example');
    });
    
    it('should have context', () => {
      const section = createSection210();
      
      expect(section.context.category).toBe('Set^Z2');
      expect(section.context.description).toContain('involutive sets');
      expect(section.context.involution).toBe('σ: X → X with σ² = Id');
    });
    
    it('should have twist transformation', () => {
      const section = createSection210();
      
      expect(section.twistTransformation.notation).toBe('τ: Id ⇒ Id');
      expect(section.twistTransformation.component).toContain('τ_X = σ_X');
      expect(section.twistTransformation.properties.isCartesian).toBe(true);
      expect(section.twistTransformation.properties.isVertical).toBe(true);
      expect(section.twistTransformation.properties.isStrong).toBe(false);
    });
    
    it('should have problem description', () => {
      const section = createSection210();
      
      expect(section.problem.description).toContain('cannot be represented by any diagram');
      expect(section.problem.reason).toContain('Any connecting arrows would have to be identities');
      expect(section.problem.conclusion).toContain('not strong, showing limitations');
    });
  });
  
  describe('Topological Spaces', () => {
    it('should create topological space', () => {
      const points = [0, 1, 2];
      const openSets = [[0, 1], [1, 2], [0, 2]];
      const space = createTopologicalSpace('Real Line', points, openSets);
      
      expect(space.kind).toBe('TopologicalSpace');
      expect(space.name).toBe('Real Line');
      expect(space.points).toEqual(points);
      expect(space.openSets).toEqual(openSets);
    });
    
    it('should have sheaf structure', () => {
      const space = createTopologicalSpace('Test', [], []);
      
      expect(space.sheafStructure.hasSheaf).toBe(true);
      expect(space.sheafStructure.presheafCategory).toBe('PSh(X)');
      expect(space.sheafStructure.grothendieckFibration).toBe(true);
    });
  });
  
  describe('Sheaves', () => {
    it('should create sheaf', () => {
      const space = createTopologicalSpace('Test', [0, 1], [[0, 1]]);
      const sheaf = createSheaf('Continuous Functions', space);
      
      expect(sheaf.kind).toBe('Sheaf');
      expect(sheaf.name).toBe('Continuous Functions');
      expect(sheaf.topologicalSpace).toBe(space);
    });
    
    it('should have polynomial representation', () => {
      const space = createTopologicalSpace('Test', [], []);
      const sheaf = createSheaf('Test', space);
      
      expect(sheaf.polynomialRepresentation.hasRepresentation).toBe(true);
      expect(sheaf.polynomialRepresentation.functor).toBe('P_F: PSh(X) → Set');
      expect(sheaf.polynomialRepresentation.naturalTransformations).toEqual(['Vertical', 'Cartesian', 'Strong']);
    });
    
    it('should have fibration properties', () => {
      const space = createTopologicalSpace('Test', [], []);
      const sheaf = createSheaf('Test', space);
      
      expect(sheaf.fibrationProperties.isGrothendieckFibration).toBe(true);
      expect(sheaf.fibrationProperties.hasCartesianArrows).toBe(true);
      expect(sheaf.fibrationProperties.hasVerticalArrows).toBe(true);
    });
    
    it('should have Yoneda connection', () => {
      const space = createTopologicalSpace('Test', [], []);
      const sheaf = createSheaf('Test', space);
      
      expect(sheaf.yonedaConnection.usesYonedaLemma).toBe(true);
      expect(sheaf.yonedaConnection.representable).toBe(true);
      expect(sheaf.yonedaConnection.internalLanguage).toContain('Sheaf sections');
    });
  });
  
  describe('Sheaf Morphisms', () => {
    it('should create sheaf morphism', () => {
      const space1 = createTopologicalSpace('X', [0, 1], [[0, 1]]);
      const space2 = createTopologicalSpace('Y', [0, 1], [[0, 1]]);
      const sheaf1 = createSheaf('F', space1);
      const sheaf2 = createSheaf('G', space2);
      const morphism = createSheafMorphism('φ', sheaf1, sheaf2);
      
      expect(morphism.kind).toBe('SheafMorphism');
      expect(morphism.name).toBe('φ');
      expect(morphism.domain).toBe(sheaf1);
      expect(morphism.codomain).toBe(sheaf2);
    });
    
    it('should have natural transformation properties', () => {
      const space1 = createTopologicalSpace('X', [], []);
      const space2 = createTopologicalSpace('Y', [], []);
      const sheaf1 = createSheaf('F', space1);
      const sheaf2 = createSheaf('G', space2);
      const morphism = createSheafMorphism('φ', sheaf1, sheaf2);
      
      expect(morphism.naturalTransformation.isVertical).toBe(true);
      expect(morphism.naturalTransformation.isCartesian).toBe(true);
      expect(morphism.naturalTransformation.isStrong).toBe(true);
      expect(morphism.naturalTransformation.representation).toBe('Uniquely represented by pasting diagram');
    });
    
    it('should have pasting diagram', () => {
      const space1 = createTopologicalSpace('X', [], []);
      const space2 = createTopologicalSpace('Y', [], []);
      const sheaf1 = createSheaf('F', space1);
      const sheaf2 = createSheaf('G', space2);
      const morphism = createSheafMorphism('φ', sheaf1, sheaf2);
      
      expect(morphism.pastingDiagram.hasDiagram).toBe(true);
      expect(morphism.pastingDiagram.diagramType).toBe('Multi-layered commutative diagram');
      expect(morphism.pastingDiagram.internalLanguage).toBe('φX(a, x) = (a, x · w_a)');
    });
  });
  
  describe('Topological Invariants', () => {
    it('should create topological invariant', () => {
      const invariant = createTopologicalInvariant('Euler Characteristic');
      
      expect(invariant.kind).toBe('TopologicalInvariant');
      expect(invariant.name).toBe('Euler Characteristic');
    });
    
    it('should have polynomial interpretation', () => {
      const invariant = createTopologicalInvariant('Test');
      
      expect(invariant.polynomialInterpretation.functor).toBe('P_F: Top → Set');
      expect(invariant.polynomialInterpretation.naturalTransformations).toEqual(['Vertical', 'Cartesian', 'Strong']);
      expect(invariant.polynomialInterpretation.pastingDiagrams).toBe(true);
    });
    
    it('should have sheaf properties', () => {
      const invariant = createTopologicalInvariant('Test');
      
      expect(invariant.sheafProperties.usesSheaves).toBe(true);
      expect(invariant.sheafProperties.grothendieckFibration).toBe(true);
      expect(invariant.sheafProperties.yonedaLemma).toBe(true);
    });
    
    it('should have computational aspects', () => {
      const invariant = createTopologicalInvariant('Test');
      
      expect(invariant.computational.computable).toBe(true);
      expect(invariant.computational.algorithm).toBe('Via polynomial functor calculus');
      expect(invariant.computational.complexity).toBe('Polynomial in space complexity');
    });
  });
  
  describe('Verification', () => {
    it('should verify pasting diagram', () => {
      const diagram = createPastingDiagram();
      const verification = verifyPastingDiagram(diagram);
      
      expect(verification.isValid).toBe(true);
      expect(verification.hasTransformation).toBe(true);
      expect(verification.hasCategories).toBe(true);
      expect(verification.hasFunctors).toBe(true);
      expect(verification.hasInternalLanguage).toBe(true);
      expect(verification.examples).toHaveLength(1);
    });
    
    it('should verify sheaf', () => {
      const space = createTopologicalSpace('Test', [], []);
      const sheaf = createSheaf('Test', space);
      const verification = verifySheaf(sheaf);
      
      expect(verification.isValid).toBe(true);
      expect(verification.hasPolynomialRepresentation).toBe(true);
      expect(verification.hasFibrationProperties).toBe(true);
      expect(verification.hasYonedaConnection).toBe(true);
      expect(verification.examples).toHaveLength(1);
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
    
    it('should run pasting diagram example', () => {
      examplePastingDiagram();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          pastingDiagram: true,
          isValid: true,
          transformation: expect.any(String),
          categories: expect.any(Array),
          functors: expect.any(Array),
          internalLanguage: expect.any(String),
          examples: expect.any(Array)
        })
      );
    });
    
    it('should run Proposition 2.8 example', () => {
      exampleProposition28();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          proposition28: true,
          statement: expect.any(String),
          isVertical: true,
          isStrong: true,
          uniqueRepresentation: true,
          yonedaLemma: true
        })
      );
    });
    
    it('should run Proposition 2.9 example', () => {
      exampleProposition29();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          proposition29: true,
          statement: expect.any(String),
          isCartesian: true,
          isStrong: true,
          uniqueRepresentation: true,
          yonedaLemma: true
        })
      );
    });
    
    it('should run Section 2.10 example', () => {
      exampleSection210();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          section210: true,
          category: 'Set^Z2',
          twistTransformation: 'τ: Id ⇒ Id',
          isCartesian: true,
          isVertical: true,
          isStrong: false,
          problem: expect.any(String),
          conclusion: expect.any(String)
        })
      );
    });
    
    it('should run sheaf theory example', () => {
      exampleSheafTheory();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          sheafTheory: true,
          topologicalSpace: 'Real Line',
          sheaf: 'Continuous Functions',
          isValid: true,
          hasPolynomialRepresentation: true,
          hasFibrationProperties: true,
          hasYonedaConnection: true,
          polynomialFunctor: expect.any(String),
          internalLanguage: expect.any(String),
          examples: expect.any(Array)
        })
      );
    });
    
    it('should run topological invariant example', () => {
      exampleTopologicalInvariant();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          topologicalInvariant: true,
          name: 'Euler Characteristic',
          polynomialFunctor: expect.any(String),
          usesSheaves: true,
          grothendieckFibration: true,
          yonedaLemma: true,
          computable: true,
          algorithm: expect.any(String)
        })
      );
    });
  });
  
  describe('Mathematical Properties', () => {
    it('should verify pasting diagram mathematical properties', () => {
      const diagram = createPastingDiagram();
      
      // Pasting diagram should have complex structure
      expect(diagram.categories).toHaveProperty('EBPrime');
      expect(diagram.categories).toHaveProperty('EI');
      expect(diagram.categories).toHaveProperty('EB');
      expect(diagram.categories).toHaveProperty('EA');
      expect(diagram.categories).toHaveProperty('EJ');
      
      // Should have functors connecting categories
      expect(diagram.functors).toHaveProperty('deltaSPrime');
      expect(diagram.functors).toHaveProperty('deltaW');
      expect(diagram.functors).toHaveProperty('piW');
      expect(diagram.functors).toHaveProperty('piFPrime');
      expect(diagram.functors).toHaveProperty('deltaS');
      expect(diagram.functors).toHaveProperty('piF');
      expect(diagram.functors).toHaveProperty('sigmaT');
      
      // Should have natural transformations
      expect(diagram.naturalTransformations.isomorphisms).toHaveLength(2);
      expect(diagram.naturalTransformations.eta).toBe('↓η');
      
      // Should have internal language
      expect(diagram.internalLanguage.componentDefinition).toContain('φX');
      expect(diagram.internalLanguage.actionFormula).toContain('φX(a, x)');
      expect(diagram.internalLanguage.grothendieckContext).toContain('φ1 = Id_A');
    });
    
    it('should verify sheaf mathematical properties', () => {
      const space = createTopologicalSpace('Test', [0, 1], [[0, 1]]);
      const sheaf = createSheaf('Test', space);
      
      // Sheaf should have polynomial representation
      expect(sheaf.polynomialRepresentation.hasRepresentation).toBe(true);
      expect(sheaf.polynomialRepresentation.functor).toContain('P_F: PSh(X) → Set');
      expect(sheaf.polynomialRepresentation.naturalTransformations).toContain('Vertical');
      expect(sheaf.polynomialRepresentation.naturalTransformations).toContain('Cartesian');
      expect(sheaf.polynomialRepresentation.naturalTransformations).toContain('Strong');
      
      // Should have fibration properties
      expect(sheaf.fibrationProperties.isGrothendieckFibration).toBe(true);
      expect(sheaf.fibrationProperties.hasCartesianArrows).toBe(true);
      expect(sheaf.fibrationProperties.hasVerticalArrows).toBe(true);
      
      // Should have Yoneda connection
      expect(sheaf.yonedaConnection.usesYonedaLemma).toBe(true);
      expect(sheaf.yonedaConnection.representable).toBe(true);
      expect(sheaf.yonedaConnection.internalLanguage).toContain('Sheaf sections');
    });
    
    it('should verify topological invariant mathematical properties', () => {
      const invariant = createTopologicalInvariant('Test');
      
      // Should have polynomial interpretation
      expect(invariant.polynomialInterpretation.functor).toBe('P_F: Top → Set');
      expect(invariant.polynomialInterpretation.naturalTransformations).toContain('Vertical');
      expect(invariant.polynomialInterpretation.naturalTransformations).toContain('Cartesian');
      expect(invariant.polynomialInterpretation.naturalTransformations).toContain('Strong');
      expect(invariant.polynomialInterpretation.pastingDiagrams).toBe(true);
      
      // Should have sheaf properties
      expect(invariant.sheafProperties.usesSheaves).toBe(true);
      expect(invariant.sheafProperties.grothendieckFibration).toBe(true);
      expect(invariant.sheafProperties.yonedaLemma).toBe(true);
      
      // Should be computable
      expect(invariant.computational.computable).toBe(true);
      expect(invariant.computational.algorithm).toContain('polynomial functor calculus');
      expect(invariant.computational.complexity).toContain('Polynomial');
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
    it('should handle empty topological space', () => {
      const space = createTopologicalSpace('Empty', [], []);
      const sheaf = createSheaf('Empty Sheaf', space);
      
      expect(space.points).toHaveLength(0);
      expect(space.openSets).toHaveLength(0);
      expect(sheaf.kind).toBe('Sheaf');
      expect(sheaf.polynomialRepresentation.hasRepresentation).toBe(true);
    });
    
    it('should handle single point topological space', () => {
      const space = createTopologicalSpace('Single Point', [0], [[0]]);
      const sheaf = createSheaf('Single Point Sheaf', space);
      
      expect(space.points).toEqual([0]);
      expect(space.openSets).toEqual([[0]]);
      expect(sheaf.kind).toBe('Sheaf');
      expect(sheaf.fibrationProperties.isGrothendieckFibration).toBe(true);
    });
    
    it('should handle large topological space', () => {
      const points = Array.from({length: 100}, (_, i) => i);
      const openSets = [[0, 50], [25, 75], [50, 100]];
      const space = createTopologicalSpace('Large Space', points, openSets);
      const sheaf = createSheaf('Large Sheaf', space);
      
      expect(space.points).toHaveLength(100);
      expect(space.openSets).toHaveLength(3);
      expect(sheaf.kind).toBe('Sheaf');
      expect(sheaf.yonedaConnection.usesYonedaLemma).toBe(true);
    });
  });
});
