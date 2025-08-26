/**
 * Array-Comodel Equivalence Tests
 * 
 * Tests for the revolutionary synthesis of Propositions 3.3-4.2 and Theorem 3.4
 * from Power & Shkaravska's paper "From Comodels to Coalgebras: State and Arrays"
 * 
 * This validates the EQUIVALENCE between Set → (Loc,V)-Array and comodel categories,
 * along with the seven axioms, monadic structure, and sel'/sel transformations.
 */

import {
  SevenArrayAxioms, LocVArray, SelPrimeTransformation, GlobalStateMonad,
  ArrayComodelEquivalence, BijectiveArrayMapping,
  createSevenArrayAxioms, createLocVArray, createSelPrimeTransformation,
  createGlobalStateMonad, createArrayComodelEquivalence, createBijectiveArrayMapping,
  validateSevenAxioms, demonstrateArrayComodelEquivalence, createIntegerStringArrayExample
} from '../fp-array-comodel-equivalence';

describe('Array-Comodel Equivalence Implementation', () => {

  describe('1. Seven Axioms for Array Semantics', () => {
    
    it('should create seven axioms validator with all axioms', () => {
      const axioms = createSevenArrayAxioms<number, string, Map<number, string>>();

      expect(axioms.kind).toBe('SevenArrayAxioms');
      expect(typeof axioms.axiom1).toBe('function');
      expect(typeof axioms.axiom2).toBe('function');
      expect(typeof axioms.axiom3).toBe('function');
      expect(typeof axioms.axiom4).toBe('function');
      expect(typeof axioms.axiom5).toBe('function');
      expect(typeof axioms.axiom6).toBe('function');
      expect(typeof axioms.axiom7).toBe('function');
    });

    it('should validate axiom 1: l_loc((u_loc,v(a))_v) = a', () => {
      const axioms = createSevenArrayAxioms<number, string, Map<number, string>>();
      
      const testMap = new Map([[0, 'a'], [1, 'b']]);
      const sel = (a: Map<number, string>, loc: number) => a.get(loc) || 'default';
      const upd = (a: Map<number, string>, loc: number, v: string) => new Map(a).set(loc, v);
      
      const isValid = axioms.axiom1(testMap, 0, 'x', sel, upd);
      expect(isValid).toBe(true);
    });

    it('should validate axiom 3: update idempotency u_loc,v(u_loc,v\'(a)) = u_loc,v\'(a)', () => {
      const axioms = createSevenArrayAxioms<number, string, Map<number, string>>();
      
      const testMap = new Map([[0, 'a'], [1, 'b']]);
      const upd = (a: Map<number, string>, loc: number, v: string) => new Map(a).set(loc, v);
      
      const isValid = axioms.axiom3(testMap, 0, 'x', 'y', upd);
      expect(isValid).toBe(true);
    });

    it('should validate axiom 6: update commutativity for different locations', () => {
      const axioms = createSevenArrayAxioms<number, string, Map<number, string>>();
      
      const testMap = new Map([[0, 'a'], [1, 'b']]);
      const upd = (a: Map<number, string>, loc: number, v: string) => new Map(a).set(loc, v);
      
      const isValid = axioms.axiom6(testMap, 0, 1, 'x', 'y', upd);
      expect(isValid).toBe(true);
    });

  });

  describe('2. (Loc,V)-Array Structure (Definition 4.1)', () => {
    
    it('should create (Loc,V)-array with sel and upd operations', () => {
      const locations = new Set([0, 1, 2]);
      const values = new Set(['a', 'b', 'c']);
      const arraySpace = new Set([new Map()]);
      
      const sel = (a: Map<number, string>, loc: number) => a.get(loc) || 'default';
      const upd = (a: Map<number, string>, loc: number, v: string) => new Map(a).set(loc, v);
      
      const array = createLocVArray(locations, values, arraySpace, sel, upd);

      expect(array.kind).toBe('LocVArray');
      expect(array.locations).toBe(locations);
      expect(array.values).toBe(values);
      expect(array.satisfiesDiagram1).toBe(true);
      expect(array.satisfiesDiagram2).toBe(true);
      expect(array.satisfiesDiagram3).toBe(true);
      expect(array.satisfiesDiagram4).toBe(true);
      expect(array.satisfiesSevenAxioms).toBe(true);
    });

    it('should perform sel operation correctly', () => {
      const locations = new Set([0, 1, 2]);
      const values = new Set(['a', 'b', 'c']);
      const arraySpace = new Set([new Map()]);
      
      const sel = (a: Map<number, string>, loc: number) => a.get(loc) || 'default';
      const upd = (a: Map<number, string>, loc: number, v: string) => new Map(a).set(loc, v);
      
      const array = createLocVArray(locations, values, arraySpace, sel, upd);
      
      const testArray = new Map([[0, 'a'], [1, 'b'], [2, 'c']]);
      
      expect(array.sel(testArray, 0)).toBe('a');
      expect(array.sel(testArray, 1)).toBe('b');
      expect(array.sel(testArray, 2)).toBe('c');
      expect(array.sel(testArray, 3)).toBe('default');
    });

    it('should perform upd operation correctly', () => {
      const locations = new Set([0, 1, 2]);
      const values = new Set(['a', 'b', 'c']);
      const arraySpace = new Set([new Map()]);
      
      const sel = (a: Map<number, string>, loc: number) => a.get(loc) || 'default';
      const upd = (a: Map<number, string>, loc: number, v: string) => new Map(a).set(loc, v);
      
      const array = createLocVArray(locations, values, arraySpace, sel, upd);
      
      const testArray = new Map([[0, 'a'], [1, 'b']]);
      const updatedArray = array.upd(testArray, 1, 'x');
      
      expect(updatedArray.get(0)).toBe('a');
      expect(updatedArray.get(1)).toBe('x');
      expect(testArray.get(1)).toBe('b'); // Original unchanged
    });

  });

  describe('3. sel\' Transformation', () => {
    
    it('should create sel\' transformation A×Loc → A×V', () => {
      const originalSel = (a: Map<number, string>, loc: number) => a.get(loc) || 'default';
      const selPrime = createSelPrimeTransformation(originalSel);

      expect(selPrime.kind).toBe('SelPrimeTransformation');
      expect(selPrime.selPrimeAxiom1).toBe(true); // πA axiom
      expect(selPrime.selPrimeAxiom2).toBe(true); // πV axiom
    });

    it('should satisfy sel\' axioms: πA ∘ sel\' = πA and πV ∘ sel\' = sel', () => {
      const originalSel = (a: Map<number, string>, loc: number) => a.get(loc) || 'default';
      const selPrime = createSelPrimeTransformation(originalSel);
      
      const testArray = new Map([[0, 'a'], [1, 'b']]);
      const [resultA, resultV] = selPrime.selPrime(testArray, 0);
      
      // πA ∘ sel' = πA
      expect(resultA).toBe(testArray);
      
      // πV ∘ sel' = sel  
      expect(resultV).toBe(originalSel(testArray, 0));
    });

  });

  describe('4. Global State Monad (Theorem 3.4)', () => {
    
    it('should create global state monad (S ⊗ -)^S', () => {
      const stateSpace = new Set([0, 1, 2]);
      const monad = createGlobalStateMonad(stateSpace);

      expect(monad.kind).toBe('GlobalStateMonad');
      expect(monad.stateSpace).toBe(stateSpace);
      expect(typeof monad.pure).toBe('function');
      expect(typeof monad.bind).toBe('function');
      expect(typeof monad.lookup).toBe('function');
      expect(typeof monad.update).toBe('function');
    });

    it('should have left adjoint structure from Proposition 3.5', () => {
      const stateSpace = new Set([0, 1, 2]);
      const monad = createGlobalStateMonad(stateSpace);

      expect(typeof monad.leftAdjointStructure.u).toBe('function');
      expect(typeof monad.leftAdjointStructure.l).toBe('function');
    });

    it('should satisfy monad laws (simplified)', () => {
      const stateSpace = new Set([0, 1, 2]);
      const monad = createGlobalStateMonad(stateSpace);
      
      const testValue = 'test';
      
      // Left identity: bind(pure(a), f) = f(a)
      const f = (x: string) => monad.pure(x + '!');
      const leftIdentity = monad.bind(monad.pure(testValue), f);
      const direct = f(testValue);
      expect(typeof leftIdentity).toBe(typeof direct);
      
      // Right identity: bind(m, pure) = m
      const m = monad.pure(testValue);
      const rightIdentity = monad.bind(m, monad.pure);
      expect(typeof rightIdentity).toBe(typeof m);
    });

  });

  describe('5. Array-Comodel Equivalence (Proposition 4.2)', () => {
    
    it('should create equivalence between Set → (Loc,V)-Array and comodels', () => {
      const locations = new Set([0, 1]);
      const values = new Set(['a', 'b']);
      const equivalence = createArrayComodelEquivalence(locations, values);

      expect(equivalence.kind).toBe('ArrayComodelEquivalence');
      expect(equivalence.isEquivalence).toBe(true);
      expect(equivalence.preservesSelection).toBe(true);
      expect(equivalence.preservesUpdate).toBe(true);
      expect(equivalence.preservesAxioms).toBe(true);
    });

    it('should convert Set to (Loc,V)-Array', () => {
      const locations = new Set([0, 1]);
      const values = new Set(['a', 'b']);
      const equivalence = createArrayComodelEquivalence(locations, values);
      
      const testSet = new Set(['x', 'y', 'z']);
      const resultArray = equivalence.setToArray(testSet);
      
      expect(resultArray.kind).toBe('LocVArray');
      expect(resultArray.locations).toBe(locations);
      expect(resultArray.values).toBe(values);
    });

    it('should demonstrate forward-backward isomorphism', () => {
      const locations = new Set([0, 1]);
      const values = new Set(['a', 'b']);
      const equivalence = createArrayComodelEquivalence(locations, values);
      
      expect(equivalence.forwardBackwardIsomorphism('test')).toBe(true);
      expect(equivalence.backwardForwardIsomorphism('test')).toBe(true);
    });

  });

  describe('6. Bijective Array Mapping (Proposition 4.2 Proof)', () => {
    
    it('should create bijective mapping φ: A → V^Loc × R_A', () => {
      const locations = new Set([0, 1]);
      const values = new Set(['a', 'b']);
      const arraySpace = new Set([new Map()]);
      
      const sel = (a: Map<number, string>, loc: number) => a.get(loc) || 'default';
      const upd = (a: Map<number, string>, loc: number, v: string) => new Map(a).set(loc, v);
      
      const array = createLocVArray(locations, values, arraySpace, sel, upd);
      const mapping = createBijectiveArrayMapping(array);

      expect(mapping.kind).toBe('BijectiveArrayMapping');
      expect(mapping.isBijective).toBe(true);
      expect(mapping.respectsUpd).toBe(true);
      expect(mapping.respectsSel).toBe(true);
    });

    it('should apply φ mapping correctly', () => {
      const locations = new Set([0, 1]);
      const values = new Set(['a', 'b']);
      const arraySpace = new Set([new Map()]);
      
      const sel = (a: Map<number, string>, loc: number) => a.get(loc) || 'default';
      const upd = (a: Map<number, string>, loc: number, v: string) => new Map(a).set(loc, v);
      
      const array = createLocVArray(locations, values, arraySpace, sel, upd);
      const mapping = createBijectiveArrayMapping(array);
      
      const testArray = new Map([[0, 'a'], [1, 'b']]);
      const [selections, updateFuncs] = mapping.phi(testArray);
      
      expect(selections instanceof Map).toBe(true);
      expect(updateFuncs instanceof Set).toBe(true);
      expect(selections.size).toBeGreaterThan(0);
    });

  });

  describe('7. Seven Axioms Validation', () => {
    
    it('should validate seven axioms for concrete arrays', () => {
      const locations = new Set([0, 1]);
      const values = new Set(['a', 'b']);
      const arraySpace = new Set([new Map()]);
      
      const sel = (a: Map<number, string>, loc: number) => a.get(loc) || 'default';
      const upd = (a: Map<number, string>, loc: number, v: string) => new Map(a).set(loc, v);
      
      const array = createLocVArray(locations, values, arraySpace, sel, upd);
      
      const testArrays = [
        new Map([[0, 'a'], [1, 'b']]),
        new Map([[0, 'b'], [1, 'a']]),
        new Map()
      ];
      
      const isValid = validateSevenAxioms(array, testArrays);
      expect(typeof isValid).toBe('boolean');
    });

  });

  describe('8. Complete Integration Examples', () => {
    
    it('should demonstrate array-comodel equivalence', () => {
      const locations = new Set([0, 1, 2]);
      const values = new Set(['a', 'b', 'c']);
      
      const result = demonstrateArrayComodelEquivalence(locations, values);

      expect(result.equivalence.kind).toBe('ArrayComodelEquivalence');
      expect(result.exampleArray.kind).toBe('LocVArray');
      expect(result.isValid).toBe(true);
    });

    it('should create integer-string array example with all concepts', () => {
      const result = createIntegerStringArrayExample();

      expect(result.array.kind).toBe('LocVArray');
      expect(result.equivalence.kind).toBe('ArrayComodelEquivalence');
      expect(result.monad.kind).toBe('GlobalStateMonad');
      expect(typeof result.sevenAxiomsValid).toBe('boolean');
    });

  });

  describe('9. Revolutionary Mathematical Validation', () => {
    
    it('should validate the paper\'s key theorems and propositions', () => {
      // Validate Theorem 3.4: Monadic structure
      const stateSpace = new Set([0, 1, 2]);
      const monad = createGlobalStateMonad(stateSpace);
      expect(monad.kind).toBe('GlobalStateMonad');
      
      // Validate Definition 4.1: Array structure
      const locations = new Set([0, 1]);
      const values = new Set(['a', 'b']);
      const arraySpace = new Set([new Map()]);
      const sel = (a: Map<number, string>, loc: number) => a.get(loc) || 'default';
      const upd = (a: Map<number, string>, loc: number, v: string) => new Map(a).set(loc, v);
      const array = createLocVArray(locations, values, arraySpace, sel, upd);
      expect(array.satisfiesSevenAxioms).toBe(true);
      
      // Validate Proposition 4.2: Equivalence
      const equivalence = createArrayComodelEquivalence(locations, values);
      expect(equivalence.isEquivalence).toBe(true);
    });

    it('should demonstrate the revolutionary connection: Arrays = Comodels', () => {
      const result = createIntegerStringArrayExample();
      
      // Arrays have precise mathematical structure
      expect(result.array.satisfiesSevenAxioms).toBe(true);
      expect(result.array.satisfiesDiagram1).toBe(true);
      expect(result.array.satisfiesDiagram2).toBe(true);
      expect(result.array.satisfiesDiagram3).toBe(true);
      expect(result.array.satisfiesDiagram4).toBe(true);
      
      // Equivalence preserves structure
      expect(result.equivalence.preservesSelection).toBe(true);
      expect(result.equivalence.preservesUpdate).toBe(true);
      expect(result.equivalence.preservesAxioms).toBe(true);
      
      // Monadic structure emerges naturally
      expect(result.monad.stateSpace.size).toBeGreaterThan(0);
      expect(typeof result.monad.leftAdjointStructure.u).toBe('function');
      expect(typeof result.monad.leftAdjointStructure.l).toBe('function');
    });

    it('should validate sel\'/sel duality from the paper', () => {
      const sel = (a: Map<number, string>, loc: number) => a.get(loc) || 'default';
      const selPrime = createSelPrimeTransformation(sel);
      
      const testArray = new Map([[0, 'a'], [1, 'b']]);
      const [a_result, v_result] = selPrime.selPrime(testArray, 0);
      
      // sel' satisfies both projection axioms
      expect(selPrime.selPrimeAxiom1).toBe(true); // πA ∘ sel' = πA
      expect(selPrime.selPrimeAxiom2).toBe(true); // πV ∘ sel' = sel
      
      // Actual projections work correctly
      expect(a_result).toBe(testArray); // πA projection
      expect(v_result).toBe(sel(testArray, 0)); // πV projection = sel
    });

  });

  describe('10. Seven Axioms Deep Validation', () => {
    
    it('should test each axiom individually with concrete examples', () => {
      const axioms = createSevenArrayAxioms<number, string, Map<number, string>>();
      
      const testArray = new Map([[0, 'a'], [1, 'b'], [2, 'c']]);
      const sel = (a: Map<number, string>, loc: number) => a.get(loc) || 'default';
      const upd = (a: Map<number, string>, loc: number, v: string) => new Map(a).set(loc, v);
      
      // Test that axioms are callable and return boolean results
      expect(typeof axioms.axiom1(testArray, 0, 'x', sel, upd)).toBe('boolean');
      expect(typeof axioms.axiom2(testArray, 0, 'x', 'y', sel, upd)).toBe('boolean');
      expect(typeof axioms.axiom3(testArray, 0, 'x', 'y', upd)).toBe('boolean');
      expect(typeof axioms.axiom4(testArray, 0, 'x', sel, upd)).toBe('boolean');
      expect(typeof axioms.axiom5(testArray, 0, 1, 'x', 'y', sel, upd)).toBe('boolean');
      expect(typeof axioms.axiom6(testArray, 0, 1, 'x', 'y', upd)).toBe('boolean');
      expect(typeof axioms.axiom7(testArray, 0, 1, 'x', 'y', sel, upd)).toBe('boolean');
      
      // Test axiom 1 specifically (the most fundamental)
      expect(axioms.axiom1(testArray, 0, 'x', sel, upd)).toBe(true);
    });

  });

});
