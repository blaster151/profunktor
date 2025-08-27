// examples/dialens-demo.ts
import { dialensFromGMorph } from "../src/optics/dialens-mod-sig";
import { type GMorphSpec, type SeedSynthesizer, type PartialStructure } from "../src/meta/generalized-morphism";
import { composeDialens, dialensH1, dialensH2 } from "../fp-optics-dialens";

// Wire the tiny demo spec from earlier (S interpreted inside A) and your synthesizer.
const T  = { sorts: ["S"], funcs: [{ name: "f", inSorts: ["S"], outSort: "S" }] as const };
const Tp = { sorts: ["A"], funcs: [{ name: "g", inSorts: ["A"], outSort: "A" }] as const };

const spec: GMorphSpec = {
  T, Tprime: Tp,
  interpretSort: (N, _S) => (N.carriers["A"] ?? []).flatMap(a => (N.carriers["A"] ?? []).map(b => [a,b] as const)),
  interpretFunc: (N, _f) => (args) => {
    const [a,b] = args[0] as readonly [unknown,unknown];
    const r = N.ops.apply("g", [a]);
    return r.defined ? { defined: true, value: [r.value, b] as const } : { defined: false };
  }
};

// Mock synthesizer for demo purposes
const synth: SeedSynthesizer = {
  seedFor: (X: PartialStructure) => ({
    sorts: { A: X.carriers["S"] ?? [] },
    relations: {
      g: (X.carriers["S"] ?? []).map(s => [s, s]) // Identity relation for demo
    }
  } as any),
  TprimeCart: {
    sorts: ["A"],
    relations: [{ name: "g", arity: 2 }],
    axioms: []
  } as any
};

// Create the dialens
const O = dialensFromGMorph(spec, synth);

// Demo usage
const N_Tprime: PartialStructure = {
  sigma: Tp,
  carriers: { A: [0, 1, 2] },
  ops: { 
    apply: (name: string, args: unknown[]) => 
      name === "g" && typeof args[0] === "number"
        ? { defined: (args[0] as number) % 2 === 0, value: (args[0] as number) } 
        : { defined: false } 
  }
};

// Now O.get gives a T-model view
const T_model_view = O.get(N_Tprime);
console.log("T-model view carriers:", T_model_view.carriers);
console.log("T-model view S size:", T_model_view.carriers["S"].length);

// O.put re-builds a coherent T′ model after edits
const deltaY = { someEdit: "modification" };
const result = O.put(N_Tprime, deltaY);
console.log("Rebuilt T′-model:", result.x1);
console.log("Delta X:", result.dx);

// Demonstrate composition
const O2 = dialensFromGMorph(spec, synth); // Another dialens
const composed = composeDialens(O, O2);
console.log("Composed dialens get result:", composed.get(N_Tprime));

// Demonstrate height-1 dialens construction
const simpleLens = dialensH1({
  forward: (x: number) => x * 2,
  backward: (x: number, dy: number) => ({ x1: dy / 2, dx: x })
});
console.log("Height-1 dialens get:", simpleLens.get(5));
console.log("Height-1 dialens put:", simpleLens.put(5, 20));

// Demonstrate height-2 dialens construction
const lens1 = dialensH1({
  forward: (x: number) => x * 2,
  backward: (x: number, dy: number) => ({ x1: dy / 2, dx: x })
});
const lens2 = dialensH1({
  forward: (x: number) => x + 1,
  backward: (x: number, dy: number) => ({ x1: dy - 1, dx: x })
});
const height2Dialens = dialensH2(lens1, lens2);
console.log("Height-2 dialens get:", height2Dialens.get(3)); // (3*2)+1 = 7
console.log("Height-2 dialens put:", height2Dialens.put(3, 15)); // Complex composition
