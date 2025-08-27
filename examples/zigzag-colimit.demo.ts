// examples/zigzag-colimit.demo.ts
import { colimitCategory, roofArrow, type DiagramCat, type SmallCategory } from "../src/cat/zigzag-colimit";

// Tiny pushout: K --l--> A,  K --r--> B
const K: SmallCategory = { name:"K", objects:["x"], morphisms:[{id:"idK",src:"x",dst:"x"}] };
const A: SmallCategory = { name:"A", objects:["a"], morphisms:[{id:"idA",src:"a",dst:"a"}] };
const B: SmallCategory = { name:"B", objects:["b"], morphisms:[{id:"idB",src:"b",dst:"b"}] };

const J = { objects:["K","A","B"], arrows:[
  {id:"l", src:"K", dst:"A"},
  {id:"r", src:"K", dst:"B"}
]};

const F = {
  l: { id:"l", src:"K", dst:"A",
    onObj:(o:string)=> "a",
    onMor:(m:any)=> ({id:"idA",src:"a",dst:"a"})
  },
  r: { id:"r", src:"K", dst:"B",
    onObj:(o:string)=> "b",
    onMor:(m:any)=> ({id:"idB",src:"b",dst:"b"})
  }
} as any;

const diag: DiagramCat = { J, C: {K, A, B}, F };

const C = colimitCategory(diag);
console.log("object reps:", C.reps);

// A "roof" arrow using the single object x∈K as the apex
const zz = roofArrow(diag, {
  i:"A", j:"B", k:"K", lId:"l", rId:"r",
  a:"a", c:"x", b:"b",
  f:{id:"idA",src:"a",dst:"a"},
  g:{id:"idB",src:"b",dst:"b"}
});
console.log("roof zig-zag:", zz);
