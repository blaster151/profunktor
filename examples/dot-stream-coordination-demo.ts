import { 
  planSequentialColimit,
  type SequentialColimitPlan,
  type Diagram,
  type PushoutStep
} from '../fp-colimit-sequentializer';

import {
  runSequentialColimit,
  type StreamState,
  type PushoutComputation,
  type EmissionFunction,
  type SchedulingHooks,
  type CancellationToken,
  createConsoleEmission,
  createBufferedEmission,
  createMonitoringHooks,
  createTimeoutCancellationToken,
  createManualCancellationToken,
  runSequentialColimitWithRecovery,
  runSequentialColimitInBatches
} from '../fp-dot-style-stream-coordination';

// Example object type with degree information
interface DegreeObject {
  readonly id: string;
  readonly degree: number;
  readonly value: number;
}

// Example morphism type
interface DegreeMorphism {
  readonly source: string;
  readonly target: string;
  readonly type: 'identity' | 'canonical' | 'pushout';
  readonly weight: number;
}

// Example diagram builder that creates diagrams based on degree
const buildDegreeDiagram = (degree: number): Diagram<number, DegreeObject, DegreeMorphism> => {
  const objects: DegreeObject[] = [];
  const morphisms: DegreeMorphism[] = [];
  
  // Create objects with the specified degree
  for (let i = 0; i <= degree; i++) {
    objects.push({ 
      id: `obj_${degree}_${i}`, 
      degree,
      value: degree * 10 + i 
    });
  }
  
  // Create identity morphisms
  for (const obj of objects) {
    morphisms.push({
      source: obj.id,
      target: obj.id,
      type: 'identity',
      weight: 1
    });
  }
  
  return {
    index: degree,
    objectOf: (i: number) => objects[i] || objects[0],
    morphism: (src: number, dst: number) => {
      const morphism = morphisms.find(m => 
        m.source === objects[src]?.id && m.target === objects[dst]?.id
      );
      return morphism || null;
    }
  };
};

// Example canonical morphism function
const canonicalMorphism = (source: DegreeObject, target: DegreeObject): DegreeMorphism => {
  return {
    source: source.id,
    target: target.id,
    type: 'canonical',
    weight: Math.abs(source.value - target.value)
  };
};

// Example degree restriction: only include objects with degree <= k
const restrictToQk = (obj: DegreeObject, k: number): boolean => {
  return obj.degree <= k;
};

// Example pushout computation function
const pushoutComputation: PushoutComputation<DegreeObject, DegreeMorphism> = (
  prevPk: Diagram<number, DegreeObject, DegreeMorphism>,
  context: { Qk: DegreeObject; Lk: DegreeObject; glue: DegreeMorphism }
): Diagram<number, DegreeObject, DegreeMorphism> => {
  
  // Create a simple pushout diagram
  return {
    index: prevPk.index + 1,
    objectOf: (i: number) => context.Qk,
    morphism: (src: number, dst: number) => context.glue
  };
};

// Example emission function for detailed logging
const detailedEmission: EmissionFunction<DegreeObject, DegreeMorphism> = (
  state: StreamState<DegreeObject, DegreeMorphism>,
  step?: PushoutStep<DegreeObject, DegreeMorphism>
) => {
  if (state.error) {
    console.log(`❌ Error at step ${state.stepIndex}:`, state.error.message);
  } else if (state.isComplete) {
    console.log(`✅ Final diagram: processing complete`);
  } else {
    console.log(`🔄 Step ${state.stepIndex}: processing diagram`);
    
    if (step) {
      console.log(`   Pushout: processing step`);
    }
  }
};

// Example custom scheduling hooks
const customSchedulingHooks: SchedulingHooks = {
  onStepStart: (stepIndex: number) => {
    console.log(`🚀 Starting step ${stepIndex}...`);
  },
  onStepEnd: (stepIndex: number) => {
    console.log(`✅ Step ${stepIndex} completed`);
  },
  onError: (error: Error, stepIndex: number) => {
    console.error(`💥 Error at step ${stepIndex}:`, error.message);
  },
  onComplete: (finalResult: unknown) => {
    console.log(`🎉 Sequential colimit completed successfully!`);
  }
};

