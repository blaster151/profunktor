/* @jest-environment node */
import type { SmallCat } from "../src/catsharp/cofunctor";
import { bicomoduleFromFunctor_p } from "../src/catsharp/polycat-example";

// B: x --u--> y; E has exactly two distinct lifts of u
const B: SmallCat = {
  objects:["x","y"],
  morphisms:[
    {id:"id_x",src:"x",dst:"x"},
    {id:"id_y",src:"y",dst:"y"},
    {id:"u",src:"x",dst:"y"}
  ]
};
const E: SmallCat = {
  objects:["ex","ey1","ey2"],
  morphisms:[
    {id:"id_ex",src:"ex",dst:"ex"},
    {id:"id_ey1",src:"ey1",dst:"ey1"},
    {id:"id_ey2",src:"ey2",dst:"ey2"},
    {id:"ua",src:"ex",dst:"ey1"},
    {id:"ub",src:"ex",dst:"ey2"}
  ]
};
const p = {
  onObj: (e:string)=> e==="ex"?"x":"y",
  onMor: (m:string)=> (m==="ua"||m==="ub")? "u" : (m.startsWith("id_")? `id_${p.onObj(m.slice(3))}` : m)
};

test("number of lifts equals number of 1-simplices in the fiber nerve over G", () => {
  const P = bicomoduleFromFunctor_p(E, B, p, 2);
  const Gs = P.positionsAt("[1]");                 // all 1-simplices of N(B)
  const G = Gs.find(s => s.includes('"u"'))!;
  const fiber = P.fiberAt("[1]", G);
  const lifts = fiber.onObj("[1]");                 // our simplified fiber nerve: 1-simplices = lifts
  expect(lifts.length).toBe(2);
});
