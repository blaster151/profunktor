import { 
  Enrichment,
  EnrichedCategory,
  isSimplicial,
  supportsGoodRealization,
  enrichNone,
  enrichSimplicial,
  enrichTopological
} from '../fp-enrichment';

console.log('=== Simplicial Enrichment Guards Test ===\n');

// Example base category interface
interface BaseCategory {
  readonly name: string;
  readonly objects: ReadonlyArray<string>;
}

// Create some example base categories
const plainCategory: BaseCategory = {
  name: 'Plain Category',
  objects: ['A', 'B', 'C']
};

const simplicialCategory: BaseCategory = {
  name: 'Simplicial Category',
  objects: ['X', 'Y', 'Z']
};

const topologicalCategory: BaseCategory = {
  name: 'Topological Category',
  objects: ['P', 'Q', 'R']
};

console.log('--- Creating Enriched Categories ---');

// Create enriched categories with different enrichment types
const plainEnriched = enrichNone(plainCategory);
const simplicialEnriched = enrichSimplicial(simplicialCategory, true, true); // with standard simplices and good realization
const simplicialEnrichedNoStd = enrichSimplicial(simplicialCategory, false, false); // without standard simplices or good realization
const topologicalEnriched = enrichTopological(topologicalCategory);

console.log('Created enriched categories:');
console.log('  Plain:', plainEnriched);
console.log('  Simplicial (with std simplices):', simplicialEnriched);
console.log('  Simplicial (no std simplices):', simplicialEnrichedNoStd);
console.log('  Topological:', topologicalEnriched);

console.log('\n--- Testing Guard Functions ---');

// Test isSimplicial guard
console.log('isSimplicial guards:');
console.log(`  Plain category: ${isSimplicial(plainEnriched)}`);
console.log(`  Simplicial category: ${isSimplicial(simplicialEnriched)}`);
console.log(`  Topological category: ${isSimplicial(topologicalEnriched)}`);

// Test supportsGoodRealization guard (Theorem 8.2)
console.log('\nsupportsGoodRealization guards (Theorem 8.2):');
console.log(`  Plain category: ${supportsGoodRealization(plainEnriched)}`);
console.log(`  Simplicial (with std + good realization): ${supportsGoodRealization(simplicialEnriched)}`);
console.log(`  Simplicial (no std + no good realization): ${supportsGoodRealization(simplicialEnrichedNoStd)}`);
console.log(`  Topological category: ${supportsGoodRealization(topologicalEnriched)}`);

console.log('\n--- Theorem 8.2 Precondition Checks ---');

// Example function that requires Theorem 8.2 hypotheses
function realizationFunctor<E extends EnrichedCategory<any>>(category: E) {
  if (!supportsGoodRealization(category)) {
    throw new Error('Realization functor requires simplicial enrichment with standard simplices and good realization (Theorem 8.2)');
  }
  
  console.log(`  ✓ Optimal realization functor with Theorem 8.2 hypotheses satisfied`);
  console.log(`  ✓ Realization functor enabled for ${category.base.name}`);
  return `realization_${category.base.name}`;
}

// Example function that requires simplicial enrichment (but not full Theorem 8.2)
function basicSimplicialFeature<E extends EnrichedCategory<any>>(category: E) {
  if (!isSimplicial(category)) {
    throw new Error('Basic simplicial feature requires simplicial enrichment');
  }
  
  console.log(`  ✓ Basic simplicial feature enabled for ${category.base.name}`);
  return `basic_simplicial_${category.base.name}`;
}

// Test the precondition checks
console.log('Testing Theorem 8.2 preconditions:');

try {
  console.log('\nAttempting realization functor on plain category:');
  realizationFunctor(plainEnriched);
} catch (error) {
  console.log(`  ✗ Blocked: ${error.message}`);
}

try {
  console.log('\nAttempting realization functor on simplicial category (with Theorem 8.2):');
  const result = realizationFunctor(simplicialEnriched);
  console.log(`  Result: ${result}`);
} catch (error) {
  console.log(`  ✗ Blocked: ${error.message}`);
}

try {
  console.log('\nAttempting realization functor on simplicial category (without Theorem 8.2):');
  const result = realizationFunctor(simplicialEnrichedNoStd);
  console.log(`  Result: ${result}`);
} catch (error) {
  console.log(`  ✗ Blocked: ${error.message}`);
}

try {
  console.log('\nAttempting basic simplicial feature on simplicial category:');
  const result = basicSimplicialFeature(simplicialEnriched);
  console.log(`  Result: ${result}`);
} catch (error) {
  console.log(`  ✗ Blocked: ${error.message}`);
}

console.log('\n--- Type Safety Demonstration ---');

// Demonstrate type safety with conditional logic
function processEnrichedCategory<E extends EnrichedCategory<any>>(category: E) {
  console.log(`Processing ${category.base.name} with ${category.enrichment} enrichment`);
  
  if (isSimplicial(category)) {
    console.log('  → Simplicial features available');
    if (supportsGoodRealization(category)) {
      console.log('  → Theorem 8.2 hypotheses satisfied - optimal features available');
    } else {
      console.log('  → Basic simplicial features only (missing Theorem 8.2 hypotheses)');
    }
  }
  
  if (category.enrichment === 'topological') {
    console.log('  → Topological features available');
  }
  
  if (category.enrichment === 'none') {
    console.log('  → No enrichment - limited feature set');
  }
}

console.log('\nProcessing each category:');
processEnrichedCategory(plainEnriched);
processEnrichedCategory(simplicialEnriched);
processEnrichedCategory(topologicalEnriched);

console.log('\n=== Enrichment Guards Test Completed ===');
