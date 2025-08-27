// src/catsharp/nerve.ts
// The nerve N(B): at [n] return Cat(Δ[n], B) as *chains* of n composable arrows.  :contentReference[oaicite:2]{index=2}
import type { SmallCat } from "./cofunctor";
import type { Copresheaf, Morph } from "./prafunctor";
import { deltaOpBound, deltaSimplex } from "./delta";

function outgoing(B: SmallCat, x: string) {
  return B.morphisms.filter(m => m.src === x);
}

/** All composable chains of length n in B, encoded as JSON for reuse by fibers. */
function nChains(B: SmallCat, n: number): string[] {
  if (n === 0) return B.objects.map(b0 => JSON.stringify({ objs: [b0], morIds: [] }));
  const out: string[] = [];
  for (const b0 of B.objects) {
    const stack: { objs: string[]; morIds: string[] }[] = [{ objs: [b0], morIds: [] }];
    while (stack.length) {
      const cur = stack.pop()!;
      if (cur.morIds.length === n) { out.push(JSON.stringify(cur)); continue; }
      const last = cur.objs[cur.objs.length - 1];
      for (const m of outgoing(B, last)) {
        stack.push({ objs: [...cur.objs, m.dst], morIds: [...cur.morIds, m.id] });
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
      const m = /^\[(\d+)\]$/.exec(k);
      if (!m) return [];
      return nChains(B, parseInt(m[1], 10));
    },
    onMor: (_m: Morph) => (a: string) => a // faces/degeneracies left as TODO
  };
}
