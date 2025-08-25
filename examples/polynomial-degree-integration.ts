import { 
  Degree, 
  IndexedObject, 
  degree, 
  totalDegree, 
  withDegree,
  computeDegree,
  EdgeKind
} from '../fp-polynomial-degree';

import {
  PolynomialDiagram,
  IndexedPolynomialDiagram,
  indexDiagram
} from '../fp-polynomial-foundations';

import {
  Polynomial,
  Family,
  evalPoly,
  composeExt
} from '../fp-polynomial-functors';

console.log('=== Polynomial Degree Integration Demo ===\n');

// Example: Degree-aware polynomial functor
interface DegreePolynomial<I, A> {
  readonly polynomial: Polynomial<I, A>;
  readonly degreeMap: (obj: A) => Degree;
}

// Example: Indexed polynomial functor with degree tracking
interface IndexedPolynomialF<I, A> {
  readonly diagram: IndexedPolynomialDiagram<I, A, A, I>;
  readonly degree: (obj: IndexedObject<A>) => Degree;
}

// Example: Degree-aware polynomial morphism
interface DegreePolynomialMorphism<I, A, J, B> {
  readonly source: DegreePolynomial<I, A>;
  readonly target: DegreePolynomial<J, B>;
  readonly morphism: (a: A) => B;
  readonly degreePreserving: boolean;
}

// Create a degree-aware polynomial
function createDegreePolynomial<I, A>(
  polynomial: Polynomial<I, A>,
  degreeMap: (obj: A) => Degree
): DegreePolynomial<I, A> {
  return {
    polynomial,
    degreeMap
  };
}

// Create an indexed polynomial diagram from a degree polynomial
function createIndexedPolynomialDiagram<I, A>(
  degreePoly: DegreePolynomial<I, A>
): IndexedPolynomialDiagram<I, A, A, I> {
  
  // Create a simple polynomial diagram
  const diagram: PolynomialDiagram<I, A, A, I> = {
    kind: 'PolynomialDiagram',
    s: (a: A) => degreePoly.polynomial.I,
    f: (a: A) => a,
    t: (a: A) => degreePoly.polynomial.I,
    I: degreePoly.polynomial.I,
    B: degreePoly.polynomial.A,
    A: degreePoly.polynomial.A,
    J: degreePoly.polynomial.I
  };
  
  // Index the diagram with degree functions
  return indexDiagram(
    diagram,
    (i: I) => degree(0, 0),  // Input objects have zero degree
    degreePoly.degreeMap,     // Base objects use the degree map
    degreePoly.degreeMap,     // Argument objects use the degree map
    (j: I) => degree(0, 0)   // Output objects have zero degree
  );
}

// Example usage
console.log('--- Creating Degree-Aware Polynomials ---');

// Define a simple polynomial
const simplePoly: Polynomial<string, number> = {
  I: 'input',
  A: 42
};

// Define degree mapping based on value
const degreeMap = (obj: number): Degree => {
  return degree(Math.floor(obj / 10), obj % 10);
};

// Create degree-aware polynomial
const degreePoly = createDegreePolynomial(simplePoly, degreeMap);

console.log('Degree polynomial:', degreePoly);
console.log('Degree of 42:', degreeMap(42));
console.log('Degree of 123:', degreeMap(123));

// Create indexed diagram
const indexedDiagram = createIndexedPolynomialDiagram(degreePoly);

console.log('\n--- Indexed Diagram ---');
console.log('Indexed diagram kind:', indexedDiagram.kind);
console.log('Indexed I:', indexedDiagram.I);
console.log('Indexed B:', indexedDiagram.B);
console.log('Indexed A:', indexedDiagram.A);
console.log('Indexed J:', indexedDiagram.J);

// Test degree propagation through the diagram
console.log('\n--- Degree Propagation ---');

const testValue = 156;
const indexedValue = withDegree(testValue, degreeMap(testValue));

console.log('Test value:', testValue);
console.log('Indexed value:', indexedValue);

// Apply the diagram maps
const mappedI = indexedDiagram.s(indexedValue);
const mappedA = indexedDiagram.f(indexedValue);
const mappedJ = indexedDiagram.t(mappedA);

console.log('Mapped I:', mappedI);
console.log('Mapped A:', mappedA);
console.log('Mapped J:', mappedJ);

// Example: Degree-preserving morphism
console.log('\n--- Degree-Preserving Morphism ---');

const sourcePoly = createDegreePolynomial(
  { I: 'source', A: 10 },
  (a: number) => degree(a, 0)
);

const targetPoly = createDegreePolynomial(
  { I: 'target', A: 20 },
  (a: number) => degree(a * 2, 0)
);

const morphism: DegreePolynomialMorphism<string, number, string, number> = {
  source: sourcePoly,
  target: targetPoly,
  morphism: (a: number) => a * 2,
  degreePreserving: true
};

console.log('Source polynomial:', sourcePoly);
console.log('Target polynomial:', targetPoly);
console.log('Morphism degree preserving:', morphism.degreePreserving);

// Test degree preservation
const sourceValue = 5;
const sourceDegree = sourcePoly.degreeMap(sourceValue);
const targetValue = morphism.morphism(sourceValue);
const targetDegree = targetPoly.degreeMap(targetValue);

console.log('Source value:', sourceValue, 'degree:', sourceDegree);
console.log('Target value:', targetValue, 'degree:', targetDegree);
console.log('Degree preserved:', totalDegree(sourceDegree) === totalDegree(targetDegree));

// Example: Edge-based degree computation
console.log('\n--- Edge-Based Degree Computation ---');

// Define edges for different operations
const edges: Record<string, EdgeKind[]> = {
  'identity': [],
  'constant': ['K'],
  'linear': ['K', 'L'],
  'quadratic': ['K', 'K', 'L', 'L'],
  'transform': ['F', 'G', 'K']
};

// Create degree polynomials based on edge patterns
for (const [operation, edgeList] of Object.entries(edges)) {
  const computedDegree = computeDegree(edgeList);
  console.log(`${operation}: edges=${edgeList}, degree=${JSON.stringify(computedDegree)}`);
}

console.log('\n=== Polynomial Degree Integration Demo Completed ===');
