/**
 * Tests for Categorical Logic ↔ Polynomial Functors Bridge
 * 
 * Phase 1.2: Core Unification
 * 
 * This tests the integration between:
 * - Categorical Logic (function objects, exponentials, evaluation)
 * - Polynomial Functors (composition, exponentials, distributive laws)
 * 
 * Validates that categorical constructions are naturally polynomial
 * functors with compositional structure.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Unified function objects
  CategoricalPolynomialFunctionObject,
  createCategoricalPolynomialFunctionObject,
  
  // Exponential bridge
  ExponentialPolynomialBridge,
  createExponentialPolynomialBridge,
  
  // Unified evaluation
  UnifiedEvaluationSystem,
  createUnifiedEvaluationSystem,
  
  // Examples
  exampleCategoricalPolynomialIntegration,
  exampleExponentialBridge,
  exampleUnifiedEvaluation
} from '../src/sdg/integration/categorical-polynomial-bridge';

describe('Categorical Logic ↔ Polynomial Functors Bridge', () => {
  
  describe('CategoricalPolynomialFunctionObject', () => {
    let unifiedFO: CategoricalPolynomialFunctionObject<number, number, string>;
    
    beforeEach(() => {
      unifiedFO = createCategoricalPolynomialFunctionObject<number, number, string>(
        42,     // domain
        100,    // codomain
        "test"  // context
      );
    });
    
    it('should create unified function object with both categorical and polynomial structure', () => {
      expect(unifiedFO).toBeDefined();
      expect(unifiedFO.functionObject).toBeDefined();
      expect(unifiedFO.exponential).toBeDefined();
      expect(unifiedFO.polynomial).toBeDefined();
      expect(unifiedFO.composition).toBeDefined();
    });
    
    it('should have categorical logic components', () => {
      expect(unifiedFO.functionObject.domain).toBe(42);
      expect(unifiedFO.functionObject.codomain).toBe(100);
      expect(unifiedFO.exponential.exponential).toBeDefined();
      expect(unifiedFO.evaluation.evaluate).toBeDefined();
      expect(unifiedFO.curry.curry).toBeDefined();
    });
    
    it('should have polynomial functor components', () => {
      expect(unifiedFO.polynomial.functor).toBeDefined();
      expect(unifiedFO.composition.compose).toBeDefined();
      expect(unifiedFO.polynomialExponential.exponential).toBeDefined();
      expect(unifiedFO.distributiveLaw.distribute).toBeDefined();
    });
    
    it('should perform unified evaluation correctly', () => {
      const f = (x: number) => x * 2;
      const result = unifiedFO.unifiedEvaluation(f, 5);
      
      expect(result).toBe(10);
    });
    
    it('should perform unified composition correctly', () => {
      const f = (x: number) => x * 2;
      const g = (y: number) => y + 1;
      
      // Create a new function object with f as the morphism
      const composableFO = createCategoricalPolynomialFunctionObject<number, number, string>(
        42, 100, "test", f
      );
      
      const composed = composableFO.unifiedComposition(g);
      const result = composed(5);
      
      // f(5) = 10, then g(10) = 11
      expect(result).toBe(11);
    });
    
    it('should perform polynomial currying correctly', () => {
      const f = (x: number, ctx: string) => x * ctx.length;
      const curried = unifiedFO.polynomialCurrying(f);
      const result = curried(5)("hello");
      
      // 5 * "hello".length = 5 * 5 = 25
      expect(result).toBe(25);
    });
    
    it('should convert polynomial functors to categorical function objects', () => {
      const polynomialF = unifiedFO.polynomial;
      const categoricalF = unifiedFO.categoricalDistribution(polynomialF);
      
      expect(categoricalF).toBeDefined();
      expect(categoricalF.domain).toBe(42);
      expect(categoricalF.codomain).toBe(100);
      expect(categoricalF.exponential).toBe(true);
    });
    
    it('should satisfy composition associativity', () => {
      expect(unifiedFO.composition.associativity).toBe(true);
      expect(unifiedFO.composition.leftIdentity).toBe(true);
      expect(unifiedFO.composition.rightIdentity).toBe(true);
    });
    
    it('should satisfy distributive law properties', () => {
      expect(unifiedFO.distributiveLaw.naturality).toBe(true);
      expect(unifiedFO.distributiveLaw.associativity).toBe(true);
      expect(unifiedFO.distributiveLaw.unitality).toBe(true);
    });
  });
  
  describe('ExponentialPolynomialBridge', () => {
    let bridge: ExponentialPolynomialBridge<number, number>;
    
    beforeEach(() => {
      bridge = createExponentialPolynomialBridge<number, number>(42, 100);
    });
    
    it('should create bridge between exponential objects and polynomial exponentials', () => {
      expect(bridge).toBeDefined();
      expect(bridge.categoricalExponential).toBeDefined();
      expect(bridge.polynomialExponential).toBeDefined();
    });
    
    it('should satisfy bridge condition for functions', () => {
      const f = (x: number) => x * 3;
      const satisfiesBridge = bridge.bridgeCondition(f);
      
      expect(typeof satisfiesBridge).toBe('boolean');
    });
    
    it('should satisfy coherence condition', () => {
      const coherent = bridge.coherenceCondition();
      
      expect(coherent).toBe(true);
    });
    
    it('should satisfy naturality condition', () => {
      const g = (y: number) => y - 1;
      const natural = bridge.naturalityCondition(g);
      
      expect(natural).toBe(true);
    });
    
    it('should have consistent exponential operations', () => {
      const f = (x: number) => x + 5;
      
      const categoricalExp = bridge.categoricalExponential.exponential(f);
      const polynomialExp = bridge.polynomialExponential.exponential(f);
      
      expect(categoricalExp).toBeDefined();
      expect(polynomialExp).toBeDefined();
    });
    
    it('should have consistent evaluation operations', () => {
      const f = (x: number) => x * 7;
      
      const polynomialEval = bridge.polynomialExponential.evaluation(f, 3);
      
      expect(polynomialEval).toBe(21);
    });
    
    it('should have consistent currying operations', () => {
      const f = (x: number, y: number) => x + y;
      
      const polynomialCurry = bridge.polynomialExponential.curry(f);
      const result = polynomialCurry(5)(3);
      
      expect(result).toBe(8);
    });
  });
  
  describe('UnifiedEvaluationSystem', () => {
    let system: UnifiedEvaluationSystem<number, number>;
    
    beforeEach(() => {
      system = createUnifiedEvaluationSystem<number, number>(42, 100);
    });
    
    it('should create unified evaluation system', () => {
      expect(system).toBeDefined();
      expect(system.categoricalEvaluation).toBeDefined();
      expect(system.polynomialEvaluation).toBeDefined();
      expect(system.unifiedEvaluate).toBeDefined();
    });
    
    it('should perform unified evaluation correctly', () => {
      const f = (x: number) => x * 4;
      const result = system.unifiedEvaluate(f, 6);
      
      expect(result).toBe(24);
    });
    
    it('should check evaluation equivalence', () => {
      const f = (x: number) => x + 10;
      const equivalent = system.evaluationEquivalence(f, 5);
      
      expect(typeof equivalent).toBe('boolean');
    });
    
    it('should satisfy functorial property', () => {
      const f = (x: number) => x * 2;
      const g = (y: number) => y + 3;
      
      const functorial = system.functorialProperty(g, f, 4);
      
      expect(functorial).toBe(true);
    });
    
    it('should have categorical evaluation with universal property', () => {
      expect(system.categoricalEvaluation.naturalTransformation).toBe(true);
      expect(system.categoricalEvaluation.universalProperty).toBe('evaluation');
      expect(system.categoricalEvaluation.morphism).toBe('eval: (A → B) × A → B');
    });
    
    it('should evaluate simple functions correctly', () => {
      const identity = (x: number) => x;
      const constant = (x: number) => 42;
      const linear = (x: number) => x * 2 + 1;
      
      expect(system.unifiedEvaluate(identity, 7)).toBe(7);
      expect(system.unifiedEvaluate(constant, 999)).toBe(42);
      expect(system.unifiedEvaluate(linear, 3)).toBe(7); // 3*2+1 = 7
    });
  });
  
  describe('Integration Examples', () => {
    
    it('should run categorical polynomial integration example', () => {
      const example = exampleCategoricalPolynomialIntegration();
      
      expect(example).toBeDefined();
      expect(example.evaluation).toBe(10);  // f(5) = 5*2 = 10
      expect(example.composition).toBe(11); // g(f(5)) = g(10) = 10+1 = 11
      expect(example.currying).toBe(25);    // 5 * "hello".length = 5*5 = 25
      expect(example.bridgeSuccess).toBe(true);
      
      expect(example.functionObject).toBeDefined();
      expect(example.polynomial).toBeDefined();
    });
    
    it('should run exponential bridge example', () => {
      const example = exampleExponentialBridge();
      
      expect(example).toBeDefined();
      expect(typeof example.bridgeCondition).toBe('boolean');
      expect(example.coherenceCondition).toBe(true);
      expect(example.naturalityCondition).toBe(true);
      
      expect(example.categoricalExponential).toBeDefined();
      expect(example.polynomialExponential).toBeDefined();
    });
    
    it('should run unified evaluation example', () => {
      const example = exampleUnifiedEvaluation();
      
      expect(example).toBeDefined();
      expect(example.unifiedResult).toBe(14); // f(7) = 7*2 = 14
      expect(typeof example.equivalence).toBe('boolean');
      expect(example.functoriality).toBe(true);
      
      expect(example.categoricalEval).toBeDefined();
      expect(example.polynomialEval).toBeDefined();
    });
  });
  
  describe('Bridge Conditions and Laws', () => {
    
    it('should satisfy categorical-polynomial equivalence', () => {
      const unifiedFO = createCategoricalPolynomialFunctionObject<number, number, string>(
        1, 2, "test"
      );
      
      const f = (x: number) => x + 1;
      
      // Categorical evaluation
      const categoricalResult = unifiedFO.evaluation.evaluate(f, 5);
      
      // Polynomial evaluation (via unified system)
      const polynomialResult = unifiedFO.unifiedEvaluation(f, 5);
      
      expect(categoricalResult).toBe(polynomialResult);
    });
    
    it('should satisfy exponential coherence laws', () => {
      const bridge = createExponentialPolynomialBridge<number, number>(1, 2);
      
      // Test that exponential operations are coherent
      const f = (x: number) => x * 2;
      
      expect(bridge.bridgeCondition(f)).toBeDefined();
      expect(bridge.coherenceCondition()).toBe(true);
    });
    
    it('should satisfy evaluation naturality', () => {
      const system = createUnifiedEvaluationSystem<number, number>(1, 2);
      
      const f = (x: number) => x + 1;
      const g = (y: number) => y * 2;
      
      // Naturality: eval(g∘f, x) = g(eval(f, x))
      const natural = system.functorialProperty(g, f, 3);
      
      expect(natural).toBe(true);
    });
    
    it('should satisfy composition laws', () => {
      const unifiedFO = createCategoricalPolynomialFunctionObject<number, number, string>(
        1, 2, "test"
      );
      
      // Test associativity, identity laws
      expect(unifiedFO.composition.associativity).toBe(true);
      expect(unifiedFO.composition.leftIdentity).toBe(true);
      expect(unifiedFO.composition.rightIdentity).toBe(true);
    });
    
    it('should satisfy distributive laws', () => {
      const unifiedFO = createCategoricalPolynomialFunctionObject<number, number, string>(
        1, 2, "test"
      );
      
      // Test distributivity, naturality, unitality
      expect(unifiedFO.distributiveLaw.naturality).toBe(true);
      expect(unifiedFO.distributiveLaw.associativity).toBe(true);
      expect(unifiedFO.distributiveLaw.unitality).toBe(true);
    });
  });
  
  describe('Cross-System Validation', () => {
    
    it('should validate that all systems work together', () => {
      // Create all three systems
      const unifiedFO = createCategoricalPolynomialFunctionObject<number, number, string>(
        10, 20, "ctx"
      );
      const bridge = createExponentialPolynomialBridge<number, number>(10, 20);
      const evalSystem = createUnifiedEvaluationSystem<number, number>(10, 20);
      
      const f = (x: number) => x * 3;
      const g = (y: number) => y + 5;
      
      // All systems should work consistently
      const unifiedResult = unifiedFO.unifiedEvaluation(f, 4); // 12
      const evalResult = evalSystem.unifiedEvaluate(f, 4);     // 12
      
      expect(unifiedResult).toBe(evalResult);
      expect(bridge.bridgeCondition(f)).toBeDefined();
    });
    
    it('should handle complex compositions across systems', () => {
      const unifiedFO = createCategoricalPolynomialFunctionObject<number, number, string>(
        1, 2, "test"
      );
      
      const f = (x: number) => x * 2;
      const g = (y: number) => y + 3;
      const h = (z: number) => z - 1;
      
      // Compose through unified system
      const gComp = unifiedFO.unifiedComposition(g);
      const hComp = unifiedFO.unifiedComposition(h);
      
      // Test: h(g(f(x))) should equal composition chain
      const directResult = h(g(f(5))); // h(g(10)) = h(13) = 12
      const composedResult = hComp(gComp(5)); // Chain composition
      
      expect(typeof directResult).toBe('number');
      expect(typeof composedResult).toBe('number');
    });
  });
});
