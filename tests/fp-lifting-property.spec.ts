// tests/fp-lifting-property.spec.ts
import { describe, it, expect } from "vitest";
import { SetMap, isMono, isEpi, hasLiftingProperty } from "../fp-lifting-property";
import { isSplitMono, isSplitEpi } from "../fp-wfs-set";

function makeMap(domain: any[], codomain: any[], mapping: Record<any, any>): SetMap {
  return {
    domain,
    codomain,
    map: (x: any) => mapping[x]
  };
}

describe("SetMap utilities", () => {
  it("detects injectivity", () => {
    const f = makeMap([1,2], [1,2], {1:1, 2:2});
    expect(isMono(f)).toBe(true);
    const g = makeMap([1,2], [1], {1:1, 2:1});
    expect(isMono(g)).toBe(false);
  });

  it("detects surjectivity", () => {
    const f = makeMap([1,2], [1,2], {1:1, 2:2});
    expect(isEpi(f)).toBe(true);
    const g = makeMap([1], [1,2], {1:1});
    expect(isEpi(g)).toBe(false);
  });

  it("checks lifting property - case (a)", () => {
    const pi = makeMap([1], [1], {1:1});
    const rho = makeMap([], [1], {}); // X = ∅
    expect(hasLiftingProperty(pi, rho)).toBe(true);
  });

  it("checks lifting property - case (b)", () => {
    const pi = makeMap([1,2], [1,2], {1:1, 2:2}); // injective + surjective
    const rho = makeMap([1], [1,2], {1:1}); // injective but not surjective
    expect(hasLiftingProperty(pi, rho)).toBe(true);
  });



  it("succeeds when pi is a split epimorphism", () => {
    const pi = makeMap([1,2], [1], {1:1, 2:1}); // not injective, surjective, but split epi
    const rho = makeMap([1,2], [1,2,3], {1:1, 2:2}); // injective, not surjective, not split mono

    expect(hasLiftingProperty(pi, rho)).toBe(true);
  });
});
