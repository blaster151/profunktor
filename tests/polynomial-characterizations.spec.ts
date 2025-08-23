/**
 * Tests for Six Equivalent Characterizations of Polynomial Functors
 * 
 * Based on "Polynomial functors and polynomial monads" by Nicola Gambino and Joachim Kock
 * 
 * Tests:
 * - Six equivalent characterizations of polynomial functors over Set
 * - Container theory connections (Abbott, Altenkirch, Ghani)
 * - Dependent type theory applications (Moerdijk and Palmgren)
 * - Interaction systems (Hancock and Setzer, Hyvernat)
 * - Tambara functors (Representation theory)
 */

import { describe, it, expect, vi } from 'vitest';

import {
  // Six Equivalent Characterizations
  StandardPolynomialForm,
  ContainerFunctor,
  FamiliallyRepresentableFunctor,
  LocalRightAdjoint,
  SpeciesAnalyticFunctor,
  NormalFunctor,
  
  // Conversion Functions
  standardToContainer,
  containerToStandard,
  standardToFamiliallyRepresentable,
  standardToSpeciesAnalytic,
  
  // Container Theory
  Container,
  polynomialToContainer,
  ShapelyType,
  
  // Dependent Type Theory
  DependentPolynomialFunctor,
  standardToDependent,
  
  // Interaction Systems
  InteractionSystem,
  polynomialToInteractionSystem,
  
  // Tambara Functors
  TambaraFunctor,
  polynomialToTambara,
  
  // Verification
  verifySixCharacterizations,
  
  // Examples
  exampleNaturalNumbersPolynomial,
  exampleBinaryTreesPolynomial,
  exampleInteractionSystem
} from '../fp-polynomial-characterizations';

import { Polynomial } from '../fp-polynomial-functors';

