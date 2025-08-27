// examples/polycat-example.demo.ts
import type { SmallCat } from "../src/catsharp/cofunctor";
import { bicomoduleFromFunctor_p } from "../src/catsharp/polycat-example";

// B: x→y; E has two distinct lifts of that arrow.
const B: SmallCat = {
  objects: ["x","y"],
  morphisms: [
    { id:"id_x", src:"x", dst:"x" },
    { id:"id_y", src:"y", dst:"y" },
    { id:"u", src:"x", dst:"y" }
  ]
};
const E: SmallCat = {
  objects: ["ex","ey1","ey2"],
  morphisms: [
    { id:"id_ex", src:"ex", dst:"ex" },
    { id:"id_ey1", src:"ey1", dst:"ey1" },
    { id:"id_ey2", src:"ey2", dst:"ey2" },
    { id:"ua", src:"ex", dst:"ey1" },
    { id:"ub", src:"ex", dst:"ey2" }
  ]
};
const p = {
  onObj: (e: string) => e.startsWith("e") ? (e==="ex"?"x":"y") : e,
  onMor: (m: string) => (m==="ua"||m==="ub") ? "u" : (m.startsWith("id_") ? `id_${p.onObj(m.slice(3))}` : m)
};

const P = bicomoduleFromFunctor_p(E, B, p, 2);

// pick a 1-simplex position G = x --u--> y
const positions1 = P.positionsAt("[1]");
console.log("positions [1] (N(B)_1):", positions1);
const G = positions1.find(s => s.includes('"u"'))!;
const fiber = P.fiberAt("[1]", G);
console.log("fiber nerve 0-simplices:", fiber.onObj("[0]"));   // ex over x
console.log("fiber nerve 1-simplices:", fiber.onObj("[1]"));   // lifts ua, ub
