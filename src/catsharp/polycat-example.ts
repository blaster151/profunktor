// src/catsharp/polycat-example.ts
// Example 4.4: for p:E→B, a (Δ^op, Δ^op)-bicomodule where positions = N(B) and,
// for each simplex G:Δ[n]→B, directions = N(fiber_p(G)) (simplified Set-level).  :contentReference[oaicite:3]{index=3}
import type { SmallCat } from "./cofunctor";
import type { BicomoduleWitness, Copresheaf } from "./prafunctor";
import { deltaOpBound } from "./delta";
import { nerveOf } from "./nerve";

/** Tiny functor E→B (names only): map objects/morphisms by id. */
export interface FunctorEB {
  onObj: (eObj: string) => string;
  onMor: (eMorId: string) => string;
}

/** Parse a nerve label back to its B-chain. */
function parseChain(label: string): { objs: string[]; morIds: string[] } {
  try { return JSON.parse(label); } catch { return { objs: [], morIds: [] }; }
}

/** Enumerate *lifts* of a B-chain along p:E→B as chains in E whose images are that chain. */
function liftsOfChain(E: SmallCat, B: SmallCat, p: FunctorEB, chainLabel: string): string[] {
  const { objs, morIds } = parseChain(chainLabel);
  if (morIds.length === 0) {
    // 0-simplex: fiber objects e with p(e)=objs[0]
    return E.objects.filter(e => p.onObj(e) === objs[0]).map(e => JSON.stringify({ objs: [e], morIds: [] }));
  }
  // pick e0 with p(e0)=objs[0], then for each step choose e-morphism mapping to given B morphism
  const results: string[] = [];
  for (const e0 of E.objects.filter(e => p.onObj(e) === objs[0])) {
    const stack: { eObjs: string[]; eMorIds: string[] }[] = [{ eObjs: [e0], eMorIds: [] }];
    while (stack.length) {
      const cur = stack.pop()!;
      const k = cur.eMorIds.length;
      if (k === morIds.length) { results.push(JSON.stringify({ objs: cur.eObjs, morIds: cur.eMorIds })); continue; }
      const need = morIds[k];
      const srcE = cur.eObjs[cur.eObjs.length - 1];
      // choose e-morphisms with p(mE)=need and src = srcE
      for (const mE of E.morphisms) {
        if (mE.src !== srcE) continue;
        if (p.onMor(mE.id) !== need) continue;
        stack.push({ eObjs: [...cur.eObjs, mE.dst], eMorIds: [...cur.eMorIds, mE.id] });
      }
    }
  }
  return results;
}

/** A Δ^op–copresheaf that we use as "nerve of the fiber over G" (0/1-simplices sufficient for demos). */
function simplifiedFiberNerve(E: SmallCat, B: SmallCat, p: FunctorEB, Glabel: string, maxDim = 1): Copresheaf {
  const Δop = deltaOpBound(maxDim);
  return {
    onObj: (k: string) => {
      const m = /^\[(\d+)\]$/.exec(k);
      if (!m) return [];
      const n = parseInt(m[1], 10);
      if (n === 0) {
        // 0-simplices: starting fiber objects over first vertex of G
        const first = parseChain(Glabel).objs[0];
        return E.objects.filter(e => p.onObj(e) === first).map(e => `e:${e}`);
      }
      if (n === 1) {
        // 1-simplices: edge-lifts of G
        return liftsOfChain(E, B, p, Glabel).map(s => `lift:${s}`);
      }
      return [];
    },
    onMor: (_m) => (a: string) => a
  };
}

/** Build the (Δ^op, Δ^op)-bicomodule witness for p:E→B. */
export function bicomoduleFromFunctor_p(E: SmallCat, B: SmallCat, p: FunctorEB, maxDim = 2)
: BicomoduleWitness<SmallCat, SmallCat> {
  const Δop = deltaOpBound(maxDim);
  const positions = nerveOf(B, maxDim);         // positions = nerve(B)
  return {
    left: Δop,
    right: Δop,
    positionsAt: (obj: string) => positions.onObj(obj),
    fiberAt: (_obj: string, Glabel: string) => simplifiedFiberNerve(E, B, p, Glabel, maxDim)
  };
}
