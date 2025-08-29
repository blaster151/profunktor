// src/fp-laws-core.ts
import type { Eq, Gen } from "./fp-witness-registry";

export type Law = { name: string; run(seed: number): boolean | string }; // string => failure msg
export type Suite = { subject: string; laws: Law[] };

export function sample(n: number, seed0 = 42): number[] {
  // deterministic LCG; good enough for internal property checks
  let s = seed0 >>> 0; const xs: number[] = [];
  for (let i=0;i<n;i++){ s = (1664525*s + 1013904223) >>> 0; xs.push(s); }
  return xs;
}

export function forAll<A>(n: number, g: Gen<A>, prop: (a: A) => boolean | string): Law {
  return { name: "forAll-1", run: (seed) => {
    for (const s of sample(n, seed)) {
      const r = prop(g(s));
      if (r !== true) return (typeof r === "string" ? r : `counterexample (seed=${s})`);
    }
    return true;
  }};
}

export function forAll2<A,B>(n: number, g1: Gen<A>, g2: Gen<B>, prop:(a:A,b:B)=>boolean|string): Law {
  return { name: "forAll-2", run: (seed) => {
    const xs = sample(n, seed); const ys = sample(n, seed+137);
    for (let i=0;i<n;i++){
      const x = xs[i];
      const y = ys[i];
      if (x === undefined || y === undefined) continue;
      const r = prop(g1(x), g2(y));
      if (r !== true) return (typeof r === "string" ? r : `counterexample (i=${i})`);
    } return true;
  }};
}
