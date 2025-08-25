/**
 * Punctured Cube Implementation
 * 
 * Provides cube and punctured cube structures with vertices as 0/1 arrays.
 * A punctured cube is a cube with the (1,...,1) vertex removed.
 */

// Type for binary arrays (0/1 arrays)
export type BinaryArray = ReadonlyArray<0 | 1>;

// Cube with all vertices
export interface CubeK {
  readonly dimension: number;
  readonly vertices: ReadonlyArray<BinaryArray>;
}

// Punctured cube with (1,...,1) vertex removed
export interface PuncturedCubeK {
  readonly dimension: number;
  readonly vertices: ReadonlyArray<BinaryArray>;
}

// Generate all binary arrays of length k
function generateBinaryArrays(k: number): ReadonlyArray<BinaryArray> {
  if (k <= 0) return [[]];
  
  const result: BinaryArray[] = [];
  const max = Math.pow(2, k);
  
  for (let i = 0; i < max; i++) {
    const binary: (0 | 1)[] = [];
    for (let j = 0; j < k; j++) {
      binary.unshift(((i >> j) & 1) as 0 | 1);
    }
    result.push(binary);
  }
  
  return result;
}

// Check if a binary array is all ones (1,...,1)
function isAllOnes(arr: BinaryArray): boolean {
  return arr.every(bit => bit === 1);
}

// Create a cube of dimension k
export function cube(k: number): CubeK {
  if (k < 0) {
    throw new Error(`Cube dimension must be non-negative, got ${k}`);
  }
  
  const vertices = generateBinaryArrays(k);
  
  return {
    dimension: k,
    vertices
  };
}

// Create a punctured cube of dimension k (removes (1,...,1))
export function puncturedCube(k: number): PuncturedCubeK {
  if (k < 0) {
    throw new Error(`Punctured cube dimension must be non-negative, got ${k}`);
  }
  
  const allVertices = generateBinaryArrays(k);
  const vertices = allVertices.filter(vertex => !isAllOnes(vertex));
  
  return {
    dimension: k,
    vertices
  };
}

// Utility functions for working with cubes

// Get the number of vertices in a cube
export function cubeVertexCount(dimension: number): number {
  return Math.pow(2, dimension);
}

// Get the number of vertices in a punctured cube
export function puncturedCubeVertexCount(dimension: number): number {
  return Math.pow(2, dimension) - 1;
}

// Check if a vertex is in a cube
export function isVertexInCube(cube: CubeK, vertex: BinaryArray): boolean {
  return cube.vertices.some(v => 
    v.length === vertex.length && 
    v.every((bit, i) => bit === vertex[i])
  );
}

// Check if a vertex is in a punctured cube
export function isVertexInPuncturedCube(puncturedCube: PuncturedCubeK, vertex: BinaryArray): boolean {
  return puncturedCube.vertices.some(v => 
    v.length === vertex.length && 
    v.every((bit, i) => bit === vertex[i])
  );
}

// Get the Hamming weight (number of 1s) of a binary array
export function hammingWeight(arr: BinaryArray): number {
  return arr.reduce((count, bit) => count + bit, 0 as number);
}

// Get vertices by Hamming weight
export function getVerticesByWeight(cube: CubeK, weight: number): ReadonlyArray<BinaryArray> {
  return cube.vertices.filter(vertex => hammingWeight(vertex) === weight);
}

// Get vertices by Hamming weight for punctured cube
export function getPuncturedVerticesByWeight(puncturedCube: PuncturedCubeK, weight: number): ReadonlyArray<BinaryArray> {
  return puncturedCube.vertices.filter(vertex => hammingWeight(vertex) === weight);
}

// Get the all-ones vertex for a given dimension
export function getAllOnesVertex(dimension: number): BinaryArray {
  return Array(dimension).fill(1);
}

// Get the all-zeros vertex for a given dimension
export function getAllZerosVertex(dimension: number): BinaryArray {
  return Array(dimension).fill(0);
}
