/**
 * FRP Fusion System
 * 
 * This module provides FRP-specific fusion optimizations that integrate with
 * the existing StatefulStream fusion system. It handles FRP-specific patterns
 * like event stream optimization, UI event fusion, and reactive pipeline
 * optimization.
 * 
 * Features:
 * - FRP-specific fusion rules
 * - Event stream optimization
 * - UI event fusion
 * - Reactive pipeline optimization
 * - Integration with existing fusion system
 * - Purity-aware FRP optimizations
 */

import { 
  StatefulStream, 
  liftStateless, 
  liftStateful,
  compose,
  parallel,
  fanOut,
  fanIn,
  StateFn        // <-- add this
} from './fp-stream-state';

import { 
  StreamPlanNode,
  FusionRule,
  FusionRegistry,
  optimizePlan,
  canOptimize,
  withAutoOptimization
} from './fp-stream-fusion';

import { 
  FRPStreamPlanNode,
  FRPSource
} from './fp-frp-bridge';

// Minimal safe implementations for missing functions
const fromFRP = <T>(source: FRPSource<T>, initialState: any): any => {
  // Minimal implementation - return a basic StatefulStream-like object
  return {
    map: (f: any) => fromFRP(source, initialState),
    chain: (f: any) => fromFRP(source, initialState),
    filter: (p: any) => fromFRP(source, initialState),
    __plan: { type: 'source', purity: 'IO' } as any,
    __brand: 'StatefulStream' as const,
    __purity: 'IO' as const
  };
};

const isFRPSource = (x: any): boolean => x && typeof x.subscribe === 'function';
const isStatefulStream = (x: any): boolean => x && x.__brand === 'StatefulStream';

// ============================================================================
// Part 1: FRP-Specific Fusion Rules
// ============================================================================

/**
 * FRP-specific fusion rules
 */
