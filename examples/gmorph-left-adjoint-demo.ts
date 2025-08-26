// examples/gmorph-left-adjoint-demo.ts
import { U_M, leftAdjoint_M, type GMorphSpec } from "../src/meta/generalized-morphism";

// Toy T: one sort S, unary op f; Toy T′: one sort A, unary op g; M interprets S as A×A, f via g on first coord.
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

// N: a T′-model on a tiny carrier
const N = {
  sigma: Tp,
  carriers: { A: [0,1,2] },
  ops: { apply: (name: string, args: unknown[]) => name==="g" && typeof args[0]==="number"
      ? { defined: (args[0] as number)%2===0, value: (args[0] as number) } : { defined: false } }
};

// U_M(N): a T-model
const UMN = U_M(spec, N);
console.log("U_M(N).S size:", UMN.carriers["S"].length);

// Left adjoint on a tiny X:T-model (sketch; needs SeedSynthesizer wired to your Σ′-cartesian encoding)
