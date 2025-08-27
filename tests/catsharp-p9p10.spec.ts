/* @jest-environment node */
import type { SmallCat } from "../src/catsharp/cofunctor";
import { prod } from "../src/catsharp/duoidal";
import { externalProduct, type Copresheaf } from "../src/catsharp/prafunctor";
import { graphOfElements } from "../src/catsharp/graphs";
import { oppositeFromSpan } from "../src/catsharp/spans";

// Helpers
const disc = (xs: string[]): SmallCat => ({
  objects: xs,
  morphisms: xs.map(x => ({ id: `id_${x}`, src: x, dst: x }))
});

describe("External product ⊠, graph-of-elements counts, and opposite round-trip", () => {
  test("(F ⊠ G)(⟨x,y⟩) has |F(x)|·|G(y)| elements", () => {
    // Discrete C and D so arrow action is trivial for this size check
    const C = disc(["c0", "c1"]);
    const D = disc(["d0"]);
    const CxD = prod(C, D);

    // Tiny copresheaves with explicit cardinalities
    const F: Copresheaf<typeof C> = {
      onObj: (x) => (x === "c0" ? ["a", "b", "c"] : ["d"]), // |F(c0)|=3, |F(c1)|=1
      onMor: (_m) => (a) => a
    };
    const G: Copresheaf<typeof D> = {
      onObj: (_y) => ["x", "y"], // |G(d0)|=2
      onMor: (_m) => (b) => b
    };

    const FxG = externalProduct(C, D, F, G);
    expect(FxG.onObj("⟨c0,d0⟩").length).toBe(3 * 2);
    expect(FxG.onObj("⟨c1,d0⟩").length).toBe(1 * 2);
  });

  test("graphOfElements has Σ_x |F(x)| vertices and Σ_f |F(src f)| edges", () => {
    // Nontrivial category with identities + two extra arrows
    const C: SmallCat = {
      objects: ["x", "y"],
      morphisms: [
        { id: "id_x", src: "x", dst: "x" },
        { id: "id_y", src: "y", dst: "y" },
        { id: "f", src: "x", dst: "y" },
        { id: "g", src: "x", dst: "x" }
      ]
    };
    const F: Copresheaf<typeof C> = {
      onObj: (o) => (o === "x" ? ["x1", "x2"] : ["y1"]), // |F(x)|=2, |F(y)|=1
      onMor: (_m) => (a) => a
    };

    const G = graphOfElements(C, F);
    const expectedVertices = 2 + 1;
    // edges count = sum over morphisms of |F(src m)|
    // src counts: src=x appears in id_x, f, g → 3 morphisms; src=y appears in id_y → 1 morphism
    const expectedEdges = 3 * 2 + 1 * 1; // 7
    expect(G.vertices.length).toBe(expectedVertices);
    expect(G.edges.length).toBe(expectedEdges);
  });

  test("oppositeFromSpan(oppositeFromSpan(C)) = C (round-trip)", () => {
    const C: SmallCat = {
      objects: ["a", "b"],
      morphisms: [
        { id: "id_a", src: "a", dst: "a" },
        { id: "id_b", src: "b", dst: "b" },
        { id: "h", src: "a", dst: "b" }
      ]
    };
    const Cop = oppositeFromSpan(C);
    const Cback = oppositeFromSpan(Cop);
    // Compare object sets and morphism endpoints (ignore id renaming in ^op)
    expect(Cback.objects).toEqual(C.objects);
    // Build (src,dst) pairs for comparison
    const pairs = (cat: SmallCat) => cat.morphisms.map(m => [m.src, m.dst]);
    expect(pairs(Cback).sort()).toEqual(pairs(C).sort());
  });
});
