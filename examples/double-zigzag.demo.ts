// examples/double-zigzag.demo.ts
import { 
  actSquare, 
  actLadder, 
  actRhoConcat,
  buildZF,
  zigzagDouble,
  type DecoratedLR, 
  type DecoratedTrivial,
  type TwoCellSquare,
  type TwoCellLadder,
  type FunctorLike,
  type RhoGen,
  type DoubleCategory
} from "../src/cat/double-zigzag";

console.log("=== Double Zigzag Demo ===\n");

// Simple functor implementation for testing
const simpleFunctor: FunctorLike<string, string> = {
  onObj: (o: string) => `F(${o})`,
  onMor: (m: string) => `F(${m})`
};

// Mock functor factory
const F = (uId: string): FunctorLike<string, string> => simpleFunctor;

// Simple composition function
const composeInCk = (m2: string, m1: string): string => `${m1} ∘ ${m2}`;

console.log("1. Testing Square Action (Generator i):");

// Create a decorated LR zig-zag
const decoratedLR: DecoratedLR<string, string, string> = {
  i: "i", j: "j", k: "k",
  lId: "l", rId: "r",
  a: "a", a1: "a1", b: "b",
  f0: "f0: a → l̃(a1)",
  f1: "f1: r̃(a1) → b"
};

// Create a 2-cell square
const square: TwoCellSquare<string> = {
  i: "i", j: "j", k: "k",
  rhoiId: "rhoi", rhojId: "rhoj"
};

// Apply square action
const result = actSquare(F, square, decoratedLR, composeInCk);

console.log("  Input decorated LR:", {
  i: decoratedLR.i, j: decoratedLR.j, k: decoratedLR.k,
  f0: decoratedLR.f0, f1: decoratedLR.f1
});

console.log("  Output trivial decoration:", {
  k: result.k,
  aPrime: result.aPrime,
  bPrime: result.bPrime,
  g: result.g
});

console.log("\n2. Testing Ladder Action (Generator ii):");

// Create a 2-cell ladder
const ladder: TwoCellLadder<string> = {
  i: "i", j1: "j1", j: "j",
  iPrime: "i′", j1Prime: "j1′", jPrime: "j′",
  lId: "l", rId: "r",
  lPrimeId: "l′", rPrimeId: "r′",
  rhoiId: "rhoi", rhoj1Id: "rhoj1", rhojId: "rhoj"
};

// Apply ladder action
const ladderResult = actLadder(F, ladder, decoratedLR);

console.log("  Input decorated LR:", {
  i: decoratedLR.i, j: decoratedLR.j, k: decoratedLR.k,
  f0: decoratedLR.f0, f1: decoratedLR.f1
});

console.log("  Output decorated LR:", {
  i: ladderResult.i, j: ladderResult.j, k: ladderResult.k,
  f0: ladderResult.f0, f1: ladderResult.f1
});

console.log("\n3. Testing Composition in Ck:");
const composition = composeInCk("f1p", "f0p");
console.log("  f1p ∘ f0p =", composition);

console.log("\n4. Testing Horizontal Concatenation:");

// Create a sequence of generators
const generators: RhoGen<string>[] = [
  { kind: "square", cell: square },
  { kind: "ladder", cell: ladder },
  { kind: "square", cell: { i: "i′", j: "j′", k: "k′", rhoiId: "rhoi2", rhojId: "rhoj2" } }
];

// Apply concatenated action
const concatResult = actRhoConcat(F, generators, decoratedLR, composeInCk);

console.log("  Input generators:", generators.length, "generators");
console.log("  Output type:", "g" in concatResult ? "trivial" : "decorated LR");
if ("g" in concatResult) {
  console.log("  Trivial result:", { k: concatResult.k, g: concatResult.g });
} else {
  console.log("  LR result:", { i: concatResult.i, j: concatResult.j, k: concatResult.k });
}

console.log("\n5. Testing ZF Facade:");

// Build a simple ZF double category
const ZF = buildZF(
  ["obj1", "obj2"], // objects
  [decoratedLR],    // horizontal 1-cells (F-decorated zig-zags)
  ["vert1", "vert2"], // vertical 1-cells
  ["cell1", "cell2"]  // 2-cells
);

console.log("  ZF structure:", {
  objects: ZF.objs.length,
  horizontal: ZF.horiz.length,
  vertical: ZF.vert.length,
  cells: ZF.cells.length
});

console.log("\n6. Testing Zigzag Double:");

// Build the zigzag double
const ZTildeF = zigzagDouble(ZF);

console.log("  Z~F structure:", {
  objects: ZTildeF.objs.length,
  horizontal: ZTildeF.horiz.length,
  vertical: ZTildeF.vert.length,
  vCells: ZTildeF.vCells.length
});

console.log("\n=== Demo Complete ===");
