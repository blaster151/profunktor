// examples/necklace-replacement.demo.ts
import { necklaceReplacement, type DecoratedZigZagB } from "../src/sset/necklace";
import { composeP, type PArrow } from "../src/sset/delta-p";

// toy decorated zig-zag: x0 (dim 2) → x1 (dim 1) → x2 (dim 3) with p=1
const B: DecoratedZigZagB = {
  simplices: [{id:"x0",dim:2},{id:"x1",dim:1},{id:"x2",dim:3}],
  vertices: [0,0,2],
  p: 1,
  arrows: [
    { i: 0, j: 0, flag: [[0],[0]] } as PArrow,
    { i: 0, j: 0, flag: [[0,1],[0,1]] } as PArrow
  ]
};

const A = necklaceReplacement(B);
console.log("necklace beads:", A.necklace.beads, "p:", A.p);
console.log("chain length:", A.chain.length);
console.log("compose first two (if composable):",
  (A.chain.length>=2 ? composeP(A.p, A.chain[1], A.chain[0]) : "(n/a)")
);
