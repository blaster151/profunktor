export function monadFromAdjunction<L extends Kind1, R extends Kind1>(
  A: Adjunction<L, R>,
  Lf: Functor<L>,
  Rf: Functor<R>
): { effectTag: EffectTag; usageBound: UsageBound; monad: Monad<ComposeK<R, L>> } {
  type T<A> = Apply<R, [Apply<L, [A]>]>;
  const of = <A>(a: A): T<A> => A.unit(a);
  const map = <A, B>(ta: T<A>, f: (a: A) => B): T<B> =>
    Rf.map(ta, (la: Apply<L, [A]>) => Lf.map(la, f)) as T<B>;
  const join = <A>(tta: T<T<A>>): T<A> =>
    Rf.map(tta, (l_ta: Apply<L, [T<A>]>) => A.counit<Apply<L, [A]>>(l_ta)) as T<A>;
  const chain = <A, B>(ta: T<A>, k: (a: A) => T<B>): T<B> => join(map(ta, k));
  const ap =  <A, B>(tf: T<(a: A) => B>, ta: T<A>): T<B> => chain(tf, f => map(ta, f));
  return {
    effectTag: A.effectTag,
    usageBound: A.usageBound,
    monad: {
      map: (fa, f) => map(fa as any, f) as any,
      of:  a => of(a),
      chain: (fa, f) => chain(fa as any, f as any) as any,
      ap: (fab, fa) => ap(fab as any, fa as any) as any
    }
  };
}

export function comonadFromAdjunction<L extends Kind1, R extends Kind1>(
  A: Adjunction<L, R>,
  Lf: Functor<L>,
  Rf: Functor<R>
): { effectTag: EffectTag; usageBound: UsageBound; comonad: Comonad<ComposeK<L, R>> } {
  type U<A> = Apply<L, [Apply<R, [A]>]>;
  const extract = <A>(ura: U<A>): A => A.counit(ura);
  const map = <A, B>(ua: U<A>, f: (a: A) => B): U<B> =>
    Lf.map(ua, (ra: Apply<R, [A]>) => Rf.map(ra, f)) as U<B>;
  const duplicate = <A>(ua: U<A>): U<U<A>> =>
    Lf.map(ua, (ra: Apply<R, [A]>) => A.unit<Apply<R, [A]>>(ra)) as U<U<A>>;
  const extend = <A, B>(ua: U<A>, f: (wa: U<A>) => B): U<B> => map(duplicate(ua), f);
  return {
    effectTag: A.effectTag,
    usageBound: A.usageBound,
    comonad: {
      map: (fa, f) => map(fa as any, f) as any,
      extract: (fa) => extract(fa as any),
      extend: (fa, f) => extend(fa as any, f as any) as any
    }
  };
}
// Comonad interface (restored for compatibility)
export interface Comonad<F extends Kind1> extends Functor<F> {
  extract<A>(fa: Apply<F, [A]>): A;
  extend<A, B>(fa: Apply<F, [A]>, f: (wa: Apply<F, [A]>) => B): Apply<F, [B]>;
}

import { Kind1, Apply } from './fp-hkt';
import { Functor, Monad } from './fp-typeclasses-hkt';
import { NaturalTransformation, joinEffectTag, multiplyUsage, EffectTag, UsageBound } from './fp-nat';

// Type alias for deeply nested LR<LR<A>>
type LRLR<L extends Kind1, R extends Kind1, A> = Apply<L, [Apply<R, [Apply<L, [Apply<R, [A]>]>]>]>;

// Identity functor wrapper (for signatures)
export interface IdK extends Kind1 { readonly type: this['arg0']; }

export interface ComposeK<F extends Kind1, G extends Kind1> extends Kind1 {
  readonly type: Apply<F, [Apply<G, [this['arg0']]>]>;
}

export interface Adjunction<L extends Kind1, R extends Kind1> {
  readonly left: L;
  readonly right: R;
  readonly effectTag: EffectTag;
  readonly usageBound: UsageBound;
  // unit η: Id ~> R∘L
  unit<A>(a: A): Apply<R, [Apply<L, [A]>]>;
  // counit ε: L∘R ~> Id
  counit<A>(lra: Apply<L, [Apply<R, [A]>]>): A;
}

export function lambda_UT<L extends Kind1, R extends Kind1>(
  A: Adjunction<L, R>,
  Lf: Functor<L>,
  Rf: Functor<R>
): NaturalTransformation<
  ComposeK<ComposeK<L, R>, ComposeK<R, L>>,
  ComposeK<ComposeK<R, L>, ComposeK<L, R>>
