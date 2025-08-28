/* @jest-environment node */
import type { Polynomial } from "../src/eff/polynomial";
import {
  composeElementaryWithEqualizer, expectedEqualizerSize, type EqualizerGlue,
  identityElementary
} from "../src/eff/elementary";

// Tiny middle (@) with two positions
const Mid: Polynomial = { positions:["m1","m2"], fiber: (_)=> ["*"] };

// Carriers B and C with explicit maps into the middle
const B: Polynomial = { positions:["b1","b2","b3"], fiber: (b)=> b==="b3"? ["p","q"] : ["r"] };
const C: Polynomial = { positions:["c1","c2"], fiber: (c)=> c==="c1"? ["s"] : ["t","u"] };

const glue: EqualizerGlue = {
  middlePositions: Mid.positions,
  leftMap: (b) => b==="b1" || b==="b2" ? "m1" : "m2",   // b1,b2 ↦ m1; b3 ↦ m2
  rightMap: (c) => c==="c1" ? "m1" : "m2"               // c1 ↦ m1;  c2 ↦ m2
};

// Elementary handlers: Q→@ with carrier B;  @→A with carrier C (we only use carriers here)
const Q: Polynomial = { positions:["q"], fiber: (_)=> ["*"] };
const A: Polynomial = { positions:["a"], fiber: (_)=> ["*"] };
const E1 = { from: Q, to: Mid, carrier: B, onPos: (_:string)=> "m1", pull: (d:string)=> d };
const E2 = { from: Mid, to: A,  carrier: C, onPos: (_:string)=> "a",  pull: (d:string)=> d };

test("equalizer carrier size = Σ_m |B_m|·|C_m|", () => {
  const comp = composeElementaryWithEqualizer(E1, E2, glue);
  const expected = expectedEqualizerSize(E1, E2, glue);
  expect(comp.carrier.positions.length).toBe(expected);
  // In our numbers: |B_m1|=2 (b1,b2), |C_m1|=1 (c1) → 2
  //                 |B_m2|=1 (b3),    |C_m2|=1 (c2) → 1
  // total 3
  expect(expected).toBe(3);
});

test("fiber of a pair is product B[b] × C[c]", () => {
  const comp = composeElementaryWithEqualizer(E1, E2, glue);
  // One pair at m2 is (b3,c2) → fiber size = |B[b3]|·|C[c2]| = 2·2 = 4
  const pair = comp.carrierDetail.pairs.find(p => p.mid === "m2")!;
  const label = `${pair.b}⨯${pair.c}`;
  expect(comp.carrier.fiber(label).length).toBe(4);
});

test("onPos/pull compose as in name-level composition", () => {
  const idQ = identityElementary(Q);
  const comp = composeElementaryWithEqualizer(E1, E2, glue);
  expect(comp.onPos("q")).toBe("a");
  expect(comp.pull("*")).toBe("*");
});
