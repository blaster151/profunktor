// Elementary effects handlers (? ⊳ B ← B ⊳ @) as lightweight maps on positions + a backward pull.  :contentReference[oaicite:1]{index=1}
import type { Polynomial } from "./polynomial";
import type { Handler } from "./handler";

/** Minimal, operational presentation of an elementary (?, @)-effects handler with carrier B. */
export interface ElementaryHandler {
  from: Polynomial;     // ?
  to: Polynomial;       // @
  carrier: Polynomial;  // B
  /** Action on positions (|?(1)| → |@(1)|), e.g. Example 5.9 has !(n) = n+1. */
  onPos: (u: string) => string;
  /** Backward direction translation: given an @-direction, feed a ?-direction to the old cont. */
  pull: (dir_to: string) => string;
}

/** Identity elementary handler on ?. */
export function identityElementary(q: Polynomial): ElementaryHandler {
  return {
    from: q, to: q, carrier: q,
    onPos: (u) => u,
    pull: (d) => d
  };
}

/** Horizontal composition in Eff_el: ( ? ┣ B ┫ @ ) ; ( @ ┣ C ┫ A ) → ( ? ┣ B⊳C ┫ A ) (name-level). */
export function composeElementary(X: ElementaryHandler, Y: ElementaryHandler): ElementaryHandler {
  return {
    from: X.from,
    to: Y.to,
    // keep a simple carrier name; your future equalizer-based carrier can drop in here later
    carrier: { positions: [...X.carrier.positions], fiber: X.carrier.fiber },
    onPos: (u) => Y.onPos(X.onPos(u)),
    pull: (dirA) => X.pull(Y.pull(dirA))
  };
}

/** Reify an elementary handler as our concrete "effects" Handler (same positions/directions view). */
export function toEffectsHandler(E: ElementaryHandler): Handler {
  return {
    from: E.from,
    to: E.to,
    translate: (u: string) => ({ v: E.onPos(u), pull: (d: string) => E.pull(d) })
  };
}

// -------------------- NEW: Set-level equalizer carrier for Eff_el composition --------------------
/**
 * Glue data that pins down how the two carriers meet along the middle (target) polynomial:
 *  - `middlePositions`: the @-positions
 *  - `leftMap`:  B-position ↦ middle position
 *  - `rightMap`: C-position ↦ middle position
 */
export interface EqualizerGlue {
  middlePositions: string[];
  leftMap: (bPos: string) => string;
  rightMap: (cPos: string) => string;
}

/**
 * Compose elementary handlers with a **concrete equalizer carrier**:
 * positions = {(b,c) | leftMap(b) = rightMap(c)};  fiber(b,c) = B[b] × C[c].
 * `onPos` and `pull` compose exactly as before.
 */
export function composeElementaryWithEqualizer(
  X: ElementaryHandler, Y: ElementaryHandler, glue: EqualizerGlue
): ElementaryHandler & { carrierDetail: { pairs: Array<{ b: string; c: string; mid: string }> } } {
  const pairs: Array<{ b: string; c: string; mid: string }> = [];
  for (const b of X.carrier.positions) {
    const mb = glue.leftMap(b);
    for (const c of Y.carrier.positions) {
      const mc = glue.rightMap(c);
      if (mb === mc) pairs.push({ b, c, mid: mb });
    }
  }
  const carrier: Polynomial = {
    positions: pairs.map(({ b, c }) => `${b}⨯${c}`),
    fiber: (bc: string) => {
      const parts = bc.split("⨯");
      if (parts.length !== 2) return [];
      const [b, c] = parts;
      if (!b || !c) return [];
      const Bs = X.carrier.fiber(b);
      const Cs = Y.carrier.fiber(c);
      const out: string[] = [];
      for (const u of Bs) for (const v of Cs) out.push(`${u}×${v}`);
      return out;
    }
  };
  return {
    from: X.from,
    to: Y.to,
    carrier,
    onPos: (u) => Y.onPos(X.onPos(u)),
    pull: (dirA) => X.pull(Y.pull(dirA)),
    carrierDetail: { pairs }
  };
}

/** Convenience: expected size of the equalizer carrier = Σ_{m∈mid} |B_m|·|C_m|. */
export function expectedEqualizerSize(
  X: ElementaryHandler, Y: ElementaryHandler, glue: EqualizerGlue
): number {
  return glue.middlePositions.reduce((acc, m) => {
    const bCount = X.carrier.positions.filter(b => glue.leftMap(b) === m).length;
    const cCount = Y.carrier.positions.filter(c => glue.rightMap(c) === m).length;
    return acc + bCount * cCount;
  }, 0);
}
