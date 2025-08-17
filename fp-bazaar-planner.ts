// fp-bazaar-planner.ts — concrete, minimal planner for Church-encoded Bazaar
// ---------------------------------------------------------------------------------
// This module provides:
//   - makeParTraverseIf: build a plan to traverse a Bazaar with an async predicate+worker
//   - optimizePlan: no-op (placeholder for future fusing rules)
//   - compilePlanToStream: compiles a plan into a tiny “stream-like” object with
//       .compile.fold(seed, step) → Promise<Acc>
//
// Important: We *enumerate* elements focused by a Church-encoded Bazaar by
// running it with an Applicative that ignores effects and records the A’s —
// i.e. a viewing applicative. That gives us a list of A’s without committing
// to any specific effect runtime up-front.

import type { Kind1, Apply } from './fp-hkt';
import type { Applicative } from './fp-typeclasses-hkt';
import type { Bazaar } from './fp-bazaar-traversable-bridge';

// ------------------------- 
// Plan model
// -------------------------
export type FilterAStep<A, S, T> = {
  tag: 'FilterA';
  pA: (a: A) => boolean | Promise<boolean>;
  baz: Bazaar<A, any, S, T>;
  s: S;
};

export type TraverseStep<A, B, S, T> = {
  tag: 'Traverse';
  baz: Bazaar<A, B, S, T>;
  s: S;
  k: (a: A) => B | Promise<B>;
};

export type SeqPlan = { tag: 'Seq'; steps: Array<FilterAStep<any, any, any> | TraverseStep<any, any, any, any>> };

export type ParTraverseIfPlan<A, B, S, T> = {
  tag: 'ParTraverseIf';
  baz: Bazaar<A, B, S, T>;
  s: S;
  predAsync: (a: A) => Promise<boolean>;
  kAsync: (a: A) => Promise<B>;
  options?: { concurrency?: number; preserveOrder?: boolean };
};

export type GenericPlan =
  | ParTraverseIfPlan<any, any, any, any>
  | SeqPlan
  | (FilterAStep<any, any, any> | TraverseStep<any, any, any, any>);

// -------------------------
// Public API
// -------------------------
export function makeParTraverseIf<A, B, S, T>(
  baz: Bazaar<A, B, S, T>,
  s: S,
  predAsync: (a: A) => Promise<boolean>,
  kAsync: (a: A) => Promise<B>,
  options?: { concurrency?: number; preserveOrder?: boolean }
): ParTraverseIfPlan<A, B, S, T> {
  return { tag: 'ParTraverseIf', baz, s, predAsync, kAsync, options };
}

export function optimizePlan<P extends GenericPlan>(plan: P, _opts?: { fuse?: boolean }): P {
  // Keep as identity for now. You can add fusing rules later, e.g.:
  // - Seq[ FilterA(p), Traverse(k) ] => a single ParTraverseIf with predAsync=p & kAsync=k (sync->async lift)
  // Ensure the behavior matches your laws before enabling.
  return plan;
}

// Core compiler: returns a tiny “stream” with compile.fold
export function compilePlanToStream<F extends Kind1>(
  _runEffect: <X>(fx: Apply<F, [X]>) => Promise<X>,
  _F: Applicative<F>,
  _asyncF: any,
  _bracket: any,
  plan: GenericPlan
) {
  return {
    compile: {
      async fold<X>(seed: X, step: (acc: X, b: any) => Promise<X> | X): Promise<X> {
        const outs = await runPlanCollectOutputs(plan);
        let acc = seed;
        for (const b of outs) {
          acc = await step(acc, b);
        }
        return acc;
      }
    }
  };
}

// -------------------------
// Implementation helpers
// -------------------------
// Enumerate A’s focused by a Church-encoded Bazaar:
// run baz with an Applicative that ignores effects and pushes each 'a' seen.
function enumerateA<A, S, T>(baz: Bazaar<A, any, S, T>, s: S): A[] {
  const as: A[] = [];
  const ViewF: Applicative<any> = {
    of: <X>(_x: X) => undefined as any,
    map: <X, Y>(_fx: any, _f: (x: X) => Y) => undefined as any,
    ap: <X, Y>(_ff: any, _fx: any) => undefined as any
  };
  // We don’t care about the reconstructed T here; we only want the visits.
  (baz as any)(ViewF, (a: A) => {
    as.push(a);
    return undefined as any;
  })(s as any);
  return as;
}

// Concurrency-limited async map with optional order preservation
async function pMapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, idx: number) => Promise<R>,
  preserveOrder: boolean
): Promise<R[]> {
  if (limit <= 0 || !isFinite(limit)) limit = items.length || 1;
  let i = 0;
  const out: R[] = preserveOrder ? new Array(items.length) : [];
  let active = 0;
  let resolve!: (v: R[]) => void;
  let reject!: (e: any) => void;
  const done = new Promise<R[]>((res, rej) => { resolve = res; reject = rej; });

  const launch = () => {
    while (active < limit && i < items.length) {
      const idx = i++;
      const it = items[idx];
      active++;
      Promise.resolve(fn(it, idx))
        .then((r) => {
          if (preserveOrder) out[idx] = r;
          else out.push(r);
        })
        .catch(reject)
        .finally(() => {
          active--;
          if (i >= items.length && active === 0) resolve(out);
          else launch();
        });
    }
  };
  launch();
  return done;
}

async function runParTraverseIf<A, B, S, T>(p: ParTraverseIfPlan<A, B, S, T>): Promise<Array<B | undefined>> {
  const as = enumerateA(p.baz, p.s);
  const limit = p.options?.concurrency ?? (as.length || 1);
  const preserve = !!p.options?.preserveOrder;

  // Two-stage per element: predicate, then worker if true
  return pMapLimit(
    as,
    limit,
    async (a) => (await p.predAsync(a)) ? await p.kAsync(a) : undefined,
    preserve
  );
}

async function runSeq(plan: SeqPlan): Promise<any[]> {
  let working: any[] | undefined = undefined;
  let out: any[] = [];

  for (const step of plan.steps) {
    if (step.tag === 'FilterA') {
      const { baz, s, pA } = step as FilterAStep<any, any, any>;
      const as = enumerateA(baz, s);
      const keep: any[] = [];
      for (const a of as) {
        const ok = await Promise.resolve(pA(a));
        if (ok) keep.push(a);
      }
      working = keep;
    } else if (step.tag === 'Traverse') {
      const { baz, s, k } = step as TraverseStep<any, any, any, any>;
      // If a previous FilterA produced 'working', traverse that; else enumerate fresh.
      const as = working ?? enumerateA(baz, s);
      for (const a of as) {
        out.push(await Promise.resolve(k(a)));
      }
    } else {
      // Unknown step; ignore for now.
    }
  }
  return out;
}

async function runPlanCollectOutputs(plan: GenericPlan): Promise<any[]> {
  if (!plan) return [];
  if ((plan as any).tag === 'ParTraverseIf') return runParTraverseIf(plan as any);
  if ((plan as any).tag === 'Seq') return runSeq(plan as any);
  // Single step treated as a one-step Seq
  if ((plan as any).tag === 'FilterA' || (plan as any).tag === 'Traverse') {
    return runSeq({ tag: 'Seq', steps: [plan as any] });
  }
  return [];
}

// End of fp-bazaar-planner.ts
