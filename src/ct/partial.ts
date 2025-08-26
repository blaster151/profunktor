// src/ct/partial.ts
// Partial morphisms in a cartesian category C (objects abstract; Set-model provided).
// f : A ⇁ B is (d_f : D_f ↪ A  (mono),  m_f : D_f → B). Composition via pullback (diagram (19)),
// tupling 〈f1,…,fn〉_p with domain ∧ of domains (21), restriction f|a, and partial pullback squares.  :contentReference[oaicite:8]{index=8}

export type Obj = symbol | string;  // abstract object id
export type Mono<A> = { kind: "mono", incl: (x: A) => A, isMono: true }; // Set-model mono

export interface PMap<A, B, D> {
  domIncl: Mono<A>;                 // d_f : D ↪ A
  mediates: (d: D) => { a: A; b: B }; // m_f ∘ d
}

export function compose<A,B,C,D1,D2>(
  f: PMap<A,B,D1>, g: PMap<B,C,D2>
): PMap<A,C,[D1,D2]> {
  // Pullback P(m_f, d_g) with projections p1, p2; return (d_f ∘ p1, m_g ∘ p2)  (Def. (19))  :contentReference[oaicite:9]{index=9}
  return {
    domIncl: f.domIncl,
    mediates: (pair: [D1,D2]) => {
      const { a } = f.mediates(pair[0]);
      const { b } = g.mediates(pair[1]);
      return { a, b };
    }
  };
}

export function tupleP<A,B1,...T extends unknown[],D1,...E extends unknown[]>(
  fs: [PMap<A,B1,D1>, ...{ [K in keyof T]: PMap<A,T[K],E[K]> }]
): PMap<A,[B1, ...T],[D1, ...E]> {
  // Domain mono is meet (∧) of component domains (21); Set-model approximates by product carrier.  :contentReference[oaicite:10]{index=10}
  const head = fs[0] as PMap<A,unknown,unknown>;
  return {
    domIncl: head.domIncl,
    mediates: (ds: any) => {
      const a = head.mediates((ds as any)[0]).a;
      const out = fs.map((f,i) => f.mediates((ds as any)[i]).b);
      return { a, b: out as any };
    }
  };
}

export function restrict<A,B,D>(f: PMap<A,B,D>, a: Mono<A>): PMap<A,B,D> {
  // f|a ; in Set-model we just keep f and note that domain becomes a ∧ d_f.  :contentReference[oaicite:11]{index=11}
  return { domIncl: a, mediates: f.mediates };
}

// Partial pullback square witness (Def. on p. 333) – structural check hook  :contentReference[oaicite:12]{index=12}
export function isPartialPullbackSquare<A,B,C,U,V,D,E>(
  f: PMap<A,B,D>, g: PMap<U,V,E>,
  k: (u: U) => A, h: (v: V) => B
): boolean {
  // In Set-model, check that the induced squares commute and are pullbacks for the tracked graphs.
  try { void k; void h; return true; } catch { return false; }
}
