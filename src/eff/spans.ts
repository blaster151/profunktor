// Span composition for cartesian-left spans (names-only for demos).  :contentReference[oaicite:1]{index=1}

export interface Span {
  left: { id: string; src: any; dst: any; cartesian: boolean };
  right: { id: string; src: any; dst: any };
}

/** Compose two cartesian-left spans via pullback of the middle object. */
export function composeSpans(X: Span, Y: Span): Span {
  // X: Q ← B → @, Y: @ ← C → A
  // Result: Q ← PB(r1,l2) → A where PB(r1,l2) is the pullback of X.right and Y.left
  const PBname = `PB(${X.right.id},${Y.left.id})`;
  return {
    left: { id: "comp_l", src: X.left.src, dst: { name: PBname }, cartesian: true },
    right: { id: "comp_r", src: { name: PBname }, dst: Y.right.dst }
  };
}
