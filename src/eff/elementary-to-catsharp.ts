// Lift an elementary handler to Cat♯ via Eff_el → Eff (Lemma 5.12 / Cor. 5.13) and c−.  :contentReference[oaicite:2]{index=2}
import type { ElementaryHandler } from "./elementary";
import { toEffectsHandler } from "./elementary";
import { cofreeComonoidOf, bicomoduleOfHandler } from "./to-catsharp";
import type { Bicomodule, Comonoid } from "../catsharp/definition";

export function elementaryToCatSharp(E: ElementaryHandler): {
  cFrom: Comonoid; cTo: Comonoid; bicomodule: Bicomodule;
} {
  // Eff_el → Eff: ( ?, @ )  ↦  ( c?, c@ ), same carrier B; then Eff → Cat♯ via our existing adapter.
  const cFrom = cofreeComonoidOf(E.from, "c?");
  const cTo   = cofreeComonoidOf(E.to,   "c@");
  const H     = toEffectsHandler(E);                                    // elementary ⇒ effects handler
  const Bico  = bicomoduleOfHandler(H, cFrom, cTo);                     // effects ⇒ Cat♯
  // Tag the carrier so you can see the elementary carrier's role today (names-only).
  (Bico as any).carrier = { name: `B[${E.carrier.positions.length}]⋉(${Bico.carrier.name})` };
  return { cFrom, cTo, bicomodule: Bico };
}
