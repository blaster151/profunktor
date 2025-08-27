/* @jest-environment node */
import { type Polynomial, type Coalgebra, runStep, cfreeApproxFrom } from "../src/eff/polynomial";
import { migrateCoalgebra, type Handler } from "../src/eff/handler";

const DBQ: Polynomial = {
  positions: ["Search","Retrieve","Halt"],
  fiber: (u)=> u==="Search"? ["ids=[i]"] : u==="Retrieve"? ["ok"] : []
};
type S = { phase:"search" } | { phase:"retrieve" } | { phase:"halt" };
const prog: Coalgebra<S> = {
  poly: DBQ,
  step: (s)=> s.phase==="search"
    ? { pos:"Search",   cont:(_)=> ({ phase:"retrieve" }) }
    : s.phase==="retrieve"
      ? { pos:"Retrieve", cont:(_)=> ({ phase:"halt" }) }
      : { pos:"Halt", cont:(_)=> s }
};
const SYS: Polynomial = { positions:["R","Done"], fiber:(v)=> v==="R"? ["ok"] : [] };
const H: Handler = {
  from: DBQ, to: SYS,
  translate: (u)=> u==="Halt"? ({ v:"Done", pull:(_)=> "" }) : ({ v:"R", pull:(_)=> "ok" })
};

test("migrateCoalgebra composes continuations correctly", () => {
  const P = migrateCoalgebra(prog, H);
  const pick = (_v:string, fs:string[])=> fs[0] ?? "";
  let s: S = { phase:"search" };
  s = runStep(P, pick, s); // R
  s = runStep(P, pick, s); // R
  s = runStep(P, pick, s); // Done
  expect(s.phase).toBe("halt");
});

test("cfreeApproxFrom builds the expected branching at depth 1", () => {
  const root = cfreeApproxFrom(DBQ, "Search", 1);
  expect(root.pos).toBe("Search");
  expect(root.edges.map(e=>e.dir)).toEqual(["ids=[i]"]);
});
