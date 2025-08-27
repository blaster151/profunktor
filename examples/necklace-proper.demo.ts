// examples/necklace-proper.demo.ts
import { 
  joinsOf, 
  isProperDecoration, 
  pushFlag, 
  type ProperDecoration,
  type Necklace 
} from "../src/sset/necklace";
import { 
  mkProperHoriz, 
  act2Cell, 
  type NecklaceInX, 
  type ProperHoriz,
  type PointedMap 
} from "../src/sset/npX";

console.log("=== Necklace Proper Demo ===\n");

console.log("1. Testing Joins Calculation:");

// Create a necklace with beads [2, 1, 3]
const necklace: Necklace = { 
  beads: [2, 1, 3], 
  label: "N[2,1,3]" 
};

const joins = joinsOf(necklace);
console.log("  Necklace:", necklace.beads);
console.log("  Total vertices:", necklace.beads.reduce((s, ni) => s + ni, 0) + 1);
console.log("  Joins J_N:", joins);

console.log("\n2. Testing Proper Decoration:");

// Create a proper decoration with p=1
const properDec: ProperDecoration = {
  p: 1,
  flag: [[0, 2, 3, 6], [0, 1, 2, 3, 4, 5, 6]] // U0 contains joins 2,3
};

const isProper = isProperDecoration(necklace, properDec);
console.log("  Decoration:", properDec);
console.log("  Is proper:", isProper);

// Create an improper decoration (missing join 2)
const improperDec: ProperDecoration = {
  p: 1,
  flag: [[0, 3, 6], [0, 1, 2, 3, 4, 5, 6]] // U0 missing join 2
};

const isImproper = isProperDecoration(necklace, improperDec);
console.log("  Improper decoration:", improperDec);
console.log("  Is proper:", isImproper);

console.log("\n3. Testing Flag Pushforward:");

// Create a pointed map that collapses vertices
const pointedMap: PointedMap = {
  mapVertex: (v: number) => {
    // Collapse vertices 2,3 to 2, and 4,5 to 4
    if (v === 3) return 2;
    if (v === 5) return 4;
    return v;
  }
};

const originalFlag = [[0, 2, 3, 6], [0, 1, 2, 3, 4, 5, 6]];
const pushedFlag = pushFlag(pointedMap.mapVertex, originalFlag);

console.log("  Original flag:", originalFlag);
console.log("  Pointed map: v →", "collapses 3→2, 5→4");
console.log("  Pushed flag:", pushedFlag);

console.log("\n4. Testing N^p_X Sub-double Category:");

// Create a necklace in X
const necklaceInX: NecklaceInX = {
  neck: necklace,
  beadSimplexIds: ["x0", "x1", "x2"],
  a: "a",
  b: "b"
};

// Create a proper horizontal 1-cell
try {
  const properHoriz = mkProperHoriz(necklaceInX, properDec);
  console.log("  Created proper horizontal 1-cell:", {
    necklace: properHoriz.NtoX.neck.beads,
    endpoints: [properHoriz.NtoX.a, properHoriz.NtoX.b],
    decoration: properHoriz.dec
  });

  // Test 2-cell action
  const actedHoriz = act2Cell(pointedMap, properHoriz);
  console.log("  After 2-cell action:", {
    decoration: actedHoriz.dec
  });

} catch (error) {
  console.log("  Error creating proper horizontal:", error);
}

// Test improper decoration (should throw error)
try {
  const improperHoriz = mkProperHoriz(necklaceInX, improperDec);
  console.log("  Unexpected success with improper decoration");
} catch (error) {
  console.log("  Correctly rejected improper decoration:", error);
}

console.log("\n5. Testing Edge Cases:");

// Test empty necklace
const emptyNecklace: Necklace = { beads: [], label: "empty" };
const emptyJoins = joinsOf(emptyNecklace);
console.log("  Empty necklace joins:", emptyJoins);

// Test single bead necklace
const singleNecklace: Necklace = { beads: [3], label: "single" };
const singleJoins = joinsOf(singleNecklace);
console.log("  Single bead joins:", singleJoins);

// Test flag pushforward with identity map
const identityMap: PointedMap = {
  mapVertex: (v: number) => v
};

const identityPushed = pushFlag(identityMap.mapVertex, originalFlag);
console.log("  Identity pushforward:", identityPushed);
console.log("  Matches original:", JSON.stringify(originalFlag) === JSON.stringify(identityPushed));

console.log("\n=== Demo Complete ===");