> {
  const eta = etaNat(A); // Id ~> R∘L
  const eps = epsNat(A); // L∘R ~> Id

  return {
    effectTag: joinEffectTag(eta.effectTag, eps.effectTag),
    usageBound: multiplyUsage(eta.usageBound, eps.usageBound),
    run<A0>(lrrla: Apply<ComposeK<ComposeK<L, R>, ComposeK<R, L>>, [A0]>) {
      // Keep TS happy with explicit stages and casts; this is the usual “slide past”:
      const step1 = Lf.map(lrrla as any, (rra: any) =>
        Rf.map(rra, (ra: any) => Rf.map(ra, (x: any) => eta.run(x)))
      );
      const step2 = Lf.map(step1 as any, (rrx: any) =>
        Rf.map(rrx, (rx: any) => eps.run(Lf.map(rx, (x: any) => x)))
      );
      return step2 as Apply<ComposeK<ComposeK<R, L>, ComposeK<L, R>>, [A0]>;
    }
  };
}





// Triangle identity checks (sample-based)
export type Gen<T> = () => T;
export type Eq<T> = (a: T, b: T) => boolean;

export function checkTriangles<L extends Kind1, R extends Kind1, X, Y>(
  A: Adjunction<L, R>,
  Lf: Functor<L>,
  Rf: Functor<R>,
  genLX: Gen<Apply<L, [X]>>, eqLX: Eq<Apply<L, [X]>>,
  genRY: Gen<Apply<R, [Y]>>, eqRY: Eq<Apply<R, [Y]>>,
  samples = 50
): boolean {
  // Triangle 1: ε_{L X} ∘ L(η_X) = id_{L X}
  let t1ok = true;
  for (let i = 0; i < samples && t1ok; i++) {
    const lx = genLX();
    const l_eta = Lf.map(lx, (x: any) => A.unit(x)); // L(η_X): L X -> L R L X
    const left = A.counit(l_eta as any) as Apply<L, [X]>; // ε_{L X}: L R L X -> L X
    t1ok = eqLX(left, lx);
  }
  // Triangle 2: R(ε_Y) ∘ η_{R Y} = id_{R Y}
  let t2ok = true;
  for (let i = 0; i < samples && t2ok; i++) {
    const ry = genRY();

    // Triangle 2
    const etaRY = A.unit<Apply<R, [Y]>>(ry) as Apply<R, [Apply<L, [Apply<R, [Y]>]>]>;
    const left  = Rf.map(etaRY, (lry: any) => A.counit<Y>(lry)) as Apply<R, [Y]>;

    t2ok = eqRY(left, ry);
  }
  return t1ok && t2ok;
}

// ---------- Natural transformation utilities --------------------------------

export function composeNat<F extends Kind1, G extends Kind1, H extends Kind1>(
  fg: NaturalTransformation<F, G>,
  gh: NaturalTransformation<G, H>
): NaturalTransformation<F, H> {
  return {
    effectTag: joinEffectTag(fg.effectTag, gh.effectTag),
    usageBound: multiplyUsage(fg.usageBound, gh.usageBound),
    run<A>(fa: Apply<F, [A]>): Apply<H, [A]> {
      return gh.run(fg.run(fa));
    }
  };
}

/** Right whiskering: H ∘ (F ~> G) = (H∘F ~> H∘G) */
export function rightWhisker<F extends Kind1, G extends Kind1, H extends Kind1>(
  Hf: Functor<H>,
  nt: NaturalTransformation<F, G>
): NaturalTransformation<ComposeK<H, F>, ComposeK<H, G>> {
  return {
    effectTag: nt.effectTag,
    usageBound: nt.usageBound,
    run<A>(hfa: Apply<ComposeK<H, F>, [A]>): Apply<ComposeK<H, G>, [A]> {
      // hfa : H(F(A))  →  H(G(A)) by mapping nt.run inside H
      return Hf.map(hfa, (fa: Apply<F, [A]>) => nt.run(fa)) as Apply<ComposeK<H, G>, [A]>;
    }
  };
}

