/* @jest-environment node */
import type { SmallCat } from "../src/catsharp/cofunctor";
import { oppositeViaDuals } from "../src/catsharp/duals";
import { oppositeFromSpan } from "../src/catsharp/spans";

const C: SmallCat = {
  objects: ["a","b"],
  morphisms: [
    { id:"id_a", src:"a", dst:"a" },
    { id:"id_b", src:"b", dst:"b" },
    { id:"f", src:"a", dst:"b" }
  ]
};

test("Theorem 3.5: opposite via duals matches direct opposite", () => {
  const byDuals = oppositeViaDuals(C);
  const direct  = oppositeFromSpan(C);
  const pairs = (X: SmallCat) => X.morphisms.map(m => [m.src, m.dst]).sort();
  expect(pairs(byDuals)).toEqual(pairs(direct));
});
