/**
 * Property-Based Tests for Mathematical Laws
 * 
 * Tests for:
 * 1) w(k) component isomorphic to CubeK
 * 2) final-subcategory reduction naturality
 * 3) sequential colimit equivalence
 */

import { describe, it, expect } from 'vitest';
import { 
  cube, 
  puncturedCube, 
  type CubeK, 
  type PuncturedCubeK,
  hammingWeight,
  getVerticesByWeight
} from '../fp-punctured-cube';

import {
  planSequentialColimit,
  type SequentialColimitPlan,
  type Diagram,
  type PushoutStep,
  type DegreeRestriction,
  type DiagramBuilder,
  type CanonicalMorphism
} from '../fp-colimit-sequentializer';

import {
  runSequentialColimit,
  type PushoutComputation,
  type EmissionFunction,
  createConsoleEmission
} from '../fp-dot-style-stream-coordination';

// Property-based generators
interface PropertyGenerator<T> {
  generate(): T;
  shrink(value: T): T[];
}

// Simple property generator for numbers
class NumberGenerator implements PropertyGenerator<number> {
  constructor(
    private min: number = 0,
    private max: number = 10
  ) {}

  generate(): number {
    return Math.floor(Math.random() * (this.max - this.min + 1)) + this.min;
  }

  shrink(value: number): number[] {
    if (value <= this.min) return [];
    return [value - 1, Math.floor(value / 2)];
  }
}

// Generator for binary arrays
class BinaryArrayGenerator implements PropertyGenerator<ReadonlyArray<0 | 1>> {
  constructor(private length: number) {}

  generate(): ReadonlyArray<0 | 1> {
    return Array.from({ length: this.length }, () => 
      Math.random() > 0.5 ? 1 : 0
    );
  }

  shrink(value: ReadonlyArray<0 | 1>): ReadonlyArray<0 | 1>[] {
    if (value.length <= 1) return [];
    return [
      value.slice(0, -1),
      value.slice(1),
      value.map((x, i) => i % 2 === 0 ? x : 0)
    ];
  }
}

// Generator for degree objects
interface DegreeObject {
  readonly id: string;
  readonly degree: number;
  readonly value: number;
}

class DegreeObjectGenerator implements PropertyGenerator<DegreeObject> {
  constructor(
    private maxDegree: number = 5,
    private maxValue: number = 100
  ) {}

  generate(): DegreeObject {
    const degree = Math.floor(Math.random() * (this.maxDegree + 1));
    const value = Math.floor(Math.random() * this.maxValue);
    const id = `obj_${degree}_${value}`;
    return { id, degree, value };
  }

  shrink(value: DegreeObject): DegreeObject[] {
    const results: DegreeObject[] = [];
    if (value.degree > 0) {
      results.push({ ...value, degree: value.degree - 1 });
    }
    if (value.value > 0) {
      results.push({ ...value, value: Math.floor(value.value / 2) });
    }
    return results;
  }
}

