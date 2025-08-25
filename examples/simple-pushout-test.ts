import { CategoryOps, pushout } from '../fp-pushout';
import { 
  Diagram, 
  PushoutStep, 
  SequentialColimitPlan, 
  planSequentialColimit 
} from '../fp-colimit-sequentializer';
import { runSequentialColimit } from '../fp-colimit-runner';

console.log('=== Simple Pushout and Sequential Colimit Test ===\n');

// Simple test with numbers as objects and functions as morphisms
interface NumObj {
  readonly value: number;
  readonly name: string;
}

interface NumMor {
  readonly source: NumObj;
  readonly target: NumObj;
  readonly map: (x: number) => number;
}

// Simple category operations for numbers
const numCategoryOps: CategoryOps<NumObj, NumMor> = {
  coproduct: (x: NumObj, y: NumObj) => {
    const sumObj: NumObj = { value: x.value + y.value, name: `${x.name}+${y.name}` };
    
    const inl: NumMor = {
      source: x,
      target: sumObj,
      map: (n: number) => n
    };
    
    const inr: NumMor = {
      source: y,
      target: sumObj,
      map: (n: number) => n + x.value
    };
    
    return { obj: sumObj, inl, inr };
  },
  
  coequalizer: (u: NumMor, v: NumMor) => {
    // Simple coequalizer: take the minimum
    const coequalizerObj: NumObj = { 
      value: Math.min(u.target.value, v.target.value), 
      name: `coeq_${u.source.name}_${v.source.name}` 
    };
    
    const q: NumMor = {
      source: u.target,
      target: coequalizerObj,
      map: (n: number) => Math.min(n, coequalizerObj.value)
    };
    
    return { obj: coequalizerObj, q };
  },
  
  compose: (v: NumMor, u: NumMor) => {
    if (v.source !== u.target) {
      throw new Error(`Cannot compose: ${u.target.name} ≠ ${v.source.name}`);
    }
    
    return {
      source: u.source,
      target: v.target,
      map: (x: number) => v.map(u.map(x))
    };
  }
};

// Test basic pushout
console.log('--- Basic Pushout Test ---');

const A: NumObj = { value: 1, name: 'A' };
const B: NumObj = { value: 2, name: 'B' };
const C: NumObj = { value: 3, name: 'C' };

const f: NumMor = {
  source: A,
  target: B,
  map: (x: number) => x * 2
};

const g: NumMor = {
  source: A,
  target: C,
  map: (x: number) => x * 3
};

console.log('Computing pushout of:');
console.log('  A:', A);
console.log('  B:', B);
console.log('  C:', C);

const pushoutResult = pushout(numCategoryOps, A, B, C, f, g);

console.log('Pushout result:');
console.log('  P:', pushoutResult.P);
console.log('  inB: B → P');
console.log('  inC: C → P');

// Test sequential colimit planning
console.log('\n--- Sequential Colimit Planning Test ---');

// Simple diagram implementation
class SimpleNumDiagram implements Diagram<number, NumObj, NumMor> {
  constructor(
    public readonly index: number,
    private readonly objects: Map<number, NumObj>
  ) {}
  
  objectOf(i: number): NumObj {
    const obj = this.objects.get(i);
    if (!obj) throw new Error(`Object ${i} not found`);
    return obj;
  }
  
  morphism(src: number, dst: number): NumMor | null {
    const srcObj = this.objects.get(src);
    const dstObj = this.objects.get(dst);
    if (!srcObj || !dstObj) return null;
    
    return {
      source: srcObj,
      target: dstObj,
      map: (x: number) => x
    };
  }
}

// Restriction function
const restrictToQk = (k: number): Diagram<number, NumObj, NumMor> | null => {
  if (k < 0 || k > 2) return null;
  
  const objects = new Map<number, NumObj>();
  objects.set(k, { value: k * 10, name: `Q${k}` });
  
  return new SimpleNumDiagram(k, objects);
};

// Build leg for degree k
const buildLk = (k: number): NumObj => {
  return { value: k * 5, name: `L${k}` };
};

// Canonical morphism for degree k
const canonical = (k: number): NumMor => {
  const source: NumObj = { value: (k - 1) * 10, name: `P${k-1}` };
  const target: NumObj = { value: k * 10, name: `Q${k}` };
  
  return {
    source,
    target,
    map: (x: number) => x
  };
};

// Create plan
const plan = planSequentialColimit(restrictToQk, buildLk, canonical, 2);

console.log('Sequential colimit plan created:');
console.log('  Number of steps:', plan.steps.length);
for (let i = 0; i < plan.steps.length; i++) {
  const step = plan.steps[i];
  console.log(`  Step ${i}: Qk=${step.Qk.name}, Lk=${step.Lk.name}`);
}

console.log('\n=== Test Completed Successfully ===');