export const FRPFusionRules: FusionRule[] = [
  {
    name: 'FRP Map-Map Fusion',
    match: (node: StreamPlanNode) => {
      return node.type === 'map' && 
             node.next?.type === 'map' && 
             node.purity === 'Pure' && 
             node.next.purity === 'Pure';
    },
    rewrite: (node: StreamPlanNode) => {
      const fusedFn = (x: any) => node.next!.fn!(node.fn!(x));
      return {
        type: 'map',
        fn: fusedFn,
        purity: 'Pure',
        next: node.next!.next
      };
    },
    description: 'Combines consecutive pure map operations in FRP streams'
  },

  {
    name: 'FRP Event Filter Fusion',
    match: (node: StreamPlanNode) => {
      return node.type === 'filter' && 
             node.next?.type === 'filter' && 
             node.purity === 'Pure' && 
             node.next.purity === 'Pure';
    },
    rewrite: (node: StreamPlanNode) => {
      const fusedPred = (x: any) => node.predicate!(x) && node.next!.predicate!(x);
      return {
        type: 'filter',
        predicate: fusedPred,
        purity: 'Pure',
        next: node.next!.next
      };
    },
    description: 'Combines consecutive pure filter operations in FRP streams'
  },

  {
    name: 'FRP Map-Filter Fusion',
    match: (node: StreamPlanNode) => {
      return node.type === 'map' && 
             node.next?.type === 'filter' && 
             node.purity === 'Pure' && 
             node.next.purity === 'Pure';
    },
    rewrite: (node: StreamPlanNode) => {
      const fusedFn = (x: any) => {
        const mapped = node.fn!(x);
        return node.next!.predicate!(mapped) ? mapped : undefined;
      };
      return {
        type: 'filterMap',
        filterMapFn: fusedFn,
        purity: 'Pure',
        next: node.next!.next
      };
    },
    description: 'Combines pure map and filter operations into filterMap'
  },

  {
    name: 'FRP Event Source Fusion',
    match: (node: StreamPlanNode) => {
      // This plan node shape doesn't include 'source' in its union,
      // so access via a safe cast + optional meta.
      const t: any = (node as any).type;
      const meta: any = (node as any).meta;
      return t === 'source' &&
             meta?.sourceType === 'FRP' &&
             node.next?.type === 'map' &&
             node.next.purity === 'Pure';
    },
    rewrite: (node: StreamPlanNode) => {
      // Push map operation closer to the source
      const nextNode = node.next!;
      return { ...(nextNode as StreamPlanNode), next: nextNode.next } as StreamPlanNode;
    },
    description: 'Pushes pure operations closer to FRP event sources'
  },

  {
    name: 'FRP Scan-Map Fusion',
    match: (node: StreamPlanNode) => {
      return node.type === 'scan' && 
             node.next?.type === 'map' && 
             node.purity === 'State' && 
             node.next.purity === 'Pure';
    },
    rewrite: (node: StreamPlanNode) => {
      // Push map inside scan
      const originalScanFn = node.scanFn!;
      const mapFn = node.next!.fn!;

      const fusedScanFn: StateFn<any, any> = ((state: any, value: any) => {
  const [newState, scanResult] = originalScanFn(state);
  return [newState, mapFn(scanResult)];
      }) as StateFn<any, any>;

      return {
        type: 'scan',
        scanFn: fusedScanFn,
        purity: 'State',
        next: node.next!.next
      };
    },
    description: 'Pushes pure map operations inside stateful scan operations'
  },

  {
    name: 'FRP Pure Segment Fusion',
    match: (node: StreamPlanNode) => {
      // Check for consecutive pure operations
      let current = node;
      let pureCount = 0;
      
      while (current && current.purity === 'Pure' && 
             ['map', 'filter', 'filterMap'].includes(current.type)) {
        pureCount++;
        current = current.next!;
      }
      
      return pureCount > 1;
    },
    rewrite: (node: StreamPlanNode) => {
      // Collect all consecutive pure operations
      const pureOps: StreamPlanNode[] = [];
      let current = node;
      while (current && current.purity === 'Pure' && ['map', 'filter', 'filterMap'].includes(current.type)) {
        pureOps.push(current);
        current = current.next!;
      }
      // Fuse all pure operations
      let fusedOp = pureOps.reduce<StreamPlanNode | null>((acc, op) => {
        if (!acc) return op;
        if (acc.type === 'map' && op.type === 'map') {
          return { type: 'map', fn: (x: any) => op.fn!(acc.fn!(x)), purity: 'Pure', next: undefined };
        }
        if (acc.type === 'filter' && op.type === 'filter') {
          return { type: 'filter', predicate: (x: any) => !!acc.predicate!(x) && !!op.predicate!(x), purity: 'Pure', next: undefined };
        }
        if (acc.type === 'filterMap' && op.type === 'filterMap') {
          return {
            type: 'filterMap',
            filterMapFn: (x: any) => {
              const mid = acc.filterMapFn!(x);
              return mid == null ? undefined : op.filterMapFn!(mid);
            },
            purity: 'Pure',
            next: undefined
          };
        }
        if (acc.type === 'scan' && op.type === 'scan') {
          return { type: 'compose', f: acc, g: op, purity: 'Pure', next: undefined };
        }
        return { type: 'compose', f: acc, g: op, purity: 'Pure', next: undefined };
      }, null);
      if (fusedOp) {
        fusedOp.next = current;
        // Ensure type is always present and not undefined
        if (!fusedOp.type) fusedOp.type = 'compose';
        return fusedOp as StreamPlanNode;
      }
      // fallback: return node
      return node;
    },
    description: 'Fuses consecutive pure operations in FRP streams'
  }
];

// ============================================================================
// Part 2: FRP Fusion Registry
// ============================================================================

/**
 * FRP-specific fusion registry
 */
export const FRPFusionRegistry = [...FusionRegistry, ...FRPFusionRules];

/**
 * Optimize FRP plan using FRP-specific rules
 */
export function optimizeFRPPlan(plan: FRPStreamPlanNode): FRPStreamPlanNode {
  let changed = true;
  let optimizedPlan = plan.clone();
  
  while (changed) {
    changed = false;
    
    for (const rule of FRPFusionRegistry) {
      if (rule.match(optimizedPlan)) {
        optimizedPlan = rule.rewrite(optimizedPlan) as FRPStreamPlanNode;
        optimizedPlan.markOptimized();
        changed = true;
        break;
      }
    }
    
    // Also optimize child nodes
    if (optimizedPlan.next) {
      // If next is not an FRPStreamPlanNode, try to convert/cast it
      let nextNode = optimizedPlan.next as FRPStreamPlanNode;
      // If nextNode is missing FRPStreamPlanNode methods, wrap it
      if (!(nextNode instanceof FRPStreamPlanNode)) {
        nextNode = new FRPStreamPlanNode(
          (nextNode as any).type,
          (nextNode as any).meta || {},
          (nextNode as any).children || []
        );
        // Copy over other properties if present
        Object.assign(nextNode, optimizedPlan.next);
      }
      const optimizedNext = optimizeFRPPlan(nextNode);
      if (optimizedNext !== optimizedPlan.next) {
        optimizedPlan.next = optimizedNext;
        changed = true;
      }
    }
  }
  
  return optimizedPlan;
}

