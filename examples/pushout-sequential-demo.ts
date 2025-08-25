import { CategoryOps, pushout } from '../fp-pushout';
import { 
  Diagram, 
  PushoutStep, 
  SequentialColimitPlan, 
  planSequentialColimit 
} from '../fp-colimit-sequentializer';
import { runSequentialColimit } from '../fp-colimit-runner';
import { 
  SmallCategory, 
  Functor, 
  categoryOfElements 
} from '../fp-grothendieck-construction';

console.log('=== Pushout and Sequential Colimit Demo ===\n');

// Example: Simple category with sets as objects and functions as morphisms
interface SetObj {
  readonly elements: ReadonlyArray<string>;
  readonly name: string;
}

interface SetMor {
  readonly source: SetObj;
  readonly target: SetObj;
  readonly map: (x: string) => string;
}

// Simple category operations for sets
const setCategoryOps: CategoryOps<SetObj, SetMor> = {
  coproduct: (x: SetObj, y: SetObj) => {
    const sumElements = [
      ...x.elements.map(e => `left_${e}`),
      ...y.elements.map(e => `right_${e}`)
    ];
    const sumObj: SetObj = { elements: sumElements, name: `${x.name}+${y.name}` };
    
    const inl: SetMor = {
      source: x,
      target: sumObj,
      map: (e: string) => `left_${e}`
    };
    
    const inr: SetMor = {
      source: y,
      target: sumObj,
      map: (e: string) => `right_${e}`
    };
    
    return { obj: sumObj, inl, inr };
  },
  
  coequalizer: (u: SetMor, v: SetMor) => {
    // Simple coequalizer: identify elements that are mapped to the same place
    const equivalenceClasses = new Map<string, string>();
    const representatives = new Set<string>();
    
    for (const elem of u.source.elements) {
      const uImage = u.map(elem);
      const vImage = v.map(elem);
      if (uImage === vImage) {
        equivalenceClasses.set(elem, uImage);
        representatives.add(uImage);
      }
    }
    
    const coequalizerElements = Array.from(representatives);
    const coequalizerObj: SetObj = { 
      elements: coequalizerElements, 
      name: `coeq_${u.source.name}_${v.source.name}` 
    };
    
    const q: SetMor = {
      source: u.target,
      target: coequalizerObj,
      map: (e: string) => {
        // Find the representative for this element
        for (const [key, value] of equivalenceClasses.entries()) {
          if (value === e) return e;
        }
        return e; // Default case
      }
    };
    
    return { obj: coequalizerObj, q };
  },
  
  compose: (v: SetMor, u: SetMor) => {
    // For pushout computation, we need to handle composition more carefully
    // The pushout construction composes inl ∘ f and inr ∘ g
    // where inl: B → B+C, inr: C → B+C, f: A → B, g: A → C
    
    // Check if composition is valid
    if (v.source !== u.target) {
      throw new Error(`Cannot compose morphisms: target of u (${u.target.name}) must equal source of v (${v.source.name})`);
    }
    
    return {
      source: u.source,
      target: v.target,
      map: (x: string) => {
        const uResult = u.map(x);
        return v.map(uResult);
      }
    };
  }
};

// Test pushout computation
console.log('--- Pushout Computation ---');

const A: SetObj = { elements: ['a', 'b'], name: 'A' };
const B: SetObj = { elements: ['x', 'y'], name: 'B' };
const C: SetObj = { elements: ['p', 'q'], name: 'C' };

const f: SetMor = {
  source: A,
  target: B,
  map: (x: string) => x === 'a' ? 'x' : 'y'
};

const g: SetMor = {
  source: A,
  target: C,
  map: (x: string) => x === 'a' ? 'p' : 'q'
};

console.log('Computing pushout of:');
console.log('  A:', A);
console.log('  B:', B);
console.log('  C:', C);
console.log('  f: A → B');
console.log('  g: A → C');

const pushoutResult = pushout(setCategoryOps, A, B, C, f, g);

console.log('Pushout result:');
console.log('  P:', pushoutResult.P);
console.log('  inB: B → P');
console.log('  inC: C → P');

// Test sequential colimit planning
console.log('\n--- Sequential Colimit Planning ---');

// Simple diagram implementation
class SimpleDiagram implements Diagram<number, SetObj, SetMor> {
  constructor(
    public readonly index: number,
    private readonly objects: Map<number, SetObj>,
    private readonly morphisms: Map<string, SetMor>
  ) {}
  
  objectOf(i: number): SetObj {
    const obj = this.objects.get(i);
    if (!obj) throw new Error(`Object ${i} not found in diagram`);
    return obj;
  }
  
  morphism(src: number, dst: number): SetMor | null {
    const key = `${src}->${dst}`;
    return this.morphisms.get(key) || null;
  }
}

