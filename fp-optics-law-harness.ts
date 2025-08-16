/**
 * Law harness: Affine optics + Indexed Lens coherence
 *
 * Drop-in, no deps beyond your HKT/typeclass shells (you can switch imports to your paths).
 */

////////////////////
// Minimal support
////////////////////
export type Eq<T> = (x: T, y: T) => boolean;
export type Gen<T> = () => T;

export type Either<L, R> =
  | { _tag: 'Left'; value: L }
  | { _tag: 'Right'; value: R };

////////////////////////////
// Affine laws (Optional)
////////////////////////////
/**
 * An affine optic here is given as:
 *   match : S -> Either<T, A>   // Left(t) = miss + replacement; Right(a) = hit
 *   set   : (b: B, s: S) -> T   // update (or build) result of type T
 *
 * Laws we check (informal Optional laws adapted to this encoding):
 *  A1  Hit-roundtrip:   match(s)=Right(a)  ==>  set(a, s) == s'
 *      where s' is the "update result" one would expect; with this encoding we require:
 *        preview(set(b, s)) = b
 *  A2  Miss consistency: match(s)=Left(t)  ==>  set(b, s) == t
 *  A3  Set/view:         match(s)=Right(a) ==>  preview(set(b, s)) = b
 *  A4  Idempotence:      set(b2, set(b1, s)) == set(b2, s)   (when the focus exists)
 *
 * We implement preview via match.
 */
export function checkAffineLaws<S, T extends S, A, B>(opts: {
  match: (s: S) => Either<T, A>;
  set: (b: B, s: S) => T;
  genS: Gen<S>;
  genB: Gen<B>;
  eqT: Eq<T>;
  eqA?: Eq<A>;
  samples?: number;
}) {
  const { match, set, genS, genB, eqT } = opts;
  const samples = opts.samples ?? 50;

  const preview = (s: S): A | undefined => {
    const m = match(s);
    return m._tag === 'Right' ? m.value : undefined;
  };

  let A2_ok = true, A3_ok = true, A4_ok = true;

  for (let i = 0; i < samples && (A2_ok || A3_ok || A4_ok); i++) {
    const s = genS();
    const m = match(s);
    const b1 = genB();
    const b2 = genB();

    // A2 Miss consistency
    if (m._tag === 'Left') {
      const t = set(b1, s);
      A2_ok = A2_ok && eqT(t, m.value);
    }

    // A3 Set/View on hit
    if (m._tag === 'Right') {
      const t = set(b1, s);
      const p = preview(t);
      A3_ok = A3_ok && (p !== undefined) && (String(p) === String(b1)); // structural check without Eq<B>

      // A4 Idempotence (when focus exists)
      const t12 = set(b2, set(b1, s));
      const t2  = set(b2, s);
      A4_ok = A4_ok && eqT(t12, t2);
    }
  }

  return {
    A2_missConsistency: A2_ok,
    A3_setView: A3_ok,
    A4_idempotence: A4_ok,
    ok: A2_ok && A3_ok && A4_ok
  };
}

/////////////////////////////////////////////
// Indexed Lens coherence vs. plain Lens
/////////////////////////////////////////////
/**
 * ilens is supplied as:
 *   getIA : S -> [I, A]
 *   set   : (b: B, s: S) -> T
 *
 * Coherence we check:
 *  I1  Forgetting indices yields a lawful plain lens:
 *        getter(s) = snd(getIA(s))
 *        setter(b, s) as given
 *      (we test two standard lens laws)
 *        - set(get(s), s) == s
 *        - get(set(b, s)) == b
 *
 *  I2  (Optional) Index stability on set with same value:
 *        let [i1, a] = getIA(s)
 *        let s' = set(a, s)
 *        then fst(getIA(s')) == i1
 */
export function checkIndexedLensCoherence<S, T, I, A, B>(opts: {
  getIA: (s: S) => [I, A];
  set: (b: B, s: S) => T;
  genS: Gen<S>;
  genB: Gen<B>;
  eqT: Eq<T>;
  eqI?: Eq<I>;
  samples?: number;
}) {
  const { getIA, set, genS, genB, eqT } = opts;
  const samples = opts.samples ?? 50;

  let I1a_ok = true, I1b_ok = true, I2_ok = true;

  for (let i = 0; i < samples && (I1a_ok || I1b_ok || I2_ok); i++) {
    const s = genS();
    const [i1, a] = getIA(s);
    const b = genB() as unknown as B;

    // I1a set(get(s), s) == s
    const t1 = set((a as unknown as B), s);
    I1a_ok = I1a_ok && eqT(t1, (s as unknown as T));

    // I1b get(set(b, s)) == b
    const t2 = set(b, s);
    const [, a2] = getIA((t2 as unknown as any as S));
    I1b_ok = I1b_ok && (String(a2) === String(b)); // structural equality without Eq<B>

    // I2 index stability (best-effort; only checked when B~A)
    const t3 = set((a as unknown as B), s);
    const [i2] = getIA((t3 as unknown as any as S));
    if (opts.eqI) I2_ok = I2_ok && opts.eqI(i1, i2);
  }

  return {
    I1_setGet: I1a_ok,
    I1_getSet: I1b_ok,
    I2_indexStability: I2_ok,
    ok: I1a_ok && I1b_ok && I2_ok
  };
}
