// examples/catsharp-definition.demo.ts
import { 
  type Poly, 
  type PolyHom, 
  type Comonoid, 
  type CoHom, 
  type Bicomodule, 
  type Square,
  type CatSharp,
  hid,
  hcomp,
  squareCommutes,
  type EqualizerTools
} from "../src/catsharp/definition";

console.log("=== Cat♯ Definition Demo ===\n");

console.log("1. Testing Basic Polynomials:");

// Create some basic polynomials
const p1: Poly = { name: "p1" };
const p2: Poly = { name: "p2" };
const p3: Poly = { name: "p3" };

const hom1: PolyHom = { from: p1, to: p2, label: "f" };
const hom2: PolyHom = { from: p2, to: p3, label: "g" };

console.log("  Polynomials:", [p1.name, p2.name, p3.name]);
console.log("  Homomorphism:", hom1.label, ":", hom1.from.name, "→", hom1.to.name);

console.log("\n2. Testing Comonoids:");

// Create a comonoid
const comonoid1: Comonoid = {
  poly: p1,
  counit: { from: p1, to: { name: "y" }, label: "ε" },
  comult: { from: p1, to: { name: "p1▷p1" }, label: "δ" }
};

const comonoid2: Comonoid = {
  poly: p2,
  counit: { from: p2, to: { name: "y" }, label: "ε'" },
  comult: { from: p2, to: { name: "p2▷p2" }, label: "δ'" }
};

console.log("  Comonoid 1:", {
  poly: comonoid1.poly.name,
  counit: comonoid1.counit.label,
  comult: comonoid1.comult.label
});

console.log("  Comonoid 2:", {
  poly: comonoid2.poly.name,
  counit: comonoid2.counit.label,
  comult: comonoid2.comult.label
});

console.log("\n3. Testing Comonoid Homomorphisms:");

// Create a comonoid homomorphism
const cohom: CoHom = {
  src: comonoid1,
  dst: comonoid2,
  map: { from: p1, to: p2, label: "φ" }
};

console.log("  CoHom:", {
  src: cohom.src.poly.name,
  dst: cohom.dst.poly.name,
  map: cohom.map.label
});

console.log("\n4. Testing Bicomodules:");

// Create bicomodules
const bicomodule1: Bicomodule = {
  left: comonoid1,
  right: comonoid2,
  carrier: p3,
  coactL: { from: p3, to: { name: "p1▷p3" }, label: "λ" },
  coactR: { from: p3, to: { name: "p3▷p2" }, label: "ρ" }
};

const bicomodule2: Bicomodule = {
  left: comonoid2,
  right: comonoid1,
  carrier: p1,
  coactL: { from: p1, to: { name: "p2▷p1" }, label: "λ'" },
  coactR: { from: p1, to: { name: "p1▷p1" }, label: "ρ'" }
};

console.log("  Bicomodule 1:", {
  left: bicomodule1.left.poly.name,
  right: bicomodule1.right.poly.name,
  carrier: bicomodule1.carrier.name,
  coactL: bicomodule1.coactL.label,
  coactR: bicomodule1.coactR.label
});

console.log("  Bicomodule 2:", {
  left: bicomodule2.left.poly.name,
  right: bicomodule2.right.poly.name,
  carrier: bicomodule2.carrier.name,
  coactL: bicomodule2.coactL.label,
  coactR: bicomodule2.coactR.label
});

console.log("\n5. Testing Horizontal Identity:");

// Test horizontal identity
const hid1 = hid(comonoid1);
console.log("  Horizontal identity at comonoid1:", {
  left: hid1.left.poly.name,
  right: hid1.right.poly.name,
  carrier: hid1.carrier.name,
  coactL: hid1.coactL.label,
  coactR: hid1.coactR.label
});

console.log("\n6. Testing Squares:");

// Create a square
const square: Square = {
  phi: cohom,
  psi: { src: comonoid2, dst: comonoid1, map: { from: p2, to: p1, label: "ψ" } },
  p: bicomodule1,
  pPrime: bicomodule2,
  gamma: { from: p3, to: p1, label: "γ" }
};

console.log("  Square:", {
  phi: square.phi.map.label,
  psi: square.psi.map.label,
  p: square.p.carrier.name,
  pPrime: square.pPrime.carrier.name,
  gamma: square.gamma.label
});

console.log("\n7. Testing Square Commutativity:");

// Mock commutativity checker
const mockCommuteChecker = (sq: Square): boolean => {
  // In a real implementation, this would check if the square commutes
  return sq.gamma.label === "γ" && sq.phi.map.label === "φ";
};

const commutes = squareCommutes(square, mockCommuteChecker);
console.log("  Square commutes:", commutes);

console.log("\n8. Testing Horizontal Composition:");

// Mock equalizer tools
const mockEqualizerTools: EqualizerTools = {
  equalizeTopRow: (args) => ({
    carrier: { name: `eq(${args.p.carrier.name},${args.q.carrier.name})` },
    intoMid: { from: { name: "mid" }, to: { name: "eq" }, label: "ι" }
  }),
  induceCoactions: (args) => ({
    coactL: { from: args.carrier, to: { name: "induced_L" }, label: "λ*" },
    coactR: { from: args.carrier, to: { name: "induced_R" }, label: "ρ*" }
  })
};

try {
  const composed = hcomp(bicomodule1, bicomodule2, mockEqualizerTools);
  console.log("  Horizontal composition:", {
    left: composed.left.poly.name,
    right: composed.right.poly.name,
    carrier: composed.carrier.name,
    coactL: composed.coactL.label,
    coactR: composed.coactR.label
  });
} catch (error) {
  console.log("  Composition error:", error);
}

console.log("\n9. Testing Cat♯ Structure:");

// Create a Cat♯ instance
const catSharp: CatSharp = {
  objects: [comonoid1, comonoid2],
  v: [cohom],
  h: [bicomodule1, bicomodule2],
  cells: [square]
};

console.log("  Cat♯ structure:", {
  objects: catSharp.objects.length,
  vertical: catSharp.v.length,
  horizontal: catSharp.h.length,
  cells: catSharp.cells.length
});

console.log("\n=== Demo Complete ===");
