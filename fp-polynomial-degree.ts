/**
 * Polynomial Degree System
 * 
 * Provides degree tracking for polynomial diagrams with (p,q) coordinates
 * where p = K-edges and q = L-edges.
 */

// Edge kinds in polynomial morphisms
export type EdgeKind = 'K' | 'L' | 'F' | 'G';

// Degree as (p,q) coordinates
export interface Degree { 
  readonly kEdges: number; 
  readonly lEdges: number; 
}

// Create a degree from K and L edge counts
export const degree = (kEdges: number, lEdges: number): Degree => ({ kEdges, lEdges });

// Total degree (p + q)
export const totalDegree = (d: Degree): number => d.kEdges + d.lEdges;

// Objects that carry degree information
export interface IndexedObject<A> {
  readonly value: A;
  readonly degree: Degree;
}

// Wrap a value with degree information
export const withDegree = <A>(value: A, d: Degree): IndexedObject<A> => ({ value, degree: d });

// Type guard to check if an object is indexed
export const isIndexed = <A>(x: unknown): x is IndexedObject<A> =>
  !!x && typeof x === 'object' && x !== null && 'degree' in (x as any) && 'value' in (x as any);

// Helper functions for degree computations
export const computeDegree = (edges: ReadonlyArray<EdgeKind>): Degree => {
  let kEdges = 0;
  let lEdges = 0;
  
  for (const edge of edges) {
    if (edge === 'K') kEdges++;
    else if (edge === 'L') lEdges++;
  }
  
  return degree(kEdges, lEdges);
};

// Create an indexed object from a value and edge list
export const createIndexedObject = <A>(value: A, edges: ReadonlyArray<EdgeKind>): IndexedObject<A> => {
  return withDegree(value, computeDegree(edges));
};

// Create an inclusion with degree tracking
export const createInclusion = (k: number): { k: number; degree: Degree } => {
  return { k, degree: degree(k, 0) };
};

// Degree comparison utilities
export const degreeLessThan = (d1: Degree, d2: Degree): boolean => 
  totalDegree(d1) < totalDegree(d2);

export const degreeLessThanOrEqual = (d1: Degree, d2: Degree): boolean => 
  totalDegree(d1) <= totalDegree(d2);

export const degreeEqual = (d1: Degree, d2: Degree): boolean => 
  d1.kEdges === d2.kEdges && d1.lEdges === d2.lEdges;

// Edge kind utilities
export const isKEdge = (kind: EdgeKind): boolean => kind === 'K';
export const isLEdge = (kind: EdgeKind): boolean => kind === 'L';
export const isFEdge = (kind: EdgeKind): boolean => kind === 'F';
export const isGEdge = (kind: EdgeKind): boolean => kind === 'G';
export const isTransformEdge = (kind: EdgeKind): boolean => isFEdge(kind) || isGEdge(kind);
export const isStructuralEdge = (kind: EdgeKind): boolean => isKEdge(kind) || isLEdge(kind);

// Degree arithmetic
export const addDegrees = (d1: Degree, d2: Degree): Degree => 
  degree(d1.kEdges + d2.kEdges, d1.lEdges + d2.lEdges);

export const subtractDegrees = (d1: Degree, d2: Degree): Degree => 
  degree(Math.max(0, d1.kEdges - d2.kEdges), Math.max(0, d1.lEdges - d2.lEdges));

export const maxDegree = (d1: Degree, d2: Degree): Degree => 
  degree(Math.max(d1.kEdges, d2.kEdges), Math.max(d1.lEdges, d2.lEdges));

export const minDegree = (d1: Degree, d2: Degree): Degree => 
  degree(Math.min(d1.kEdges, d2.kEdges), Math.min(d1.lEdges, d2.lEdges));

// Zero degree
export const zeroDegree = (): Degree => degree(0, 0);

// Unit degrees
export const unitK = (): Degree => degree(1, 0);
export const unitL = (): Degree => degree(0, 1);
