/**
 * FRP Bridge for StatefulStream
 * 
 * This module provides an FRP bridge that wraps UI/event sources in our StatefulStream
 * abstraction, integrates with the fusion optimizer, purity system, optics, and exposes
 * fluent operators. Generates StreamPlanNode trees so FRP pipelines can be optimized/
 * analyzed just like ObservableLite.
 * 
 * Features:
 * - Core FRP source wrapper with StatefulStream integration
 * - Fluent operators (map, filter, scan, flatMap)
 * - Fusion optimization integration
 * - Purity system integration (IO, Pure, State)
 * - Optics integration (.over, .preview)
 * - StreamPlanNode tree generation for analysis
 * - Event source management and cleanup
 */

import { 
  StatefulStream, 
  StateFn, 
  liftStateless, 
  liftStateful,
  createStatefulStream,
  compose,
  parallel,
  fanOut,
  fanIn
} from './fp-stream-state';

import { 
  EffectTag, 
  EffectOf, 
  Pure, 
  IO, 
  Async,
  createPurityInfo, 
  attachPurityMarker, 
  extractPurityMarker, 
  hasPurityMarker 
} from './fp-purity';

import { 
  StreamPlanNode,
  optimizePlan,
  canOptimize,
  optimizeStream,
  withAutoOptimization,
  createFusionOptimizer
} from './fp-stream-fusion';

import { 
  lens, 
  prism, 
  optional,
  isLens, 
  isPrism, 
  isOptional 
} from './fp-optics';

// Import common operations
import {
  addCommonOps,
  addOptimizedOps,
  applyCommonOps,
  CommonStreamOps
} from './fp-stream-ops';

// Import ObservableLite for conversions
import { ObservableLite } from './fp-observable-lite';

// ============================================================================
// Stream Type Annotations
// ============================================================================

/**
 * Stream interface for explicit typing at call sites
 */
interface Stream<Input, Output, State> {
  run: (input: Input) => (state: State) => [State, Output];
}

/**
 * Helper function to safely execute stream with proper typing
 */
function step<I, O, S>(stream: Stream<I, O, S>, input: I, state: S): { newState: S; output: O } {
  const [newState, output] = stream.run(input)(state);
  return { newState, output };
}

// ============================================================================
// Part 1: Core FRP Source Interface
// ============================================================================

/**
 * FRP Source interface for event sources
 */
export interface FRPSource<T> {
  subscribe: (listener: (value: T) => void) => () => void; // returns unsubscribe
  readonly __effect: 'IO' | 'Async'; // Mark as IO or Async for purity tracking
}

/**
 * FRP Source with metadata
 */
export interface FRPSourceWithMeta<T> extends FRPSource<T> {
  readonly __sourceType: string;
  readonly __eventType: string;
  readonly __purity: 'IO' | 'Async';
}

/**
 * FRP Source factory function
 */
export type FRPSourceFactory<T> = () => FRPSource<T>;

// ============================================================================
// Part 13: ObservableLite ↔ StatefulStream Conversions
// ============================================================================

/**
 * Convert ObservableLite to StatefulStream
 * This enables FP pipelines to move from reactive push streams to stateful monoid-homomorphic streams
 */
export function fromObservableLite<S, A>(
  obs: ObservableLite<A>,
  initialState: S = {} as S
): StatefulStream<A, S, A> {
  // Create the plan node for this conversion
  const planNode = new FRPStreamPlanNode('conversion', {
    sourceType: 'ObservableLite',
    targetType: 'StatefulStream',
    conversionType: 'fromObservableLite'
  });

  // Create the StatefulStream using the proper factory
  const stream = createStatefulStream<A, S, A>(
    (input: A) => (state: S): [S, A] => {
      let newState = state;
      let lastValue: A = input;
      
      // Subscribe to the ObservableLite to get the latest value
      const unsubscribe = obs.subscribe({
        next: (value: A) => {
          lastValue = value;
        },
        error: (err: any) => {
          // Handle error by keeping the last known good value
          console.warn('ObservableLite error in conversion:', err);
        },
        complete: () => {
          // Keep the last value when complete
        }
      });
      
      // Clean up subscription
      unsubscribe();
      
      return [newState, lastValue];
    },
    'Async'
  );

  // Attach purity marker as Async (since ObservableLite is async)
  attachPurityMarker(stream, 'Async');
  
  return stream;
}

/**
 * Convert StatefulStream to ObservableLite
 * This enables FP pipelines to move from stateful monoid-homomorphic streams to reactive push streams
 */
export function toObservableLite<S, A, O>(
  stream: StatefulStream<A, S, O>,
  inputs: Iterable<A>,
  initialState: S = {} as S
): ObservableLite<O> {
  return new ObservableLite<O>((subscriber) => {
    let state: S = initialState;
    
    try {
      for (const input of Array.from(inputs)) {
        const { newState, output } = step(stream as Stream<A, O, S>, input, state);
        state = newState;
        subscriber.next(output);
      }
      subscriber.complete?.();
    } catch (error) {
      subscriber.error?.(error);
    }
    
    return () => {
      // Cleanup logic if needed
    };
  });
}

