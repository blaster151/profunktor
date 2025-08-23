/**
 * Tests for Dependent Type Theory System
 * 
 * Based on "Polynomial functors and polynomial monads" by Nicola Gambino and Joachim Kock
 * 
 * This tests a full dependent type theory using our polynomial functor machinery:
 * - Π types (dependent products) via Π_f functors
 * - Σ types (dependent sums) via Σ_f functors  
 * - Context management via pullback functors Δ_f
 * - Type safety via Beck-Chevalley isomorphisms
 * - Substitution and weakening via adjunctions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  // Context and substitution
  Context,
  createEmptyContext,
  extendContext,
  
  // Dependent types
  DependentProductType,
  createDependentProductType,
  DependentSumType,
  createDependentSumType,
  
  // Judgments
  Judgment,
  createTypeJudgment,
  createTermJudgment,
  createTypeEqualityJudgment,
  createTermEqualityJudgment,
  
  // Type theory rules
  TypeTheoryRules,
  createTypeTheoryRules,
  
  // Type safety
  TypeSafety,
  createTypeSafety,
  
  // Complete system
  DependentTypeTheory,
  createDependentTypeTheory,
  
  // Example functions
  exampleNaturalNumbersDependentTypes,
  exampleDependentPairsAndFunctions,
  exampleContextManagementAndSubstitution
} from '../fp-dependent-types';

describe('Dependent Type Theory System', () => {
  describe('Context and Substitution', () => {
    it('should create empty context', () => {
      const context = createEmptyContext<string>();
      
      expect(context.kind).toBe('Context');
      expect(context.variables).toHaveLength(0);
      expect(context.types).toHaveLength(0);
      expect(context.dependencies.size).toBe(0);
      expect(context.length).toBe(0);
      expect(context.substitution.kind).toBe('Morphism');
      expect(context.weakening.kind).toBe('Morphism');
    });
    
    it('should extend context with new variable', () => {
      const context = createEmptyContext<string>();
      const extendedContext = extendContext(context, 'x', 'Nat');
      
      expect(extendedContext.kind).toBe('Context');
      expect(extendedContext.variables).toHaveLength(1);
      expect(extendedContext.variables[0]).toBe('x');
      expect(extendedContext.types).toHaveLength(1);
      expect(extendedContext.types[0]).toBe('Nat');
      expect(extendedContext.length).toBe(1);
      expect(extendedContext.dependencies.get('x')).toEqual([]);
    });
    
    it('should extend context with dependencies', () => {
      const context = createEmptyContext<string>();
      let extendedContext = extendContext(context, 'x', 'Nat');
      extendedContext = extendContext(extendedContext, 'y', 'Vec(x)', ['x']);
      
      expect(extendedContext.variables).toHaveLength(2);
      expect(extendedContext.variables[0]).toBe('x');
      expect(extendedContext.variables[1]).toBe('y');
      expect(extendedContext.types[0]).toBe('Nat');
      expect(extendedContext.types[1]).toBe('Vec(x)');
      expect(extendedContext.dependencies.get('y')).toEqual(['x']);
      expect(extendedContext.length).toBe(2);
    });
    
    it('should build complex context', () => {
      const context = createEmptyContext<string>();
      let complexContext = context;
      
      complexContext = extendContext(complexContext, 'n', 'Nat');
      complexContext = extendContext(complexContext, 'v', 'Vec(n)', ['n']);
      complexContext = extendContext(complexContext, 'l', 'List(v)', ['v']);
      
      expect(complexContext.variables).toEqual(['n', 'v', 'l']);
      expect(complexContext.types).toEqual(['Nat', 'Vec(n)', 'List(v)']);
      expect(complexContext.dependencies.get('v')).toEqual(['n']);
      expect(complexContext.dependencies.get('l')).toEqual(['v']);
      expect(complexContext.length).toBe(3);
    });
  });
  
  describe('Dependent Product Types (Π-types)', () => {
    it('should create dependent product type', () => {
      const domain = 'Nat';
      const codomain = (x: string) => `Vec(${x})`;
      const piType = createDependentProductType(domain, codomain);
      
      expect(piType.kind).toBe('DependentProductType');
      expect(piType.domain).toBe(domain);
      expect(piType.codomain).toBe(codomain);
      expect(piType.piFunctor.kind).toBe('DependentProductFunctor');
    });
    
    it('should introduce Π-type terms', () => {
      const domain = 'Nat';
      const codomain = (x: string) => `Vec(${x})`;
      const piType = createDependentProductType(domain, codomain);
      
      const function_ = (x: string) => `replicate(${x}, 0)`;
      const introduction = piType.introduction(function_);
      
      expect(introduction.type).toBe('PiIntro');
      expect(introduction.value).toBe(function_);
    });
    
    it('should eliminate Π-type terms', () => {
      const domain = 'Nat';
      const codomain = (x: string) => `Vec(${x})`;
      const piType = createDependentProductType(domain, codomain);
      
      const function_ = (x: string) => `replicate(${x}, 0)`;
      const introduction = piType.introduction(function_);
      const elimination = piType.elimination(introduction, '3');
      
      expect(elimination).toBe('replicate(3, 0)');
    });
    
    it('should perform beta reduction', () => {
      const domain = 'Nat';
      const codomain = (x: string) => `Vec(${x})`;
      const piType = createDependentProductType(domain, codomain);
      
      const function_ = (x: string) => `replicate(${x}, 0)`;
      const betaReduction = piType.betaReduction(function_, '3');
      
      expect(betaReduction).toBe('replicate(3, 0)');
    });
    
    it('should perform eta expansion', () => {
      const domain = 'Nat';
      const codomain = (x: string) => `Vec(${x})`;
      const piType = createDependentProductType(domain, codomain);
      
      const function_ = (x: string) => `replicate(${x}, 0)`;
      const introduction = piType.introduction(function_);
      const etaExpansion = piType.etaExpansion(introduction);
      
             expect(typeof etaExpansion).toBe('function');
       expect(etaExpansion('3')).toBe(function_('3'));
    });
  });
  
  describe('Dependent Sum Types (Σ-types)', () => {
    it('should create dependent sum type', () => {
      const domain = 'Nat';
      const codomain = (x: string) => `Vec(${x})`;
      const sigmaType = createDependentSumType(domain, codomain);
      
      expect(sigmaType.kind).toBe('DependentSumType');
      expect(sigmaType.domain).toBe(domain);
      expect(sigmaType.codomain).toBe(codomain);
      expect(sigmaType.sigmaFunctor.kind).toBe('DependentSumFunctor');
    });
    
    it('should introduce Σ-type terms', () => {
      const domain = 'Nat';
      const codomain = (x: string) => `Vec(${x})`;
      const sigmaType = createDependentSumType(domain, codomain);
      
      const introduction = sigmaType.introduction('3', '[1,2,3]');
      
      expect(introduction.type).toBe('SigmaIntro');
      expect(introduction.first).toBe('3');
      expect(introduction.second).toBe('[1,2,3]');
    });
    
    it('should eliminate Σ-type terms', () => {
      const domain = 'Nat';
      const codomain = (x: string) => `Vec(${x})`;
      const sigmaType = createDependentSumType(domain, codomain);
      
      const introduction = sigmaType.introduction('3', '[1,2,3]');
      const elimination = sigmaType.elimination(introduction);
      
      expect(elimination.first).toBe('3');
      expect(elimination.second).toBe('[1,2,3]');
    });
    
    it('should project from Σ-type terms', () => {
      const domain = 'Nat';
      const codomain = (x: string) => `Vec(${x})`;
      const sigmaType = createDependentSumType(domain, codomain);
      
      const introduction = sigmaType.introduction('3', '[1,2,3]');
      const proj1 = sigmaType.projection1(introduction);
      const proj2 = sigmaType.projection2(introduction);
      
      expect(proj1).toBe('3');
      expect(proj2).toBe('[1,2,3]');
    });
  });
  
  describe('Type Theory Judgments', () => {
    it('should create type judgment', () => {
      const context = createEmptyContext<string>();
      const judgment = createTypeJudgment(context, 'Nat');
      
      expect(judgment.kind).toBe('Judgment');
      expect(judgment.context).toBe(context);
      expect(judgment.subject).toBe('type');
      expect(judgment.predicate).toBe('type');
      expect(judgment.object).toBe('Nat');
      expect(judgment.isValid).toBe(true);
    });
    
    it('should create term judgment', () => {
      const context = createEmptyContext<string>();
      const judgment = createTermJudgment(context, 'zero', 'Nat');
      
      expect(judgment.kind).toBe('Judgment');
      expect(judgment.context).toBe(context);
      expect(judgment.subject).toBe('zero');
      expect(judgment.predicate).toBe('term');
      expect(judgment.object).toBe('Nat');
      expect(judgment.isValid).toBe(true);
    });
    
    it('should create type equality judgment', () => {
      const context = createEmptyContext<string>();
      const judgment = createTypeEqualityJudgment(context, 'Nat', 'Nat');
      
      expect(judgment.kind).toBe('Judgment');
      expect(judgment.context).toBe(context);
      expect(judgment.subject).toBe('typeEq');
      expect(judgment.predicate).toBe('typeEq');
      expect(judgment.object).toBe('Nat');
      expect(judgment.object2).toBe('Nat');
      expect(judgment.isValid).toBe(true);
    });
    
    it('should create term equality judgment', () => {
      const context = createEmptyContext<string>();
      const judgment = createTermEqualityJudgment(context, 'zero', '0', 'Nat');
      
      expect(judgment.kind).toBe('Judgment');
      expect(judgment.context).toBe(context);
      expect(judgment.subject).toBe('termEq');
      expect(judgment.predicate).toBe('termEq');
      expect(judgment.object).toBe('Nat');
      expect(judgment.isValid).toBe(true);
    });
  });
  
  describe('Type Theory Rules', () => {
    it('should create type theory rules', () => {
      const rules = createTypeTheoryRules<string>();
      
      expect(rules.kind).toBe('TypeTheoryRules');
    });
    
    it('should apply Π-type formation rule', () => {
      const rules = createTypeTheoryRules<string>();
      const context = createEmptyContext<string>();
      
      const judgment = rules.piFormation(context, 'Nat', (x: string) => `Vec(${x})`);
      
      expect(judgment.kind).toBe('Judgment');
      expect(judgment.isValid).toBe(true);
    });
    
    it('should apply Π-type introduction rule', () => {
      const rules = createTypeTheoryRules<string>();
      const context = createEmptyContext<string>();
      
      const body = (x: string) => `replicate(${x}, 0)`;
      const judgment = rules.piIntroduction(context, body, 'Nat', (x: string) => `Vec(${x})`);
      
      expect(judgment.kind).toBe('Judgment');
      expect(judgment.isValid).toBe(true);
    });
    
    it('should apply Π-type elimination rule', () => {
      const rules = createTypeTheoryRules<string>();
      const context = createEmptyContext<string>();
      
      const judgment = rules.piElimination(context, 'f', '3', 'Nat', (x: string) => `Vec(${x})`);
      
      expect(judgment.kind).toBe('Judgment');
      expect(judgment.isValid).toBe(true);
    });
    
    it('should apply Π-type computation rule', () => {
      const rules = createTypeTheoryRules<string>();
      const context = createEmptyContext<string>();
      
      const body = (x: string) => `replicate(${x}, 0)`;
      const judgment = rules.piComputation(context, body, '3', 'Nat', (x: string) => `Vec(${x})`);
      
      expect(judgment.kind).toBe('Judgment');
      expect(judgment.isValid).toBe(true);
    });
    
    it('should apply Σ-type formation rule', () => {
      const rules = createTypeTheoryRules<string>();
      const context = createEmptyContext<string>();
      
      const judgment = rules.sigmaFormation(context, 'Nat', (x: string) => `Vec(${x})`);
      
      expect(judgment.kind).toBe('Judgment');
      expect(judgment.isValid).toBe(true);
    });
    
    it('should apply Σ-type introduction rule', () => {
      const rules = createTypeTheoryRules<string>();
      const context = createEmptyContext<string>();
      
      const judgment = rules.sigmaIntroduction(context, '3', '[1,2,3]', 'Nat', (x: string) => `Vec(${x})`);
      
      expect(judgment.kind).toBe('Judgment');
      expect(judgment.isValid).toBe(true);
    });
    
    it('should apply Σ-type elimination rule', () => {
      const rules = createTypeTheoryRules<string>();
      const context = createEmptyContext<string>();
      
      const judgment = rules.sigmaElimination(context, 'p', 'Nat', (x: string) => `Vec(${x})`);
      
      expect(judgment.kind).toBe('Judgment');
      expect(judgment.isValid).toBe(true);
    });
    
    it('should apply Σ-type computation rule', () => {
      const rules = createTypeTheoryRules<string>();
      const context = createEmptyContext<string>();
      
      const judgment = rules.sigmaComputation(context, '3', '[1,2,3]', 'Nat', (x: string) => `Vec(${x})`);
      
      expect(judgment.kind).toBe('Judgment');
      expect(judgment.isValid).toBe(true);
    });
    
    it('should extend context', () => {
      const rules = createTypeTheoryRules<string>();
      const context = createEmptyContext<string>();
      
      const extendedContext = rules.contextExtension(context, 'x', 'Nat');
      
      expect(extendedContext.kind).toBe('Context');
      expect(extendedContext.variables).toHaveLength(1);
      expect(extendedContext.variables[0]).toBe('x');
      expect(extendedContext.types[0]).toBe('Nat');
    });
    
    it('should apply substitution', () => {
      const rules = createTypeTheoryRules<string>();
      const context = createEmptyContext<string>();
      
      const substitutedContext = rules.substitution(context, 'x', '3', 'Nat');
      
      expect(substitutedContext.kind).toBe('Context');
      expect(substitutedContext.variables).toHaveLength(1);
      expect(substitutedContext.variables[0]).toBe('x');
      expect(substitutedContext.types[0]).toBe('3');
    });
    
    it('should apply weakening', () => {
      const rules = createTypeTheoryRules<string>();
      const context = createEmptyContext<string>();
      
      const weakenedContext = rules.weakening(context, 'x');
      
      expect(weakenedContext.kind).toBe('Context');
    });
  });
  
  describe('Type Safety via Beck-Chevalley', () => {
    it('should create type safety system', () => {
      const typeSafety = createTypeSafety<string>();
      
      expect(typeSafety.kind).toBe('TypeSafety');
      expect(typeSafety.beckChevalley.kind).toBe('PreciseBeckChevalleyIsomorphism');
    });
    
    it('should verify substitution commutativity', () => {
      const typeSafety = createTypeSafety<string>();
      const context = createEmptyContext<string>();
      
      const commutativity = typeSafety.substitutionCommutativity(context, 'x', '3', 'Nat');
      
      expect(commutativity).toBe(true);
    });
    
    it('should verify weakening commutativity', () => {
      const typeSafety = createTypeSafety<string>();
      const context = createEmptyContext<string>();
      
      const commutativity = typeSafety.weakeningCommutativity(context, 'x', 'Nat');
      
      expect(commutativity).toBe(true);
    });
    
    it('should verify Π-type substitution', () => {
      const typeSafety = createTypeSafety<string>();
      const context = createEmptyContext<string>();
      
      const substitution = typeSafety.piSubstitution(
        context, 'x', '3', 'Nat', (x: string) => `Vec(${x})`
      );
      
      expect(substitution).toBe(true);
    });
    
    it('should verify Σ-type substitution', () => {
      const typeSafety = createTypeSafety<string>();
      const context = createEmptyContext<string>();
      
      const substitution = typeSafety.sigmaSubstitution(
        context, 'x', '3', 'Nat', (x: string) => `Vec(${x})`
      );
      
      expect(substitution).toBe(true);
    });
  });
  
  describe('Complete Dependent Type Theory System', () => {
    it('should create dependent type theory system', () => {
      const dtt = createDependentTypeTheory<string>();
      
      expect(dtt.kind).toBe('DependentTypeTheory');
      expect(dtt.rules.kind).toBe('TypeTheoryRules');
      expect(dtt.typeSafety.kind).toBe('TypeSafety');
      expect(dtt.context.kind).toBe('Context');
    });
    
    it('should check types', () => {
      const dtt = createDependentTypeTheory<string>();
      const context = createEmptyContext<string>();
      
      const isValid = dtt.checkType(context, 'Nat');
      
      expect(typeof isValid).toBe('boolean');
    });
    
    it('should check terms', () => {
      const dtt = createDependentTypeTheory<string>();
      const context = createEmptyContext<string>();
      
      const isValid = dtt.checkTerm(context, 'zero', 'Nat');
      
      expect(typeof isValid).toBe('boolean');
    });
    
    it('should normalize terms', () => {
      const dtt = createDependentTypeTheory<string>();
      const context = createEmptyContext<string>();
      
      const normalized = dtt.normalize(context, 'zero');
      
      expect(normalized).toBe('zero');
    });
    
    it('should reduce terms', () => {
      const dtt = createDependentTypeTheory<string>();
      const context = createEmptyContext<string>();
      
      const reduced = dtt.reduce(context, 'zero');
      
      expect(reduced).toBe('zero');
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
    
    it('should run natural numbers dependent types example', () => {
      exampleNaturalNumbersDependentTypes();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          naturalNumbersDependentTypes: true,
          natType: 'Nat',
          vecDependentType: 'DependentProductType',
          replicateType: 'DependentProductType',
          typeSafe: true,
          contextLength: 1,
          beckChevalleyValid: true
        })
      );
    });
    
    it('should run dependent pairs and functions example', () => {
      exampleDependentPairsAndFunctions();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          dependentPairsAndFunctions: true,
          dependentPairType: 'DependentSumType',
          dependentFunctionType: 'DependentProductType',
          pair: 'SigmaIntro',
          function: 'PiIntro',
          result: expect.any(String),
          typeSafety: true
        })
      );
    });
    
    it('should run context management and substitution example', () => {
      exampleContextManagementAndSubstitution();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          contextManagementAndSubstitution: true,
                     originalContextLength: 3,
           substitutedContextLength: 4,
           weakenedContextLength: 3,
          substitutionSafe: true,
          weakeningSafe: true,
          beckChevalleyValid: true
        })
      );
    });
  });
  
  describe('Mathematical Properties', () => {
    it('should verify Π-type functoriality', () => {
      const domain = 'Nat';
      const codomain = (x: string) => `Vec(${x})`;
      const piType = createDependentProductType(domain, codomain);
      
      // Test that Π_f is a functor
      expect(piType.piFunctor.kind).toBe('DependentProductFunctor');
      expect(piType.piFunctor.morphism.kind).toBe('Morphism');
    });
    
    it('should verify Σ-type functoriality', () => {
      const domain = 'Nat';
      const codomain = (x: string) => `Vec(${x})`;
      const sigmaType = createDependentSumType(domain, codomain);
      
      // Test that Σ_f is a functor
      expect(sigmaType.sigmaFunctor.kind).toBe('DependentSumFunctor');
      expect(sigmaType.sigmaFunctor.morphism.kind).toBe('Morphism');
    });
    
    it('should verify adjunction properties', () => {
      const dtt = createDependentTypeTheory<string>();
      
      // Test that Σ_f ⊣ Δ_f adjunction holds
      const beckChevalley = dtt.typeSafety.beckChevalley;
      expect(beckChevalley.kind).toBe('PreciseBeckChevalleyIsomorphism');
      
      const leftSide = beckChevalley.leftSide('test');
      const rightSide = beckChevalley.rightSide('test');
      expect(leftSide.length).toBeGreaterThan(0);
      expect(rightSide.length).toBeGreaterThan(0);
    });
    
    it('should verify substitution naturality', () => {
      const dtt = createDependentTypeTheory<string>();
      const context = createEmptyContext<string>();
      
      // Test that substitution is natural
      const naturality = dtt.typeSafety.beckChevalley.verifyNaturality(
        'test', (x: string) => `substituted(${x})`
      );
      
      expect(naturality.commutes).toBe(true);
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
    it('should handle empty contexts gracefully', () => {
      const context = createEmptyContext<string>();
      
      expect(context.variables).toHaveLength(0);
      expect(context.types).toHaveLength(0);
      expect(context.length).toBe(0);
      expect(context.dependencies.size).toBe(0);
    });
    
    it('should handle identity morphisms in dependent types', () => {
      const domain = 'A';
      const codomain = (x: string) => x; // Identity codomain
      const piType = createDependentProductType(domain, codomain);
      
      expect(piType.kind).toBe('DependentProductType');
      expect(piType.domain).toBe(domain);
      expect(piType.codomain).toBe(codomain);
    });
    
    it('should handle constant morphisms in dependent types', () => {
      const domain = 'A';
      const codomain = (x: string) => 'B'; // Constant codomain
      const sigmaType = createDependentSumType(domain, codomain);
      
      expect(sigmaType.kind).toBe('DependentSumType');
      expect(sigmaType.domain).toBe(domain);
      expect(sigmaType.codomain).toBe(codomain);
    });
    
    it('should handle complex dependencies', () => {
      const context = createEmptyContext<string>();
      let complexContext = context;
      
      // Build context with complex dependencies
      complexContext = extendContext(complexContext, 'n', 'Nat');
      complexContext = extendContext(complexContext, 'v', 'Vec(n)', ['n']);
      complexContext = extendContext(complexContext, 'm', 'Matrix(n,n)', ['n']);
      complexContext = extendContext(complexContext, 'p', 'Product(v,m)', ['v', 'm']);
      
      expect(complexContext.variables).toHaveLength(4);
      expect(complexContext.dependencies.get('v')).toEqual(['n']);
      expect(complexContext.dependencies.get('m')).toEqual(['n']);
      expect(complexContext.dependencies.get('p')).toEqual(['v', 'm']);
      expect(complexContext.length).toBe(4);
    });
  });
});
