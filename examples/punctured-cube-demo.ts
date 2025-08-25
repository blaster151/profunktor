import { 
  cube, 
  puncturedCube, 
  CubeK, 
  PuncturedCubeK,
  BinaryArray,
  cubeVertexCount,
  puncturedCubeVertexCount,
  isVertexInCube,
  isVertexInPuncturedCube,
  hammingWeight,
  getVerticesByWeight,
  getPuncturedVerticesByWeight,
  getAllOnesVertex,
  getAllZerosVertex
} from '../fp-punctured-cube';

console.log('=== Punctured Cube Demo ===\n');

// Test cube creation
console.log('Testing cube(2):');
const cube2: CubeK = cube(2);
console.log('Dimension:', cube2.dimension);
console.log('Vertices:', cube2.vertices);
console.log('Vertex count:', cubeVertexCount(2));
console.log('Expected: 2^2 = 4 vertices\n');

// Test punctured cube creation
console.log('Testing puncturedCube(2):');
const puncturedCube2: PuncturedCubeK = puncturedCube(2);
console.log('Dimension:', puncturedCube2.dimension);
console.log('Vertices:', puncturedCube2.vertices);
console.log('Vertex count:', puncturedCubeVertexCount(2));
console.log('Expected: 2^2 - 1 = 3 vertices (removed [1,1])\n');

// Test cube(3)
console.log('Testing cube(3):');
const cube3: CubeK = cube(3);
console.log('Dimension:', cube3.dimension);
console.log('Vertices:', cube3.vertices);
console.log('Vertex count:', cubeVertexCount(3));
console.log('Expected: 2^3 = 8 vertices\n');

// Test punctured cube(3)
console.log('Testing puncturedCube(3):');
const puncturedCube3: PuncturedCubeK = puncturedCube(3);
console.log('Dimension:', puncturedCube3.dimension);
console.log('Vertices:', puncturedCube3.vertices);
console.log('Vertex count:', puncturedCubeVertexCount(3));
console.log('Expected: 2^3 - 1 = 7 vertices (removed [1,1,1])\n');

// Test vertex membership
console.log('Testing vertex membership:');
const testVertex: BinaryArray = [1, 0, 1];
console.log(`Is [1,0,1] in cube(3)?`, isVertexInCube(cube3, testVertex));
console.log(`Is [1,0,1] in puncturedCube(3)?`, isVertexInPuncturedCube(puncturedCube3, testVertex));

const allOnesVertex: BinaryArray = [1, 1, 1];
console.log(`Is [1,1,1] in cube(3)?`, isVertexInCube(cube3, allOnesVertex));
console.log(`Is [1,1,1] in puncturedCube(3)?`, isVertexInPuncturedCube(puncturedCube3, allOnesVertex));

// Test Hamming weight
console.log('\nTesting Hamming weight:');
console.log('Hamming weight of [1,0,1]:', hammingWeight([1, 0, 1]));
console.log('Hamming weight of [0,0,0]:', hammingWeight([0, 0, 0]));
console.log('Hamming weight of [1,1,1]:', hammingWeight([1, 1, 1]));

// Test vertices by weight
console.log('\nTesting vertices by weight in cube(3):');
for (let weight = 0; weight <= 3; weight++) {
  const verticesWithWeight = getVerticesByWeight(cube3, weight);
  console.log(`Vertices with weight ${weight}:`, verticesWithWeight);
}

console.log('\nTesting vertices by weight in puncturedCube(3):');
for (let weight = 0; weight <= 3; weight++) {
  const verticesWithWeight = getPuncturedVerticesByWeight(puncturedCube3, weight);
  console.log(`Vertices with weight ${weight}:`, verticesWithWeight);
}

// Test utility functions
console.log('\nTesting utility functions:');
console.log('All zeros vertex for dimension 3:', getAllZerosVertex(3));
console.log('All ones vertex for dimension 3:', getAllOnesVertex(3));

// Test edge cases
console.log('\nTesting edge cases:');
console.log('cube(0):', cube(0));
console.log('puncturedCube(0):', puncturedCube(0));
console.log('cube(1):', cube(1));
console.log('puncturedCube(1):', puncturedCube(1));

// Verify the punctured cube is missing the all-ones vertex
console.log('\nVerifying punctured cube properties:');
const allOnes3 = getAllOnesVertex(3);
console.log('All-ones vertex for dimension 3:', allOnes3);
console.log('Is all-ones in cube(3)?', isVertexInCube(cube3, allOnes3));
console.log('Is all-ones in puncturedCube(3)?', isVertexInPuncturedCube(puncturedCube3, allOnes3));
console.log('Punctured cube vertex count:', puncturedCube3.vertices.length);
console.log('Expected: cube vertex count - 1 =', cube3.vertices.length - 1);
