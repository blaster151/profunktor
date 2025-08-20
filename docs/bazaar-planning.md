# Bazaar Planning & Optimization

A minimal plan IR and optimizer to schedule, batch, and parallelize Bazaar traversals safely.

## Plan IR (from `fp-bazaar-planner.ts`)

```
Plan =
  | { tag: 'Seq'; steps: Plan[]; ann?: { card?: Cardinality; cost?: number; canReorder?: boolean } }
  | { tag: 'Map'; f: (b: any) => any }
  | { tag: 'Filter'; p: (b: any) => boolean }
  | { tag: 'Traverse'; baz: Bazaar<any,any,any,any>; s: any; k: (a: any) => any }
  | { tag: 'ParTraverse'; baz: Bazaar<any,any,any,any>; s: any; kAsync: (a: any) => Promise<any>; concurrency?: number; preserveOrder?: boolean }
  | { tag: 'ResourceTraverse'; baz: Bazaar<any,any,any,any>; s: any; kRes: (a: any) => any }
  | { tag: 'Batch'; size: number }
  | { tag: 'Observe'; key: string }
  | { tag: 'Barrier' }
```

## Helpers

- `planOf(baz, s, k)`
- `optimizePlan(plan, { fuse, autoChunk, autoPar })`
- `compilePlanToStream(runEffect, F, asyncF, bracket, plan)`
- `runPlan(runEffect, F, asyncF, bracket, plan): Promise<any[]>`

## Passes

- Map fusion (adjacent Map nodes)
- Optional chunking after traversals (`Batch(size)`)
- Traverse→ParTraverse upgrade based on cost threshold

## Notes

- Reordering is conservative; resource and order barriers are respected.
- Use with Bazaar ↔ Streaming bridge to execute plans as streams.


