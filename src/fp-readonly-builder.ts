/**
 * Fluent Pattern-Matching Builder for Readonly Collections
 * 
 * Provides a generic builder core that supports:
 * - .with(caseName, handler)
 * - .partial() → returns R | undefined
 * - .exhaustive() → produces a total function C → R that throws on missing cases
 * - .toFunction() → same as exhaustive() (alias)
 */

import { PersistentList, PersistentMap, PersistentSet } from '../fp-persistent';
import { Immutable } from '../fp-immutable';

// ---- Generic Builder Core ----

type CaseTable<Cases> = Map<keyof Cases & string, Function>;

export type BuilderState<C, Cases, R> = {
  cases: CaseTable<Cases>;
  // discriminator projects the concrete value C into a tagged case + args
  discriminate: (value: C) => { tag: keyof Cases & string; args: unknown[] } | undefined;
  expectedTags: ReadonlyArray<keyof Cases & string>;
};

export interface MatcherBuilder<C, Cases, R> {
  with<K extends keyof Cases & string>(
    tag: K,
    handler: Cases[K]
  ): MatcherBuilder<C, Cases, R>;

  /** Invoke the registered handler for a value if present */
  partial(value: C): R | undefined;

  /** Produce a total function C -> R; throws if a case is missing at call time */
  exhaustive(): (value: C) => R;

  /** Alias of exhaustive() */
  toFunction(): (value: C) => R;
}

function createBuilder<C, Cases, R>(
  state: BuilderState<C, Cases, R>
): MatcherBuilder<C, Cases, R> {
  const api: MatcherBuilder<C, Cases, R> = {
    with(tag, handler) {
      state.cases.set(tag, handler as unknown as Function);
      return api;
    },
    partial(value) {
      const info = state.discriminate(value);
      if (!info) return undefined;
      const fn = state.cases.get(info.tag);
      return fn ? (fn as any)(...info.args) : undefined;
    },
    exhaustive() {
      // At build-time, we can do a best-effort compile-time check using conditional types.
      // At run-time, verify that all expectedTags are present.
      const missing = state.expectedTags.filter(t => !state.cases.has(t));
      if (missing.length) {
        throw new Error(
          `Unhandled cases: ${missing.join(', ')}`
        );
      }
      return (value: C) => {
        const info = state.discriminate(value);
        if (!info) {
          throw new Error('Discriminator returned undefined.');
        }
        const fn = state.cases.get(info.tag);
        if (!fn) {
          throw new Error(`Unhandled case at call-site: ${info.tag}`);
        }
        return (fn as any)(...info.args);
      };
    },
    toFunction() {
      return api.exhaustive();
    }
  };
  return api;
}

// ---- Populate helper ----

// Narrow keys of a Partial<Cases> at the type level for better intellisense
type PresentKeys<Cases> = keyof Cases & string;

/**
 * Populate a builder from a partial record-of-cases.
 * Only registers handlers that are present in the record.
 * Returns the same builder for fluent chaining.
 */
export function populateFromCases<C, Cases, R>(
  builder: MatcherBuilder<C, Cases, R>,
  record: Partial<Cases>
): MatcherBuilder<C, Cases, R> {
  for (const k in record) {
    const handler = record[k as keyof Cases];
    if (typeof handler === 'function') {
      builder = builder.with(k as PresentKeys<Cases>, handler as any);
    }
  }
  return builder;
}

// ---- Case Sets for Concrete Collections ----

type ArrayCases<T, R> = {
  empty: () => R;
  nonEmpty: (head: T, tail: readonly T[]) => R;
};

type ListCases<T, R> = {
  empty: () => R;
  cons: (head: T, tail: PersistentList<T>) => R;
};

type MapCases<K, V, R> = {
  empty: () => R;
  nonEmpty: (firstKey: K, firstValue: V, rest: PersistentMap<K, V>) => R;
};

type SetCases<T, R> = {
  empty: () => R;
  nonEmpty: (first: T, rest: PersistentSet<T>) => R;
};

// ---- Discriminators ----

function discrArray<T, R>(a: readonly T[]) {
  if (a.length === 0) return { tag: 'empty' as const, args: [] };
  const [h, ...t] = a;
  return { tag: 'nonEmpty' as const, args: [h, t as readonly T[]] };
}

