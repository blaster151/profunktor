import { 
  SliceIndexed, 
  ColimDiagram, 
  collapseNestedColimit 
} from '../fp-colimit-optimizations';

console.log('=== Colimit Collapsing Optimization Test ===\n');

// Example: Simple diagram with numbers as objects
interface NumObj {
  readonly value: number;
  readonly name: string;
}

// Create a slice-indexed diagram
const createSliceIndexed = (base: number): SliceIndexed<number> => ({
  isSliceIndexed: true,
  base
});

// Example outer diagram indexed over a slice category
const outerDiagram: ColimDiagram<SliceIndexed<number>, NumObj> = {
  index: createSliceIndexed(5), // slice indexed over base 5
  evaluateAt: (sliceIndex) => {
    console.log(`  Evaluating outer diagram at slice index:`, sliceIndex);
    return { value: sliceIndex.base * 2, name: `Outer_${sliceIndex.base}` };
  }
};

// Example inner diagram builder
const innerBuilder = (i: number): ColimDiagram<number, NumObj> => {
  console.log(`  Building inner diagram for base index: ${i}`);
  return {
    index: i,
    evaluateAt: (j: number) => {
      console.log(`    Evaluating inner diagram at index: ${j}`);
      return { value: i + j, name: `Inner_${i}_${j}` };
    }
  };
};

console.log('--- Before Optimization ---');
console.log('Original nested colimit structure:');
console.log('  Outer diagram index:', outerDiagram.index);
const originalResult = outerDiagram.evaluateAt(outerDiagram.index);
console.log('  Original evaluation result:', originalResult);

console.log('\n--- Applying Optimization ---');
console.log('Collapsing nested colimit using Lemma 7.13...');

// Apply the optimization
const collapsedDiagram = collapseNestedColimit(outerDiagram, innerBuilder);

console.log('  Collapsed diagram index:', collapsedDiagram.index);
console.log('  Collapsed diagram type: ColimDiagram<number, NumObj>');

console.log('\n--- After Optimization ---');
console.log('Evaluating collapsed diagram:');
const optimizedResult = collapsedDiagram.evaluateAt(collapsedDiagram.index);
console.log('  Optimized evaluation result:', optimizedResult);

console.log('\n--- Performance Comparison ---');
console.log('Before optimization:');
console.log('  - Required nested colimit computation');
console.log('  - Outer colimit over slice category');
console.log('  - Inner colimit for each slice element');
console.log('');
console.log('After optimization:');
console.log('  - Single colimit computation');
console.log('  - Direct evaluation at base index');
console.log('  - Eliminated redundant inner colimits');

console.log('\n=== Colimit Optimization Test Completed ===');
