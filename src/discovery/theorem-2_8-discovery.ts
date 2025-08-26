// src/discovery/theorem-2_8-discovery.ts
import type { TheoryPack } from "../logic/finite-limit-and-coherent";

export type Theorem28Route = "case1" | "case2" | "undecided";
export interface Theorem28Report {
  route: Theorem28Route;
  extendsToAllTopoi: boolean;      // 2.8(iii) satisfied?
  functorialTOPOItoHOMODEL: boolean;
  notes: string[];
}

function hasClauseIII(pack: TheoryPack): boolean {
  const { W, C } = pack;
  return !!(W.finiteLength || W.countableFragment || W.enoughModelsInSet ||
            C.finiteLength || C.countableFragment || C.enoughModelsInSet);
}

export function discoverTheorem28(pack: TheoryPack): Theorem28Report {
  const notes: string[] = [];
  // Case (2): C(E) = cof(I_E) for some set I_E in every topos (strongest, gives functoriality)
  if (pack.cofibrationsAreCofIInEveryTopos) {
    notes.push("Using 2.8(ii): cofibrations coherently definable as cof(I_E) in each topos.");
    notes.push("Presheaf→sheaf transfer available: generators via LK, then ℓ.");
    return {
      route: "case2",
      extendsToAllTopoi: true,
      functorialTOPOItoHOMODEL: true, // Remark 2.9
      notes
    };
  }

  // Case (1): from Set instance with C = cof(I) (and then extend via (iii))
  if (pack.cofibrationsAreCofIinSet) {
    const iii = hasClauseIII(pack);
    notes.push("Using 2.8(i): Set-based model with C=cof(I); extend along (iii) if available.");
    if (iii) {
      notes.push("Presheaf→sheaf transfer available: generators via LK, then ℓ.");
    }
    return {
      route: "case1",
      extendsToAllTopoi: iii,
      functorialTOPOItoHOMODEL: iii, // functorial once extended to all topoi
      notes
    };
  }

  notes.push("Undecided: need either C=cof(I) in Set, or C=cof(I_E) in every topos.");
  return { route: "undecided", extendsToAllTopoi: false, functorialTOPOItoHOMODEL: false, notes };
}
