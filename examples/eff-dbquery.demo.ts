import { type Polynomial, type Coalgebra, runStep, cfreeApproxFrom } from "../src/eff/polynomial";
import { migrateCoalgebra, type Handler } from "../src/eff/handler";

// DBQuery as a polynomial: positions = {Search, Retrieve}; fibers = exemplar result-shapes.
const DBQ: Polynomial = {
  positions: ["Search", "Retrieve", "Halt"],
  fiber: (u) =>
    u === "Search"   ? ["ids=[]", "ids=[i1]", "ids=[i1,i2]"] :
    u === "Retrieve" ? ["rec=missing", "rec=ok"] :
    /* Halt */         [] // empty fiber = termination signal
};

// A silly state machine that alternates Search → Retrieve → Halt.
type S = { phase: "search" } | { phase: "retrieve"; target: "i1"|"i2" } | { phase: "halt" };
const prog: Coalgebra<S> = {
  poly: DBQ,
  step: (s) => {
    if (s.phase === "search") {
      return {
        pos: "Search",
        cont: (dir) => {
          if (dir === "ids=[i1]") return { phase: "retrieve", target: "i1" };
          if (dir === "ids=[i1,i2]") return { phase: "retrieve", target: "i2" };
          return { phase: "halt" };
        }
      };
    } else if (s.phase === "retrieve") {
      return {
        pos: "Retrieve",
        cont: (_dir) => ({ phase: "halt" })
      };
    } else {
      return { pos: "Halt", cont: (_d) => s };
    }
  }
};

// A handler that "implements" DBQuery on top of a hypothetical @-polynomial SYS (e.g., syscalls).
const SYS: Polynomial = {
  positions: ["SysRead", "SysDone"],
  fiber: (v) => (v === "SysRead" ? ["ok", "err"] : [])
};
const handler: Handler = {
  from: DBQ, to: SYS,
  translate: (u) =>
    u === "Search"   ? { v: "SysRead", pull: (_dr) => "ids=[i1]" } :
    u === "Retrieve" ? { v: "SysRead", pull: (_dr) => "rec=ok"   } :
    /* Halt */         { v: "SysDone", pull: (_dr) => "" }
};

const progSYS = migrateCoalgebra(prog, handler);

// A trivial environmentthat always picks the first direction.
const pickFirst = (_v: string, fiber: string[]) => fiber[0] ?? "";

let s: S = { phase: "search" };
s = runStep(progSYS, pickFirst, s);
s = runStep(progSYS, pickFirst, s);
s = runStep(progSYS, pickFirst, s);
console.log("final state:", s);

// Show a bounded approximation to c? at u="Search"
console.log("c? approx depth=2 edges out of root:", cfreeApproxFrom(DBQ, "Search", 2).edges.length);
