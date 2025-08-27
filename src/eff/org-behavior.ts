// Build a small "behavior tree" from an Org coalgebra (depth-limited), labeling nodes by states.
// Mirrors the paper's description: run the coalgebra from a seed and along paths through @-branching. :contentReference[oaicite:2]{index=2}
import type { ClosureCoalgebra } from "./org";

export type BehaviorNode = { state: string; children: BehaviorNode[] };

export function behaviorTree(C: ClosureCoalgebra, start: string, depth: number): BehaviorNode {
  function expand(s: string, k: number): BehaviorNode {
    if (k <= 0) return { state: s, children: [] };
    // One Org step; we ignore the specific @ position label here and only unfold the continuation.
    const step = C.step(s);
    // For a linear carrier y(S), we take one canonical branch (you can enrich this to branch over @-dirs).
    const next = step.cont(s);
    return { state: s, children: [expand(next as unknown as string, k - 1)] };
  }
  return expand(start, Math.max(0, depth));
}
