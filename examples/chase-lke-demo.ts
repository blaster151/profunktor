import { leftKanViaChase } from "../src/kan/chase-lkan";
import { freeReflect, weaklyFreeReflect } from "../src/kan/chase-lkan";

// Example: Canonical fast schedule (cartesian)
// This demonstrates the optimized chase algorithm with early termination
const LKEfast = leftKanViaChase(fp, { 
  canonicalCartesianFast: true, 
  egdCheckEvery: 2, 
  stopWhenFinite: true 
});
console.log("Σ_F via canonical fast:", LKEfast.evaluate("X"), "freedom:", LKEfast.freedom);

// Example: Reflectors (when you have the cartesian theory explicitly)
if (false) {
  // assume you built the cartesian theory T and seed S for cog(F) as shown earlier
  // const Mfree = freeReflect(T, S);
  // const Mweak = weaklyFreeReflect(T, S); // for regular theories
}

// Example: Performance comparison between different chase strategies
console.log("\n=== Chase Performance Comparison ===");

// Standard parallel chase
const LKEstandard = leftKanViaChase(fp, { 
  parallel: true, 
  fairnessRounds: 8 
});
console.log("Standard parallel chase:", LKEstandard.evaluate("X"));

// Fair parallel chase to colimit
const LKEcolimit = leftKanViaChase(fp, { 
  toColimit: true, 
  fairnessRounds: 32 
});
console.log("Fair parallel chase to colimit:", LKEcolimit.evaluate("X"), "freedom:", LKEcolimit.freedom);

// Canonical fast with aggressive early termination
const LKEaggressive = leftKanViaChase(fp, { 
  canonicalCartesianFast: true, 
  egdCheckEvery: 1, 
  stopWhenFinite: true,
  fairnessRounds: 64 
});
console.log("Canonical fast (aggressive):", LKEaggressive.evaluate("X"), "freedom:", LKEaggressive.freedom);

console.log("\n=== Reflector Usage Examples ===");

// Example: Using reflectors directly with explicit theories
// Note: This requires building the cartesian theory and seed explicitly
// const cartesianTheory = /* ... */;
// const seedInstance = /* ... */;
// 
// // For cartesian theories (all EDs have unique: true)
// const freeModel = freeReflect(cartesianTheory, seedInstance);
// console.log("Free model via reflector:", freeModel);
// 
// // For regular theories (some EDs may not have unique: true)
// const weaklyFreeModel = weaklyFreeReflect(cartesianTheory, seedInstance);
// console.log("Weakly free model via reflector:", weaklyFreeModel);

console.log("Demo completed! Check the console output for results.");

// === Partial Horn Integration Example ===
console.log("\n=== Partial Horn Integration ===");

import type { PartialHornSpec } from "../src/logic/partial-horn";

// Suppose our base signature has sorts ["A","B"] with no relations.
// Add a partial op "pdiv" : A×A ⇀ A defined when dom(x,y) (here we just name a predicate).
const partialSpec: PartialHornSpec = {
  base: { sorts: ["A"], relations: [{ name: "dom_p", arity: ["A","A"] }] },
  ops: [
    {
      name: "pdiv_graph", inSorts: ["A","A"], outSort: "A",
      domain: { all: [{ kind: "rel", rel: "dom_p", vars: ["x0","x1"] }] }
    }
  ]
};

const LKEph = leftKanViaChase(fp, { partialHorn: partialSpec, toColimit: true });
console.log("freedom (with partial ops):", LKEph.freedom);

// === Indexed State Demo ===
console.log("\n=== Indexed State Analysis ===");

// After computing `const LKEc = leftKanViaChase(fp, { toColimit: true });`
if (LKEc.indexed) {
  console.log("Indexed rows/MB (rough):", LKEc.metrics?.rowsPerMB);
  console.log("J(d) sizes:", LKEc.indexed.J);
}

// === Core-Chase Demo ===
console.log("\n=== Core-Chase Optimization ===");

// Core-chase (categorical variant: protect seed carriers on C:*)
const LKEcore = leftKanViaChase(fp, { useCoreChase: "categorical", coreRounds: 8, toColimit: false });
console.log("core savings:", LKEcore.metrics?.coreSavings);

// Compare with standard chase
const LKEstandard = leftKanViaChase(fp, { toColimit: false });
console.log("standard vs core-chase results:", 
  LKEstandard.evaluate("X").length, "vs", LKEcore.evaluate("X").length, "elements");

// Standard core-chase variant
const LKEcoreStd = leftKanViaChase(fp, { useCoreChase: "standard", coreRounds: 12 });
console.log("standard core-chase savings:", LKEcoreStd.metrics?.coreSavings);

// === Semi-Naïve Chase Demo ===
console.log("\n=== Semi-Naïve Fast Parallel Chase (Algorithm 3) ===");

// Semi-naïve chase toggle
const LKEsn = leftKanViaChase(fp, { semiNaive: true });
console.log("Σ_F via semi-naïve chase (Alg.3):", LKEsn.evaluate("X"));

// Compare with standard parallel chase
const LKEparallel = leftKanViaChase(fp, { parallel: true, fairnessRounds: 8 });
console.log("Standard parallel vs semi-naïve results:", 
  LKEparallel.evaluate("X").length, "vs", LKEsn.evaluate("X").length, "elements");

// Semi-naïve with partial Horn integration
const LKEsnPartial = leftKanViaChase(fp, { 
  semiNaive: true, 
  partialHorn: partialSpec 
});
console.log("Semi-naïve with partial ops:", LKEsnPartial.evaluate("X").length, "elements");