// Main demo execution
async function runDemo() {
  console.log('=== DOT-Style Stream Coordination Demo ===\n');

  // Create a sequential colimit plan
  const plan: SequentialColimitPlan<DegreeObject, DegreeMorphism> = planSequentialColimit(
    restrictToQk,
    buildDegreeDiagram,
    canonicalMorphism,
    3
  );

  // Create initial diagram for the coordination
  const initialDiagram = buildDegreeDiagram(0);

  console.log('Created sequential colimit plan with', plan.steps.length, 'steps\n');

  // Demo 1: Basic stream coordination
  console.log('--- Demo 1: Basic Stream Coordination ---');
  try {
    const result1 = await runSequentialColimit(
      plan,
      pushoutComputation,
      detailedEmission,
      { initialDiagram }
    );
    console.log('Basic coordination completed successfully\n');
  } catch (error) {
    console.error('Basic coordination failed:', error);
  }

  // Demo 2: With monitoring hooks
  console.log('--- Demo 2: With Monitoring Hooks ---');
  try {
    const result2 = await runSequentialColimit(
      plan,
      pushoutComputation,
      createConsoleEmission(),
      { schedulingHooks: customSchedulingHooks, initialDiagram }
    );
    console.log('Monitoring coordination completed successfully\n');
  } catch (error) {
    console.error('Monitoring coordination failed:', error);
  }

  // Demo 3: Buffered emission
  console.log('--- Demo 3: Buffered Emission ---');
  const buffer: StreamState<DegreeObject, DegreeMorphism>[] = [];
  try {
    const result3 = await runSequentialColimit(
      plan,
      pushoutComputation,
      createBufferedEmission(buffer),
      { initialDiagram }
    );
    console.log(`Buffered ${buffer.length} states successfully`);
    console.log('Buffer contents:', buffer.map(s => `Step ${s.stepIndex}: processing diagram`));
    console.log();
  } catch (error) {
    console.error('Buffered coordination failed:', error);
  }

  // Demo 4: Manual cancellation
  console.log('--- Demo 4: Manual Cancellation ---');
  const manualToken = createManualCancellationToken();
  try {
    // Cancel after a short delay
    setTimeout(() => {
      manualToken.cancel('User requested cancellation');
    }, 100);
    
    const result4 = await runSequentialColimit(
      plan,
      pushoutComputation,
      detailedEmission,
      { cancellationToken: manualToken, initialDiagram }
    );
    console.log('Manual cancellation test completed (should not reach here)\n');
  } catch (error) {
    console.log('✅ Manual cancellation worked as expected:', (error as Error).message, '\n');
  }

  // Demo 5: Timeout cancellation
  console.log('--- Demo 5: Timeout Cancellation ---');
  const timeoutToken = createTimeoutCancellationToken(50); // 50ms timeout
  try {
    const result5 = await runSequentialColimit(
      plan,
      pushoutComputation,
      detailedEmission,
      { cancellationToken: timeoutToken, initialDiagram }
    );
    console.log('Timeout test completed (should not reach here)\n');
  } catch (error) {
    console.log('✅ Timeout cancellation worked as expected:', (error as Error).message, '\n');
  }

  // Demo 6: Batch processing
  console.log('--- Demo 6: Batch Processing ---');
  try {
    const result6 = await runSequentialColimitInBatches(
      plan,
      pushoutComputation,
      detailedEmission,
      { 
        batchSize: 2,
        interBatchDelayMs: 50,
        initialDiagram
      }
    );
    console.log('Batch processing completed successfully\n');
  } catch (error) {
    console.error('Batch processing failed:', error);
  }

  // Demo 7: Error recovery (simulate errors)
  console.log('--- Demo 7: Error Recovery ---');
  
  // Create a faulty pushout computation that throws errors
  const faultyPushoutComputation: PushoutComputation<DegreeObject, DegreeMorphism> = (
    prevPk: Diagram<number, DegreeObject, DegreeMorphism>,
    context: { Qk: DegreeObject; Lk: DegreeObject; glue: DegreeMorphism }
  ): Diagram<number, DegreeObject, DegreeMorphism> => {
    // Simulate an error on the second step
    if (prevPk.index === 1) {
      throw new Error('Simulated error during pushout computation');
    }
    
    return pushoutComputation(prevPk, context);
  };

  try {
    const result7 = await runSequentialColimitWithRecovery(
      plan,
      faultyPushoutComputation,
      detailedEmission,
      {
        maxRetries: 2,
        retryDelayMs: 100,
        initialDiagram
      }
    );
    console.log('Error recovery test completed successfully\n');
  } catch (error) {
    console.log('✅ Error recovery worked as expected:', (error as Error).message, '\n');
  }
}

// Run the demo
runDemo().catch(console.error);
