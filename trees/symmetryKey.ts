// src/trees/symmetryKey.ts
import type { LTree, Lbl } from "./canonicalTreeLabeled";
import { canonicalizeLabeled } from "./canonicalTreeLabeled";

export type SymmetryMode =
  | { kind: "planar" }            // preserve order
  | { kind: "symmetric-agg" }     // ignore order (merge identical shapes)
  | { kind: "symmetric-orbit" };  // ignore order + later divide by |Aut|

// simple *ordered* encoding for planar mode
function encodePlanar<L extends Lbl = string>(t: LTree<L>): string {
  const lbl = t.label === undefined ? "#" : String(t.label);
  const kids = t.children ?? [];
  return `(${lbl}|${kids.map(encodePlanar).join("")})`;
}

/** 
 * A stable key to use in your Map:
 * - planar: preserves order (no merging)
 * - symmetric-agg/orbit: canonical unlabeled order (merges by isomorphism)
 * Also returns aut so callers in orbit mode can divide weights by |Aut|.
 */
export function symmetryKey<L extends Lbl = string>(
  t: LTree<L>,
  mode: SymmetryMode
): { key: string; aut: bigint } {
  if (mode.kind === "planar") {
    return { key: encodePlanar(t), aut: 1n };
  }
  const { code, aut } = canonicalizeLabeled(t);
  return { key: code, aut };
}
