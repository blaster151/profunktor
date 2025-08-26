/**
 * Global State Lawvere Theory Tests
 * 
 * Tests for the revolutionary implementation of Section 3 from Power & Shkaravska's paper
 * "From Comodels to Coalgebras: State and Arrays"
 * 
 * Covers:
 * - Countable Lawvere theories
 * - Global state operations (l: V → Loc, u: 1 → Loc×V)
 * - Four interaction diagrams
 * - Computational examples (n-ary and B-unary operations)
 */

import {
  CountableLawvereTheory, AlephOneCategory, GlobalStateLawvereTheory,
  GlobalStateInteractionDiagrams, GlobalStateComodel,
  NAryOperationComodel, BUnaryOperationComodel,
  createAlephOneCategory, createCountableLawvereTheory,
  createGlobalStateLawvereTheory, createGlobalStateInteractionDiagrams,
  createGlobalStateComodel, createNAryOperationComodel, createBUnaryOperationComodel,
  validateGlobalStateComodel, nAryToStateCoalgebra, bUnaryToStateCoalgebra,
  createIntegerStringGlobalState, createCounterNAryExample, 
  createStateMachineBUnaryExample, demonstrateGlobalStateTheory
} from '../fp-global-state-lawvere-theory';

describe('Global State Lawvere Theory Implementation', () => {

  describe('1. Countable Lawvere Theory Foundations', () => {
    
    it('should create ℵ₁ category with countable coproducts', () => {
      const alephOne = createAlephOneCategory();

      expect(alephOne.kind).toBe('AlephOneCategory');
      expect(alephOne.hasCountableCoproducts).toBe(true);
      expect(alephOne.naturalNumberObjects.length).toBeGreaterThan(0);
      expect(alephOne.countableSetObject).toBe('ℵ₀');
    });

    it('should create countable Lawvere theory extending finite case', () => {
      const category = {
        objects: ['TestObject'],
        morphisms: new Map(),
        identity: (obj: string) => ({ kind: 'Identity', source: obj, target: obj }),
        composition: (f: any, g: any) => ({ kind: 'Composition', first: f, second: g })
      };

      const alephOne = createAlephOneCategory();
      const countableFunctor = {
        sourceCategory: alephOne,
        targetCategory: category,
        mapObjects: (obj: any) => 'TestObject',
        mapMorphisms: (mor: any) => ({ kind: 'MappedMorphism', original: mor })
      };

      const countableTheory = createCountableLawvereTheory(
        category as any,
        alephOne as any,
        countableFunctor as any
      );

      expect(countableTheory.kind).toBe('CountableLawvereTheory');
      expect(countableTheory.hasFiniteProducts).toBe(true);
      expect(countableTheory.hasCountableProducts).toBe(true);
    });

  });

  describe('2. Global State Operations (Definition 3.2)', () => {
    
    it('should create global state Lawvere theory with fundamental operations', () => {
      const locations = new Set([0, 1, 2]);
      const values = new Set(['a', 'b', 'c']);
      const locationOp = (value: string) => value.charCodeAt(0) % 3;
      const updateOp = () => [0, 'init'] as [number, string];

      const theory = createGlobalStateLawvereTheory(
        locations,
        values,
        locationOp,
        updateOp
      );

      expect(theory.kind).toBe('GlobalStateLawvereTheory');
      expect(theory.locations).toBe(locations);
      expect(theory.values).toBe(values);
      expect(theory.locationOperation).toBe(locationOp);
      expect(theory.updateOperation).toBe(updateOp);
      expect(theory.satisfiesInteractionDiagrams).toBe(true);
    });

    it('should perform location operation l: V → Loc correctly', () => {
      const theory = createIntegerStringGlobalState();
      
      // Test location mapping for different values
      expect(typeof theory.locationOperation('a')).toBe('number');
      expect(typeof theory.locationOperation('b')).toBe('number');
      expect(typeof theory.locationOperation('c')).toBe('number');
      
      // Should be deterministic
      expect(theory.locationOperation('a')).toBe(theory.locationOperation('a'));
    });

    it('should perform update operation u: 1 → Loc×V correctly', () => {
      const theory = createIntegerStringGlobalState();
      
      const [loc, val] = theory.updateOperation();
      
      expect(typeof loc).toBe('number');
      expect(typeof val).toBe('string');
      expect(theory.locations.has(loc)).toBe(true);
      expect(theory.values.has(val)).toBe(true);
    });

    it('should validate derived operations', () => {
      const theory = createIntegerStringGlobalState();
      
      // Test diagonal operation
      const [loc1, loc2] = theory.diagonal(2);
      expect(loc1).toBe(2);
      expect(loc2).toBe(2);
      
      // Test terminal operation
      const terminal = theory.terminal(1);
      expect(terminal).toBe(1);
      
      // Test symmetry operation
      const [b, a] = theory.symmetry(['a', 'b']);
      expect(a).toBe('a');
      expect(b).toBe('b');
    });

  });

  describe('3. Interaction Diagrams (Four Fundamental Laws)', () => {
    
    it('should create interaction diagrams with proper structure', () => {
      const theory = createIntegerStringGlobalState();
      const diagrams = createGlobalStateInteractionDiagrams(theory);

      expect(diagrams.kind).toBe('GlobalStateInteractionDiagrams');
      expect(diagrams.diagram1.description).toContain('Terminal-Update');
      expect(diagrams.diagram2.description).toContain('Value-Location');
      expect(diagrams.diagram3.description).toContain('symmetry');
      expect(diagrams.diagram4.description).toContain('coherence');
    });

    it('should validate diagram 1: Terminal-Update interaction', () => {
      const theory = createIntegerStringGlobalState();
      const diagrams = createGlobalStateInteractionDiagrams(theory);
      
      const commutes = diagrams.diagram1.commutes(
        theory.updateOperation,
        theory.terminal,
        theory.locationOperation
      );
      
      expect(commutes).toBe(true);
    });

    it('should validate diagram 2: Value-Location interaction', () => {
      const theory = createIntegerStringGlobalState();
      const diagrams = createGlobalStateInteractionDiagrams(theory);
      
      const testValue = 'a';
      const commutes = diagrams.diagram2.commutes(
        testValue,
        theory.locationOperation,
        theory.diagonal
      );
      
      expect(commutes).toBe(true);
    });

    it('should validate diagram 3: Update symmetry', () => {
      const theory = createIntegerStringGlobalState();
      const diagrams = createGlobalStateInteractionDiagrams(theory);
      
      const commutes = diagrams.diagram3.commutes(
        theory.updateOperation,
        theory.symmetry
      );
      
      expect(commutes).toBe(true);
    });

    it('should validate diagram 4: Location-Value coherence', () => {
      const theory = createIntegerStringGlobalState();
      const diagrams = createGlobalStateInteractionDiagrams(theory);
      
      const commutes = diagrams.diagram4.commutes(
        theory.locationOperation,
        theory.updateOperation,
        theory.diagonal
      );
      
      expect(commutes).toBe(true);
    });

  });

  describe('4. Global State Comodel Implementation', () => {
    
    it('should create global state comodel with interaction diagrams', () => {
      const theory = createIntegerStringGlobalState();
      const comodel = createGlobalStateComodel(theory);

      expect(comodel.kind).toBe('GlobalStateComodel');
      expect(comodel.theory).toBe(theory);
      expect(comodel.interactionDiagrams.kind).toBe('GlobalStateInteractionDiagrams');
      expect(typeof comodel.selection).toBe('function');
      expect(typeof comodel.update).toBe('function');
    });

    it('should perform array selection operation', () => {
      const theory = createIntegerStringGlobalState();
      const comodel = createGlobalStateComodel(theory);
      
      const testArray = new Map([[0, 'a'], [1, 'b'], [2, 'c']]);
      
      expect(comodel.selection(testArray, 0)).toBe('a');
      expect(comodel.selection(testArray, 1)).toBe('b');
      expect(comodel.selection(testArray, 2)).toBe('c');
      expect(comodel.selection(testArray, 3)).toBeUndefined();
    });

    it('should perform array update operation', () => {
      const theory = createIntegerStringGlobalState();
      const comodel = createGlobalStateComodel(theory);
      
      const testArray = new Map([[0, 'a'], [1, 'b'], [2, 'c']]);
      const updatedArray = comodel.update(testArray, 1, 'x');
      
      expect(updatedArray.get(0)).toBe('a');
      expect(updatedArray.get(1)).toBe('x'); // Updated
      expect(updatedArray.get(2)).toBe('c');
      expect(testArray.get(1)).toBe('b'); // Original unchanged
    });

    it('should validate all interaction diagrams', () => {
      const theory = createIntegerStringGlobalState();
      const comodel = createGlobalStateComodel(theory);
      
      const isValid = comodel.validateInteractionDiagrams();
      expect(isValid).toBe(true);
      
      const globallyValid = validateGlobalStateComodel(comodel);
      expect(globallyValid).toBe(true);
    });

  });

  describe('5. Computational Examples (Examples 2.3 & 2.4)', () => {
    
    it('should create n-ary operation comodel (Example 2.3)', () => {
      const stateSpace = new Set([0, 1, 2, 3]);
      const actionSpace = new Set(['inc', 'dec']);
      const transition = (state: number) => {
        return state < 2 ? ['inc', state + 1] as [string, number] : ['dec', state - 1] as [string, number];
      };

      const naryComodel = createNAryOperationComodel(stateSpace, actionSpace, transition);

      expect(naryComodel.kind).toBe('NAryOperationComodel');
      expect(naryComodel.arity).toBe(2);
      expect(naryComodel.stateSpace).toBe(stateSpace);
      expect(naryComodel.actionSpace).toBe(actionSpace);
    });

    it('should create B-unary operation comodel (Example 2.4)', () => {
      const stateSpace = new Set(['idle', 'active']);
      const operationSpace = new Set(['start', 'stop', 'reset']);
      const transition = (state: string) => {
        const transitions = new Map<string, string>();
        if (state === 'idle') {
          transitions.set('start', 'active');
        } else {
          transitions.set('stop', 'idle');
          transitions.set('reset', 'idle');
        }
        return transitions;
      };

      const bunaryComodel = createBUnaryOperationComodel(stateSpace, operationSpace, transition);

      expect(bunaryComodel.kind).toBe('BUnaryOperationComodel');
      expect(bunaryComodel.operationCount).toBe(3);
      expect(bunaryComodel.stateSpace).toBe(stateSpace);
      expect(bunaryComodel.operationSpace).toBe(operationSpace);
    });

    it('should test n-ary comodel transition X → A×X', () => {
      const naryComodel = createCounterNAryExample();
      
      // Test transitions
      const [action1, state1] = naryComodel.transition(0);
      expect(action1).toBe('inc');
      expect(state1).toBe(1);
      
      const [action2, state2] = naryComodel.transition(4);
      expect(action2).toBe('dec');
      expect(state2).toBe(3);
    });

    it('should test B-unary comodel transition X → X^B', () => {
      const bunaryComodel = createStateMachineBUnaryExample();
      
      // Test transitions from 'start'
      const startTransitions = bunaryComodel.transition('start');
      expect(startTransitions.get('play')).toBe('running');
      expect(startTransitions.get('stop')).toBe('stopped');
      
      // Test transitions from 'running'
      const runningTransitions = bunaryComodel.transition('running');
      expect(runningTransitions.get('pause')).toBe('paused');
      expect(runningTransitions.get('stop')).toBe('stopped');
    });

  });

  describe('6. Coalgebra Conversions', () => {
    
    it('should convert n-ary comodel to state coalgebra', () => {
      const naryComodel = createCounterNAryExample();
      const stateCoalgebra = nAryToStateCoalgebra(naryComodel);

      expect(stateCoalgebra.kind).toBe('StateCoalgebra');
      
      // Test coalgebraic operations
      const observation = stateCoalgebra.observe(2);
      expect(Array.isArray(observation)).toBe(true);
      expect(observation).toHaveLength(2);
      
      const newState = stateCoalgebra.transition(2);
      expect(typeof newState).toBe('number');
      
      const [decomposedObs, nextCoalgebra] = stateCoalgebra.decompose(2);
      expect(Array.isArray(decomposedObs)).toBe(true);
      expect(nextCoalgebra().kind).toBe('StateCoalgebra');
    });

    it('should convert B-unary comodel to state coalgebra', () => {
      const bunaryComodel = createStateMachineBUnaryExample();
      const stateCoalgebra = bUnaryToStateCoalgebra(bunaryComodel);

      expect(stateCoalgebra.kind).toBe('StateCoalgebra');
      
      // Test coalgebraic operations
      const observation = stateCoalgebra.observe('start');
      expect(observation instanceof Map).toBe(true);
      
      const newState = stateCoalgebra.transition('start');
      expect(typeof newState).toBe('string');
      
      const [decomposedObs, nextCoalgebra] = stateCoalgebra.decompose('start');
      expect(decomposedObs instanceof Map).toBe(true);
      expect(nextCoalgebra().kind).toBe('StateCoalgebra');
    });

  });

  describe('7. Complete Integration Examples', () => {
    
    it('should demonstrate full global state theory', () => {
      const { theory, comodel, isValid } = demonstrateGlobalStateTheory();

      expect(theory.kind).toBe('GlobalStateLawvereTheory');
      expect(comodel.kind).toBe('GlobalStateComodel');
      expect(isValid).toBe(true);
      
      // Test the complete integration
      expect(comodel.theory).toBe(theory);
      expect(comodel.validateInteractionDiagrams()).toBe(true);
    });

    it('should validate mathematical consistency across all components', () => {
      const theory = createIntegerStringGlobalState();
      const comodel = createGlobalStateComodel(theory);
      
      // Test that operations are consistent
      const [updateLoc, updateVal] = theory.updateOperation();
      const mappedLoc = theory.locationOperation(updateVal);
      
      // Both locations should be valid
      expect(theory.locations.has(updateLoc)).toBe(true);
      expect(theory.locations.has(mappedLoc)).toBe(true);
      
      // Array operations should work with theory operations
      const testArray = new Map([[updateLoc, updateVal]]);
      const retrievedVal = comodel.selection(testArray, updateLoc);
      expect(retrievedVal).toBe(updateVal);
    });

    it('should demonstrate connection to existing coalgebra framework', () => {
      // Show how our new global state theory connects to existing coalgebras
      const naryComodel = createCounterNAryExample();
      const stateCoalgebra = nAryToStateCoalgebra(naryComodel);
      
      // This state coalgebra should be compatible with existing framework
      expect(stateCoalgebra.kind).toBe('StateCoalgebra');
      expect(typeof stateCoalgebra.observe).toBe('function');
      expect(typeof stateCoalgebra.transition).toBe('function');
      expect(typeof stateCoalgebra.decompose).toBe('function');
      
      // Test coalgebraic composition
      const state = 1;
      const [obs1, nextCoalg1] = stateCoalgebra.decompose(state);
      const [obs2, nextCoalg2] = nextCoalg1().decompose(stateCoalgebra.transition(state));
      
      expect(obs1).toBeDefined();
      expect(obs2).toBeDefined();
      expect(nextCoalg2().kind).toBe('StateCoalgebra');
    });

  });

  describe('8. Revolutionary Mathematical Validation', () => {
    
    it('should validate the paper\'s fundamental insights', () => {
      // Test that our implementation captures the paper's key insights
      
      // 1. Countable extension of Lawvere theories
      const alephOne = createAlephOneCategory();
      expect(alephOne.hasCountableCoproducts).toBe(true);
      
      // 2. Global state operations with precise semantics
      const theory = createIntegerStringGlobalState();
      expect(typeof theory.locationOperation).toBe('function');
      expect(typeof theory.updateOperation).toBe('function');
      
      // 3. Interaction diagrams encode the laws
      const comodel = createGlobalStateComodel(theory);
      expect(comodel.validateInteractionDiagrams()).toBe(true);
      
      // 4. Examples show computational applicability
      const naryExample = createCounterNAryExample();
      const bunaryExample = createStateMachineBUnaryExample();
      expect(naryExample.kind).toBe('NAryOperationComodel');
      expect(bunaryExample.kind).toBe('BUnaryOperationComodel');
    });

    it('should demonstrate the comodel-coalgebra bridge', () => {
      // Show how comodels naturally give rise to coalgebras
      const theory = createIntegerStringGlobalState();
      const comodel = createGlobalStateComodel(theory);
      
      // The comodel provides theoretical structure
      expect(comodel.theory.satisfiesInteractionDiagrams).toBe(true);
      expect(comodel.preservesFiniteCoproducts).toBe(true);
      
      // Which can be used computationally via array operations
      const testArray = new Map([[0, 'test']]);
      const selected = comodel.selection(testArray, 0);
      const updated = comodel.update(testArray, 0, 'new');
      
      expect(selected).toBe('test');
      expect(updated.get(0)).toBe('new');
      
      // This bridges abstract category theory to concrete computation
      expect(typeof comodel.locationLookup).toBe('function');
      expect(typeof comodel.defaultUpdate).toBe('function');
    });

  });

});
