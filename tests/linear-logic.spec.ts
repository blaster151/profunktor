/**
 * Linear Logic Tests
 */

import {
  LinearLogicFormula,
  createAtomicFormula,
  createTensorFormula,
  createDirectSumFormula,
  createLinearImplFormula,
  createOfCourseFormula,
  createWhyNotFormula,
  ProofNet,
  ProofNetNode,
  ProofNetConnection,
  createProofNet,
  LinearLogicModel,
  createLinearLogicModel,
  LinearLogicSequent,
  createSequent,
  CutElimination,
  createCutElimination,
  PolynomialToLinearLogic,
  createPolynomialToLinearLogic,
  exampleLinearLogicFormulas,
  exampleProofNet,
  examplePolynomialToLinearLogic
} from '../fp-linear-logic';

import { createNormalFunctor } from '../fp-normal-functors-slice';

describe('Linear Logic Implementation', () => {
  
  describe('I. Linear Logic Connectives', () => {
    
    test('should create atomic formulas', () => {
      const A = createAtomicFormula('A');
      const B = createAtomicFormula('B');
      
      expect(A.kind).toBe('LinearLogicFormula');
      expect(A.connective).toBe('atomic');
      expect(A.isAtomic).toBe(true);
      expect(A.atomicType).toBe('A');
      expect(A.subformulas).toEqual([]);
      
      expect(B.atomicType).toBe('B');
    });
    
    test('should create tensor formulas', () => {
      const A = createAtomicFormula('A');
      const B = createAtomicFormula('B');
      const tensorAB = createTensorFormula(A, B);
      
      expect(tensorAB.kind).toBe('LinearLogicFormula');
      expect(tensorAB.connective).toBe('tensor');
      expect(tensorAB.isAtomic).toBe(false);
      expect(tensorAB.subformulas).toEqual([A, B]);
    });
    
    test('should create direct sum formulas', () => {
      const A = createAtomicFormula('A');
      const B = createAtomicFormula('B');
      const directSumAB = createDirectSumFormula(A, B);
      
      expect(directSumAB.connective).toBe('directSum');
      expect(directSumAB.subformulas).toEqual([A, B]);
    });
    
    test('should create linear implication formulas', () => {
      const A = createAtomicFormula('A');
      const B = createAtomicFormula('B');
      const implAB = createLinearImplFormula(A, B);
      
      expect(implAB.connective).toBe('linearImpl');
      expect(implAB.subformulas).toEqual([A, B]);
    });
    
    test('should create of course formulas', () => {
      const A = createAtomicFormula('A');
      const ofCourseA = createOfCourseFormula(A);
      
      expect(ofCourseA.connective).toBe('ofCourse');
      expect(ofCourseA.subformulas).toEqual([A]);
    });
    
    test('should create why not formulas', () => {
      const A = createAtomicFormula('A');
      const whyNotA = createWhyNotFormula(A);
      
      expect(whyNotA.connective).toBe('whyNot');
      expect(whyNotA.subformulas).toEqual([A]);
    });
  });
  
  describe('II. Proof Nets', () => {
    
    test('should create proof net nodes', () => {
      const A = createAtomicFormula('A');
      const node: ProofNetNode = {
        kind: 'ProofNetNode',
        nodeType: 'axiom',
        formula: A,
        connections: []
      };
      
      expect(node.kind).toBe('ProofNetNode');
      expect(node.nodeType).toBe('axiom');
      expect(node.formula).toBe(A);
      expect(node.connections).toEqual([]);
    });
    
    test('should create proof net connections', () => {
      const A = createAtomicFormula('A');
      const B = createAtomicFormula('B');
      
      const node1: ProofNetNode = {
        kind: 'ProofNetNode',
        nodeType: 'axiom',
        formula: A,
        connections: []
      };
      
      const node2: ProofNetNode = {
        kind: 'ProofNetNode',
        nodeType: 'axiom',
        formula: B,
        connections: []
      };
      
      const connection: ProofNetConnection = {
        kind: 'ProofNetConnection',
        source: node1,
        target: node2,
        connectionType: 'logical'
      };
      
      expect(connection.kind).toBe('ProofNetConnection');
      expect(connection.source).toBe(node1);
      expect(connection.target).toBe(node2);
      expect(connection.connectionType).toBe('logical');
    });
    
    test('should create and validate proof nets', () => {
      const A = createAtomicFormula('A');
      const B = createAtomicFormula('B');
      const tensorAB = createTensorFormula(A, B);
      
      const node1: ProofNetNode = {
        kind: 'ProofNetNode',
        nodeType: 'axiom',
        formula: A,
        connections: []
      };
      
      const node2: ProofNetNode = {
        kind: 'ProofNetNode',
        nodeType: 'axiom',
        formula: B,
        connections: []
      };
      
      const node3: ProofNetNode = {
        kind: 'ProofNetNode',
        nodeType: 'tensor',
        formula: tensorAB,
        connections: []
      };
      
      const connection1: ProofNetConnection = {
        kind: 'ProofNetConnection',
        source: node1,
        target: node3,
        connectionType: 'logical'
      };
      
      const connection2: ProofNetConnection = {
        kind: 'ProofNetConnection',
        source: node2,
        target: node3,
        connectionType: 'logical'
      };
      
      const proofNet = createProofNet(
        [node1, node2, node3],
        [connection1, connection2],
        tensorAB,
        { kind: 'Polynomial', positions: [], directions: [] } as any
      );
      
      expect(proofNet.kind).toBe('ProofNet');
      expect(proofNet.nodes).toHaveLength(3);
      expect(proofNet.connections).toHaveLength(2);
      expect(proofNet.conclusion).toBe(tensorAB);
      expect(proofNet.isCorrect).toBe(true);
      expect(proofNet.polynomialFunctor.kind).toBe('Polynomial');
    });
  });
  
  describe('III. Linear Logic Models', () => {
    
    test('should create linear logic models from normal functors', () => {
      const normalFunctor = createNormalFunctor('Test', 'Set^I', 'Set^J');
      const model = createLinearLogicModel(normalFunctor);
      
      expect(model.kind).toBe('LinearLogicModel');
      expect(model.normalFunctor).toBe(normalFunctor);
      expect(model.pullbackPreservation).toBe(true);
      expect(model.interpretation).toBeInstanceOf(Map);
      expect(typeof model.tensorInterpretation).toBe('function');
      expect(typeof model.directSumInterpretation).toBe('function');
      expect(typeof model.linearImplInterpretation).toBe('function');
    });
    
    test('should interpret linear logic connectives', () => {
      const normalFunctor = createNormalFunctor('Test', 'Set^I', 'Set^J');
      const model = createLinearLogicModel(normalFunctor);
      
      const tensorResult = model.tensorInterpretation('a', 'b');
      expect(tensorResult).toEqual({ kind: 'tensor', left: 'a', right: 'b' });
      
      const directSumResult = model.directSumInterpretation('a', 'b');
      expect(directSumResult).toEqual({ kind: 'directSum', left: 'a', right: 'b' });
      
      const implResult = model.linearImplInterpretation('a', 'b');
      expect(implResult).toEqual({ kind: 'linearImpl', antecedent: 'a', consequent: 'b' });
    });
  });
  
  describe('IV. Polynomial Functor to Linear Logic Translation', () => {
    
    test('should translate polynomial functors to linear logic', () => {
      const polynomial = { 
        kind: 'Polynomial', 
        positions: ['pos1', 'pos2'], 
        directions: ['dir1', 'dir2'] 
      } as any;
      
      const translation = createPolynomialToLinearLogic(polynomial);
      
      expect(translation.kind).toBe('PolynomialToLinearLogic');
      expect(translation.polynomial).toBe(polynomial);
      expect(translation.linearFormula.connective).toBe('tensor');
      expect(translation.pullbackPreservation).toBe(true);
      
      expect(translation.translation.positions.atomicType).toBe('positions');
      expect(translation.translation.directions.atomicType).toBe('directions');
      expect(translation.translation.source.atomicType).toBe('source');
      expect(translation.translation.target.atomicType).toBe('target');
    });
  });
  
  describe('V. Integration Examples', () => {
    
    test('should run linear logic formula examples', () => {
      // Test that the function runs without error
      expect(() => exampleLinearLogicFormulas()).not.toThrow();
    });
    
    test('should run proof net examples', () => {
      // Test that the function runs without error
      expect(() => exampleProofNet()).not.toThrow();
    });
    
    test('should run polynomial to linear logic examples', () => {
      // Test that the function runs without error
      expect(() => examplePolynomialToLinearLogic()).not.toThrow();
    });
  });
});
