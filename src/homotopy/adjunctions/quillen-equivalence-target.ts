// Represent TOPOI → HOMODEL modulo Quillen equivalence.
export interface QuillenModel { /* opaque tag for a model structure */ }
export interface QuillenPair { /* L ⊣ R with preservation evidence */ }

export interface QEClass {
  repr: QuillenModel;                // chosen representative
  witnesses: string[];               // notes about equivalences used
}
export function modQuillenEquivalence(m: QuillenModel): QEClass {
  return { repr: m, witnesses: [] };
}
export function recordQE(e: QEClass, note: string) { e.witnesses.push(note); }
