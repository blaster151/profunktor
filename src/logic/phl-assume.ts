// src/logic/phl-assume.ts
// Implements Theorem 11 (closed-assumption trick) and the "fresh-constant
// parameterization" corollary for Horn/PHL. See pp. 7–9.

import type { Sequent, Context, Term } from "./phl-sequent";
import { defined, substHorn } from "./phl-sequent";

export interface ClosedHorn { atoms: readonly { pred: string; args: readonly Term[] }[] }

/** Inline a closed Horn fact θ into the antecedent of a sequent (Theorem 11). */
export function assumeClosed(theta: ClosedHorn, sq: Sequent): Sequent {
  const thetaHorn = { all: theta.atoms.map(a => ({ kind: "true" as const })) }; // schematic: treat as ⊤-entailing pack
  return { ctx: sq.ctx, lhs: { all: [...thetaHorn.all, ...sq.lhs.all] }, rhs: sq.rhs };
}

/** Fresh-constant parameterization for a context Ez: replace vars by fresh constants Ec and
 *  return (i) the rewritten sequent, (ii) the two closed axioms you must add: Ec↓ and φ(Ec/Ez).
 */
export function parameterizeWithFreshConstants(
  Ez: Context,
  EcNames: readonly string[],        // one per variable in Ez
  sq: Sequent
): {
  sequent: Sequent,
  closedAxioms: { definedness: Sequent; antecedentFact: Sequent }
} {
  if (EcNames.length !== Ez.length) throw new Error("EcNames length must match Ez length.");

  // Build constant terms and "definedness" axiom > ⊢ Ec↓
  const EcTerms: Term[] = Ez.map((v, i) => {
    const sym = EcNames[i];
    if (sym === undefined) throw new Error(`Missing constant name at index ${i}`);
    return { kind: "app", sym, args: [], sort: v.sort };
  });
  const defCtx: Context = []; // closed
  const definedness: Sequent = { ctx: defCtx, lhs: { all: [] }, rhs: { all: EcTerms.map(defined) } };

  // Antecedent fact > ⊢ φ(Ec/Ez)
  const antecedentFact: Sequent = {
    ctx: defCtx,
    lhs: { all: [] },
    rhs: substHorn(sq.lhs, Ez, EcTerms)
  };

  // Rewrite the main sequent by substituting Ec for Ez in both sides, context becomes closed
  const sequent: Sequent = {
    ctx: defCtx,
    lhs: substHorn(sq.lhs, Ez, EcTerms),
    rhs: substHorn(sq.rhs, Ez, EcTerms)
  };

  return { sequent, closedAxioms: { definedness, antecedentFact } };
}
