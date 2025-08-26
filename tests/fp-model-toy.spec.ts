// fp-model-toy.spec.ts
// Vitest tests for toy Set model categories.

import { describe, it, expect } from "vitest";
import { isMono, isEpi, isIso } from "./fp-wfs-set";
import { ALL_MODEL_STRUCTURES } from "./fp-model-sets";
import { isQuillenEquivalent } from "./fp-quillen-equivalences";

describe("Weak Factorization predicates", () => {
  it("detects isMono on injective maps", () => {
    const f = { domain: [1,2], codomain: [1,2,3], map: (x:number)=>x };
    expect(isMono(f)).toBe(true);
  });

  it("detects non-mono on non-injective", () => {
    const f = { domain: [1,2], codomain: [1], map: (_:number)=>1 };
    expect(isMono(f)).toBe(false);
  });

  it("detects epi on surjective map", () => {
    const f = { domain: [1,2], codomain: [1,2], map: (x:number)=>x };
    expect(isEpi(f)).toBe(true);
  });

  it("detects iso on bijection", () => {
    const f = { domain: [1,2], codomain: [1,2], map: (x:number)=>x };
    expect(isIso(f)).toBe(true);
  });
});

describe("Model structures", () => {
  it("has nine structures", () => {
    expect(ALL_MODEL_STRUCTURES.length).toBe(9);
  });
});

describe("Quillen equivalences", () => {
  it("detects direct equivalence", () => {
    const res = isQuillenEquivalent("Mono-Epi", "Epi-Mono");
    expect(res.equiv).toBe(true);
    expect(res.via).toBe("direct");
  });
});
