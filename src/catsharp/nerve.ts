// src/catsharp/nerve.ts
// The nerve N(B): at [n] return Cat(Δ[n], B) as *chains* of n composable arrows.  :contentReference[oaicite:2]{index=2}
import type { SmallCat } from "./cofunctor";
import type { Copresheaf, Morph } from "./prafunctor";
import { deltaOpBound, deltaSimplex } from "./delta";
import { assertString } from "../util/strings";

function outgoing(B: SmallCat, x: string) {
  const xStr = assertString(x, "outgoing: x must be a string");
  return B.morphisms.filter(m => m.src === xStr);
}

/** All composable chains of length n in B, encoded as JSON for reuse by fibers. */
function nChains(B: SmallCat, n: number): string[] {
  if (n === 0) return B.objects.map(b0 => {
    const b0Str = assertString(b0, "nChains: b0 must be a string");
    return JSON.stringify({ objs: [b0Str], morIds: [] });
  });
  const out: string[] = [];
  for (const b0 of B.objects) {
    const b0Str = assertString(b0, "nChains: b0 must be a string");
    const stack: { objs: string[]; morIds: string[] }[] = [{ objs: [b0Str], morIds: [] }];
    while (stack.length) {
      const cur = stack.pop()!;
      if (cur.morIds.length === n) { 
        const objs = cur.objs.map(obj => assertString(obj, "nChains: obj must be a string"));
        const morIds = cur.morIds.map(morId => assertString(morId, "nChains: morId must be a string"));
        out.push(JSON.stringify({ objs, morIds })); 
        continue; 
      }
      const last = assertString(cur.objs[cur.objs.length - 1], "nChains: last must be a string");
      for (const m of outgoing(B, last)) {
        const dstStr = assertString(m.dst, "nChains: m.dst must be a string");
        const idStr = assertString(m.id, "nChains: m.id must be a string");
        const objs = cur.objs.map(obj => assertString(obj, "nChains: obj must be a string"));
        const morIds = cur.morIds.map(morId => assertString(morId, "nChains: morId must be a string"));
        stack.push({ objs: [...objs, dstStr], morIds: [...morIds, idStr] });
      }
    }
  }
  return out;
}

/** Nerve N(B) as a Copresheaf on Δ^op (bounded to [0..N] for demos). */
export function nerveOf(B: SmallCat, maxDim = 3): Copresheaf {
  const Δop = deltaOpBound(maxDim);
  return {
    onObj: (k: string) => {
      const kStr = assertString(k, "nerveOf: k must be a string");
      const m = /^\[(\d+)\]$/.exec(kStr);
      if (!m || !m[1]) return [];
      const num = assertString(m[1], "nerveOf: m[1] must be a string");
      return nChains(B, parseInt(num, 10));
    },
    onMor: (_m: Morph) => (a: string) => {
      const aStr = assertString(a, "nerveOf: a must be a string");
      return aStr; // faces/degeneracies left as TODO
    }
  };
}