/**
 * Convert StatefulStream to ObservableLite with async execution
 * This version handles async StatefulStreams properly
 */
/**
 * Convert StatefulStream to ObservableLite (async version)
 * This version handles asynchronous input streams (commented out due to ES2017 compatibility)
 */
/* 
export async function toObservableLiteAsync<S, A, O>(
  stream: StatefulStream<A, S, O>,
  inputs: AsyncIterable<A>,
  initialState: S = {} as S
): Promise<ObservableLite<O>> {
  return new ObservableLite<O>((subscriber) => {
    let state: S = initialState;
    let isSubscribed = true;
    
    const processInputs = async () => {
      try {
        for await (const input of inputs) {
          if (!isSubscribed) break;
          
          const { newState, output } = step(stream as Stream<A, O, S>, input, state);
          state = newState;
          subscriber.next(output);
        }
        if (isSubscribed) {
          subscriber.complete?.();
        }
      } catch (error) {
        if (isSubscribed) {
          subscriber.error?.(error);
        }
      }
    };

    processInputs();

    return () => {
      isSubscribed = false;
    };
  });
}
*//**
 * Convert StatefulStream to ObservableLite with event-driven execution
 * This version is suitable for event-driven StatefulStreams
 */
export function toObservableLiteEvent<S, A, O>(
  stream: StatefulStream<A, S, O>,
  initialState: S = {} as S
): ObservableLite<O> {
  return new ObservableLite<O>((subscriber) => {
    let state: S = initialState;
    
    // Create a function that can be called with new inputs
    const processInput = (input: A) => {
      try {
        const { newState, output } = step(stream as Stream<A, O, S>, input, state);
        state = newState;
        subscriber.next(output);
      } catch (error) {
        subscriber.error?.(error);
      }
    };
    
    // Return a cleanup function that can be used to stop processing
    return () => {
      // Cleanup logic
    };
  });
}

// Define FRPStreamPlanNode if not already defined
export class FRPStreamPlanNode implements FRPStreamPlanNodeInterface {
  type: 'map' | 'filter' | 'flatMap' | 'scan' | 'filterMap' | 'compose' | 'parallel' | 'conversion';
  meta: Record<string, any>;
  children: FRPStreamPlanNode[];
  // Required StreamPlanNode properties
  purity: 'Pure' | 'State' | 'IO' | 'Async';
  fn?: any;
  scanFn?: any;
  predicate?: any;
  filterMapFn?: any;
  flatMapFn?: any;
  next?: StreamPlanNode;
  left?: StreamPlanNode;
  right?: StreamPlanNode;
  input?: any;
  output?: any;
  state?: any;

  constructor(
    type: 'map' | 'filter' | 'flatMap' | 'scan' | 'filterMap' | 'compose' | 'parallel' | 'conversion',
    meta: Record<string, any> = {},
    children: FRPStreamPlanNode[] = []
  ) {
    this.type = type;
    this.meta = meta;
    this.children = children;
    this.purity = meta.purity || 'IO';
  }

  addChild(node: FRPStreamPlanNode): FRPStreamPlanNode {
    this.children.push(node);
    return this;
  }

  markOptimized(): FRPStreamPlanNode {
    this.meta.optimized = true;
    return this;
  }

  markPurity(purity: 'Pure' | 'State' | 'IO' | 'Async'): FRPStreamPlanNode {
    this.meta.purity = purity;
    return this;
  }

  getPurity(): 'Pure' | 'State' | 'IO' | 'Async' {
    return this.meta.purity || 'IO';
  }

  isOptimized(): boolean {
    return this.meta.optimized || false;
  }

  getSourceType(): string | undefined {
    return this.meta.sourceType;
  }

  getEventType(): string | undefined {
    return this.meta.eventType;
  }

  clone(): FRPStreamPlanNode {
    return new FRPStreamPlanNode(
      this.type,
      { ...this.meta },
      this.children.map(child => child.clone())
    );
  }

  toString(): string {
    const parts: string[] = [this.type];
    if (this.meta.purity) parts.push('(' + this.meta.purity + ')');
    if (this.meta.optimized) parts.push('[OPTIMIZED]');
    if (this.children.length > 0) {
      parts.push('-> [' + this.children.map(c => c.toString()).join(', ') + ']');
    }
    return parts.join(' ');
  }
}

// FRP-specific StreamPlanNode that includes conversion operations
export interface FRPStreamPlanNodeInterface {
  type: 'map' | 'scan' | 'filter' | 'filterMap' | 'flatMap' | 'compose' | 'parallel' | 'conversion';
  // Additional properties for FRP operations
  meta: Record<string, any>;
  children: FRPStreamPlanNode[];
  // Required StreamPlanNode compatibility properties
  purity: 'Pure' | 'State' | 'IO' | 'Async';
  fn?: any;
  scanFn?: any;
  predicate?: any;
  filterMapFn?: any;
  flatMapFn?: any;
  next?: StreamPlanNode;
  left?: StreamPlanNode;
  right?: StreamPlanNode;
  input?: any;
  output?: any;
  state?: any;
}


