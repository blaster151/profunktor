/* @jest-environment node */
import { colimObjects, type DiagramCat, type SmallCategory, categoryOfElements, pi0OfElements, type SetDiagram } from "../src/cat/zigzag-colimit";

function makePushoutSets(): { setDiag: SetDiagram } {
  // J: K --l--> A,  K --r--> B
  const J = { objects: ["K", "A", "B"], arrows: [
    { id: "l", src: "K", dst: "A" },
    { id: "r", src: "K", dst: "B" }
  ]};
  const setDiag: SetDiagram = {
    J,
    C: { K: ["x1","x2"], A: ["a1","a2"], B: ["b1","b2"] },
    F: {
      l: (x: string) => x === "x1" ? "a1" : "a2",
      r: (x: string) => x === "x1" ? "b1" : "b2"
    }
  };
  return { setDiag };
}

function makePushoutCats(): { diag: DiagramCat } {
  const K: SmallCategory = { name: "K", objects: ["x1","x2"], morphisms: [] };
  const A: SmallCategory = { name: "A", objects: ["a1","a2"], morphisms: [] };
  const B: SmallCategory = { name: "B", objects: ["b1","b2"], morphisms: [] };
  const J = { objects: ["K","A","B"], arrows: [
    { id: "l", src: "K", dst: "A" },
    { id: "r", src: "K", dst: "B" }
  ]};
  const F = {
    l: { id: "l", src: "K", dst: "A",
      onObj: (o: string) => o === "x1" ? "a1" : "a2",
      onMor: (m: any) => m
    },
    r: { id: "r", src: "K", dst: "B",
      onObj: (o: string) => o === "x1" ? "b1" : "b2",
      onMor: (m: any) => m
    }
  } as any;
  return { diag: { J, C: { K, A, B }, F } };
}

describe("π0(category of elements) agrees with object-classes from Cat colimit", () => {
  test("pushout example", () => {
    const { setDiag } = makePushoutSets();
    const { diag } = makePushoutCats();

    // π0 from category of elements
    const pi0 = pi0OfElements(setDiag); // Map "i::a" -> component id

    // object classes from Cat colimit
    const { repOf } = colimObjects(diag); // Map "i::a" -> representative key

    // For each element key, check that having the same π0 component
    // iff they map to the same representative in the Cat colimit.
    const keys = [
      ...setDiag.C.K.map(a => `K::${a}`),
      ...setDiag.C.A.map(a => `A::${a}`),
      ...setDiag.C.B.map(a => `B::${a}`)
    ];

    for (const i of keys) for (const j of keys) {
      const samePi0 = pi0.get(i) === pi0.get(j);
      const sameRep = repOf.get(i) === repOf.get(j);
      expect(sameRep).toBe(samePi0);
    }
  });
});
