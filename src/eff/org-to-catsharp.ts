// Org (linear) ⟶ Elementary ⟶ Effects ⟶ Cat♯ in one hop. :contentReference[oaicite:1]{index=1}
import type { Bicomodule, Comonoid } from "../catsharp/definition";
import type { ClosureCoalgebra } from "./org";
import { linearElementaryFromOrg } from "./org";
import { toEffectsHandler } from "./elementary";
import { cofreeComonoidOf, bicomoduleOfHandler } from "./to-catsharp";

export function orgLinearToCatSharp(C: ClosureCoalgebra): {
  cFrom: Comonoid; cTo: Comonoid; bicomodule: Bicomodule;
} {
  // Org (linear) → Elementary (carrier y(S)) → Effects handler → Cat♯ bicomodule (c? ▷ c@)
  const Elem = linearElementaryFromOrg(C);
  const H    = toEffectsHandler(Elem);
  const cQ   = cofreeComonoidOf(Elem.from, "c?");
  const cAt  = cofreeComonoidOf(Elem.to,   "c@");
  const B    = bicomoduleOfHandler(H, cQ, cAt);
  return { cFrom: cQ, cTo: cAt, bicomodule: B };
}
