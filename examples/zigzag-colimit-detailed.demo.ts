// examples/zigzag-colimit-detailed.demo.ts
import { colimitCategory, roofArrow, colimObjects, type DiagramCat, type SmallCategory } from "../src/cat/zigzag-colimit";

console.log("=== Zigzag Colimit Demo ===\n");

// More interesting example: categories with multiple objects and morphisms
const K: SmallCategory = { 
  name: "K", 
  objects: ["x", "y"], 
  morphisms: [
    {id: "idK_x", src: "x", dst: "x"},
    {id: "idK_y", src: "y", dst: "y"},
    {id: "f_K", src: "x", dst: "y"}
  ] 
};

const A: SmallCategory = { 
  name: "A", 
  objects: ["a", "b"], 
  morphisms: [
    {id: "idA_a", src: "a", dst: "a"},
    {id: "idA_b", src: "b", dst: "b"},
    {id: "f_A", src: "a", dst: "b"}
  ] 
};

const B: SmallCategory = { 
  name: "B", 
  objects: ["c", "d"], 
  morphisms: [
    {id: "idB_c", src: "c", dst: "c"},
    {id: "idB_d", src: "d", dst: "d"},
    {id: "f_B", src: "c", dst: "d"}
  ] 
};

const J = { 
  objects: ["K", "A", "B"], 
  arrows: [
    {id: "l", src: "K", dst: "A"},
    {id: "r", src: "K", dst: "B"}
  ]
};

const F = {
  l: { 
    id: "l", 
    src: "K", 
    dst: "A",
    onObj: (o: string) => o === "x" ? "a" : "b",
    onMor: (m: any) => {
      if (m.src === "x" && m.dst === "x") return {id: "idA_a", src: "a", dst: "a"};
      if (m.src === "y" && m.dst === "y") return {id: "idA_b", src: "b", dst: "b"};
      if (m.src === "x" && m.dst === "y") return {id: "f_A", src: "a", dst: "b"};
      return {id: "idA_a", src: "a", dst: "a"}; // fallback
    }
  },
  r: { 
    id: "r", 
    src: "K", 
    dst: "B",
    onObj: (o: string) => o === "x" ? "c" : "d",
    onMor: (m: any) => {
      if (m.src === "x" && m.dst === "x") return {id: "idB_c", src: "c", dst: "c"};
      if (m.src === "y" && m.dst === "y") return {id: "idB_d", src: "d", dst: "d"};
      if (m.src === "x" && m.dst === "y") return {id: "f_B", src: "c", dst: "d"};
      return {id: "idB_c", src: "c", dst: "c"}; // fallback
    }
  }
} as any;

const diag: DiagramCat = { J, C: {K, A, B}, F };

console.log("1. Object Colimit Analysis:");
const { repOf, classes } = colimObjects(diag);
console.log("Object representatives:", Array.from(classes.keys()));
console.log("Object classes:");
for (const [rep, members] of classes) {
  console.log(`  ${rep}: [${members.join(", ")}]`);
}

console.log("\n2. Colimit Category:");
const C = colimitCategory(diag);
console.log("Object representatives:", C.reps);

console.log("\n3. Roof Arrow Construction:");
// Create a roof arrow from A to B using x in K as the apex
const zz = roofArrow(diag, {
  i: "A", j: "B", k: "K", 
  lId: "l", rId: "r",
  a: "a", c: "x", b: "c",
  f: {id: "idA_a", src: "a", dst: "a"},
  g: {id: "idB_c", src: "c", dst: "c"}
});

console.log("Roof zig-zag structure:");
console.log("  Source rep:", zz.srcRep);
console.log("  Target rep:", zz.dstRep);
console.log("  Start:", JSON.stringify(zz.start, null, 2));
console.log("  Beads:", zz.beads.length, "legs");

console.log("\n4. Identity Morphisms:");
const idA = C.id("A", "a");
const idB = C.id("B", "c");
console.log("Identity on A::a:", idA.srcRep, "→", idA.dstRep);
console.log("Identity on B::c:", idB.srcRep, "→", idB.dstRep);

console.log("\n=== Demo Complete ===");