// Restriction function: return diagram for degree k
const restrictToQk = (k: number): Diagram<number, SetObj, SetMor> | null => {
  if (k < 0 || k > 2) return null;
  
  const objects = new Map<number, SetObj>();
  const morphisms = new Map<string, SetMor>();
  
  // Create objects for degree k
  const obj: SetObj = { 
    elements: [`obj_${k}_1`, `obj_${k}_2`], 
    name: `Q${k}` 
  };
  objects.set(k, obj);
  
  return new SimpleDiagram(k, objects, morphisms);
};

// Build leg for degree k
const buildLk = (k: number): SetObj => {
  return { 
    elements: [`leg_${k}_1`, `leg_${k}_2`, `leg_${k}_3`], 
    name: `L${k}` 
  };
};

// Canonical morphism for degree k
const canonical = (k: number): SetMor => {
  const source: SetObj = { 
    elements: [`prev_${k}_1`, `prev_${k}_2`], 
    name: `P${k-1}` 
  };
  const target: SetObj = { 
    elements: [`obj_${k}_1`, `obj_${k}_2`], 
    name: `Q${k}` 
  };
  
  return {
    source,
    target,
    map: (x: string) => x.replace('prev', 'obj')
  };
};

// Create sequential colimit plan
const plan = planSequentialColimit(restrictToQk, buildLk, canonical, 2);

console.log('Sequential colimit plan:');
console.log('  Number of steps:', plan.steps.length);
for (let i = 0; i < plan.steps.length; i++) {
  const step = plan.steps[i];
  console.log(`  Step ${i}:`);
  console.log(`    Qk:`, step.Qk);
  console.log(`    Lk:`, step.Lk);
  console.log(`    glue: P${i-1} → Q${i}`);
}

// Test sequential colimit execution
console.log('\n--- Sequential Colimit Execution ---');

const seedP0: SetObj = { elements: ['init'], name: 'P0' };

const seedIn = {
  toB: (Qk: SetObj): SetMor => ({
    source: Qk,
    target: Qk,
    map: (x: string) => x
  }),
  toC: (Lk: SetObj): SetMor => ({
    source: Lk,
    target: Lk,
    map: (x: string) => x
  }),
  fromA: (Pk_1: SetObj): {A: SetObj; f: SetMor; g: SetMor} => {
    // For the pushout construction, we need f: A → Qk and g: A → Lk
    // But we're given Pk_1, so we need to create appropriate morphisms
    const A: SetObj = { elements: ['shared'], name: 'A' };
    
    // Create a dummy target for f (this should be Qk in practice)
    const dummyTarget: SetObj = { elements: ['dummy'], name: 'Dummy' };
    
    const f: SetMor = {
      source: A,
      target: dummyTarget,
      map: (x: string) => 'dummy'
    };
    const g: SetMor = {
      source: A,
      target: dummyTarget,
      map: (x: string) => 'dummy'
    };
    return { A, f, g };
  }
};

const result = runSequentialColimit(setCategoryOps, plan, seedP0, seedIn);

console.log('Sequential colimit execution result:');
console.log('  Number of objects in chain:', result.length);
for (let i = 0; i < result.length; i++) {
  console.log(`  P${i}:`, result[i]);
}

// Test Grothendieck construction
console.log('\n--- Grothendieck Construction ---');

// Simple category A
const categoryA: SmallCategory<string, string> = {
  id: (o: string) => `id_${o}`,
  dom: (m: string) => m.split('->')[0],
  cod: (m: string) => m.split('->')[1],
  comp: (g: string, f: string) => `${f.split('->')[0]}->${g.split('->')[1]}`
};

// Simple category E
const categoryE: SmallCategory<number, string> = {
  id: (o: number) => `id_${o}`,
  dom: (m: string) => parseInt(m.split('->')[0]),
  cod: (m: string) => parseInt(m.split('->')[1]),
  comp: (g: string, f: string) => `${f.split('->')[0]}->${g.split('->')[1]}`
};

// Functor F: A → E
const functorF: Functor<string, string, number, string> = {
  A: categoryA,
  E: categoryE,
  onObj: (a: string) => a.length,
  onMor: (f: string) => `${f.split('->')[0].length}->${f.split('->')[1].length}`
};

// Create category of elements
const categoryOfElementsF = categoryOfElements(functorF);

console.log('Category of elements ∫F created');
console.log('  Functor F: A → E');
console.log('  A objects: strings');
console.log('  E objects: numbers (length of strings)');

// Test object creation
const obj1 = categoryOfElementsF.makeObj('hello', 5, '5->5');
const obj2 = categoryOfElementsF.makeObj('world', 5, '5->5');

console.log('Created objects:');
console.log('  obj1:', obj1);
console.log('  obj2:', obj2);

// Test morphism creation
const mor = categoryOfElementsF.makeMor(obj1, obj2, 'hello->world', '5->5');
console.log('Created morphism:', mor);

console.log('\n=== Pushout and Sequential Colimit Demo Completed ===');
