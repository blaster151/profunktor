// examples/necklace-functor-parrows.demo.ts
import { NStar, type NStarResult, type Inclusion2Cell } from "../src/sset/necklace-replacement-functor";
import { equivPArrow, isValidPArrow, type PArrowRep } from "../src/sset/p-arrows";
import { type DecoratedZigZagB } from "../src/sset/necklace";
import { type PArrow } from "../src/sset/delta-p";

console.log("=== Necklace Functor & P-Arrows Demo ===\n");

console.log("1. Testing N* Functor:");

// Create a decorated zig-zag B
const decoratedZigZag: DecoratedZigZagB = {
  simplices: [
    { id: "x0", dim: 2 },
    { id: "x1", dim: 1 },
    { id: "x2", dim: 3 }
  ],
  vertices: [0, 0, 2], // a0=a, a1, a2=b
  p: 1,
  arrows: [
    { i: 0, j: 0, flag: [[0], [0]] } as PArrow,
    { i: 0, j: 0, flag: [[0, 1], [0, 1]] } as PArrow
  ]
};

// Helper function to identify bead-simplex ids
const XidOf = (simpId: string): string => `X_${simpId}`;

// Apply N* functor
const nStarResult: NStarResult = NStar(XidOf, decoratedZigZag);

console.log("  Input decorated zig-zag:", {
  simplices: decoratedZigZag.simplices.map(s => ({ id: s.id, dim: s.dim })),
  vertices: decoratedZigZag.vertices,
  p: decoratedZigZag.p
});

console.log("  N* output proper necklace:", {
  beads: nStarResult.proper.NtoX.neck.beads,
  endpoints: [nStarResult.proper.NtoX.a, nStarResult.proper.NtoX.b],
  decoration: nStarResult.proper.dec
});

console.log("  Inclusion 2-cell ε_T:", {
  T_chain: nStarResult.epsilon.T_chain,
  N_chain: nStarResult.epsilon.N_chain
});

console.log("\n2. Testing P-Arrow Representation:");

// Create a p-arrow representation
const pArrow1: PArrowRep = {
  a: "a", b: "b",
  N: { beads: [2, 1, 3], label: "N1" },
  flag: [[0, 2, 3, 6], [0, 1, 2, 3, 4, 5, 6]], // proper: U0 contains joins 2,3
  p: 1
};

const pArrow2: PArrowRep = {
  a: "a", b: "b",
  N: { beads: [3, 3], label: "N2" },
  flag: [[0, 3, 6], [0, 1, 2, 3, 4, 5, 6]], // proper: U0 contains join 3
  p: 1
};

const pArrow3: PArrowRep = {
  a: "a", b: "b",
  N: { beads: [2, 1, 3], label: "N3" },
  flag: [[0, 3, 6], [0, 1, 2, 3, 4, 5, 6]], // improper: U0 missing join 2
  p: 1
};

console.log("  P-arrow 1 valid:", isValidPArrow(pArrow1));
console.log("  P-arrow 2 valid:", isValidPArrow(pArrow2));
console.log("  P-arrow 3 valid:", isValidPArrow(pArrow3));

console.log("\n3. Testing P-Arrow Equivalence:");

// Test equivalence between different p-arrows
const equiv12 = equivPArrow(pArrow1, pArrow2);
const equiv21 = equivPArrow(pArrow2, pArrow1);
const equiv11 = equivPArrow(pArrow1, pArrow1);

console.log("  P-arrow 1 ~ P-arrow 2:", equiv12);
console.log("  P-arrow 2 ~ P-arrow 1:", equiv21);
console.log("  P-arrow 1 ~ P-arrow 1 (reflexive):", equiv11);

console.log("\n4. Testing Surjection Generation:");

// Test the surjection generation for different bead counts
const surjections = (k: number, l: number) => {
  const cuts: number[][] = [];
  function rec(pos: number, rem: number, acc: number[]) {
    if (rem === 0) { cuts.push(acc.slice()); return; }
    for (let c = pos; c <= k - rem; c++) rec(c + 1, rem - 1, acc.concat(c));
  }
  rec(0, l, []);
  return cuts.map(sel => {
    const theta: number[] = [];
    let j = 0;
    for (let i = 0; i <= k; i++) {
      theta.push(j);
      if (sel.includes(i)) j++;
    }
    return theta;
  });
};

console.log("  Surjections [2] → [1]:", surjections(2, 1));
console.log("  Surjections [3] → [2]:", surjections(3, 2));

console.log("\n5. Testing Edge Cases:");

// Test empty necklace p-arrow
const emptyPArrow: PArrowRep = {
  a: "a", b: "b",
  N: { beads: [], label: "empty" },
  flag: [[0], [0]],
  p: 0
};

console.log("  Empty necklace p-arrow valid:", isValidPArrow(emptyPArrow));

// Test single bead p-arrow
const singlePArrow: PArrowRep = {
  a: "a", b: "b",
  N: { beads: [3], label: "single" },
  flag: [[0, 3], [0, 1, 2, 3]],
  p: 1
};

console.log("  Single bead p-arrow valid:", isValidPArrow(singlePArrow));

console.log("\n=== Demo Complete ===");