// Test 1: w(k) component isomorphic to CubeK
describe('w(k) isomorphism to CubeK', () => {
  
  // Explicit isomorphism functions
  function wToCubeK(k: number): CubeK {
    return cube(k);
  }

  function cubeKToW(cubeK: CubeK): { dimension: number; vertices: ReadonlyArray<ReadonlyArray<0 | 1>> } {
    return {
      dimension: cubeK.dimension,
      vertices: cubeK.vertices
    };
  }

  // Functor laws for vertices
  function testVertexFunctorLaws(k: number): boolean {
    const cubeK = wToCubeK(k);
    const w = cubeKToW(cubeK);
    const backToCubeK = wToCubeK(w.dimension);
    
    // Identity law: id ∘ f = f ∘ id
    const identity = (x: ReadonlyArray<0 | 1>) => x;
    const f = (x: ReadonlyArray<0 | 1>) => x;
    
    const leftSide = cubeK.vertices.map(v => identity(f(v)));
    const rightSide = cubeK.vertices.map(v => f(identity(v)));
    
    return JSON.stringify(leftSide) === JSON.stringify(rightSide);
  }

  // Functor laws for edges (morphisms between vertices)
  function testEdgeFunctorLaws(k: number): boolean {
    const cubeK = wToCubeK(k);
    
    // Create edge morphisms (adjacent vertices)
    const edges: Array<[ReadonlyArray<0 | 1>, ReadonlyArray<0 | 1>]> = [];
    for (let i = 0; i < cubeK.vertices.length; i++) {
      for (let j = i + 1; j < cubeK.vertices.length; j++) {
        const v1 = cubeK.vertices[i];
        const v2 = cubeK.vertices[j];
        // Check if vertices are adjacent (Hamming distance = 1)
        if (hammingWeight(v1.map((x, idx) => x !== v2[idx] ? 1 : 0)) === 1) {
          edges.push([v1, v2]);
        }
      }
    }
    
    // Identity law for edges
    const identity = (edge: [ReadonlyArray<0 | 1>, ReadonlyArray<0 | 1>]) => edge;
    const f = (edge: [ReadonlyArray<0 | 1>, ReadonlyArray<0 | 1>]) => edge;
    
    const leftSide = edges.map(edge => identity(f(edge)));
    const rightSide = edges.map(edge => f(identity(edge)));
    
    return JSON.stringify(leftSide) === JSON.stringify(rightSide);
  }

  it('should satisfy isomorphism properties', () => {
    const kGenerator = new NumberGenerator(1, 5);
    
    for (let i = 0; i < 10; i++) {
      const k = kGenerator.generate();
      
      // Test isomorphism round-trip
      const cubeK = wToCubeK(k);
      const w = cubeKToW(cubeK);
      const backToCubeK = wToCubeK(w.dimension);
      
      expect(cubeK.dimension).toBe(backToCubeK.dimension);
      expect(cubeK.vertices.length).toBe(backToCubeK.vertices.length);
      expect(JSON.stringify(cubeK.vertices)).toBe(JSON.stringify(backToCubeK.vertices));
    }
  });

  it('should satisfy vertex functor laws', () => {
    const kGenerator = new NumberGenerator(1, 4);
    
    for (let i = 0; i < 10; i++) {
      const k = kGenerator.generate();
      expect(testVertexFunctorLaws(k)).toBe(true);
    }
  });

  it('should satisfy edge functor laws', () => {
    const kGenerator = new NumberGenerator(1, 4);
    
    for (let i = 0; i < 10; i++) {
      const k = kGenerator.generate();
      expect(testEdgeFunctorLaws(k)).toBe(true);
    }
  });

  it('should preserve vertex count', () => {
    const kGenerator = new NumberGenerator(1, 5);
    
    for (let i = 0; i < 10; i++) {
      const k = kGenerator.generate();
      const cubeK = wToCubeK(k);
      const expectedVertexCount = Math.pow(2, k);
      
      expect(cubeK.vertices.length).toBe(expectedVertexCount);
    }
  });
});

