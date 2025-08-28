// src/catsharp/polycat-example.ts
// Example 4.4: for p:E→B, a (Δ^op, Δ^op)-bicomodule where positions = N(B) and,
// for each simplex G:Δ[n]→B, directions = N(fiber_p(G)) (simplified Set-level).  :contentReference[oaicite:3]{index=3}
import type { SmallCat } from "./cofunctor";
import type { BicomoduleWitness, Copresheaf } from "./prafunctor";
import { deltaOpBound } from "./delta";
import { nerveOf } from "./nerve";
import { assertString } from "../util/strings";

/** Tiny functor E→B (names only): map objects/morphisms by id. */
export interface FunctorEB {
  onObj: (eObj: string) => string;
  onMor: (eMorId: string) => string;
}

/** Parse a nerve label back to its B-chain. */
function parseChain(label: string): { objs: string[]; morIds: string[] } {
  const labelStr = assertString(label, "parseChain: label must be a string");
  try { return JSON.parse(labelStr); } catch { return { objs: [], morIds: [] }; }
}

/** Enumerate *lifts* of a B-chain along p:E→B as chains in E whose images are that chain. */
function liftsOfChain(E: SmallCat, B: SmallCat, p: FunctorEB, chainLabel: string): string[] {
  const { objs, morIds } = parseChain(chainLabel);
  if (morIds.length === 0) {
    // 0-simplex: fiber objects e with p(e)=objs[0]
    const first = objs.length > 0 ? assertString(objs[0], "liftsOfChain: first must be a string") : "";
    return E.objects.filter(e => p.onObj(e) === first).map(e => JSON.stringify({ objs: [e], morIds: [] }));
  }
  // pick e0 with p(e0)=objs[0], then for each step choose e-morphism mapping to given B morphism
  const results: string[] = [];
  const first = objs.length > 0 ? assertString(objs[0], "liftsOfChain: first must be a string") : "";
  for (const e0 of E.objects.filter(e => p.onObj(e) === first)) {
    const stack: { eObjs: string[]; eMorIds: string[] }[] = [{ eObjs: [e0], eMorIds: [] }];
    while (stack.length) {
      const cur = stack.pop()!;
      const k = cur.eMorIds.length;
      if (k === morIds.length) { 
        const eObjs = cur.eObjs.map(obj => assertString(obj, "liftsOfChain: eObj must be a string"));
        const eMorIds = cur.eMorIds.map(morId => assertString(morId, "liftsOfChain: eMorId must be a string"));
        results.push(JSON.stringify({ objs: eObjs, morIds: eMorIds })); 
        continue; 
      }
      const need = k < morIds.length ? assertString(morIds[k], "liftsOfChain: need must be a string") : "";
      const srcE = cur.eObjs.length > 0 ? assertString(cur.eObjs[cur.eObjs.length - 1], "liftsOfChain: srcE must be a string") : "";
      // choose e-morphisms with p(mE)=need and src = srcE
      for (const mE of E.morphisms) {
        if (mE.src !== srcE) continue;
        if (p.onMor(mE.id) !== need) continue;
        const dstStr = assertString(mE.dst, "liftsOfChain: mE.dst must be a string");
        const idStr = assertString(mE.id, "liftsOfChain: mE.id must be a string");
        stack.push({ eObjs: [...cur.eObjs, dstStr], eMorIds: [...cur.eMorIds, idStr] });
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
      const kStr = assertString(k, "simplifiedFiberNerve: k must be a string");
      const m = /^\[(\d+)\]$/.exec(kStr);
      if (!m || !m[1]) return [];
      const num = assertString(m[1], "simplifiedFiberNerve: m[1] must be a string");
      const n = parseInt(num, 10);
      if (n === 0) {
        // 0-simplices: starting fiber objects over first vertex of G
        const objs = parseChain(Glabel).objs;
        const first = objs.length > 0 ? assertString(objs[0], "simplifiedFiberNerve: first must be a string") : "";
        return E.objects.filter(e => p.onObj(e) === first).map(e => {
          const eStr = assertString(e, "simplifiedFiberNerve: e must be a string");
          return `e:${eStr}`;
        });
      }
      if (n === 1) {
        // 1-simplices: edge-lifts of G
        return liftsOfChain(E, B, p, Glabel).map(s => `lift:${s}`);
      }
      return [];
    },
    onMor: (_m) => (a: string) => {
      const aStr = assertString(a, "simplifiedFiberNerve: a must be a string");
      return aStr;
    }
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
    positionsAt: (obj: string) => {
      const objStr = assertString(obj, "bicomoduleFromFunctor_p: obj must be a string");
      return positions.onObj(objStr);
    },
    fiberAt: (_obj: string, Glabel: string) => {
      const GlabelStr = assertString(Glabel, "bicomoduleFromFunctor_p: Glabel must be a string");
      return simplifiedFiberNerve(E, B, p, GlabelStr, maxDim);
    }
  };
}
