// src/logic/core.ts
// Finite "core" reductions + core-chase driver.
// - reduceToCore: folds elements that are homomorphically redundant by identical
//   relational profiles, keeping any "protected" elements fixed.
// - reduceToCategoricalCoreUnder: same, but lets callers mark the image of a seed
//   morphism i : I0 → I as protected (the "core under i" variant).
//
// Notes & provenance:
// • Core chase alternates a (parallel) chase step with a core step; for cartesian theories
//   it still computes finite free models, and standard vs categorical variants are both
//   complete in this regime. Each core step can be expensive—ours is a safe, finite
//   approximation that terminates and preserves the seed.  [pp. 35–38]
//
// • On infinite instances, cores need not exist or be unique; we only run on finite data. [pp. 37–38]

import type { Instance, RegularTheory } from "./regular-cartesian";

export type Protected = Record<string, Set<unknown>>; // per-sort protected carriers

function clone(I: Instance): Instance {
  return {
    sorts: Object.fromEntries(Object.entries(I.sorts).map(([s, xs]) => [s, xs.slice()])),
    relations: Object.fromEntries(Object.entries(I.relations).map(([r, ts]) => [r, ts.slice()])),
  };
}

/** Build a per-element signature from all relations it participates in. */
function elementProfiles(I: Instance): Record<string, Map<unknown, string>> {
  const profiles: Record<string, Map<unknown, string>> = {};
  for (const [s, xs] of Object.entries(I.sorts)) profiles[s] = new Map(xs.map(x => [x, ""]));

  for (const [r, tuples] of Object.entries(I.relations)) {
    tuples.forEach((t, k) => {
      t.forEach((x, i) => {
        // Coarse signature: relation name + arity-pos + tuple index
        // (Enough to detect duplicates with identical participation.)
        const s = Object.keys(I.sorts).find(ss => I.sorts[ss]?.includes(x));
        if (!s) return;
        const profileMap = profiles[s];
        if (profileMap !== undefined) {
          const prev = profileMap.get(x) ?? "";
          profileMap.set(x, prev + `|${r}@${i}#${k}`);
        }
      });
    });
  }
  return profiles;
}

/** Conservative finite "core" fold: merge elements with identical profiles, unless protected. */
export function reduceToCore(I0: Instance, protected_: Protected = {}): { I: Instance; map: Record<string, Map<unknown, unknown>> } {
  const I = clone(I0);
  const profiles = elementProfiles(I);

  const repMap: Record<string, Map<unknown, unknown>> = {};
  for (const [s, xs] of Object.entries(I.sorts)) {
    const prot = protected_[s] ?? new Set<unknown>();
    repMap[s] = new Map<unknown, unknown>();
    // Group by profile
    const bySig = new Map<string, unknown[]>();
    xs.forEach(x => {
      const profileMap = profiles[s];
      const sig = (profileMap?.get(x) ?? "") + (prot.has(x) ? "|P" : "");
      const arr = bySig.get(sig) ?? []; arr.push(x); bySig.set(sig, arr);
    });
    // Select representative (prefer a protected element)
    const keep: unknown[] = [];
    const toRep = new Map<unknown, unknown>();
    bySig.forEach(group => {
      const rep = group.find(x => prot.has(x)) ?? group[0];
      keep.push(rep);
      group.forEach(x => toRep.set(x, rep));
    });
    // Rewrite carriers
    I.sorts[s] = Array.from(new Set(keep));
    repMap[s] = toRep;
  }

  // Rewrite relations
  for (const [r, tuples] of Object.entries(I.relations)) {
    const rewritten = tuples.map(t => t.map(x => {
      const s = Object.keys(repMap).find(ss => repMap[ss]?.has(x));
      if (s) {
        const map = repMap[s];
        return map ? map.get(x) ?? x : x;
      }
      return x;
    }));
    // Deduplicate tuples
    const uniq = Array.from(new Set(rewritten.map(t => JSON.stringify(t)))).map(s => JSON.parse(s));
    I.relations[r] = uniq as (readonly unknown[])[];
  }

  return { I, map: repMap };
}

/** Mark the image of seed sorts as protected and run the reduction. */
export function reduceToCategoricalCoreUnder(
  I: Instance,
  seedSorts: readonly string[] // e.g., all sorts tagged "C:..." in the cograph
): { I: Instance; map: Record<string, Map<unknown, unknown>> } {
  const prot: Protected = {};
  seedSorts.forEach(s => {
    const sortsArray = I.sorts[s] ?? [];
    prot[s] = new Set(sortsArray);
  });
  return reduceToCore(I, prot);
}

/** One round of "core chase": parallel chase step -> chosen core step. */
export function coreChaseRound(
  step: (I: Instance) => Instance,
  I: Instance,
  kind: "standard" | "categorical",
  seedSorts?: readonly string[]
): Instance {
  const after = step(I);
  if (kind === "categorical" && seedSorts) {
    return reduceToCategoricalCoreUnder(after, seedSorts).I;
  }
  return reduceToCore(after).I;
}