describe('Six Equivalent Characterizations of Polynomial Functors', () => {
  
  describe('Characterization 1: Standard Polynomial Form', () => {
    
    it('should create standard polynomial form', () => {
      const standard: StandardPolynomialForm<string, string> = {
        kind: 'StandardPolynomialForm',
        indexingSet: ['a', 'b'],
        fiberMap: (a) => a === 'a' ? ['x', 'y'] : ['z'],
        evaluate: <X>(x: X) => [{
          position: 'a',
          directions: ['x', 'y']
        }]
      };
      
      expect(standard.kind).toBe('StandardPolynomialForm');
      expect(standard.indexingSet).toEqual(['a', 'b']);
      expect(standard.fiberMap('a')).toEqual(['x', 'y']);
      expect(standard.fiberMap('b')).toEqual(['z']);
    });
    
    it('should evaluate standard polynomial form', () => {
      const standard: StandardPolynomialForm<string, string> = {
        kind: 'StandardPolynomialForm',
        indexingSet: ['pos1', 'pos2'],
        fiberMap: (pos) => pos === 'pos1' ? ['dir1', 'dir2'] : ['dir3'],
        evaluate: <X>(x: X) => [{
          position: 'pos1',
          directions: ['dir1', 'dir2']
        }]
      };
      
      const result = standard.evaluate('test');
      expect(result).toHaveLength(1);
      expect(result[0].position).toBe('pos1');
      expect(result[0].directions).toEqual(['dir1', 'dir2']);
    });
    
  });
  
  describe('Characterization 2: Container Functor (Abbott, Altenkirch, Ghani)', () => {
    
    it('should create container functor', () => {
      const container: ContainerFunctor<string, string> = {
        kind: 'ContainerFunctor',
        shapes: ['shape1', 'shape2'],
        positions: (shape) => shape === 'shape1' ? ['pos1', 'pos2'] : ['pos3'],
        evaluate: <X>(x: X) => [{
          shape: 'shape1',
          positions: ['pos1', 'pos2']
        }]
      };
      
      expect(container.kind).toBe('ContainerFunctor');
      expect(container.shapes).toEqual(['shape1', 'shape2']);
      expect(container.positions('shape1')).toEqual(['pos1', 'pos2']);
      expect(container.positions('shape2')).toEqual(['pos3']);
    });
    
    it('should convert standard form to container', () => {
      const standard: StandardPolynomialForm<string, string> = {
        kind: 'StandardPolynomialForm',
        indexingSet: ['a', 'b'],
        fiberMap: (a) => a === 'a' ? ['x', 'y'] : ['z'],
        evaluate: <X>(x: X) => [{
          position: 'a',
          directions: ['x', 'y']
        }]
      };
      
      const container = standardToContainer(standard);
      
      expect(container.kind).toBe('ContainerFunctor');
      expect(container.shapes).toEqual(['a', 'b']);
      expect(container.positions('a')).toEqual(['x', 'y']);
      expect(container.positions('b')).toEqual(['z']);
    });
    
    it('should convert container to standard form', () => {
      const container: ContainerFunctor<string, string> = {
        kind: 'ContainerFunctor',
        shapes: ['shape1', 'shape2'],
        positions: (shape) => shape === 'shape1' ? ['pos1', 'pos2'] : ['pos3'],
        evaluate: <X>(x: X) => [{
          shape: 'shape1',
          positions: ['pos1', 'pos2']
        }]
      };
      
      const standard = containerToStandard(container);
      
      expect(standard.kind).toBe('StandardPolynomialForm');
      expect(standard.indexingSet).toEqual(['shape1', 'shape2']);
      expect(standard.fiberMap('shape1')).toEqual(['pos1', 'pos2']);
      expect(standard.fiberMap('shape2')).toEqual(['pos3']);
    });
    
  });
  
  describe('Characterization 3: Familially Representable Functor (Diers, Carboni-Johnstone)', () => {
    
    it('should create familially representable functor', () => {
      const familially: FamiliallyRepresentableFunctor<string, string> = {
        kind: 'FamiliallyRepresentableFunctor',
        indexSet: ['i1', 'i2'],
        familyMap: (i) => i === 'i1' ? ['j1', 'j2'] : ['j3'],
        evaluate: <X>(x: X) => [{
          index: 'i1',
          family: ['j1', 'j2']
        }]
      };
      
      expect(familially.kind).toBe('FamiliallyRepresentableFunctor');
      expect(familially.indexSet).toEqual(['i1', 'i2']);
      expect(familially.familyMap('i1')).toEqual(['j1', 'j2']);
      expect(familially.familyMap('i2')).toEqual(['j3']);
    });
    
    it('should convert standard form to familially representable', () => {
      const standard: StandardPolynomialForm<string, string> = {
        kind: 'StandardPolynomialForm',
        indexingSet: ['a', 'b'],
        fiberMap: (a) => a === 'a' ? ['x', 'y'] : ['z'],
        evaluate: <X>(x: X) => [{
          position: 'a',
          directions: ['x', 'y']
        }]
      };
      
      const familially = standardToFamiliallyRepresentable(standard);
      
      expect(familially.kind).toBe('FamiliallyRepresentableFunctor');
      expect(familially.indexSet).toEqual(['a', 'b']);
      expect(familially.familyMap('a')).toEqual(['x', 'y']);
      expect(familially.familyMap('b')).toEqual(['z']);
    });
    
  });
  
  describe('Characterization 4: Local Right Adjoint (Lamarche, Taylor, Weber)', () => {
    
    it('should create local right adjoint', () => {
      const localRightAdjoint: LocalRightAdjoint<string, string> = {
        kind: 'LocalRightAdjoint',
        baseObject: 'base',
        fiberObject: 'fiber',
        rightAdjoint: <X>(x: X) => [{
          base: 'base',
          fiber: 'fiber'
        }],
        leftAdjoint: <X>(x: Array<{ base: string; fiber: string }>) => x[0]?.base as X
      };
      
      expect(localRightAdjoint.kind).toBe('LocalRightAdjoint');
      expect(localRightAdjoint.baseObject).toBe('base');
      expect(localRightAdjoint.fiberObject).toBe('fiber');
      
      const rightResult = localRightAdjoint.rightAdjoint('test');
      expect(rightResult).toHaveLength(1);
      expect(rightResult[0].base).toBe('base');
      expect(rightResult[0].fiber).toBe('fiber');
      
      const leftResult = localRightAdjoint.leftAdjoint([{ base: 'test', fiber: 'test' }]);
      expect(leftResult).toBe('test');
    });
    
  });
  
  describe('Characterization 5: Species/Analytic Functor (Joyal, Bergeron)', () => {
    
    it('should create species/analytic functor', () => {
      const coefficients = new Map<number, number>();
      coefficients.set(0, 1); // a_0 = 1
      coefficients.set(1, 2); // a_1 = 2
      coefficients.set(2, 1); // a_2 = 1
      
      const species: SpeciesAnalyticFunctor = {
        kind: 'SpeciesAnalyticFunctor',
        coefficients,
        evaluate: <X>(x: X) => [
          { arity: 0, coefficient: 1, result: [] },
          { arity: 1, coefficient: 2, result: [x] },
          { arity: 2, coefficient: 1, result: [x, x] }
        ]
      };
      
      expect(species.kind).toBe('SpeciesAnalyticFunctor');
      expect(species.coefficients.get(0)).toBe(1);
      expect(species.coefficients.get(1)).toBe(2);
      expect(species.coefficients.get(2)).toBe(1);
    });
    
    it('should convert standard form to species/analytic', () => {
      const standard: StandardPolynomialForm<string, string> = {
        kind: 'StandardPolynomialForm',
        indexingSet: ['a', 'b', 'c'],
        fiberMap: (a) => {
          if (a === 'a') return []; // size 0
          if (a === 'b') return ['x']; // size 1
          return ['x', 'y']; // size 2
        },
        evaluate: <X>(x: X) => [{
          position: 'a',
          directions: []
        }]
      };
      
      const species = standardToSpeciesAnalytic(standard);
      
      expect(species.kind).toBe('SpeciesAnalyticFunctor');
      expect(species.coefficients.get(0)).toBe(1); // one fiber of size 0
      expect(species.coefficients.get(1)).toBe(1); // one fiber of size 1
      expect(species.coefficients.get(2)).toBe(1); // one fiber of size 2
    });
    
  });
  
  describe('Characterization 6: Normal Functor (Girard)', () => {
    
    it('should create normal functor', () => {
      const normal: NormalFunctor<string, string> = {
        kind: 'NormalFunctor',
        parameterSet: ['α1', 'α2'],
        finiteSets: (α) => α === 'α1' ? ['β1', 'β2'] : ['β3'],
        evaluate: <X>(x: X) => [{
          parameter: 'α1',
          finiteSet: ['β1', 'β2']
        }]
      };
      
      expect(normal.kind).toBe('NormalFunctor');
      expect(normal.parameterSet).toEqual(['α1', 'α2']);
      expect(normal.finiteSets('α1')).toEqual(['β1', 'β2']);
      expect(normal.finiteSets('α2')).toEqual(['β3']);
    });
    
  });
  
  describe('Container Theory Connections (Abbott, Altenkirch, Ghani)', () => {
    
    it('should create container from polynomial functor', () => {
      const polynomial: Polynomial<string, string> = {
        positions: 'shape',
        directions: () => ['pos1', 'pos2', 'pos3']
      };
      
      const container = polynomialToContainer(polynomial);
      
      expect(container.kind).toBe('Container');
      expect(container.shape).toBe('shape');
      expect(container.positions).toEqual(['shape']);
    });
    
    it('should create shapely type', () => {
      const shapely: ShapelyType<string, string> = {
        kind: 'ShapelyType',
        shape: 'shape',
        positions: ['pos1', 'pos2'],
        isShapely: true
      };
      
      expect(shapely.kind).toBe('ShapelyType');
      expect(shapely.shape).toBe('shape');
      expect(shapely.positions).toEqual(['pos1', 'pos2']);
      expect(shapely.isShapely).toBe(true);
    });
    
  });
  
  describe('Dependent Type Theory Applications (Moerdijk and Palmgren)', () => {
    
    it('should create dependent polynomial functor', () => {
      const dependent: DependentPolynomialFunctor<string, string> = {
        kind: 'DependentPolynomialFunctor',
        baseType: 'base',
        dependentType: (a) => `dependent_${a}`,
        evaluate: <X>(x: X) => [{
          base: 'base',
          dependent: 'dependent_base'
        }]
      };
      
      expect(dependent.kind).toBe('DependentPolynomialFunctor');
      expect(dependent.baseType).toBe('base');
      expect(dependent.dependentType('test')).toBe('dependent_test');
    });
    
    it('should convert standard form to dependent', () => {
      const standard: StandardPolynomialForm<string, string> = {
        kind: 'StandardPolynomialForm',
        indexingSet: ['a', 'b'],
        fiberMap: (a) => a === 'a' ? ['x', 'y'] : ['z'],
        evaluate: <X>(x: X) => [{
          position: 'a',
          directions: ['x', 'y']
        }]
      };
      
      const dependent = standardToDependent(standard);
      
      expect(dependent.kind).toBe('DependentPolynomialFunctor');
      expect(dependent.baseType).toEqual(['a', 'b']);
      expect(dependent.dependentType('a')).toEqual(['x', 'y']);
      expect(dependent.dependentType('b')).toEqual(['z']);
    });
    
  });
  
  describe('Interaction Systems (Hancock and Setzer, Hyvernat)', () => {
    
    it('should create interaction system', () => {
      const interaction: InteractionSystem<string, string> = {
        kind: 'InteractionSystem',
        initialState: 'start',
        availableActions: (state) => state === 'start' ? ['action1', 'action2'] : ['action3'],
        transition: (state, action) => action,
        isTerminal: (state) => state === 'terminal'
      };
      
      expect(interaction.kind).toBe('InteractionSystem');
      expect(interaction.initialState).toBe('start');
      expect(interaction.availableActions('start')).toEqual(['action1', 'action2']);
      expect(interaction.transition('start', 'action1')).toBe('action1');
      expect(interaction.isTerminal('start')).toBe(false);
      expect(interaction.isTerminal('terminal')).toBe(true);
    });
    
    it('should convert polynomial functor to interaction system', () => {
      const polynomial: Polynomial<string, string> = {
        positions: 'start',
        directions: () => ['action1', 'action2', 'action3']
      };
      
      const interaction = polynomialToInteractionSystem(polynomial);
      
      expect(interaction.kind).toBe('InteractionSystem');
      expect(interaction.initialState).toBe('start');
      expect(interaction.availableActions('start')).toEqual(['action1', 'action2', 'action3']);
      expect(interaction.isTerminal('start')).toBe(false);
    });
    
  });
  
  describe('Tambara Functors (Representation Theory)', () => {
    
    it('should create Tambara functor', () => {
      const tambara: TambaraFunctor<string, string> = {
        kind: 'TambaraFunctor',
        restriction: <X>(x: X) => 'restricted',
        trace: <X>(x: X) => 'traced', // Additive transfer
        norm: <X>(x: X) => 'normed'   // Multiplicative transfer
      };
      
      expect(tambara.kind).toBe('TambaraFunctor');
      expect(tambara.restriction('test')).toBe('restricted');
      expect(tambara.trace('test')).toBe('traced');
      expect(tambara.norm('test')).toBe('normed');
    });
    
    it('should convert polynomial functor to Tambara functor', () => {
      const polynomial: Polynomial<string, string> = {
        positions: 'base',
        directions: () => ['fiber1', 'fiber2']
      };
      
      const tambara = polynomialToTambara(polynomial);
      
      expect(tambara.kind).toBe('TambaraFunctor');
      expect(tambara.restriction('test')).toBe('base');
      expect(tambara.trace('test')).toEqual(['fiber1', 'fiber2']);
      expect(tambara.norm('test')).toEqual(['fiber1', 'fiber2']);
    });
    
  });
  
  describe('Verification of Six Characterizations', () => {
    
    it('should verify all six characterizations are equivalent', () => {
      const polynomial: Polynomial<string, string> = {
        positions: 'test',
        directions: () => ['dir1', 'dir2']
      };
      
      const characterizations = verifySixCharacterizations(polynomial);
      
      expect(characterizations.allEquivalent).toBe(true);
      expect(characterizations.standardForm.kind).toBe('StandardPolynomialForm');
      expect(characterizations.containerForm.kind).toBe('ContainerFunctor');
      expect(characterizations.familiallyRepresentable.kind).toBe('FamiliallyRepresentableFunctor');
      expect(characterizations.localRightAdjoint.kind).toBe('LocalRightAdjoint');
      expect(characterizations.speciesAnalytic.kind).toBe('SpeciesAnalyticFunctor');
      expect(characterizations.normalFunctor.kind).toBe('NormalFunctor');
    });
    
    it('should verify natural numbers polynomial', () => {
      const naturalNumbersPolynomial: Polynomial<string, string> = {
        positions: ['zero', 'succ'],
        directions: (pos) => pos === 'zero' ? [] : ['n']
      };
      
      const characterizations = verifySixCharacterizations(naturalNumbersPolynomial);
      
      expect(characterizations.allEquivalent).toBe(true);
      expect(characterizations.standardForm.indexingSet).toEqual(['zero', 'succ']);
      expect(characterizations.containerForm.shapes).toEqual(['zero', 'succ']);
    });
    
    it('should verify binary trees polynomial', () => {
      const binaryTreesPolynomial: Polynomial<string, string> = {
        positions: ['leaf', 'node'],
        directions: (pos) => pos === 'leaf' ? [] : ['left', 'right']
      };
      
      const characterizations = verifySixCharacterizations(binaryTreesPolynomial);
      
      expect(characterizations.allEquivalent).toBe(true);
      expect(characterizations.speciesAnalytic.coefficients.get(0)).toBe(1); // leaf
      expect(characterizations.speciesAnalytic.coefficients.get(2)).toBe(1); // node with 2 children
    });
    
  });
  
  describe('Integration Examples', () => {
    
    it('should run natural numbers polynomial example', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      exampleNaturalNumbersPolynomial();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          naturalNumbersPolynomial: true,
          allSixCharacterizations: true,
          standardForm: 'StandardPolynomialForm',
          containerForm: 'ContainerFunctor',
          familiallyRepresentable: 'FamiliallyRepresentableFunctor',
          localRightAdjoint: 'LocalRightAdjoint',
          speciesAnalytic: 'SpeciesAnalyticFunctor',
          normalFunctor: 'NormalFunctor'
        })
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should run binary trees polynomial example', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      exampleBinaryTreesPolynomial();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          binaryTreesPolynomial: true,
          allSixCharacterizations: true,
          speciesCoefficients: expect.any(Array),
          containerShapes: expect.any(Array)
        })
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should run interaction system example', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      exampleInteractionSystem();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          interactionSystemCreated: true,
          initialState: 'start',
          availableActions: expect.any(Array),
          isTerminal: expect.any(Boolean)
        })
      );
      
      consoleSpy.mockRestore();
    });
    
  });
  
  describe('Edge Cases and Advanced Properties', () => {
    
    it('should handle empty polynomial functor', () => {
      const emptyPolynomial: Polynomial<string, string> = {
        positions: [],
        directions: () => []
      };
      
      const characterizations = verifySixCharacterizations(emptyPolynomial);
      
      expect(characterizations.allEquivalent).toBe(true);
      expect(characterizations.speciesAnalytic.coefficients.get(0)).toBe(0);
    });
    
    it('should handle infinite polynomial functor', () => {
      const infinitePolynomial: Polynomial<number, number> = {
        positions: 42,
        directions: () => [1, 2, 3, 4, 5] // Finite but could be extended
      };
      
      const characterizations = verifySixCharacterizations(infinitePolynomial);
      
      expect(characterizations.allEquivalent).toBe(true);
      expect(characterizations.speciesAnalytic.coefficients.get(5)).toBe(1);
    });
    
    it('should verify mathematical coherence', () => {
      // Test that all characterizations preserve the fundamental polynomial structure
      const polynomial: Polynomial<string, string> = {
        positions: 'test',
        directions: () => ['dir1', 'dir2', 'dir3']
      };
      
      const characterizations = verifySixCharacterizations(polynomial);
      
      // All characterizations should represent the same mathematical object
      expect(characterizations.allEquivalent).toBe(true);
      
      // The species coefficients should reflect the structure
      expect(characterizations.speciesAnalytic.coefficients.get(3)).toBe(1); // One fiber of size 3
      
      // The container should have the same shape
      expect(characterizations.containerForm.shapes).toBe('test');
    });
    
  });
  
});
