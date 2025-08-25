import { 
  Diagram,
  PushoutStep,
  SequentialColimitPlan,
  planSequentialColimit,
  DegreeRestriction,
  DiagramBuilder,
  CanonicalMorphism,
  getAllObjects,
  getAllMorphisms,
  isObjectInFinalDiagram,
  getObjectFirstAppearance,
  createDegreeRestriction,
  degreeRestrictions
} from '../fp-colimit-sequentializer';

// Example object type with degree information
interface DegreeObject {
  readonly id: string;
  readonly degree: number;
}

// Example morphism type
interface DegreeMorphism {
  readonly source: string;
  readonly target: string;
  readonly type: 'identity' | 'canonical';
}

// Example diagram builder that creates diagrams based on degree
const buildDegreeDiagram: DiagramBuilder<number, DegreeObject, DegreeMorphism> = (degree: number): Diagram<number, DegreeObject, DegreeMorphism> => {
  const objects: DegreeObject[] = [];
  const morphisms: DegreeMorphism[] = [];
  
  // Create objects with the specified degree
  for (let i = 0; i <= degree; i++) {
    objects.push({ id: `obj_${degree}_${i}`, degree });
  }
  
  // Create identity morphisms
  for (const obj of objects) {
    morphisms.push({
      source: obj.id,
      target: obj.id,
      type: 'identity'
    });
  }
  
  return {
    index: degree,
    objects,
    morphisms
  };
};

// Example canonical morphism function
const canonicalMorphism: CanonicalMorphism<DegreeObject, DegreeMorphism> = (source: DegreeObject, target: DegreeObject): DegreeMorphism => {
  return {
    source: source.id,
    target: target.id,
    type: 'canonical'
  };
};

// Example degree restriction: only include objects with degree <= k
const restrictToQk: DegreeRestriction<DegreeObject> = (obj: DegreeObject, k: number): boolean => {
  return obj.degree <= k;
};

console.log('=== Sequential Colimit Planner Demo ===\n');

// Plan a sequential colimit with max degree 3
const plan: SequentialColimitPlan<DegreeObject, DegreeMorphism> = planSequentialColimit(
  restrictToQk,
  buildDegreeDiagram,
  canonicalMorphism,
  3
);

console.log('Sequential Colimit Plan:');
console.log('Max Degree:', plan.maxDegree);
console.log('Number of Steps:', plan.steps.length);
console.log('Initial Diagram Objects:', undefined as any);
console.log('Final Diagram Objects:', plan.finalDiagram.objects.length);

// Show each step
console.log('\nSteps:');
for (let i = 0; i < plan.steps.length; i++) {
  const step = plan.steps[i];
  console.log(`Step ${i + 1} (Degree ${step.stepIndex}):`);
  console.log(`  Left Diagram Objects: ${step.leftDiagram.objects.length}`);
  console.log(`  Right Diagram Objects: ${undefined as any}`);
  console.log(`  Pushout Diagram Objects: ${undefined as any}`);
  console.log(`  Pushout Diagram Morphisms: ${undefined as any}`);
}

// Test utility functions
console.log('\nUtility Functions:');
console.log('All Objects Count:', getAllObjects(plan).length);
console.log('All Morphisms Count:', getAllMorphisms(plan).length);

// Test object membership
const testObject: DegreeObject = { id: 'obj_2_1', degree: 2 };
console.log(`Is test object in final diagram?`, isObjectInFinalDiagram(plan, testObject));

// Test first appearance
const firstAppearance = getObjectFirstAppearance(plan, testObject);
console.log(`Test object first appears at degree:`, firstAppearance);

// Test degree restrictions
console.log('\nDegree Restrictions:');

// Create different degree restrictions
const lessThanOrEqualRestriction = degreeRestrictions.lessThanOrEqual<DegreeObject>((obj) => obj.degree);
const equalRestriction = degreeRestrictions.equal<DegreeObject>((obj) => obj.degree);
const greaterThanOrEqualRestriction = degreeRestrictions.greaterThanOrEqual<DegreeObject>((obj) => obj.degree);

// Test with different objects
const obj1: DegreeObject = { id: 'test1', degree: 1 };
const obj2: DegreeObject = { id: 'test2', degree: 2 };
const obj3: DegreeObject = { id: 'test3', degree: 3 };

console.log('Object 1 (degree 1):');
console.log(`  <= 2: ${lessThanOrEqualRestriction(obj1, 2)}`);
console.log(`  = 2: ${equalRestriction(obj1, 2)}`);
console.log(`  >= 2: ${greaterThanOrEqualRestriction(obj1, 2)}`);

console.log('Object 2 (degree 2):');
console.log(`  <= 2: ${lessThanOrEqualRestriction(obj2, 2)}`);
console.log(`  = 2: ${equalRestriction(obj2, 2)}`);
console.log(`  >= 2: ${greaterThanOrEqualRestriction(obj2, 2)}`);

console.log('Object 3 (degree 3):');
console.log(`  <= 2: ${lessThanOrEqualRestriction(obj3, 2)}`);
console.log(`  = 2: ${equalRestriction(obj3, 2)}`);
console.log(`  >= 2: ${greaterThanOrEqualRestriction(obj3, 2)}`);

// Show object details
console.log('\nObject Details:');
console.log('Initial Diagram Objects:', plan.initialDiagram.objects.map(obj => obj.id));
console.log('Final Diagram Objects:', plan.finalDiagram.objects.map(obj => obj.id));

// Show morphism details
console.log('\nMorphism Details:');
console.log('Initial Diagram Morphisms:', plan.initialDiagram.morphisms.map(m => `${m.source} -> ${m.target} (${m.type})`));
console.log('Final Diagram Morphisms:', plan.finalDiagram.morphisms.map(m => `${m.source} -> ${m.target} (${m.type})`));
