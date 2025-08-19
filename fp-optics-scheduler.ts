// fp-optics-scheduler.ts
// Optics Scheduler and Async Fusion: produce/optimize a plan and run it

import { Kind1, Apply } from './fp-hkt';
import { Applicative } from './fp-typeclasses-hkt';
import { Bazaar } from './fp-bazaar-traversable-bridge';
import { AsyncEffect } from './src/fp-stream-concurrent';
import { Bracket } from './src/fp-resource';
import {
  makeParTraverseIf,
  optimizePlan,
  compilePlanToStream
} from './fp-bazaar-planner';
import type { GenericPlan } from './fp-bazaar-planner';

// Stream compilation types
type Foldable<B> = {
  fold<X>(seed: X, step: (acc: X, b: B) => Promise<X> | X): Promise<X>;
};
type Compiled<B> = { compile: Foldable<B> };

// ---------------------------------------------
// Latency estimator (EMA)
// ---------------------------------------------

export interface LatencyEstimator {
  readonly alpha: number;
  readonly valueMs: number | undefined;
  update(sampleMs: number): void;
}

export function latencyEMA(alpha = 0.2): LatencyEstimator {
  let v: number | undefined = undefined;
  return {
    alpha,
    get valueMs() { return v; },
    update(sampleMs: number) {
      v = v === undefined ? sampleMs : (1 - alpha) * (v as number) + alpha * sampleMs;
    }
  } as LatencyEstimator;
}

// ---------------------------------------------
// Scheduler options
// ---------------------------------------------

export interface SchedulerOpts {
  initialConcurrency?: number; // default 4
  minConcurrency?: number;     // default 1
  maxConcurrency?: number;     // default 64
  preserveOrder?: boolean;     // default false
  chunkSize?: number;          // optional; if provided add Batch(size)
  fuse?: boolean;              // enable map fusion in optimizer
  latencyToCost?: (ms: number) => number; // default: linear
}

// ---------------------------------------------
// Planning
// ---------------------------------------------

export function scheduleOptic<A, B, S, T>(
  bazaar: Bazaar<A, B, S, T>,
  source: S,
  handlerAsync: (a: A) => Promise<B>,
  opts: SchedulerOpts = {}
): GenericPlan {
  const concurrency = clamp(
    opts.initialConcurrency ?? 4,
    opts.minConcurrency ?? 1,
    opts.maxConcurrency ?? 64
  );
  const par = makeParTraverseIf(
    bazaar as any,
    source as any,
    async () => true,         // unconditional traverse (no filter)
    handlerAsync,             // your worker
    { concurrency, preserveOrder: !!opts.preserveOrder }
  );
  // For now, just return the ParTraverseIf plan directly
  // Complex chunking/batching can be handled at the optimization layer
  return par;
}

export function tunePlanWithLatency(plan: GenericPlan, estimator: LatencyEstimator, opts: SchedulerOpts = {}): GenericPlan {
  // Attach a coarse cost and let optimizePlan (no-op for now) decide later
  const ms = estimator.valueMs;
  const toCost = opts.latencyToCost ?? ((x: number) => x / 10); // 10ms -> cost 1
  const annCost = ms !== undefined ? toCost(ms) : 1;
  return optimizePlan(
    { ...(plan as any), ann: { ...(plan as any).ann, cost: annCost } },
    { fuse: !!opts.fuse }
  );
}

// ---------------------------------------------
// Running
// ---------------------------------------------

export async function runScheduled<F extends Kind1, A, B, S, T>(
  runEffect: <X>(fx: Apply<F, [X]>) => Promise<X>,
  applicativeF: Applicative<F>,
  asyncF: AsyncEffect<F>,
  bracket: Bracket<F>,
  bazaar: Bazaar<A, B, S, T>,
  source: S,
  handlerAsync: (a: A) => Promise<B>,
  opts: SchedulerOpts = {}
): Promise<B[]> {
  const base = scheduleOptic(bazaar, source, handlerAsync, opts);
  const tuned = tunePlanWithLatency(base, latencyEMA(), opts);
  const stream = compilePlanToStream(runEffect, applicativeF, asyncF, bracket, tuned) as Compiled<B>;
  const out = await stream.compile.fold<B[]>([], async (acc: B[], b: B) => { acc.push(b); return acc; });
  return out;
}

// ---------------------------------------------
// Utils
// ---------------------------------------------

function clamp(n: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, n)); }


