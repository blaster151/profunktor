/**
 * DOT-Style Stream Coordination
 * 
 * Provides stream coordination for sequential colimits with scheduling hooks
 * and cancellation semantics.
 */

import type { 
  SequentialColimitPlan, 
  PushoutStep, 
  Diagram 
} from './fp-colimit-sequentializer';
import { assertDefined, isDefined } from './src/util/assert';

// Stream coordination types
export interface StreamState<Obj, Mor> {
  readonly currentDiagram: Diagram<number, Obj, Mor>;
  readonly stepIndex: number;
  readonly isComplete: boolean;
  readonly error?: Error;
}

// Pushout computation context
export interface PushoutContext<Obj, Mor> {
  readonly Qk: Obj;
  readonly Lk: Obj;
  readonly glue: Mor;
}

// Pushout computation function
export type PushoutComputation<Obj, Mor> = (
  prevPk: Diagram<number, Obj, Mor>,
  context: PushoutContext<Obj, Mor>
) => Diagram<number, Obj, Mor>;

// Emission function for streaming results
export type EmissionFunction<Obj, Mor> = (
  state: StreamState<Obj, Mor>,
  step?: PushoutStep<Obj, Mor>
) => void;

// Scheduling hook types
export interface SchedulingHooks {
  readonly onStepStart?: (stepIndex: number) => void;
  readonly onStepEnd?: (stepIndex: number) => void;
  readonly onError?: (error: Error, stepIndex: number) => void;
  readonly onComplete?: (finalResult: unknown) => void;
}

// Cancellation token for stream coordination
export interface CancellationToken {
  readonly isCancelled: boolean;
  readonly reason?: string;
}

// Create a cancellation token
export function createCancellationToken(): CancellationToken {
  return { isCancelled: false };
}

// Create default scheduling hooks
export function createDefaultSchedulingHooks(): SchedulingHooks {
  return {};
}

// Stream coordination options
export interface StreamCoordinationOptions<Obj, Mor> {
  readonly schedulingHooks?: SchedulingHooks;
  readonly cancellationToken?: CancellationToken;
  readonly batchSize?: number;
  readonly timeoutMs?: number;
  readonly initialDiagram: Diagram<number, Obj, Mor>;
}

// Run sequential colimit with stream coordination
export async function runSequentialColimit<Obj, Mor>(
  plan: SequentialColimitPlan<Obj, Mor>,
  pushout: PushoutComputation<Obj, Mor>,
  emit: EmissionFunction<Obj, Mor>,
  options: StreamCoordinationOptions<Obj, Mor>
): Promise<StreamState<Obj, Mor>> {
  const {
    schedulingHooks = createDefaultSchedulingHooks(),
    cancellationToken = createCancellationToken(),
    batchSize = 1,
    timeoutMs = 30000,
    initialDiagram
  } = options;

  let currentState: StreamState<Obj, Mor> = {
    currentDiagram: initialDiagram,
    stepIndex: 0,
    isComplete: false
  };

  emit(currentState);

  try {
    for (let i = 0; i < plan.steps.length; i++) {
      schedulingHooks.onStepStart?.(i);

      const step = assertDefined(plan.steps[i], `runSequentialColimit: step at index ${i} must be defined`);
      const context: PushoutContext<Obj, Mor> = {
        Qk: step.Qk,
        Lk: step.Lk,
        glue: step.glue
      };

      const nextPk = pushout(currentState.currentDiagram, context);

      currentState = {
        currentDiagram: nextPk,
        stepIndex: i + 1,
        isComplete: i + 1 === plan.steps.length
      };

      emit(currentState, step);

      schedulingHooks.onStepEnd?.(i);

      if (cancellationToken.isCancelled) break;

      // optional batching/yielding
      if (batchSize > 0 && (i + 1) % batchSize === 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, Math.min(timeoutMs, 0)));
      }
    }

    return currentState;
  } catch (err) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    currentState = { ...currentState, error: errorObj, isComplete: true };
    emit(currentState);
    throw errorObj;
  }
}




// Utility functions for stream coordination

// Create a simple emission function that logs to console
export function createConsoleEmission<Obj, Mor>(): EmissionFunction<Obj, Mor> {
  return (state: StreamState<Obj, Mor>, step?: PushoutStep<Obj, Mor>) => {
    if (state.error) {
      console.error(`Step ${state.stepIndex} failed:`, state.error.message);
    } else if (state.isComplete) {
      console.log(`Sequential colimit completed at step ${state.stepIndex}`);
    } else {
      console.log(`Step ${state.stepIndex}: processing diagram`);
    }
  };
}