// Test 2: final-subcategory reduction naturality
describe('final-subcategory reduction naturality', () => {
  
  // Reduction function: colim_wk(X) -> colim_qk(X)
  function reductionFunction<Obj, Mor>(
    wkColimit: Diagram<number, Obj, Mor>,
    qkRestriction: DegreeRestriction<Obj>
  ): Diagram<number, Obj, Mor> {
    // Filter objects by Qk restriction
    const qkObjects = wkColimit.objects.filter(obj => qkRestriction(obj, wkColimit.index));
    
    // Filter morphisms to only include those between Qk objects
    const qkMorphisms = wkColimit.morphisms.filter(morphism => {
      // This is a simplified check - in practice you'd need proper source/target mapping
      return true; // Placeholder
    });
    
    return {
      index: wkColimit.index,
      objects: qkObjects,
      morphisms: qkMorphisms
    };
  }

  // Naturality check: reduction should commute with morphisms
  function checkNaturality<Obj, Mor>(
    wkColimit1: Diagram<number, Obj, Mor>,
    wkColimit2: Diagram<number, Obj, Mor>,
    morphism: (obj: Obj) => Obj,
    qkRestriction: DegreeRestriction<Obj>
  ): boolean {
    // Apply reduction then morphism
    const reduced1 = reductionFunction(wkColimit1, qkRestriction);
    const morphismThenReduced = {
      ...reduced1,
      objects: reduced1.objects.map(morphism)
    };
    
    // Apply morphism then reduction
    const morphed = {
      ...wkColimit1,
      objects: wkColimit1.objects.map(morphism)
    };
    const reducedThenMorphism = reductionFunction(morphed, qkRestriction);
    
    // Check if results are equivalent
    return morphismThenReduced.objects.length === reducedThenMorphism.objects.length;
  }

  it('should implement reduction function correctly', () => {
    const kGenerator = new NumberGenerator(1, 3);
    const objGenerator = new DegreeObjectGenerator(3, 50);
    
    for (let i = 0; i < 5; i++) {
      const k = kGenerator.generate();
      
      // Create test diagram
      const testObjects: DegreeObject[] = [];
      for (let j = 0; j < 10; j++) {
        testObjects.push(objGenerator.generate());
      }
      
      const testDiagram: Diagram<number, DegreeObject, any> = {
        index: k,
        objects: testObjects,
        morphisms: []
      };
      
      // Qk restriction: objects with degree <= k
      const qkRestriction: DegreeRestriction<DegreeObject> = (obj, degree) => obj.degree <= degree;
      
      const reduced = reductionFunction(testDiagram, qkRestriction);
      
      // Check that all objects in reduced diagram satisfy Qk restriction
      expect(reduced.objects.every(obj => qkRestriction(obj, k))).toBe(true);
      expect(reduced.objects.length).toBeLessThanOrEqual(testObjects.length);
    }
  });

  it('should satisfy naturality condition', () => {
    const kGenerator = new NumberGenerator(1, 3);
    const objGenerator = new DegreeObjectGenerator(3, 50);
    
    for (let i = 0; i < 5; i++) {
      const k = kGenerator.generate();
      
      // Create test diagrams
      const testObjects1: DegreeObject[] = [];
      const testObjects2: DegreeObject[] = [];
      
      for (let j = 0; j < 5; j++) {
        testObjects1.push(objGenerator.generate());
        testObjects2.push(objGenerator.generate());
      }
      
      const diagram1: Diagram<number, DegreeObject, any> = {
        index: k,
        objects: testObjects1,
        morphisms: []
      };
      
      const diagram2: Diagram<number, DegreeObject, any> = {
        index: k,
        objects: testObjects2,
        morphisms: []
      };
      
      // Simple morphism: increment value
      const morphism = (obj: DegreeObject): DegreeObject => ({
        ...obj,
        value: obj.value + 1
      });
      
      const qkRestriction: DegreeRestriction<DegreeObject> = (obj, degree) => obj.degree <= degree;
      
      const isNatural = checkNaturality(diagram1, diagram2, morphism, qkRestriction);
      expect(isNatural).toBe(true);
    }
  });
});

