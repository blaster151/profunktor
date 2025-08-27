/* @jest-environment node */
import { necklaceReplacement, type DecoratedZigZagB } from "../src/sset/necklace";
import { composeP, type PArrow } from "../src/sset/delta-p";

describe("necklaceReplacement (Construction 4.1) invariants", () => {
  test("bead dims match simplex dims; chain length matches arrows length", () => {
    const B: DecoratedZigZagB = {
      simplices: [{ id: "x0", dim: 2 }, { id: "x1", dim: 1 }, { id: "x2", dim: 3 }],
      vertices: [0, 0, 2],
      p: 1,
      arrows: [
        { i: 0, j: 0, flag: [[0], [0]] } as PArrow,
        { i: 0, j: 0, flag: [[0, 1], [0, 1]] } as PArrow
      ]
    };
    const A = necklaceReplacement(B);
    expect(A.necklace.beads).toEqual([2, 1, 3]);
    expect(A.p).toBe(1);
    expect(A.chain.length).toBe(B.arrows.length);
  });

  test("composability is preserved locally (consecutive P-arrows compose)", () => {
    const B: DecoratedZigZagB = {
      simplices: [{ id: "y0", dim: 2 }, { id: "y1", dim: 2 }, { id: "y2", dim: 2 }],
      vertices: [0, 1, 2],
      p: 2,
      arrows: [
        { i: 0, j: 1, flag: [[0,1], [0,1], [1]] } as PArrow,
        { i: 1, j: 2, flag: [[1,2], [1,2], [2]] } as PArrow
      ]
    };
    const A = necklaceReplacement(B);
    // composable since j of first equals i of second
    const composed = composeP(A.p, A.chain[1], A.chain[0]);
    expect(composed.i).toBe(A.chain[0].i);
    expect(composed.j).toBe(A.chain[1].j);
    // flagwise union should contain all vertices used at each level
    for (let k = 0; k <= A.p; k++) {
      const union = Array.from(new Set([...A.chain[0].flag[k], ...A.chain[1].flag[k]])).sort((a,b)=>a-b);
      expect(composed.flag[k]).toEqual(union);
    }
  });
});
