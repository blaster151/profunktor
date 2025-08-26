// src/logic/partial-maps.ts
// Partial map as a span with mono domain (constructive "subset = mono" view).
// Matches the remark & model semantics where function symbols denote partial maps. [pp. 7–9]

export interface Mono<A> { tag: "mono"; incl: (x: A) => A } // placeholder for injective leg

export interface Span<A, B, D> {
  dom: Mono<A>;        // d_f : D → A, assumed mono
  mediates: (d: D) => { a: A; b: B }; // 〈r1, r2〉
}

export interface PMap<A, B, D> extends Span<A, B, D> { } // f : A ⇁ B

export function compose<A, B, C, D1, D2>(
  f: PMap<A, B, D1>,
  g: PMap<B, C, D2>
): PMap<A, C, [D1, D2]> {
  // Pullback-style composition (constructive definition sketched on p. 321)
  return {
    dom: f.dom,
    mediates: (pair: [D1, D2]) => {
      const { a } = f.mediates(pair[0]);
      const mid = f.mediates(pair[0]).b;
      const end = g.mediates(pair[1]).b;
      return { a, b: end };
    }
  };
}