/** Left whiskering: (F ~> G) ∘ H = (F∘H ~> G∘H) */
export function leftWhisker<F extends Kind1, G extends Kind1, H extends Kind1>(
  _Hf: Functor<H>, // not needed for implementation; kept for symmetry/API
  nt: NaturalTransformation<F, G>
): NaturalTransformation<ComposeK<F, H>, ComposeK<G, H>> {
  return {
    effectTag: nt.effectTag,
    usageBound: nt.usageBound,
    run<A>(fha: Apply<ComposeK<F, H>, [A]>): Apply<ComposeK<G, H>, [A]> {
      // By your ComposeK definition, FHA = F(H(A)), so nt.run applies directly,
      // yielding G(H(A)) which aliases to ComposeK<G,H> applied to A.
      return nt.run(fha as unknown as Apply<F, [Apply<H, [A]>]>) as Apply<ComposeK<G, H>, [A]>;
    }
  };
}

// ---------- η / ε as natural transformations --------------------------------

/** η : Id ~> R∘L */
export function etaNat<L extends Kind1, R extends Kind1>(
  A: Adjunction<L, R>
): NaturalTransformation<IdK, ComposeK<R, L>> {
  return {
    effectTag: A.effectTag,
    usageBound: A.usageBound,
    run<A>(a: A): Apply<ComposeK<R, L>, [A]> {
      return A.unit(a) as Apply<ComposeK<R, L>, [A]>;
    }
  };
}

/** ε : L∘R ~> Id */
export function epsNat<L extends Kind1, R extends Kind1>(
  A: Adjunction<L, R>
): NaturalTransformation<ComposeK<L, R>, IdK> {
  return {
    effectTag: A.effectTag,
    usageBound: A.usageBound,
    run<A>(lra: Apply<ComposeK<L, R>, [A]>): A {
      // lra : L(R(A))
      return A.counit(lra as Apply<L, [Apply<R, [A]>]>);
    }
  };
}

// ---------- μ and δ derived from the adjunction ------------------------------

/** μ_T : (R∘L)∘(R∘L) ~> (R∘L)  defined as  R ∘ ε ∘ L */
export function muFromAdjunction<L extends Kind1, R extends Kind1>(
  A: Adjunction<L, R>,
  Lf: Functor<L>,
  Rf: Functor<R>
): NaturalTransformation<ComposeK<ComposeK<R, L>, ComposeK<R, L>>, ComposeK<R, L>> {
  const eps   = epsNat(A); // ε : L∘R ~> Id
  const R_eps = rightWhisker<R, ComposeK<L, R>, IdK>(Rf, eps); // R∘(L∘R) ~> R

  // Reassociate with a harmless cast so TS accepts the shapes:
  const mu = leftWhisker<ComposeK<R, ComposeK<L, R>>, IdK, L>(Lf, R_eps) as unknown as NaturalTransformation<
    ComposeK<ComposeK<R, L>, ComposeK<R, L>>,
    ComposeK<R, L>
  >;

  return { effectTag: mu.effectTag, usageBound: mu.usageBound, run: mu.run };
}

// Neutral annotations; adapt if your fp-nat exposes a “Pure”/neutral explicitly
const NEUTRAL_EFFECT = (undefined as unknown as EffectTag);
const NEUTRAL_USAGE  = (1 as unknown as UsageBound);

export function assocRtoL<F extends Kind1, G extends Kind1, H extends Kind1>():
  NaturalTransformation<ComposeK<F, ComposeK<G, H>>, ComposeK<ComposeK<F, G>, H>> {
  return {
    effectTag: NEUTRAL_EFFECT,
    usageBound: NEUTRAL_USAGE,
    run: x => x as any
  };
}

export function assocLtoR<F extends Kind1, G extends Kind1, H extends Kind1>():
  NaturalTransformation<ComposeK<ComposeK<F, G>, H>, ComposeK<F, ComposeK<G, H>>> {
  return {
    effectTag: NEUTRAL_EFFECT,
    usageBound: NEUTRAL_USAGE,
    run: x => x as any
  };
}

