// src/fp-laws-attach.ts
import type { Suite } from "./fp-laws-core";
import { functorSuite, applicativeSuite, monadSuite, profunctorSuite, categorySuite } from "./fp-laws-suites";
import { getRegistry, has } from "./fp-witness-registry";

export function collectSuites(): Suite[] {
  const suites: Suite[] = [];
  for (const rec of getRegistry()) {
    if (has(rec,"Functor")) suites.push(functorSuite(rec));
    if (has(rec,"Applicative")) suites.push(applicativeSuite(rec));
    if (has(rec,"Monad")) suites.push(monadSuite(rec));
    if (has(rec,"Profunctor")) suites.push(profunctorSuite(rec));
    if (has(rec,"Category")) suites.push(categorySuite(rec));
    // Add your Arrow / ArrowChoice suites here when ready
  }
  return suites;
}
