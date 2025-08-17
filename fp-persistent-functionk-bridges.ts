import { Kind1, Kind2, Apply, ArrayK, MaybeK, EitherK } from './fp-hkt';
import { PersistentList, PersistentMap, PersistentSet, PersistentListK, PersistentMapK, PersistentSetK } from './fp-persistent';

// --- Simple natural transformation aliases (avoid name collision with any A->B Function type)
export type Natural<F extends Kind1, G extends Kind1> =
  <A>(fa: Apply<F,[A]>) => Apply<G,[A]>;

export type Natural2to1<F extends Kind2, G extends Kind1> =
  <K,V>(fa: Apply<F,[K,V]>) => Apply<G,[V]>;

export type EntriesArrayK = ArrayK; // Apply<ArrayK, [[K,V]]>

// ---------------------- List ↔ Array
export const arrayToList: Natural<ArrayK, PersistentListK> =
  <A>(fa: Apply<ArrayK,[A]>) =>
    PersistentList.fromArray(fa as A[]) as Apply<PersistentListK,[A]>;

export const listToArray: Natural<PersistentListK, ArrayK> =
  <A>(fa: Apply<PersistentListK,[A]>) => {
    const buf: A[] = [];
    (fa as PersistentList<A>).forEach(a => buf.push(a));
    return buf as Apply<ArrayK,[A]>;
  };

// ---------------------- List ↔ Maybe
export const maybeToList: Natural<MaybeK, PersistentListK> =
  <A>(fa: Apply<MaybeK,[A]>) => {
    const m = fa as { tag: 'Just', value: A } | { tag: 'Nothing' };
    return m.tag === 'Just'
      ? PersistentList.of(m.value) as Apply<PersistentListK,[A]>
      : PersistentList.empty<A>() as Apply<PersistentListK,[A]>;
  };

// Head (left-biased) is a standard natural transformation List → Maybe
export const listToMaybe: Natural<PersistentListK, MaybeK> =
  <A>(fa: Apply<PersistentListK,[A]>) => {
    const it = fa as PersistentList<A>;
    let out: any = { tag: 'Nothing' as const };
    let seen = false;
    it.forEach(a => { if (!seen) { out = { tag: 'Just' as const, value: a }; seen = true; } });
    return out as Apply<MaybeK,[A]>;
  };

// ---------------------- List ↔ Either (Right-biased)
export const eitherToList: Natural<EitherK, PersistentListK> =
  <A>(fa: Apply<EitherK,[unknown, A]>) => {
    const e = fa as { left: unknown } | { right: A };
    return 'right' in e
      ? PersistentList.of(e.right) as Apply<PersistentListK,[A]>
      : PersistentList.empty<A>() as Apply<PersistentListK,[A]>;
  };

// ---------------------- Set ↔ Array/Maybe/Either
export const arrayToSet: Natural<ArrayK, PersistentSetK> =
  <A>(fa: Apply<ArrayK,[A]>) => PersistentSet.fromArray(fa as A[]) as Apply<PersistentSetK,[A]>;

export const setToArray: Natural<PersistentSetK, ArrayK> =
  <A>(fa: Apply<PersistentSetK,[A]>) => {
    const buf: A[] = [];
    (fa as PersistentSet<A>).forEach(a => buf.push(a));
    return buf as Apply<ArrayK,[A]>;
  };

export const maybeToSet: Natural<MaybeK, PersistentSetK> =
  <A>(fa: Apply<MaybeK,[A]>) => {
    const m = fa as { tag: 'Just', value: A } | { tag: 'Nothing' };
    return m.tag === 'Just'
      ? PersistentSet.fromArray([m.value]) as Apply<PersistentSetK,[A]>
      : PersistentSet.empty<A>() as Apply<PersistentSetK,[A]>;
  };

export const eitherToSet: Natural<EitherK, PersistentSetK> =
  <A>(fa: Apply<EitherK,[unknown, A]>) => {
    const e = fa as { left: unknown } | { right: A };
    return 'right' in e
      ? PersistentSet.fromArray([e.right]) as Apply<PersistentSetK,[A]>
      : PersistentSet.empty<A>() as Apply<PersistentSetK,[A]>;
  };

// ---------------------- Map ↔ Array<[K,V]>
export type Entry<K,V> = [K,V];

export const entriesArrayToMap =
  <K,V>(fa: Apply<ArrayK,[Entry<K,V>]>) =>
    PersistentMap.fromEntries(fa as Entry<K,V>[]) as Apply<PersistentMapK,[K,V]>;

export const mapToEntriesArray =
  <K,V>(fa: Apply<PersistentMapK,[K,V]>) => {
    const m = fa as PersistentMap<K,V>;
    const acc: Array<Entry<K,V>> = [];
    m.forEach((v,k) => acc.push([k,v]));
    return acc as Apply<ArrayK,[Entry<K,V>]>;
  };

/**
 * Laws / notes
 * - arrayToList ∘ listToArray ≈ id up to data-structure equality
 * - listToMaybe is head natural transformation: map(f) ∘ head = head ∘ map(f)
 * - maybeToList/Nothing = empty; Just preserves mapped value
 * - eitherToList/Right = singleton; Left = empty
 * - Set bridges ignore element ordering and deduplicate
 * - Map bridges are round-trips via entries order; stable ordering is not guaranteed
 */
