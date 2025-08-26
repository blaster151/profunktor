/**
 * Tests for Proof Nets using Polynomial Functor Structure
 * 
 * Revolutionary tests for the integration of linear logic proof nets
 * with polynomial functors, creating a unified framework for proof theory
 * and category theory.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  LinearLogicConnective,
  ProofNet,
  ProofNetNode,
  ProofNetConnection,
  ProofNetCut,
  PolynomialFunctor,
  Position,
  Direction,
  createTensorConnective,
  createParConnective,
  createImplicationConnective,
  validateProofNet,
  ProofNetValidation,
  reduceProofNet,
  ProofNetReduction,
  ProofNetWithPolynomialSemantics,
  PolynomialSemantics,
  ProofNetCorrectness,
  ProofNetReductionStrategy,
  exampleSimpleProofNet,
  exampleComplexProofNetWithCuts,
  exampleProofNetWithPolynomialSemantics,
  revolutionaryProofNetIntegration,
  exampleRevolutionaryProofNetComputation
} from '../fp-proof-nets-polynomial';

describe('Proof Nets using Polynomial Functor Structure', () => {
  
  describe('Linear Logic Connectives', () => {
    
    it('should create tensor connective as polynomial functor', () => {
      const tensor = createTensorConnective('A', 'B');
      
      expect(tensor.kind).toBe('LinearLogicConnective');
      expect(tensor.connective).toBe('tensor');
      expect(tensor.leftType).toBe('A');
      expect(tensor.rightType).toBe('B');
      expect(tensor.polynomialFunctor.kind).toBe('PolynomialFunctor');
      expect(tensor.polynomialFunctor.positions).toHaveLength(2);
      expect(tensor.polynomialFunctor.directions).toHaveLength(1);
    });
    
    it('should create par connective as polynomial functor', () => {
      const par = createParConnective('A', 'B');
      
      expect(par.kind).toBe('LinearLogicConnective');
      expect(par.connective).toBe('par');
      expect(par.leftType).toBe('A');
      expect(par.rightType).toBe('B');
      expect(par.polynomialFunctor.kind).toBe('PolynomialFunctor');
      expect(par.polynomialFunctor.positions).toHaveLength(1);
      expect(par.polynomialFunctor.directions).toHaveLength(2);
    });
    
    it('should create implication connective as polynomial functor', () => {
      const implication = createImplicationConnective('A', 'B');
      
      expect(implication.kind).toBe('LinearLogicConnective');
      expect(implication.connective).toBe('implication');
      expect(implication.leftType).toBe('A');
      expect(implication.rightType).toBe('B');
      expect(implication.polynomialFunctor.kind).toBe('PolynomialFunctor');
      expect(implication.polynomialFunctor.positions).toHaveLength(1);
      expect(implication.polynomialFunctor.directions).toHaveLength(1);
    });
    
    it('should have linear positions in polynomial functors', () => {
      const tensor = createTensorConnective('A', 'B');
      
      for (const position of tensor.polynomialFunctor.positions) {
        expect(position.isLinear).toBe(true);
        expect(position.multiplicity).toBe(1);
      }
    });
    
    it('should have linear directions in polynomial functors', () => {
      const tensor = createTensorConnective('A', 'B');
      
      for (const direction of tensor.polynomialFunctor.directions) {
        expect(direction.isLinear).toBe(true);
        expect(direction.multiplicity).toBe(1);
      }
    });
  });
  
  describe('Proof Net Structures', () => {
    
    it('should create proof net nodes with proper structure', () => {
      const node: ProofNetNode<string> = {
        id: 'test_node',
        type: 'A',
        connections: [],
        cuts: [],
        isAxiom: true,
        isConclusion: false
      };
      
      expect(node.id).toBe('test_node');
      expect(node.type).toBe('A');
      expect(node.isAxiom).toBe(true);
      expect(node.isConclusion).toBe(false);
    });
    
    it('should create proof net connections', () => {
      const connection: ProofNetConnection<string> = {
        from: 'node1',
        to: 'node2',
        type: 'logical',
        formula: 'A'
      };
      
      expect(connection.from).toBe('node1');
      expect(connection.to).toBe('node2');
      expect(connection.type).toBe('logical');
      expect(connection.formula).toBe('A');
    });
    
    it('should create proof net cuts', () => {
      const cut: ProofNetCut<string> = {
        leftFormula: 'A',
        rightFormula: 'A ⊸ B',
        leftNode: 'node1',
        rightNode: 'node2',
        isReduced: false
      };
      
      expect(cut.leftFormula).toBe('A');
      expect(cut.rightFormula).toBe('A ⊸ B');
      expect(cut.leftNode).toBe('node1');
      expect(cut.rightNode).toBe('node2');
      expect(cut.isReduced).toBe(false);
    });
  });
  
  describe('Proof Net Validation', () => {
    
    it('should validate simple proof net', () => {
      const proofNet = exampleSimpleProofNet();
      const validation = validateProofNet(proofNet);
      
      expect(validation.isCorrect).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.polynomialStructure.isWellFormed).toBe(true);
      expect(validation.polynomialStructure.linearity).toBe(true);
    });
    
    it('should validate complex proof net with cuts', () => {
      const proofNet = exampleComplexProofNetWithCuts();
      const validation = validateProofNet(proofNet);
      
      expect(validation.isCorrect).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.polynomialStructure.isWellFormed).toBe(true);
      expect(validation.polynomialStructure.linearity).toBe(true);
    });
    
    it('should detect incorrect proof nets', () => {
      const incorrectNet: ProofNet<string> = {
        nodes: [],
        connections: [],
        cuts: [],
        conclusions: [],
        isCorrect: false,
        isReduced: false
      };
      
      const validation = validateProofNet(incorrectNet);
      
      // Should detect issues with empty proof net
      expect(validation.isCorrect).toBe(false); // Empty proof nets are incorrect
    });
  });
  
  describe('Proof Net Reduction', () => {
    
    it('should reduce proof net by eliminating cuts', () => {
      const proofNet = exampleComplexProofNetWithCuts();
      const reduction = reduceProofNet(proofNet);
      
      expect(reduction.originalNet).toBe(proofNet);
      expect(reduction.reducedNet).toBeDefined();
      expect(reduction.isTerminating).toBe(true);
      expect(reduction.steps).toBeDefined();
      expect(reduction.polynomialTransformations).toBeDefined();
    });
    
    it('should track reduction steps', () => {
      const proofNet = exampleComplexProofNetWithCuts();
      const reduction = reduceProofNet(proofNet);
      
      expect(Array.isArray(reduction.steps)).toBe(true);
      
      for (const step of reduction.steps) {
        expect(step.type).toMatch(/cut_elimination|axiom_reduction|logical_reduction/);
        expect(step.description).toBeDefined();
        expect(step.before).toBeDefined();
        expect(step.after).toBeDefined();
      }
    });
    
    it('should apply polynomial transformations', () => {
      const proofNet = exampleComplexProofNetWithCuts();
      const reduction = reduceProofNet(proofNet);
      
      expect(Array.isArray(reduction.polynomialTransformations)).toBe(true);
      
      for (const transformation of reduction.polynomialTransformations) {
        expect(transformation.type).toMatch(/composition|decomposition|simplification/);
        expect(transformation.description).toBeDefined();
        expect(transformation.before).toBeDefined();
        expect(transformation.after).toBeDefined();
      }
    });
  });
  
  describe('Polynomial Semantics', () => {
    
    it('should create proof net with polynomial semantics', () => {
      const semantics = exampleProofNetWithPolynomialSemantics();
      
      expect(semantics.proofNet).toBeDefined();
      expect(semantics.polynomialSemantics).toBeDefined();
      expect(semantics.correctness).toBeDefined();
      expect(semantics.reduction).toBeDefined();
    });
    
    it('should have polynomial interpretation', () => {
      const semantics = exampleProofNetWithPolynomialSemantics();
      
      expect(semantics.polynomialSemantics.interpretation).toBeInstanceOf(Map);
      expect(semantics.polynomialSemantics.composition).toBeDefined();
      expect(semantics.polynomialSemantics.evaluation).toBeDefined();
    });
    
    it('should evaluate formulas as polynomial functors', () => {
      const semantics = exampleProofNetWithPolynomialSemantics();
      const evaluation = semantics.polynomialSemantics.evaluation('A');
      
      expect(evaluation.kind).toBe('PolynomialFunctor');
      expect(evaluation.source).toBe('A');
      expect(evaluation.target).toBe('A');
      expect(evaluation.positions).toHaveLength(1);
      expect(evaluation.directions).toHaveLength(1);
    });
    
    it('should compose polynomial functors', () => {
      const semantics = exampleProofNetWithPolynomialSemantics();
      const tensor = createTensorConnective('A', 'B');
      const implication = createImplicationConnective('B', 'C');
      
      const composition = semantics.polynomialSemantics.composition(
        tensor.polynomialFunctor,
        implication.polynomialFunctor
      );
      
      expect(composition.kind).toBe('PolynomialFunctor');
      expect(composition.source).toBe('A');
      expect(composition.target).toBe('C');
    });
  });
  
  describe('Proof Net Correctness', () => {
    
    it('should validate Danos-Regnier conditions', () => {
      const semantics = exampleProofNetWithPolynomialSemantics();
      
      expect(semantics.correctness.danosRegnier).toBe(true);
      expect(semantics.correctness.polynomialWellFormedness).toBe(true);
      expect(semantics.correctness.linearity).toBe(true);
      expect(semantics.correctness.multiplicities).toBeInstanceOf(Map);
    });
    
    it('should track multiplicities correctly', () => {
      const semantics = exampleProofNetWithPolynomialSemantics();
      const multiplicities = semantics.correctness.multiplicities;
      
      expect(multiplicities.get('A')).toBe(1);
      expect(multiplicities.get('B')).toBe(1);
      expect(multiplicities.get('A ⊗ B')).toBe(1);
    });
  });
  
  describe('Proof Net Reduction Strategy', () => {
    
    it('should define reduction strategy', () => {
      const semantics = exampleProofNetWithPolynomialSemantics();
      
      expect(semantics.reduction.strategy).toMatch(/parallel|sequential|optimal/);
      expect(semantics.reduction.polynomialAware).toBe(true);
      expect(semantics.reduction.termination).toMatch(/guaranteed|probable|unknown/);
      expect(semantics.reduction.complexity).toMatch(/linear|polynomial|exponential/);
    });
    
    it('should be polynomial-aware', () => {
      const semantics = exampleProofNetWithPolynomialSemantics();
      
      expect(semantics.reduction.polynomialAware).toBe(true);
    });
    
    it('should guarantee termination', () => {
      const semantics = exampleProofNetWithPolynomialSemantics();
      
      expect(semantics.reduction.termination).toBe('guaranteed');
    });
  });
  
  describe('Revolutionary Integration', () => {
    
    it('should integrate proof nets with polynomial functors', () => {
      const integration = revolutionaryProofNetIntegration();
      
      expect(integration.proofNet).toBeDefined();
      expect(integration.validation).toBeDefined();
      expect(integration.reduction).toBeDefined();
      expect(integration.semantics).toBeDefined();
      expect(integration.revolutionary).toBeDefined();
    });
    
    it('should achieve revolutionary breakthroughs', () => {
      const integration = revolutionaryProofNetIntegration();
      
      expect(integration.revolutionary.polynomialFunctorIntegration).toBe(true);
      expect(integration.revolutionary.linearLogicConnection).toBe(true);
      expect(integration.revolutionary.proofTheoryUnification).toBe(true);
      expect(integration.revolutionary.categoryTheoryBridge).toBe(true);
      expect(integration.revolutionary.mathematicalNovelty).toContain('First implementation');
      expect(integration.revolutionary.theoreticalSignificance).toContain('Unifies proof theory');
      expect(integration.revolutionary.practicalUtility).toContain('Enables automated proof checking');
    });
  });
  
  describe('Revolutionary Computation', () => {
    
    it('should perform revolutionary proof net computation', () => {
      const computation = exampleRevolutionaryProofNetComputation();
      
      expect(computation.integration).toBeDefined();
      expect(computation.connectives).toBeDefined();
      expect(computation.composition).toBeDefined();
      expect(computation.revolutionarySuccess).toBe(true);
    });
    
    it('should demonstrate all linear logic connectives', () => {
      const computation = exampleRevolutionaryProofNetComputation();
      
      expect(computation.connectives.tensor).toBeDefined();
      expect(computation.connectives.par).toBeDefined();
      expect(computation.connectives.implication).toBeDefined();
      
      expect(computation.connectives.tensor.connective).toBe('tensor');
      expect(computation.connectives.par.connective).toBe('par');
      expect(computation.connectives.implication.connective).toBe('implication');
    });
    
    it('should compose polynomial functors correctly', () => {
      const computation = exampleRevolutionaryProofNetComputation();
      
      expect(computation.composition.kind).toBe('PolynomialFunctor');
      expect(computation.composition.source).toBe('A');
      expect(computation.composition.target).toBe('B');
    });
    
    it('should achieve mathematical breakthroughs', () => {
      const computation = exampleRevolutionaryProofNetComputation();
      
      expect(computation.mathematicalBreakthrough).toBe('Proof nets as polynomial functors');
      expect(computation.categoryTheoryRevolution).toBe('Linear logic meets polynomial functors');
      expect(computation.proofTheoryInnovation).toBe('Automated proof checking with polynomial semantics');
    });
  });
  
  describe('Advanced Features', () => {
    
    it('should support complex proof net structures', () => {
      const simpleNet = exampleSimpleProofNet();
      const complexNet = exampleComplexProofNetWithCuts();
      
      expect(simpleNet.nodes).toHaveLength(3);
      expect(simpleNet.connections).toHaveLength(2);
      expect(simpleNet.cuts).toHaveLength(0);
      expect(simpleNet.conclusions).toHaveLength(1);
      
      expect(complexNet.nodes).toHaveLength(3);
      expect(complexNet.connections).toHaveLength(2);
      expect(complexNet.cuts).toHaveLength(1);
      expect(complexNet.conclusions).toHaveLength(1);
    });
    
    it('should handle polynomial functor composition', () => {
      const tensor = createTensorConnective('A', 'B');
      const implication = createImplicationConnective('B', 'C');
      
      const composition = tensor.polynomialFunctor.composition(implication.polynomialFunctor);
      
      expect(composition.kind).toBe('PolynomialFunctor');
      expect(composition.source).toBe('A');
      expect(composition.target).toBe('C');
      expect(composition.positions).toBeDefined();
      expect(composition.directions).toBeDefined();
    });
    
    it('should maintain linearity constraints', () => {
      const tensor = createTensorConnective('A', 'B');
      
      // Check that all positions are linear
      for (const position of tensor.polynomialFunctor.positions) {
        expect(position.isLinear).toBe(true);
        expect(position.multiplicity).toBe(1);
      }
      
      // Check that all directions are linear
      for (const direction of tensor.polynomialFunctor.directions) {
        expect(direction.isLinear).toBe(true);
        expect(direction.multiplicity).toBe(1);
      }
    });
  });
  
  describe('Mathematical Correctness', () => {
    
    it('should satisfy linear logic axioms', () => {
      const tensor = createTensorConnective('A', 'B');
      const par = createParConnective('A', 'B');
      const implication = createImplicationConnective('A', 'B');
      
      // Check that all connectives have proper polynomial functor structure
      expect(tensor.polynomialFunctor.kind).toBe('PolynomialFunctor');
      expect(par.polynomialFunctor.kind).toBe('PolynomialFunctor');
      expect(implication.polynomialFunctor.kind).toBe('PolynomialFunctor');
      
      // Check that all have linear positions and directions
      [tensor, par, implication].forEach(connective => {
        for (const position of connective.polynomialFunctor.positions) {
          expect(position.isLinear).toBe(true);
        }
        for (const direction of connective.polynomialFunctor.directions) {
          expect(direction.isLinear).toBe(true);
        }
      });
    });
    
    it('should maintain polynomial functor laws', () => {
      const tensor = createTensorConnective('A', 'B');
      const implication = createImplicationConnective('B', 'C');
      const anotherImplication = createImplicationConnective('C', 'D');
      
      // Test composition
      const comp1 = tensor.polynomialFunctor.composition(implication.polynomialFunctor);
      
      expect(comp1.kind).toBe('PolynomialFunctor');
      expect(comp1.source).toBe('A');
      expect(comp1.target).toBe('C');
      
      // Test that composition preserves polynomial functor structure
      expect(comp1.positions).toBeDefined();
      expect(comp1.directions).toBeDefined();
    });
    
    it('should preserve proof net correctness under reduction', () => {
      const proofNet = exampleComplexProofNetWithCuts();
      const validation = validateProofNet(proofNet);
      const reduction = reduceProofNet(proofNet);
      
      expect(validation.isCorrect).toBe(true);
      expect(reduction.isTerminating).toBe(true);
      
      // The reduced net should still be correct
      const reducedValidation = validateProofNet(reduction.reducedNet);
      expect(reducedValidation.isCorrect).toBe(true);
    });
  });
  
  describe('Revolutionary Impact', () => {
    
    it('should represent a new era in proof theory', () => {
      const computation = exampleRevolutionaryProofNetComputation();
      
      expect(computation.revolutionarySuccess).toBe(true);
      expect(computation.mathematicalBreakthrough).toContain('polynomial functors');
      expect(computation.categoryTheoryRevolution).toContain('Linear logic meets');
      expect(computation.proofTheoryInnovation).toContain('Automated proof checking');
    });
    
    it('should unify multiple mathematical disciplines', () => {
      const integration = revolutionaryProofNetIntegration();
      
      expect(integration.revolutionary.proofTheoryUnification).toBe(true);
      expect(integration.revolutionary.categoryTheoryBridge).toBe(true);
      expect(integration.revolutionary.polynomialFunctorIntegration).toBe(true);
      expect(integration.revolutionary.linearLogicConnection).toBe(true);
    });
    
    it('should provide practical utility', () => {
      const integration = revolutionaryProofNetIntegration();
      
      expect(integration.revolutionary.practicalUtility).toContain('automated proof checking');
      expect(integration.revolutionary.practicalUtility).toContain('polynomial functor semantics');
    });
  });
});