/** δ_U : L∘R ~> (L∘R)∘(L∘R)  defined as  L ∘ η ∘ R */
export function deltaFromAdjunction<L extends Kind1, R extends Kind1>(
  A: Adjunction<L, R>,
  Lf: Functor<L>,
  Rf: Functor<R>
): NaturalTransformation<ComposeK<L, R>, ComposeK<ComposeK<L, R>, ComposeK<L, R>>> {
  const eta   = etaNat(A);                                   // Id ~> R∘L
  const L_eta = leftWhisker<IdK, ComposeK<R, L>, L>(Lf, eta); // L ~> L∘R∘L

  // Reassociate codomain: L∘(R∘L)  ==>  (L∘R)∘L
  const a1 = assocRtoL<L, R, L>();

  // Right-whisker by R:  ( (L∘R)∘L )∘R  ≅  (L∘R)∘(L∘R)
  const L_eta_reassoc: NaturalTransformation<L, ComposeK<ComposeK<L, R>, L>> =
    composeNat(L_eta, a1);

  const whisk: NaturalTransformation<
    ComposeK<L, R>,
    ComposeK<ComposeK<L, R>, ComposeK<L, R>>
  > = composeNat(
    rightWhisker<ComposeK<L, R>, L, R>(Rf as any, L_eta_reassoc as any),
    assocRtoL<ComposeK<L, R>, L, R>() // reassociate at the end
  );

  return {
    effectTag: whisk.effectTag,
    usageBound: whisk.usageBound,
    run: whisk.run
  };
}

// ---------- Optional: enriched constructors exposing η/ε/μ/δ -----------------

function composeAnnotations(
  base: { effectTag: EffectTag; usageBound: UsageBound },
  more?: { effectTag?: EffectTag; usageBound?: UsageBound }
) {
  const effectTag  = more?.effectTag  ? joinEffectTag(base.effectTag,  more.effectTag)  : base.effectTag;
  const usageBound = more?.usageBound ? multiplyUsage(base.usageBound, more.usageBound) : base.usageBound;
  return { effectTag, usageBound };
}

export function enrichedMonadFromAdjunction<L extends Kind1, R extends Kind1>(
  A: Adjunction<L, R>,
  Lf: Functor<L>,
  Rf: Functor<R>,
  composedHints?: { effectTag?: EffectTag; usageBound?: UsageBound }
) {
  type RL<A> = Apply<R, [Apply<L, [A]>]>;

  const eta = etaNat(A);
  const mu  = muFromAdjunction(A, Lf, Rf);
  const ann = composeAnnotations({ effectTag: A.effectTag, usageBound: A.usageBound }, composedHints);

  const of = <A>(a: A): RL<A> => eta.run(a) as RL<A>;
  const map = <A, B>(ta: RL<A>, f: (a: A) => B): RL<B> =>
    Rf.map(ta, (la: Apply<L, [A]>) => Lf.map(la, f)) as RL<B>;
  const join = <A>(tta: RL<RL<A>>): RL<A> => mu.run(tta as Apply<ComposeK<ComposeK<R, L>, ComposeK<R, L>>, [A]>) as RL<A>;
  const chain = <A, B>(ta: RL<A>, k: (a: A) => RL<B>): RL<B> => join(map(ta, k));
  const ap = <A, B>(tf: RL<(a: A) => B>, ta: RL<A>): RL<B> => chain(tf, f => map(ta, f));

  return {
    effectTag: ann.effectTag,
    usageBound: ann.usageBound,
    eta,  // Id ~> R∘L
    mu,   // (R∘L)² ~> R∘L
    monad: { of, map, chain, ap }
  };
}

export function enrichedComonadFromAdjunction<L extends Kind1, R extends Kind1>(
  A: Adjunction<L, R>,
  Lf: Functor<L>,
  Rf: Functor<R>,
  composedHints?: { effectTag?: EffectTag; usageBound?: UsageBound }
) {
  type LR<A> = Apply<L, [Apply<R, [A]>]>;

  const eps   = epsNat(A);
  const delta = deltaFromAdjunction(A, Lf, Rf);
  const ann = composeAnnotations({ effectTag: A.effectTag, usageBound: A.usageBound }, composedHints);

  const extract = <A>(ura: LR<A>): A => eps.run(ura);
  const map = <A, B>(ua: LR<A>, f: (a: A) => B): LR<B> =>
    Lf.map(ua, (ra: Apply<R, [A]>) => Rf.map(ra, f)) as LR<B>;
  const duplicate = <A>(ua: LR<A>): LRLR<L, R, A> =>
    delta.run(ua) as LRLR<L, R, A>; // aliases to LR<LR<A>>
  const extend = <A, B>(ua: LR<A>, f: (wa: LR<A>) => B): LR<B> => map(duplicate(ua), f);

  return {
    effectTag: ann.effectTag,
    usageBound: ann.usageBound,
    eps,     // L∘R ~> Id
    delta,   // L∘R ~> (L∘R)²
    comonad: { map, extract, extend }
  };
}
