/**
 * Comodel-Lawvere Theory Tests
 * 
 * Tests for the revolutionary implementation based on Power & Shkaravska's paper
 * "From Comodels to Coalgebras: State and Arrays"
 */

import {
  LawvereTheory, LawvereComodel, ArrayComodel, StateCoalgebra,
  ComodelCategory, ComodelComonad, LawvereTensorProduct, CompositionalComodel,
  createLawvereTheory, createLawvereComodel, createArrayComodel, createStateCoalgebra,
  createComodelComonad, satisfiesFundamentalDuality, arrayToStateCoalgebra,
  createGlobalStateLawvereTheory, createIntegerArrayExample, integerArrayStateExample
} from '../fp-comodel-lawvere-theory';

describe('Comodel-Lawvere Theory Implementation', () => {

  describe('1. Lawvere Theory Foundations', () => {
    
    it('should create a Lawvere theory with finite products', () => {
      const category = {
        objects: ['Object1', 'Object2'],
        morphisms: new Map(),
        identity: (obj: string) => ({ kind: 'Identity', source: obj, target: obj }),
        composition: (f: any, g: any) => ({ kind: 'Composition', first: f, second: g })
      };

      const identityFunctor = {
        sourceCategory: category,
        targetCategory: category,
        mapObjects: (obj: string) => obj,
        mapMorphisms: (mor: any) => mor
      };

      const theory = createLawvereTheory(category as any, identityFunctor as any);

      expect(theory.kind).toBe('LawvereTheory');
      expect(theory.hasFiniteProducts).toBe(true);
      expect(theory.category).toBe(category);
    });

    it('should create a comodel preserving finite coproducts', () => {
      const theory = createGlobalStateLawvereTheory();
      const targetCategory = {
        objects: ['Target'],
        morphisms: new Map(),
        identity: (obj: string) => ({ kind: 'Identity', source: obj, target: obj }),
        composition: (f: any, g: any) => ({ kind: 'Composition', first: f, second: g })
      };

      const interpretation = {
        sourceCategory: theory.category,
        targetCategory: targetCategory,
        mapObjects: (obj: string) => `Interpreted_${obj}`,
        mapMorphisms: (mor: any) => ({ kind: 'InterpretedMorphism', original: mor })
      };

      const comodel = createLawvereComodel(theory, targetCategory as any, interpretation as any);

      expect(comodel.kind).toBe('LawvereComodel');
      expect(comodel.theory).toBe(theory);
      expect(comodel.preservesFiniteCoproducts).toBe(true);
    });

  });

  describe('2. Array/State Coalgebras (Paper\'s Main Example)', () => {
    
    it('should create array comodel with selection and update operations', () => {
      const locations = new Set([0, 1, 2]);
      const values = new Set(['a', 'b', 'c']);
      
      const arrayComodel = createArrayComodel(locations, values);

      expect(arrayComodel.kind).toBe('ArrayComodel');
      expect(arrayComodel.locations).toBe(locations);
      expect(arrayComodel.values).toBe(values);
      expect(arrayComodel.satisfiesArrayAxioms).toBe(true);
    });

    it('should perform selection operation correctly', () => {
      const arrayComodel = createArrayComodel(
        new Set([0, 1, 2]),
        new Set(['a', 'b', 'c'])
      );

      const testArray = new Map([[0, 'a'], [1, 'b'], [2, 'c']]);
      
      expect(arrayComodel.selection(testArray, 0)).toBe('a');
      expect(arrayComodel.selection(testArray, 1)).toBe('b');
      expect(arrayComodel.selection(testArray, 2)).toBe('c');
      expect(arrayComodel.selection(testArray, 3)).toBeUndefined();
    });

    it('should perform update operation correctly', () => {
      const arrayComodel = createArrayComodel(
        new Set([0, 1, 2]),
        new Set(['a', 'b', 'c', 'd'])
      );

      const testArray = new Map([[0, 'a'], [1, 'b'], [2, 'c']]);
      const updatedArray = arrayComodel.update(testArray, 1, 'd');
      
      expect(updatedArray.get(0)).toBe('a');
      expect(updatedArray.get(1)).toBe('d'); // Updated
      expect(updatedArray.get(2)).toBe('c');
      expect(testArray.get(1)).toBe('b'); // Original unchanged
    });

    it('should create state coalgebra with proper decomposition', () => {
      const observe = (state: number) => state * 2;
      const transition = (state: number) => state + 1;
      
      const stateCoalgebra = createStateCoalgebra(observe, transition);

      expect(stateCoalgebra.kind).toBe('StateCoalgebra');
      expect(stateCoalgebra.observe(5)).toBe(10);
      expect(stateCoalgebra.transition(5)).toBe(6);

      const [observed, nextCoalgebra] = stateCoalgebra.decompose(5);
      expect(observed).toBe(10);
      expect(nextCoalgebra().kind).toBe('StateCoalgebra');
    });

  });

  describe('3. Fundamental Duality (Comod(L, C) ≅ Mod(L, C^op)^op)', () => {
    
    it('should satisfy the fundamental duality property', () => {
      const theory = createGlobalStateLawvereTheory();
      const comodel = createLawvereComodel(
        theory,
        { objects: [], morphisms: new Map(), identity: () => ({}), composition: () => ({}) } as any,
        { sourceCategory: {}, targetCategory: {}, mapObjects: () => ({}), mapMorphisms: () => ({}) } as any
      );

      expect(satisfiesFundamentalDuality(comodel)).toBe(true);
    });

  });

  describe('4. Comonadic Structure (Theorem 2.2)', () => {
    
    it('should create comonad from comodel category', () => {
      const theory = createGlobalStateLawvereTheory();
      const comodelCategory: ComodelCategory<string> = {
        kind: 'ComodelCategory',
        lawvereTheory: theory,
        forgetfulFunctor: {} as any,
        rightAdjoint: {} as any,
        comonadicStructure: {
          map: () => ({}) as any,
          extract: () => ({}) as any,
          extend: () => ({}) as any
        } as any,
        isComonadic: true
      };

      const comonad = createComodelComonad(theory, comodelCategory);

      expect(comonad.kind).toBe('ComodelComonad');
      expect(comonad.sourceTheory).toBe(theory);
      expect(comonad.comodelCategory).toBe(comodelCategory);
    });

  });

  describe('5. Array to State Coalgebra Conversion', () => {
    
    it('should convert array comodel to state coalgebra', () => {
      const arrayComodel = createArrayComodel(
        new Set([0, 1, 2]),
        new Set([10, 20, 30])
      );

      const stateCoalgebra = arrayToStateCoalgebra(arrayComodel);

      expect(stateCoalgebra.kind).toBe('StateCoalgebra');

      // Test with a sample state
      const testState = new Map([[0, 10], [1, 20], [2, 30]]);
      const [observation] = stateCoalgebra.decompose(testState);
      
      expect(Array.isArray(observation)).toBe(true);
      expect(observation).toHaveLength(2); // [location, value] pair
    });

  });

  describe('6. Concrete Examples from Paper', () => {
    
    it('should create global state Lawvere theory', () => {
      const theory = createGlobalStateLawvereTheory();

      expect(theory.kind).toBe('LawvereTheory');
      expect(theory.hasFiniteProducts).toBe(true);
      expect(theory.category.objects).toContain('GlobalState');
    });

    it('should create integer array example', () => {
      const arrayComodel = createIntegerArrayExample();

      expect(arrayComodel.kind).toBe('ArrayComodel');
      expect(arrayComodel.locations.size).toBe(5); // 0-4
      expect(arrayComodel.values.size).toBe(10); // 0-9
      expect(arrayComodel.satisfiesArrayAxioms).toBe(true);
    });

    it('should create integer array state coalgebra example', () => {
      const stateCoalgebra = integerArrayStateExample();

      expect(stateCoalgebra.kind).toBe('StateCoalgebra');

      // Test with integer array state
      const testState = new Map([[0, 5], [1, 3], [2, 8]]);
      const [observation, nextCoalgebra] = stateCoalgebra.decompose(testState);
      
      expect(Array.isArray(observation)).toBe(true);
      expect(typeof observation[0]).toBe('number'); // location
      expect(typeof observation[1]).toBe('number'); // value
      expect(nextCoalgebra().kind).toBe('StateCoalgebra');
    });

  });

  describe('7. Revolutionary Features Validation', () => {
    
    it('should demonstrate comodel-coalgebra connection', () => {
      // Create array comodel (theoretical structure)
      const arrayComodel = createArrayComodel(
        new Set(['x', 'y', 'z']),
        new Set([1, 2, 3])
      );

      // Convert to state coalgebra (computational structure)
      const stateCoalgebra = arrayToStateCoalgebra(arrayComodel);

      // Verify the connection
      expect(arrayComodel.kind).toBe('ArrayComodel');
      expect(stateCoalgebra.kind).toBe('StateCoalgebra');
      
      // Both should work with the same state representation
      const state = new Map([['x', 1], ['y', 2], ['z', 3]]);
      
      // Array comodel operations
      expect(arrayComodel.selection(state, 'x')).toBe(1);
      const updatedState = arrayComodel.update(state, 'y', 3);
      expect(updatedState.get('y')).toBe(3);
      
      // State coalgebra operations
      const [observation] = stateCoalgebra.decompose(state);
      expect(observation).toBeDefined();
    });

    it('should validate theoretical foundations match implementation', () => {
      // Test that our implementation captures the paper's key insights
      const theory = createGlobalStateLawvereTheory();
      const arrayComodel = createIntegerArrayExample();
      const stateCoalgebra = integerArrayStateExample();

      // 1. Lawvere theory has proper structure
      expect(theory.hasFiniteProducts).toBe(true);
      
      // 2. Array satisfies axioms (comodel of global state theory)
      expect(arrayComodel.satisfiesArrayAxioms).toBe(true);
      
      // 3. State coalgebra provides computational interface
      expect(typeof stateCoalgebra.observe).toBe('function');
      expect(typeof stateCoalgebra.transition).toBe('function');
      expect(typeof stateCoalgebra.decompose).toBe('function');
      
      // 4. Connection between theory and computation is maintained
      expect(arrayComodel.locations.size).toBeGreaterThan(0);
      expect(arrayComodel.values.size).toBeGreaterThan(0);
    });

  });

  describe('8. Integration with Existing Coalgebra Framework', () => {
    
    it('should integrate with existing coalgebra types', () => {
      // Our state coalgebra should be compatible with existing coalgebra infrastructure
      const stateCoalgebra = createStateCoalgebra(
        (state: string) => state.length,
        (state: string) => state + '!'
      );

      // Test coalgebraic decomposition
      const [observation, nextCoalgebra] = stateCoalgebra.decompose('hello');
      
      expect(observation).toBe(5); // length of 'hello'
      expect(nextCoalgebra().observe('world')).toBe(5); // length of 'world'
      expect(nextCoalgebra().transition('test')).toBe('test!');
    });

  });

});
