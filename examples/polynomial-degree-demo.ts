import { 
  EdgeKind, 
  Degree, 
  IndexedObject, 
  degree, 
  totalDegree, 
  withDegree, 
  isIndexed,
  computeDegree,
  createIndexedObject,
  addDegrees,
  subtractDegrees,
  maxDegree,
  minDegree,
  zeroDegree,
  unitK,
  unitL,
  isKEdge,
  isLEdge,
  isFEdge,
  isGEdge,
  isTransformEdge,
  isStructuralEdge
} from '../fp-polynomial-degree';

import {
  PolynomialDiagram,
  IndexedPolynomialDiagram,
  indexDiagram
} from '../fp-polynomial-foundations';

console.log('=== Polynomial Degree System Demo ===\n');

// Test basic degree operations
console.log('--- Basic Degree Operations ---');

const deg1 = degree(2, 3);  // 2 K-edges, 3 L-edges
const deg2 = degree(1, 4);  // 1 K-edge, 4 L-edges

console.log('Degree 1:', deg1);
console.log('Degree 2:', deg2);
console.log('Total degree 1:', totalDegree(deg1));
console.log('Total degree 2:', totalDegree(deg2));

// Test degree arithmetic
console.log('\n--- Degree Arithmetic ---');
console.log('Add degrees:', addDegrees(deg1, deg2));
console.log('Subtract degrees:', subtractDegrees(deg1, deg2));
console.log('Max degree:', maxDegree(deg1, deg2));
console.log('Min degree:', minDegree(deg1, deg2));
console.log('Zero degree:', zeroDegree());
console.log('Unit K:', unitK());
console.log('Unit L:', unitL());

// Test edge kind utilities
console.log('\n--- Edge Kind Utilities ---');
const edges: EdgeKind[] = ['K', 'L', 'F', 'G', 'K', 'L'];
console.log('Edges:', edges);
console.log('Computed degree from edges:', computeDegree(edges));
console.log('K edges:', edges.filter(isKEdge));
console.log('L edges:', edges.filter(isLEdge));
console.log('F edges:', edges.filter(isFEdge));
console.log('G edges:', edges.filter(isGEdge));
console.log('Transform edges:', edges.filter(isTransformEdge));
console.log('Structural edges:', edges.filter(isStructuralEdge));

// Test indexed objects
console.log('\n--- Indexed Objects ---');

const plainValue = { id: 'test', data: 42 };
const indexedValue = withDegree(plainValue, degree(1, 2));

console.log('Plain value:', plainValue);
console.log('Indexed value:', indexedValue);
console.log('Is indexed (plain):', isIndexed(plainValue));
console.log('Is indexed (indexed):', isIndexed(indexedValue));

// Test creating indexed objects from edge lists
const objFromEdges = createIndexedObject({ name: 'example' }, ['K', 'K', 'L', 'F']);
console.log('Object from edges:', objFromEdges);

// Test polynomial diagram indexing
console.log('\n--- Polynomial Diagram Indexing ---');

// Create a simple polynomial diagram
const simpleDiagram: PolynomialDiagram<string, number, boolean, string> = {
  kind: 'PolynomialDiagram',
  s: (b: number) => `input_${b}`,
  f: (b: number) => b > 0,
  t: (a: boolean) => a ? 'true' : 'false',
  I: 'start',
  B: 5,
  A: true,
  J: 'end'
};

console.log('Simple diagram:', simpleDiagram);

// Define degree functions for each object type
const degI = (i: string): Degree => degree(i.length, 0);
const degB = (b: number): Degree => degree(b, 0);
const degA = (a: boolean): Degree => degree(0, a ? 1 : 0);
const degJ = (j: string): Degree => degree(0, j.length);

// Create indexed diagram
const indexedDiagram = indexDiagram(simpleDiagram, degI, degB, degA, degJ);

console.log('Indexed diagram kind:', indexedDiagram.kind);
console.log('Indexed I:', indexedDiagram.I);
console.log('Indexed B:', indexedDiagram.B);
console.log('Indexed A:', indexedDiagram.A);
console.log('Indexed J:', indexedDiagram.J);

// Test the indexed maps
const indexedB = withDegree(10, degree(10, 0));
const mappedI = indexedDiagram.s(indexedB);
console.log('Mapped I from indexed B:', mappedI);

const mappedA = indexedDiagram.f(indexedB);
console.log('Mapped A from indexed B:', mappedA);

const mappedJ = indexedDiagram.t(mappedA);
console.log('Mapped J from indexed A:', mappedJ);

// Test degree tracking through composition
console.log('\n--- Degree Tracking Through Composition ---');

// Create a more complex diagram with degree-aware operations
const complexDiagram: PolynomialDiagram<number, string, number, boolean> = {
  kind: 'PolynomialDiagram',
  s: (b: string) => b.length,
  f: (b: string) => parseInt(b) || 0,
  t: (a: number) => a > 0,
  I: 0,
  B: '42',
  A: 42,
  J: true
};

// Degree functions that reflect the complexity of operations
const complexDegI = (i: number): Degree => degree(i, 0);
const complexDegB = (b: string): Degree => degree(b.length, b.length % 2);
const complexDegA = (a: number): Degree => degree(Math.floor(a / 10), a % 10);
const complexDegJ = (j: boolean): Degree => degree(j ? 1 : 0, j ? 0 : 1);

const complexIndexed = indexDiagram(complexDiagram, complexDegI, complexDegB, complexDegA, complexDegJ);

console.log('Complex indexed diagram:');
console.log('  I degree:', complexIndexed.I.degree);
console.log('  B degree:', complexIndexed.B.degree);
console.log('  A degree:', complexIndexed.A.degree);
console.log('  J degree:', complexIndexed.J.degree);

// Test degree propagation through the diagram
const testB = withDegree('12345', degree(5, 1));
const resultI = complexIndexed.s(testB);
const resultA = complexIndexed.f(testB);
const resultJ = complexIndexed.t(resultA);

console.log('\nDegree propagation:');
console.log('  Input B:', testB);
console.log('  Mapped I:', resultI);
console.log('  Mapped A:', resultA);
console.log('  Final J:', resultJ);

console.log('\n=== Polynomial Degree System Demo Completed ===');
