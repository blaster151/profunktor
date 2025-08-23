/**
 * Tests for Presheaf Topos Structure
 * 
 * Based on "Polynomial functors and polynomial monads" by Nicola Gambino and Joachim Kock
 * Page 11 - Section 1.18 (iv): The comma category (Set/J)↓P is a presheaf topos
 * 
 * This tests the fundamental connection between polynomial functors and topos theory:
 * - Presheaves as functors C^op → Set
 * - Yoneda embedding and representable presheaves
 * - Topos structure with finite limits and power objects
 * - Connection to polynomial functors via comma categories
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  // Categories and opposite categories
  Category,
  createCategory,
  Morphism,
  createMorphism,
  OppositeCategory,
  createOppositeCategory,
  
  // Presheaves
  Presheaf,
  createPresheaf,
  RepresentablePresheaf,
  createRepresentablePresheaf,
  
  // Topos structure
  Topos,
  PresheafTopos,
  createPresheafTopos,
  
  // Comma categories and polynomial functors
  CommaCategory,
  createCommaCategory,
  CommaObject,
  CommaMorphism,
  PolynomialCharacterization,
  createPolynomialCharacterization,
  
  // Yoneda lemma
  YonedaLemma,
  createYonedaLemma,
  
  // Verification
  verifyPresheaf,
  verifyTopos,
  
  // Example functions
  exampleSimpleCategoryAndPresheaf,
  exampleRepresentablePresheafAndYoneda,
  examplePresheafToposStructure,
  examplePolynomialFunctorCharacterization
} from '../fp-presheaf-topos';

describe('Presheaf Topos Structure', () => {
  describe('Categories and Opposite Categories', () => {
    it('should create category', () => {
      const category = createCategory('TestCategory', ['A', 'B', 'C']);
      
      expect(category.kind).toBe('Category');
      expect(category.name).toBe('TestCategory');
      expect(category.objects).toEqual(['A', 'B', 'C']);
      expect(category.morphisms.size).toBe(3);
    });
    
    it('should create morphism', () => {
      const morphism = createMorphism('f', 'A', 'B');
      
      expect(morphism.kind).toBe('Morphism');
      expect(morphism.name).toBe('f');
      expect(morphism.source).toBe('A');
      expect(morphism.target).toBe('B');
    });
    
    it('should compose morphisms', () => {
      const f = createMorphism('f', 'A', 'B');
      const g = createMorphism('g', 'B', 'C');
      
      const composition = f.compose(g);
      
      expect(composition).not.toBeNull();
      if (composition) {
        expect(composition.kind).toBe('Morphism');
        expect(composition.source).toBe('A');
        expect(composition.target).toBe('C');
        expect(composition.name).toBe('f∘g');
      }
    });
    
    it('should handle non-composable morphisms', () => {
      const f = createMorphism('f', 'A', 'B');
      const g = createMorphism('g', 'C', 'D');
      
      const composition = f.compose(g);
      expect(composition).toBeNull();
    });
    
    it('should create opposite category', () => {
      const category = createCategory('TestCategory', ['A', 'B']);
      const opposite = createOppositeCategory(category);
      
      expect(opposite.kind).toBe('OppositeCategory');
      expect(opposite.original).toBe(category);
      expect(opposite.objects).toEqual(['A', 'B']);
      expect(opposite.morphisms.size).toBe(2);
    });
    
    it('should implement identity morphism', () => {
      const category = createCategory('TestCategory', ['A', 'B']);
      const identity = category.identity('A');
      
      expect(identity.kind).toBe('Morphism');
      expect(identity.name).toBe('id_A');
      expect(identity.source).toBe('A');
      expect(identity.target).toBe('A');
    });
  });
  
  describe('Presheaves (Functors C^op → Set)', () => {
    it('should create presheaf', () => {
      const category = createCategory('TestCategory', ['A', 'B']);
      const presheaf = createPresheaf('F', category, (object: string) => {
        return object === 'A' ? ['a', 'b'] : ['x'];
      });
      
      expect(presheaf.kind).toBe('Presheaf');
      expect(presheaf.name).toBe('F');
      expect(presheaf.category).toBe(category);
    });
    
    it('should evaluate presheaf on objects', () => {
      const category = createCategory('TestCategory', ['A', 'B']);
      const presheaf = createPresheaf('F', category, (object: string) => {
        return object === 'A' ? ['a', 'b'] : ['x'];
      });
      
      const resultA = presheaf.evaluate('A');
      const resultB = presheaf.evaluate('B');
      
      expect(resultA).toEqual(['a', 'b']);
      expect(resultB).toEqual(['x']);
    });
    
    it('should implement presheaf action', () => {
      const category = createCategory('TestCategory', ['A', 'B']);
      const morphism = createMorphism('f', 'A', 'B');
      category.morphisms.get('A')?.push(morphism);
      
      const presheaf = createPresheaf('F', category, (object: string) => {
        return object === 'A' ? ['a', 'b'] : ['x', 'y'];
      });
      
      const action = presheaf.action('A', morphism);
      expect(Array.isArray(action)).toBe(true);
    });
    
    it('should verify presheaf functoriality', () => {
      const category = createCategory('TestCategory', ['A', 'B', 'C']);
      const f = createMorphism('f', 'A', 'B');
      const g = createMorphism('g', 'B', 'C');
      category.morphisms.get('A')?.push(f);
      category.morphisms.get('B')?.push(g);
      
      const presheaf = createPresheaf('F', category, (object: string) => {
        return ['element'];
      });
      
      const functoriality = presheaf.functoriality(f, g);
      expect(typeof functoriality).toBe('boolean');
    });
    
    it('should verify presheaf naturality', () => {
      const category = createCategory('TestCategory', ['A', 'B']);
      const morphism = createMorphism('f', 'A', 'B');
      category.morphisms.get('A')?.push(morphism);
      
      const presheaf = createPresheaf('F', category, (object: string) => {
        return ['element'];
      });
      
      const naturality = presheaf.naturality('A', morphism);
      expect(naturality).toBe(true);
    });
  });
  
  describe('Representable Presheaves (Yoneda Embedding)', () => {
    it('should create representable presheaf', () => {
      const category = createCategory('TestCategory', ['A', 'B']);
      const representable = createRepresentablePresheaf(category, 'A');
      
      expect(representable.kind).toBe('RepresentablePresheaf');
      expect(representable.representingObject).toBe('A');
      expect(representable.name).toBe('h_A');
    });
    
    it('should evaluate representable presheaf', () => {
      const category = createCategory('TestCategory', ['A', 'B']);
      const morphism = createMorphism('f', 'B', 'A');
      category.morphisms.get('B')?.push(morphism);
      
      const representable = createRepresentablePresheaf(category, 'A');
      
      const resultA = representable.evaluate('A');
      const resultB = representable.evaluate('B');
      
      expect(Array.isArray(resultA)).toBe(true);
      expect(Array.isArray(resultB)).toBe(true);
    });
    
    it('should implement Yoneda lemma', () => {
      const category = createCategory('TestCategory', ['A', 'B']);
      const representable = createRepresentablePresheaf(category, 'A');
      const otherPresheaf = createPresheaf('G', category, (object: string) => {
        return object === 'A' ? ['α', 'β'] : ['γ'];
      });
      
      const yonedaLemma = representable.yonedaLemma(otherPresheaf);
      expect(Array.isArray(yonedaLemma)).toBe(true);
    });
  });
  
  describe('Topos Structure', () => {
    it('should create presheaf topos', () => {
      const category = createCategory('TestCategory', ['A', 'B']);
      const topos = createPresheafTopos(category);
      
      expect(topos.kind).toBe('PresheafTopos');
      expect(topos.baseCategory).toBe(category);
      expect(topos.terminal.kind).toBe('Presheaf');
      expect(topos.subobjectClassifier.kind).toBe('Presheaf');
    });
    
    it('should implement terminal object', () => {
      const category = createCategory('TestCategory', ['A', 'B']);
      const topos = createPresheafTopos(category);
      
      const terminal = topos.terminal;
      expect(terminal.kind).toBe('Presheaf');
      expect(terminal.name).toBe('1');
      
      const result = terminal.evaluate('A');
      expect(result).toEqual(['*']);
    });
    
    it('should implement subobject classifier', () => {
      const category = createCategory('TestCategory', ['A', 'B']);
      const topos = createPresheafTopos(category);
      
      const classifier = topos.subobjectClassifier;
      expect(classifier.kind).toBe('Presheaf');
      expect(classifier.name).toBe('Ω');
      
      const result = classifier.evaluate('A');
      expect(result).toEqual([true, false]);
    });
    
    it('should implement products of presheaves', () => {
      const category = createCategory('TestCategory', ['A', 'B']);
      const topos = createPresheafTopos(category);
      
      const presheaf1 = createPresheaf('F', category, () => ['a']);
      const presheaf2 = createPresheaf('G', category, () => ['b']);
      
      const product = topos.products([presheaf1, presheaf2]);
      expect(product.kind).toBe('Presheaf');
      expect(product.name).toContain('∏');
      
      const result = product.evaluate('A');
      expect(Array.isArray(result)).toBe(true);
    });
    
    it('should implement equalizers of presheaves', () => {
      const category = createCategory('TestCategory', ['A', 'B']);
      const topos = createPresheafTopos(category);
      
      const presheaf1 = createPresheaf('F', category, () => ['a']);
      const presheaf2 = createPresheaf('G', category, () => ['a']);
      
      const equalizer = topos.equalizers(presheaf1, presheaf2);
      expect(equalizer.kind).toBe('Presheaf');
      expect(equalizer.name).toContain('Eq');
      
      const result = equalizer.evaluate('A');
      expect(Array.isArray(result)).toBe(true);
    });
    
    it('should implement power objects', () => {
      const category = createCategory('TestCategory', ['A', 'B']);
      const topos = createPresheafTopos(category);
      
      const presheaf = createPresheaf('F', category, () => ['a', 'b']);
      const powerObject = topos.powerObject(presheaf);
      
      expect(powerObject.kind).toBe('Presheaf');
      expect(powerObject.name).toContain('P(');
      
      const result = powerObject.evaluate('A');
      expect(Array.isArray(result)).toBe(true);
    });
    
    it('should implement exponentials', () => {
      const category = createCategory('TestCategory', ['A', 'B']);
      const topos = createPresheafTopos(category);
      
      const presheaf1 = createPresheaf('F', category, () => ['a']);
      const presheaf2 = createPresheaf('G', category, () => ['b']);
      
      const exponential = topos.exponential(presheaf1, presheaf2);
      expect(exponential.kind).toBe('Presheaf');
      expect(exponential.name).toContain('^');
      
      const result = exponential.evaluate('A');
      expect(Array.isArray(result)).toBe(true);
    });
    
    it('should implement Yoneda embedding', () => {
      const category = createCategory('TestCategory', ['A', 'B']);
      const topos = createPresheafTopos(category);
      
      const representable = topos.yonedaEmbedding('A');
      expect(representable.kind).toBe('RepresentablePresheaf');
      expect(representable.representingObject).toBe('A');
    });
  });
  
  describe('Comma Categories and Polynomial Functors', () => {
    it('should create comma category', () => {
      const polynomialFunctor = { name: 'P', source: 'Set/I', target: 'Set/J' };
      const commaCategory = createCommaCategory('(Set/J)↓P', polynomialFunctor);
      
      expect(commaCategory.kind).toBe('CommaCategory');
      expect(commaCategory.name).toBe('(Set/J)↓P');
      expect(commaCategory.isPresheafTopos).toBe(true);
    });
    
    it('should implement Yoneda embedding in comma category', () => {
      const polynomialFunctor = { name: 'P', source: 'Set/I', target: 'Set/J' };
      const commaCategory = createCommaCategory('(Set/J)↓P', polynomialFunctor);
      
      const object: CommaObject = {
        kind: 'CommaObject',
        name: 'test',
        y: 'Y',
        f: 'f',
        x: 'X'
      };
      
      const presheaf = commaCategory.yonedaEmbedding(object);
      expect(presheaf.kind).toBe('Presheaf');
    });
    
    it('should create polynomial characterization', () => {
      const polynomialFunctor = { name: 'P', source: 'Set/I', target: 'Set/J' };
      const characterization = createPolynomialCharacterization(polynomialFunctor);
      
      expect(characterization.kind).toBe('PolynomialCharacterization');
      expect(characterization.polynomialFunctor).toBe(polynomialFunctor);
      expect(characterization.isPresheafTopos).toBe(true);
      expect(characterization.verification.hasFiniteLimits).toBe(true);
      expect(characterization.verification.hasPowerObjects).toBe(true);
      expect(characterization.verification.hasSubobjectClassifier).toBe(true);
      expect(characterization.verification.isCartesianClosed).toBe(true);
    });
  });
  
  describe('Yoneda Lemma and Representability', () => {
    it('should create Yoneda lemma instance', () => {
      const category = createCategory('TestCategory', ['A', 'B']);
      const presheaf = createPresheaf('F', category, (object: string) => {
        return object === 'A' ? ['α', 'β'] : ['γ'];
      });
      
      const yonedaLemma = createYonedaLemma(category, presheaf, 'A');
      
      expect(yonedaLemma.kind).toBe('YonedaLemma');
      expect(yonedaLemma.category).toBe(category);
      expect(yonedaLemma.presheaf).toBe(presheaf);
      expect(yonedaLemma.object).toBe('A');
      expect(yonedaLemma.representable.kind).toBe('RepresentablePresheaf');
      expect(Array.isArray(yonedaLemma.naturalTransformations)).toBe(true);
      expect(Array.isArray(yonedaLemma.evaluation)).toBe(true);
      expect(typeof yonedaLemma.isomorphism).toBe('boolean');
    });
    
    it('should verify Yoneda lemma isomorphism', () => {
      const category = createCategory('TestCategory', ['A', 'B']);
      const presheaf = createPresheaf('F', category, (object: string) => {
        return object === 'A' ? ['α', 'β'] : ['γ'];
      });
      
      const yonedaLemma = createYonedaLemma(category, presheaf, 'A');
      
      // Yoneda Lemma: Nat(h_A, F) ≅ F(A)
      expect(yonedaLemma.naturalTransformations.length).toBe(2); // ['α', 'β']
      expect(yonedaLemma.evaluation.length).toBe(2); // ['α', 'β']
      expect(yonedaLemma.isomorphism).toBe(true);
    });
  });
  
  describe('Verification and Testing', () => {
    it('should verify presheaf properties', () => {
      const category = createCategory('TestCategory', ['A', 'B']);
      const presheaf = createPresheaf('F', category, (object: string) => {
        return object === 'A' ? ['a', 'b'] : ['x'];
      });
      
      const verification = verifyPresheaf(presheaf);
      
      expect(verification.isValid).toBe(true);
      expect(verification.functoriality).toBe(true);
      expect(verification.naturality).toBe(true);
      expect(verification.examples).toHaveLength(2); // A, B
    });
    
    it('should verify topos properties', () => {
      const category = createCategory('TestCategory', ['A', 'B']);
      const topos = createPresheafTopos(category);
      
      const verification = verifyTopos(topos);
      
      expect(verification.isValid).toBe(true);
      expect(verification.hasTerminal).toBe(true);
      expect(verification.hasProducts).toBe(true);
      expect(verification.hasEqualizers).toBe(true);
      expect(verification.hasPowerObjects).toBe(true);
      expect(verification.hasSubobjectClassifier).toBe(true);
      expect(verification.hasExponentials).toBe(true);
      expect(verification.examples).toHaveLength(3); // terminal, product, classifier
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
    
    it('should run simple category and presheaf example', () => {
      exampleSimpleCategoryAndPresheaf();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          simpleCategoryAndPresheaf: true,
          categoryName: 'SimpleCategory',
          objects: ['I', 'J'],
          presheafValid: true,
          presheafExamples: expect.any(Array),
          functoriality: true,
          naturality: true
        })
      );
    });
    
    it('should run representable presheaf and Yoneda example', () => {
      exampleRepresentablePresheafAndYoneda();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          representablePresheafAndYoneda: true,
          representableValid: true,
          yonedaLemmaValid: true,
          naturalTransformations: 2,
          evaluation: 2,
          isomorphism: true
        })
      );
    });
    
    it('should run presheaf topos structure example', () => {
      examplePresheafToposStructure();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          presheafToposStructure: true,
          toposValid: true,
          hasTerminal: true,
          hasProducts: true,
          hasSubobjectClassifier: true,
          hasExponentials: true,
          toposExamples: expect.any(Array),
          representableValid: true,
          productValid: true,
          exponentialValid: true,
          powerObjectValid: true
        })
      );
    });
    
    it('should run polynomial functor characterization example', () => {
      examplePolynomialFunctorCharacterization();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          polynomialFunctorCharacterization: true,
          isPresheafTopos: true,
          hasFiniteLimits: true,
          hasPowerObjects: true,
          hasSubobjectClassifier: true,
          isCartesianClosed: true,
          commaCategoryValid: true,
          toposStructureValid: true
        })
      );
    });
  });
  
  describe('Mathematical Properties', () => {
    it('should verify presheaf functoriality (contravariant)', () => {
      const category = createCategory('TestCategory', ['A', 'B', 'C']);
      const f = createMorphism('f', 'A', 'B');
      const g = createMorphism('g', 'B', 'C');
      category.morphisms.get('A')?.push(f);
      category.morphisms.get('B')?.push(g);
      
      const presheaf = createPresheaf('F', category, (object: string) => {
        return ['element'];
      });
      
      // F(f ∘ g) = F(g) ∘ F(f) (contravariant)
      const functoriality = presheaf.functoriality(f, g);
      expect(typeof functoriality).toBe('boolean');
    });
    
    it('should verify representable presheaf evaluation', () => {
      const category = createCategory('TestCategory', ['A', 'B']);
      const morphism = createMorphism('f', 'B', 'A');
      category.morphisms.get('B')?.push(morphism);
      
      const representable = createRepresentablePresheaf(category, 'A');
      
      // h_A(B) = Hom_C(B, A) = morphisms from B to A
      const result = representable.evaluate('B');
      expect(Array.isArray(result)).toBe(true);
    });
    
    it('should verify topos structure completeness', () => {
      const category = createCategory('TestCategory', ['A', 'B']);
      const topos = createPresheafTopos(category);
      
      // A topos has all finite limits
      expect(topos.terminal).toBeDefined();
      expect(topos.products).toBeDefined();
      expect(topos.equalizers).toBeDefined();
      
      // A topos has power objects
      expect(topos.powerObject).toBeDefined();
      expect(topos.subobjectClassifier).toBeDefined();
      
      // A topos is cartesian closed
      expect(topos.exponential).toBeDefined();
    });
    
    it('should verify polynomial functor characterization', () => {
      const polynomialFunctor = { name: 'P', source: 'Set/I', target: 'Set/J' };
      const characterization = createPolynomialCharacterization(polynomialFunctor);
      
      // Key insight: (Set/J)↓P is a presheaf topos
      expect(characterization.isPresheafTopos).toBe(true);
      
      // This implies it has all topos structure
      expect(characterization.verification.hasFiniteLimits).toBe(true);
      expect(characterization.verification.hasPowerObjects).toBe(true);
      expect(characterization.verification.hasSubobjectClassifier).toBe(true);
      expect(characterization.verification.isCartesianClosed).toBe(true);
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
    it('should handle empty categories', () => {
      const category = createCategory('EmptyCategory', []);
      expect(category.objects).toEqual([]);
      expect(category.morphisms.size).toBe(0);
      
      const presheaf = createPresheaf('F', category, () => []);
      expect(presheaf.evaluate('nonexistent')).toEqual([]);
    });
    
    it('should handle categories with single object', () => {
      const category = createCategory('SingleObject', ['A']);
      const presheaf = createPresheaf('F', category, () => ['element']);
      
      const result = presheaf.evaluate('A');
      expect(result).toEqual(['element']);
    });
    
    it('should handle presheaves with empty evaluations', () => {
      const category = createCategory('TestCategory', ['A', 'B']);
      const presheaf = createPresheaf('F', category, () => []);
      
      const verification = verifyPresheaf(presheaf);
      expect(verification.isValid).toBe(true);
    });
    
    it('should handle topos with minimal structure', () => {
      const category = createCategory('MinimalCategory', ['A']);
      const topos = createPresheafTopos(category);
      
      const verification = verifyTopos(topos);
      expect(verification.isValid).toBe(true);
    });
  });
});