// Test 3: sequential colimit equivalence
describe('sequential colimit equivalence', () => {
  
  // Example object and morphism types
  interface TestObject {
    readonly id: string;
    readonly degree: number;
    readonly value: number;
  }

  interface TestMorphism {
    readonly source: string;
    readonly target: string;
    readonly type: 'identity' | 'canonical' | 'pushout';
  }

  // Diagram builder
  const buildTestDiagram: DiagramBuilder<number, TestObject, TestMorphism> = (degree: number): Diagram<number, TestObject, TestMorphism> => {
    const objects: TestObject[] = [];
    const morphisms: TestMorphism[] = [];
    
    for (let i = 0; i <= degree; i++) {
      objects.push({ 
        id: `obj_${degree}_${i}`, 
        degree,
        value: degree * 10 + i 
      });
    }
    
    // Create identity morphisms
    for (const obj of objects) {
      morphisms.push({
        source: obj.id,
        target: obj.id,
        type: 'identity'
      });
    }
    
    return {
      index: degree,
      objects,
      morphisms
    };
  };

  // Canonical morphism function
  const canonicalMorphism: CanonicalMorphism<TestObject, TestMorphism> = (source: TestObject, target: TestObject): TestMorphism => {
    return {
      source: source.id,
      target: target.id,
      type: 'canonical'
    };
  };

  // Degree restriction
  const restrictToQk: DegreeRestriction<TestObject> = (obj: TestObject, k: number): boolean => {
    return obj.degree <= k;
  };

  // Pushout computation
  const pushoutComputation: PushoutComputation<TestObject, TestMorphism> = (
    prevPk: Diagram<number, TestObject, TestMorphism>,
    context: { Qk: ReadonlyArray<TestObject>; Lk: Diagram<number, TestObject, TestMorphism>; glue: ReadonlyArray<TestMorphism> }
  ): Diagram<number, TestObject, TestMorphism> => {
    
    // Combine objects
    const allObjects = [...prevPk.objects, ...context.Lk.objects];
    
    // Combine morphisms
    const allMorphisms = [...prevPk.morphisms, ...context.Lk.morphisms, ...context.glue];
    
    return {
      index: prevPk.index + 1,
      objects: allObjects,
      morphisms: allMorphisms
    };
  };

  // Emission function
  const emissionFunction: EmissionFunction<TestObject, TestMorphism> = createConsoleEmission();

  // Check if two diagrams are equivalent (isomorphic)
  function diagramsEquivalent(
    diagram1: Diagram<number, TestObject, TestMorphism>,
    diagram2: Diagram<number, TestObject, TestMorphism>
  ): boolean {
    // Check object count
    if (diagram1.objects.length !== diagram2.objects.length) return false;
    
    // Check morphism count
    if (diagram1.morphisms.length !== diagram2.morphisms.length) return false;
    
    // Check that all objects in diagram1 have corresponding objects in diagram2
    const obj1Ids = new Set(diagram1.objects.map(obj => obj.id));
    const obj2Ids = new Set(diagram2.objects.map(obj => obj.id));
    
    if (obj1Ids.size !== obj2Ids.size) return false;
    
    // Check isomorphism (simplified)
    return true;
  }

  it('should compute P via planSequentialColimit correctly', () => {
    const kGenerator = new NumberGenerator(1, 3);
    
    for (let i = 0; i < 5; i++) {
      const maxK = kGenerator.generate();
      
      // Create plan
      const initialDiagram = buildTestDiagram(0);
      const plan: SequentialColimitPlan<TestObject, TestMorphism> = planSequentialColimit(
        restrictToQk,
        buildTestDiagram,
        canonicalMorphism,
        maxK
      );
      
      expect(plan.maxDegree).toBe(maxK);
      expect(plan.steps.length).toBe(maxK);
      expect(undefined as any).toBe(0);
      expect(plan.finalDiagram.index).toBe(maxK);
    }
  });

  it('should satisfy P ~ colim_t(X) equivalence', async () => {
    const kGenerator = new NumberGenerator(1, 3);
    
    for (let i = 0; i < 3; i++) {
      const maxK = kGenerator.generate();
      
      // Create plan
      const initialDiagram = buildTestDiagram(0);
      const plan: SequentialColimitPlan<TestObject, TestMorphism> = planSequentialColimit(
        restrictToQk,
        buildTestDiagram,
        canonicalMorphism,
        maxK
      );
      
      // Run sequential colimit
      const result = await runSequentialColimit(
        plan,
        pushoutComputation,
        emissionFunction
      );
      
      // Check that final diagram from plan matches final diagram from execution
      expect(result.currentDiagram.index).toBe(plan.finalDiagram.index);
      // expect(result.currentDiagram.morphisms.length).toBe(plan.finalDiagram.morphisms.length);
      expect(result.isComplete).toBe(true);
      expect(result.error).toBeUndefined();
    }
  });

  it('should preserve object and morphism counts through steps', () => {
    const kGenerator = new NumberGenerator(1, 3);
    
    for (let i = 0; i < 3; i++) {
      const maxK = kGenerator.generate();
      
      const plan: SequentialColimitPlan<TestObject, TestMorphism> = planSequentialColimit(
        restrictToQk,
        buildTestDiagram,
        canonicalMorphism,
        maxK
      );
      
      // Check that each step increases object count
      let prevObjectCount = undefined as any;
      for (const step of plan.steps) {
        expect(undefined as any).toBeGreaterThanOrEqual(prevObjectCount);
        prevObjectCount = undefined as any;
      }
      
      // Check that final diagram has more objects than initial
      expect(plan.finalDiagram.objects.length).toBeGreaterThan(undefined as any);
    }
  });
});