// Create a buffered emission function
export function createBufferedEmission<Obj, Mor>(
  buffer: StreamState<Obj, Mor>[] = []
): EmissionFunction<Obj, Mor> {
  return (state: StreamState<Obj, Mor>, step?: PushoutStep<Obj, Mor>) => {
    buffer.push(state);
  };
}

// Create scheduling hooks for monitoring
export function createMonitoringHooks(): SchedulingHooks {
  const startTime = Date.now();
  
  return {
    onStepStart: (stepIndex: number) => {
      console.log(`Starting step ${stepIndex} at ${Date.now() - startTime}ms`);
    },
    onStepEnd: (stepIndex: number) => {
      console.log(`Completed step ${stepIndex} at ${Date.now() - startTime}ms`);
    },
    onError: (error: Error, stepIndex: number) => {
      console.error(`Error at step ${stepIndex}:`, error.message);
    },
    onComplete: (finalResult: unknown) => {
      console.log(`Sequential colimit completed in ${Date.now() - startTime}ms`);
    }
  };
}

// Create a timeout-based cancellation token
export function createTimeoutCancellationToken(timeoutMs: number): CancellationToken {
  const token = createCancellationToken();
  
  setTimeout(() => {
    (token as any).isCancelled = true;
    (token as any).reason = `Timeout after ${timeoutMs}ms`;
  }, timeoutMs);
  
  return token;
}

// Create a manual cancellation token
export function createManualCancellationToken(): CancellationToken & { cancel: (reason?: string) => void } {
  const token = createCancellationToken();
  
  return {
    ...token,
    cancel: (reason?: string) => {
      (token as any).isCancelled = true;
      (token as any).reason = reason || 'Manually cancelled';
    }
  };
}

// Stream coordination with error recovery
export async function runSequentialColimitWithRecovery<Obj, Mor>(
  plan: SequentialColimitPlan<Obj, Mor>,
  pushout: PushoutComputation<Obj, Mor>,
  emit: EmissionFunction<Obj, Mor>,
  options: StreamCoordinationOptions<Obj, Mor> & {
    maxRetries?: number;
    retryDelayMs?: number;
  }
): Promise<StreamState<Obj, Mor>> {
  const { maxRetries = 3, retryDelayMs = 1000, ...baseOptions } = options;
  
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await runSequentialColimit(plan, pushout, emit, baseOptions);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries) {
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${retryDelayMs}ms:`, lastError.message);
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
      }
    }
  }
  
  throw lastError!;
}

// Batch processing for large sequential colimits
export async function runSequentialColimitInBatches<Obj, Mor>(
  plan: SequentialColimitPlan<Obj, Mor>,
  pushout: PushoutComputation<Obj, Mor>,
  emit: EmissionFunction<Obj, Mor>,
  options: StreamCoordinationOptions<Obj, Mor> & {
    batchSize: number;
    interBatchDelayMs?: number;
  }
): Promise<StreamState<Obj, Mor>> {
  const { batchSize, interBatchDelayMs = 100, ...baseOptions } = options;
  
  let currentState: StreamState<Obj, Mor> = {
    currentDiagram: options.initialDiagram,
    stepIndex: 0,
    isComplete: false
  };

  emit(currentState);

  for (let batchStart = 0; batchStart < plan.steps.length; batchStart += batchSize) {
    const batchEnd = Math.min(batchStart + batchSize, plan.steps.length);
    const batchSteps = plan.steps.slice(batchStart, batchEnd);
    
    // Process batch
    for (let i = 0; i < batchSteps.length; i++) {
      const step = assertDefined(batchSteps[i], `runSequentialColimitInBatches: step at index ${i} must be defined`);
      const context: PushoutContext<Obj, Mor> = {
        Qk: step.Qk,
        Lk: step.Lk,
        glue: step.glue
      };
      
      const nextPk = pushout(currentState.currentDiagram, context);
      
      currentState = {
        currentDiagram: nextPk,
        stepIndex: batchStart + i + 1,
        isComplete: false
      };
      
      emit(currentState, step);
    }
    
    // Inter-batch delay
    if (batchEnd < plan.steps.length && interBatchDelayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, interBatchDelayMs));
    }
  }
  
  currentState = { ...currentState, isComplete: true };
  emit(currentState);
  
  return currentState;
}
