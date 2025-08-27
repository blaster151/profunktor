import type { SmallCat } from "../src/catsharp/cofunctor";
import { embedTypedPolynomial, type TypedPolynomial } from "../src/catsharp/polyE";

// Discrete E (objects only) to illustrate positions & fibers naming
const E: SmallCat = {
  objects: ["A","B","P","P*","o1","o2"],
  morphisms: ["A","B","P","P*","o1","o2"].map(x => ({ id:`id_${x}`, src:x, dst:x }))
};

const poly: TypedPolynomial = {
  A: "A", B: "B", P: "P", Pstar: "P*",
  a_from_pstar: { id:"a", src:"P*", dst:"A" },
  pstar_to_p:   { id:"π", src:"P*", dst:"P" },
  p_to_B:       { id:"b", src:"P",  dst:"B" }
};

const ops = {
  hom: (src: any, dst: string) => E.objects.filter(o => o === dst).map(o => ({ id:`id_${o}`, src:o, dst:o })),
  pullback: (_G: any, _π: any) => ({ obj: "PB" }) // name-only for demo
};

const B = embedTypedPolynomial(E, poly, ops);
console.log("positions at x:", B.positionsAt("id_A").slice(0,3));
console.log("fiber label at first pos over B:", B.fiberAt("id_A", B.positionsAt("id_A")[0]).onObj("id_B"));