// ============================================================================
// Part 3: FRP Stream Optimization
// ============================================================================

/**
 * Optimize FRP stream using FRP-specific fusion rules
 */
// fp-frp-fusion.ts
export function optimizeFRPStream<I, S, O>(stream: StatefulStream<I, S, O>): StatefulStream<I, S, O> {
  const plan = stream.__plan;
  if (!plan) return stream;
  const optimizedPlan = optimizeFRPPlan(plan as FRPStreamPlanNode);
  // If nothing changed, return the *same* instance
  if (optimizedPlan === plan) return stream;
  stream.__plan = optimizedPlan;         // mutate in place
  return stream;
}


/**
 * Check if FRP stream can be optimized
 */
export function canOptimizeFRPStream<S, I, O>(stream: StatefulStream<I, S, O>): boolean {
  if (!stream.__plan) {
    return false;
  }
  
  // Check if any FRP-specific fusion rules can be applied
  for (const rule of FRPFusionRules) {
    if (rule.match(stream.__plan)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Apply FRP-specific purity fusion
 */
export function applyFRPPurityFusion<S, I, O>(
  stream: StatefulStream<I, S, O>
): StatefulStream<I, S, O> {
  if (!stream.__plan) {
    return stream;
  }
  
  const optimizedPlan = optimizePlan(stream.__plan);
  
  return Object.assign(Object.create(Object.getPrototypeOf(stream)), stream, {
    __plan: optimizedPlan as StreamPlanNode
  });
}

// ============================================================================
// Part 4: Event Stream Optimization
// ============================================================================

/**
 * Optimize event stream by combining similar event handlers
 */
export function optimizeEventStream<T>(
  streams: StatefulStream<T, any, T>[]
): StatefulStream<T, any, T>[] {
  const optimized: StatefulStream<T, any, T>[] = [];
  
  for (const stream of streams) {
    const optimizedStream = optimizeFRPStream(stream);
    optimized.push(optimizedStream);
  }
  
  return optimized;
}

/**
 * Combine multiple event streams into a single optimized stream
 */
export function combineEventStreams<T>(
  streams: StatefulStream<T, any, T>[]
): StatefulStream<any, any, T[]> {
  if (streams.length === 0) {
    // empty → a never-emitting stream mapped to empty arrays is fine,
    // but keep it simple here:
    return fromFRP({ __effect: 'IO', subscribe: () => () => {} }, {}).map(() => [] as T[]);
  }

  // seed with the first stream as a singleton array
  let acc = streams[0].map((v: T) => [v] as T[]);

  for (let i = 1; i < streams.length; i++) {
    acc = (parallel(acc, streams[i]) as any).map(([arr, v]: [T[], T]) => {
      // flatten into a new array
      return [...arr, v];
    });
  }

  return optimizeFRPStream(acc as any);
}

/**
 * Optimize UI event stream by removing redundant operations
 */
export function optimizeUIEventStream<T>(
  stream: StatefulStream<T, any, T>
): StatefulStream<T, any, T> {
  // Apply FRP-specific optimizations
  let optimized = optimizeFRPStream(stream);
  
  // Apply purity-driven fusion
  optimized = applyFRPPurityFusion(optimized);
  
  return optimized;
}

// ============================================================================
// Part 5: Reactive Pipeline Optimization
// ============================================================================

/**
 * Optimize reactive pipeline by analyzing dependencies
 */
export function optimizeReactivePipeline<S, I, O>(
  stream: StatefulStream<I, S, O>
): StatefulStream<I, S, O> {
  // Analyze the pipeline for optimization opportunities
  const plan = stream.__plan;
  
  if (!plan) {
    return stream;
  }
  
  // Apply FRP-specific optimizations
  let optimized = optimizeFRPStream(stream);
  
  // Apply general fusion optimizations
  optimized = withAutoOptimization(optimized as any);
  
  return optimized;
}

/**
 * Analyze reactive pipeline for optimization opportunities
 */
export function analyzeReactivePipeline<S, I, O>(
  stream: StatefulStream<I, S, O>
): {
  canOptimize: boolean;
  optimizationCount: number;
  pureSegments: number;
  statefulSegments: number;
  ioBoundaries: number;
} {
  const plan = stream.__plan;
  
  if (!plan) {
    return {
      canOptimize: false,
      optimizationCount: 0,
      pureSegments: 0,
      statefulSegments: 0,
      ioBoundaries: 0
    };
  }
  
  let pureSegments = 0;
  let statefulSegments = 0;
  let ioBoundaries = 0;
  let current = plan;
  
  while (current) {
    if (current.purity === 'Pure') {
      pureSegments++;
    } else if (current.purity === 'State') {
      statefulSegments++;
    } else if (current.purity === 'IO' || current.purity === 'Async') {
      ioBoundaries++;
    }
    current = current.next!;
  }
  
  const canOptimize = canOptimizeFRPStream(stream);
  const optimizationCount = canOptimize ? 1 : 0;
  
  return {
    canOptimize,
    optimizationCount,
    pureSegments,
    statefulSegments,
    ioBoundaries
  };
}

// ============================================================================
// Part 6: Performance Monitoring
// ============================================================================

/**
 * FRP performance metrics
 */
export interface FRPPerformanceMetrics {
  readonly originalNodeCount: number;
  readonly optimizedNodeCount: number;
  readonly optimizationRatio: number;
  readonly pureSegmentCount: number;
  readonly statefulSegmentCount: number;
  readonly ioBoundaryCount: number;
  readonly fusionRulesApplied: string[];
}

/**
 * Get FRP performance metrics
 */
export function getFRPPerformanceMetrics<S, I, O>(
  originalStream: StatefulStream<I, S, O>,
  optimizedStream: StatefulStream<I, S, O>
): FRPPerformanceMetrics {
  const originalPlan = originalStream.__plan;
  const optimizedPlan = optimizedStream.__plan;
  
  const countNodes = (plan: StreamPlanNode | undefined): number => {
    if (!plan) return 0;
    let count = 1;
    if (plan.next) count += countNodes(plan.next);
    return count;
  };
  
  const originalCount = countNodes(originalPlan);
  const optimizedCount = countNodes(optimizedPlan);
  const optimizationRatio = originalCount > 0 ? (originalCount - optimizedCount) / originalCount : 0;
  
  const analysis = analyzeReactivePipeline(originalStream);
  
  return {
    originalNodeCount: originalCount,
    optimizedNodeCount: optimizedCount,
    optimizationRatio,
    pureSegmentCount: analysis.pureSegments,
    statefulSegmentCount: analysis.statefulSegments,
    ioBoundaryCount: analysis.ioBoundaries,
    fusionRulesApplied: canOptimizeFRPStream(originalStream) ? ['FRP Fusion'] : []
  };
}

// ============================================================================
// Part 7: Utility Functions
// ============================================================================

/**
 * Create FRP fusion optimizer
 */
export function createFRPFusionOptimizer() {
  return {
    optimize: (stream: StatefulStream<any, any, any>) => optimizeFRPStream(stream),
    canOptimize: (stream: StatefulStream<any, any, any>) => canOptimizeFRPStream(stream),
    getMetrics: (original: StatefulStream<any, any, any>, optimized: StatefulStream<any, any, any>) => 
      getFRPPerformanceMetrics(original, optimized),
    analyze: (stream: StatefulStream<any, any, any>) => analyzeReactivePipeline(stream)
  };
}

/**
 * Auto-optimize FRP stream
 */
export function withAutoFRPOptimization<T extends StatefulStream<any, any, any>>(stream: T): T {
  if (canOptimizeFRPStream(stream)) {
    return optimizeFRPStream(stream) as T;
  }
  return stream;
}

/**
 * Batch optimize multiple FRP streams
 */
export function batchOptimizeFRPStreams(streams: StatefulStream<any, any, any>[]): StatefulStream<any, any, any>[] {
  return streams.map(stream => withAutoFRPOptimization(stream));
}

// ============================================================================
// Part 8: Exports
// ============================================================================

