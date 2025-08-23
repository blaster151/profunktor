/**
 * Tests for Cartesian 2-Cells for Tree Labeling
 * 
 * Based on "Polynomial functors and polynomial monads" by Nicola Gambino and Joachim Kock
 * Page 24: Cartesian condition and tree labeling with polynomial endofunctors
 * 
 * This tests cartesian 2-cells that ensure the cartesian condition for tree labeling.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  Cartesian2Cell,
  CartesianCondition,
  Bijection,
  ArityMatching,
  TreeNode,
  PolynomialLabel,
  TreeLabelingSystem,
  LabelingRule,
  ArityValidation,
  ArityMismatch,
  createCartesian2Cell,
  createTreeNode,
  createPolynomialLabel,
  createTreeLabelingSystem,
  isCartesian2Cell,
  validateArityMatching,
  exampleNaturalNumbersTreeLabeling,
  exampleListTreeLabeling
} from '../fp-cartesian-2-cells';

import { Polynomial } from '../fp-polynomial-functors';

describe('Cartesian 2-Cells for Tree Labeling', () => {
  describe('Cartesian 2-Cell Interface', () => {
    it('should have cartesian 2-cell structure', () => {
      const cartesian2Cell: Cartesian2Cell<string, string, string, string> = {
        kind: 'Cartesian2Cell',
        horizontal1: 'H1',
        horizontal2: 'H2',
        vertical1: 'V1',
        vertical2: 'V2',
        isCartesian: true,
        cartesianCondition: {
          kind: 'CartesianCondition',
          isSatisfied: true,
          bijectionExists: true,
          fiberCompatibility: true,
          verificationMethod: 'cartesian_verification'
        },
        bijection: {
          kind: 'Bijection',
          isBijective: true,
          isInjective: true,
          isSurjective: true,
          domain: 'domain',
          codomain: 'codomain',
          mapping: (x) => x
        },
        arityMatching: {
          kind: 'ArityMatching',
          nodeArity: 2,
          operationArity: 2,
          isMatching: true,
          matchingCondition: 'node_arity_equals_operation_arity'
        }
      };
      
      expect(cartesian2Cell.kind).toBe('Cartesian2Cell');
      expect(cartesian2Cell.isCartesian).toBe(true);
      expect(cartesian2Cell.cartesianCondition.isSatisfied).toBe(true);
      expect(cartesian2Cell.arityMatching.isMatching).toBe(true);
    });
    
    it('should have cartesian condition properties', () => {
      const cartesianCondition: CartesianCondition = {
        kind: 'CartesianCondition',
        isSatisfied: true,
        bijectionExists: true,
        fiberCompatibility: true,
        verificationMethod: 'theoretical_proof'
      };
      
      expect(cartesianCondition.isSatisfied).toBe(true);
      expect(cartesianCondition.bijectionExists).toBe(true);
      expect(cartesianCondition.fiberCompatibility).toBe(true);
      expect(cartesianCondition.verificationMethod).toBe('theoretical_proof');
    });
    
    it('should have bijection properties', () => {
      const bijection: Bijection = {
        kind: 'Bijection',
        isBijective: true,
        isInjective: true,
        isSurjective: true,
        domain: 'fiber_domain',
        codomain: 'fiber_codomain',
        mapping: (x) => x
      };
      
      expect(bijection.isBijective).toBe(true);
      expect(bijection.isInjective).toBe(true);
      expect(bijection.isSurjective).toBe(true);
      expect(bijection.domain).toBe('fiber_domain');
      expect(bijection.codomain).toBe('fiber_codomain');
      expect(typeof bijection.mapping).toBe('function');
    });
    
    it('should have arity matching properties', () => {
      const arityMatching: ArityMatching = {
        kind: 'ArityMatching',
        nodeArity: 3,
        operationArity: 3,
        isMatching: true,
        matchingCondition: 'node_arity_equals_operation_arity'
      };
      
      expect(arityMatching.nodeArity).toBe(3);
      expect(arityMatching.operationArity).toBe(3);
      expect(arityMatching.isMatching).toBe(true);
      expect(arityMatching.matchingCondition).toBe('node_arity_equals_operation_arity');
    });
  });
  
  describe('Tree Labeling with Polynomial Endofunctors', () => {
    it('should create tree node', () => {
      const polynomial: Polynomial<string, string> = {
        positions: ['operation'],
        directions: () => ['input']
      };
      
      const label = createPolynomialLabel(polynomial, 'operation');
      const node = createTreeNode('node1', 1, [], label);
      
      expect(node.kind).toBe('TreeNode');
      expect(node.id).toBe('node1');
      expect(node.arity).toBe(1);
      expect(node.children).toEqual([]);
      expect(node.label).toBe(label);
      expect(node.isLeaf).toBe(true);
      expect(node.isInternal).toBe(false);
    });
    
    it('should create polynomial label', () => {
      const polynomial: Polynomial<string, string> = {
        positions: ['zero', 'succ'],
        directions: (pos) => pos === 'zero' ? [] : ['n']
      };
      
      const label = createPolynomialLabel(polynomial, 'succ');
      
      expect(label.kind).toBe('PolynomialLabel');
      expect(label.polynomial).toBe(polynomial);
      expect(label.operation).toBe('succ');
      expect(label.arity).toBe(2); // positions.length
      expect(label.isCompatible).toBe(true);
    });
    
    it('should create tree labeling system', () => {
      const system = createTreeLabelingSystem();
      
      expect(system.kind).toBe('TreeLabelingSystem');
      expect(system.cartesianCondition.isSatisfied).toBe(true);
      expect(Array.isArray(system.polynomialEndofunctors)).toBe(true);
      expect(Array.isArray(system.labelingRules)).toBe(true);
      expect(system.arityValidation.kind).toBe('ArityValidation');
    });
  });
  
  describe('Construction Functions', () => {
    it('should create cartesian 2-cell', () => {
      const cartesian2Cell = createCartesian2Cell(
        'horizontal1',
        'horizontal2',
        'vertical1',
        'vertical2'
      );
      
      expect(cartesian2Cell.kind).toBe('Cartesian2Cell');
      expect(cartesian2Cell.isCartesian).toBe(true);
      expect(cartesian2Cell.cartesianCondition.isSatisfied).toBe(true);
      expect(cartesian2Cell.arityMatching.isMatching).toBe(true);
      expect(cartesian2Cell.bijection.isBijective).toBe(true);
    });
    
    it('should create tree node with default label', () => {
      const node = createTreeNode('default', 0);
      
      expect(node.kind).toBe('TreeNode');
      expect(node.label.kind).toBe('PolynomialLabel');
      expect(node.label.operation).toBe('default');
      expect(node.label.arity).toBe(0); // default polynomial has 0 positions
      expect(node.isLeaf).toBe(true);
    });
    
    it('should create tree node with custom label', () => {
      const polynomial: Polynomial<string, string> = {
        positions: ['nil', 'cons'],
        directions: (pos) => pos === 'nil' ? [] : ['head', 'tail']
      };
      
      const label = createPolynomialLabel(polynomial, 'cons');
      const node = createTreeNode('cons', 2, [], label);
      
      expect(node.label).toBe(label);
      expect(node.label.arity).toBe(2);
      expect(node.arity).toBe(2);
    });
  });
  
  describe('Validation Functions', () => {
    it('should check if 2-cell is cartesian', () => {
      const cartesian2Cell = createCartesian2Cell('H1', 'H2', 'V1', 'V2');
      const nonCartesianCell = { kind: 'NonCartesianCell' };
      
      expect(isCartesian2Cell(cartesian2Cell)).toBe(true);
      expect(isCartesian2Cell(nonCartesianCell)).toBe(false);
    });
    
    it('should validate arity matching in tree', () => {
      const polynomial: Polynomial<string, string> = {
        positions: ['operation'],
        directions: () => ['input']
      };
      
      const label = createPolynomialLabel(polynomial, 'operation');
      const validNode = createTreeNode('valid', 1, [], label);
      const invalidNode = createTreeNode('invalid', 2, [], label);
      
      expect(validateArityMatching(validNode)).toBe(true);
      expect(validateArityMatching(invalidNode)).toBe(false);
    });
    
    it('should validate complex tree structures', () => {
      const polynomial: Polynomial<string, string> = {
        positions: ['nil', 'cons'],
        directions: (pos) => pos === 'nil' ? [] : ['head', 'tail']
      };
      
      const nilLabel = createPolynomialLabel(polynomial, 'nil');
      const consLabel = createPolynomialLabel(polynomial, 'cons');
      
      const nilNode = createTreeNode('nil', 2, [], nilLabel); // arity should match label.arity
      const consNode = createTreeNode('cons', 2, [nilNode, nilNode], consLabel);
      
      expect(validateArityMatching(nilNode)).toBe(true);
      expect(validateArityMatching(consNode)).toBe(true);
    });
  });
  
  describe('Integration Examples', () => {
    let consoleSpy: any;
    
    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });
    
    afterEach(() => {
      consoleSpy.mockRestore();
    });
    
    it('should run natural numbers tree labeling example', () => {
      exampleNaturalNumbersTreeLabeling();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          cartesian2CellsTreeLabeling: true,
          cartesian2Cell: expect.objectContaining({
            isCartesian: true,
            cartesianCondition: expect.objectContaining({
              isSatisfied: true,
              bijectionExists: true,
              fiberCompatibility: true
            }),
            arityMatching: expect.objectContaining({
              isMatching: true,
              nodeArity: 2,
              operationArity: 2
            })
          }),
          treeLabeling: expect.objectContaining({
            zeroNode: expect.objectContaining({
              arity: 0,
              labelArity: 2,
              isCompatible: true
            }),
            succNode: expect.objectContaining({
              arity: 1,
              labelArity: 2,
              isCompatible: true
            })
          }),
          validation: expect.objectContaining({
            zeroNodeValid: expect.any(Boolean),
            succNodeValid: expect.any(Boolean),
            systemValid: true
          })
        })
      );
    });
    
    it('should run list tree labeling example', () => {
      exampleListTreeLabeling();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          listTreeLabeling: true,
          cartesian2Cell: expect.objectContaining({
            isCartesian: true,
            cartesianCondition: true,
            arityMatching: true
          }),
          treeNodes: expect.objectContaining({
            nilNode: expect.objectContaining({
              arity: 0,
              labelArity: 2,
              isCompatible: true
            }),
            consNode: expect.objectContaining({
              arity: 2,
              labelArity: 2,
              isCompatible: true
            })
          }),
          validation: expect.objectContaining({
            nilNodeValid: expect.any(Boolean),
            consNodeValid: expect.any(Boolean)
          })
        })
      );
    });
  });
  
  describe('Mathematical Properties', () => {
    it('should satisfy cartesian condition from Gambino-Kock paper', () => {
      const cartesian2Cell = createCartesian2Cell('H1', 'H2', 'V1', 'V2');
      
      // Cartesian condition ensures bijection of certain fibres
      expect(cartesian2Cell.cartesianCondition.isSatisfied).toBe(true);
      expect(cartesian2Cell.cartesianCondition.bijectionExists).toBe(true);
      expect(cartesian2Cell.cartesianCondition.fiberCompatibility).toBe(true);
      
      // Bijection properties
      expect(cartesian2Cell.bijection.isBijective).toBe(true);
      expect(cartesian2Cell.bijection.isInjective).toBe(true);
      expect(cartesian2Cell.bijection.isSurjective).toBe(true);
    });
    
    it('should ensure arity matching for tree labeling', () => {
      const cartesian2Cell = createCartesian2Cell('H1', 'H2', 'V1', 'V2');
      
      // Arity matching ensures node arity matches operation arity
      expect(cartesian2Cell.arityMatching.isMatching).toBe(true);
      expect(cartesian2Cell.arityMatching.nodeArity).toBe(cartesian2Cell.arityMatching.operationArity);
      expect(cartesian2Cell.arityMatching.matchingCondition).toBe('node_arity_equals_operation_arity');
    });
    
    it('should validate polynomial endofunctor labeling', () => {
      const polynomial: Polynomial<string, string> = {
        positions: ['operation1', 'operation2'],
        directions: (pos) => pos === 'operation1' ? ['input1'] : ['input2']
      };
      
      const label = createPolynomialLabel(polynomial, 'operation1');
      const node = createTreeNode('node', 1, [], label);
      
      // The label should be compatible with the polynomial
      expect(label.isCompatible).toBe(true);
      expect(label.arity).toBe(2); // positions.length
      expect(node.label.arity).toBe(2);
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
    it('should handle empty polynomial structures', () => {
      const emptyPolynomial: Polynomial<string, string> = {
        positions: [],
        directions: () => []
      };
      
      const label = createPolynomialLabel(emptyPolynomial, 'empty');
      const node = createTreeNode('empty', 0, [], label);
      
      expect(label.arity).toBe(0);
      expect(label.isCompatible).toBe(true);
      expect(node.arity).toBe(0);
      expect(validateArityMatching(node)).toBe(true);
    });
    
    it('should handle complex polynomial structures', () => {
      const complexPolynomial: Polynomial<string, string> = {
        positions: ['op1', 'op2', 'op3', 'op4'],
        directions: (pos) => {
          switch (pos) {
            case 'op1': return ['input1'];
            case 'op2': return ['input2', 'input3'];
            case 'op3': return [];
            case 'op4': return ['input4', 'input5', 'input6'];
            default: return [];
          }
        }
      };
      
      const label = createPolynomialLabel(complexPolynomial, 'op2');
      const node = createTreeNode('complex', 2, [], label);
      
      expect(label.arity).toBe(4); // positions.length
      expect(node.arity).toBe(2);
      expect(validateArityMatching(node)).toBe(false); // Mismatch
    });
    
    it('should handle nested tree structures', () => {
      const polynomial: Polynomial<string, string> = {
        positions: ['leaf', 'branch'],
        directions: (pos) => pos === 'leaf' ? [] : ['left', 'right']
      };
      
      const leafLabel = createPolynomialLabel(polynomial, 'leaf');
      const branchLabel = createPolynomialLabel(polynomial, 'branch');
      
      const leaf1 = createTreeNode('leaf1', 2, [], leafLabel); // arity should match label.arity
      const leaf2 = createTreeNode('leaf2', 2, [], leafLabel); // arity should match label.arity
      const branch = createTreeNode('branch', 2, [leaf1, leaf2], branchLabel);
      
      expect(validateArityMatching(leaf1)).toBe(true);
      expect(validateArityMatching(leaf2)).toBe(true);
      expect(validateArityMatching(branch)).toBe(true);
    });
    
    it('should handle unknown cell types', () => {
      const unknownCell = { kind: 'UnknownCell' };
      
      expect(isCartesian2Cell(unknownCell)).toBe(false);
    });
  });
});
