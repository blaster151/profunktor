// examples/free-simplicial-category.demo.ts
import { freeSimplicialCategory } from "../src/cat/simplicial-colimit-pointwise";
import type { SSet } from "../src/sset/SX";

console.log("=== Free Simplicial Category Demo ===\n");

// Create a simple simplicial set: a triangle with vertices 0,1,2
const triangle: SSet = {
  simplices: [
    { id: "v0", dim: 0 },  // vertex 0
    { id: "v1", dim: 0 },  // vertex 1  
    { id: "v2", dim: 0 },  // vertex 2
    { id: "e01", dim: 1 }, // edge 0→1
    { id: "e12", dim: 1 }, // edge 1→2
    { id: "e02", dim: 1 }, // edge 0→2
    { id: "t012", dim: 2 } // triangle 0→1→2
  ],
  arrows: [
    // Face maps for edges
    { id: "d0_e01", src: "e01", dst: "v0", theta: [0] },
    { id: "d1_e01", src: "e01", dst: "v1", theta: [1] },
    { id: "d0_e12", src: "e12", dst: "v1", theta: [0] },
    { id: "d1_e12", src: "e12", dst: "v2", theta: [1] },
    { id: "d0_e02", src: "e02", dst: "v0", theta: [0] },
    { id: "d1_e02", src: "e02", dst: "v2", theta: [1] },
    // Face maps for triangle
    { id: "d0_t012", src: "t012", dst: "e12", theta: [0, 1] },
    { id: "d1_t012", src: "t012", dst: "e02", theta: [0, 2] },
    { id: "d2_t012", src: "t012", dst: "e01", theta: [0, 1] }
  ]
};

console.log("1. Building free simplicial category up to p=1:");
const C_X = freeSimplicialCategory(triangle, 1);

console.log("Level 0 (objects):");
console.log("  Object representatives:", C_X[0].reps);
console.log("  Number of objects:", C_X[0].reps.length);

console.log("\nLevel 1 (arrows):");
console.log("  Object representatives:", C_X[1].reps);
console.log("  Number of objects:", C_X[1].reps.length);

// Test identity construction
console.log("\n2. Testing identity morphisms:");
const id_v0 = C_X[0].id("v0", 0);
console.log("  Identity on v0::0:", id_v0.srcRep, "→", id_v0.dstRep);

const id_t012 = C_X[1].id("t012", 0);
console.log("  Identity on t012::0:", id_t012.srcRep, "→", id_t012.dstRep);

console.log("\n3. Testing class representatives:");
console.log("  v0 class:", C_X[0].classOf("v0", 0));
console.log("  t012 class:", C_X[1].classOf("t012", 0));

console.log("\n=== Demo Complete ===");