function discrList<T, R>(l: PersistentList<T>) {
  if (l.isEmpty()) return { tag: 'empty' as const, args: [] };
  const h = l.head();
  const t = l.tail();
  // l.head() returns T | undefined, but non-empty guarantees a value
  return { tag: 'cons' as const, args: [h as T, t] };
}

function discrMap<K, V, R>(m: PersistentMap<K, V>) {
  if (m.isEmpty()) return { tag: 'empty' as const, args: [] };
  const entries = Array.from(m.entries()) as [K, V][];
  const firstEntry = entries[0];
  if (firstEntry === undefined) return { tag: 'empty' as const, args: [] };
  const [k, v] = firstEntry;
  const rest = PersistentMap.fromEntries(entries.slice(1));
  return { tag: 'nonEmpty' as const, args: [k, v, rest] };
}

function discrSet<T, R>(s: PersistentSet<T>) {
  if (s.isEmpty()) return { tag: 'empty' as const, args: [] };
  const values = Array.from(s);
  const first = values[0];
  const rest = PersistentSet.fromArray(values.slice(1));
  return { tag: 'nonEmpty' as const, args: [first, rest] };
}

// ---- Builder Factories ----

export function createReadonlyArrayBuilder<T, R>() {
  type Cases = ArrayCases<T, R>;
  const state: BuilderState<readonly T[], Cases, R> = {
    cases: new Map(),
    discriminate: discrArray,
    expectedTags: ['empty', 'nonEmpty'] as const
  };
  return createBuilder<readonly T[], Cases, R>(state);
}

export function createListBuilder<T, R>() {
  type Cases = ListCases<T, R>;
  const state: BuilderState<PersistentList<T>, Cases, R> = {
    cases: new Map(),
    discriminate: discrList,
    expectedTags: ['empty', 'cons'] as const
  };
  return createBuilder<PersistentList<T>, Cases, R>(state);
}

export function createMapBuilder<K, V, R>() {
  type Cases = MapCases<K, V, R>;
  const state: BuilderState<PersistentMap<K, V>, Cases, R> = {
    cases: new Map(),
    discriminate: discrMap,
    expectedTags: ['empty', 'nonEmpty'] as const
  };
  return createBuilder<PersistentMap<K, V>, Cases, R>(state);
}

export function createSetBuilder<T, R>() {
  type Cases = SetCases<T, R>;
  const state: BuilderState<PersistentSet<T>, Cases, R> = {
    cases: new Map(),
    discriminate: discrSet,
    expectedTags: ['empty', 'nonEmpty'] as const
  };
  return createBuilder<PersistentSet<T>, Cases, R>(state);
}

// ---- Derivation Helpers ----

export function fromArrayCases<T, R>(cases: Partial<ArrayCases<T, R>>) {
  // returns a builder you can still add to and call .exhaustive() on later
  return populateFromCases(createReadonlyArrayBuilder<T, R>(), cases);
}

export function fromListCases<T, R>(cases: Partial<ListCases<T, R>>) {
  return populateFromCases(createListBuilder<T, R>(), cases);
}

export function fromMapCases<K, V, R>(cases: Partial<MapCases<K, V, R>>) {
  return populateFromCases(createMapBuilder<K, V, R>(), cases);
}

export function fromSetCases<T, R>(cases: Partial<SetCases<T, R>>) {
  return populateFromCases(createSetBuilder<T, R>(), cases);
}

// ---- Curryable creators (record-of-cases -> function) ----

export function createReadonlyArrayMatcher<T, R>(cases: ArrayCases<T, R>) {
  return createReadonlyArrayBuilder<T, R>()
    .with('empty', cases.empty)
    .with('nonEmpty', cases.nonEmpty)
    .exhaustive();
}

export function createListMatcher<T, R>(cases: ListCases<T, R>) {
  return createListBuilder<T, R>()
    .with('empty', cases.empty)
    .with('cons', cases.cons)
    .exhaustive();
}

export function createMapMatcher<K, V, R>(cases: MapCases<K, V, R>) {
  return createMapBuilder<K, V, R>()
    .with('empty', cases.empty)
    .with('nonEmpty', cases.nonEmpty)
    .exhaustive();
}

export function createSetMatcher<T, R>(cases: SetCases<T, R>) {
  return createSetBuilder<T, R>()
    .with('empty', cases.empty)
    .with('nonEmpty', cases.nonEmpty)
    .exhaustive();
}

// ---- Type Exports for External Use ----

export type { ArrayCases, ListCases, MapCases, SetCases };
