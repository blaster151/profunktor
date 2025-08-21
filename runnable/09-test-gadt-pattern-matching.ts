#!/usr/bin/env tsx

// Minimal test of our GADT pattern matching implementation
// without dependencies that might cause issues

type ListGADT<A> =
  | { tag: 'Nil'; payload: {} }
  | { tag: 'Cons'; payload: { head: A; tail: any[] } };

type MapGADT<K, V> =
  | { tag: 'Empty'; payload: {} }
  | { tag: 'NonEmpty'; payload: { key: K; value: V; rest: any } };

// Simple pmatch implementation for testing
function pmatch<T, R>(value: T) {
  const cases = new Map<string, Function>();
  
  return {
    with<Tag extends string>(tag: Tag, handler: Function) {
      cases.set(tag, handler);
      return this;
    },
    exhaustive(): R {
      const gadt = value as any;
      const handler = cases.get(gadt.tag);
      if (!handler) {
        throw new Error(`Unhandled case: ${gadt.tag}`);
      }
      return handler(gadt.payload);
    }
  };
}

// Test our pattern matching style
function pmatchList<A, R>(value: ListGADT<A>) {
  return pmatch<ListGADT<A>, R>(value);
}

function pmatchMap<K, V, R>(value: MapGADT<K, V>) {
  return pmatch<MapGADT<K, V>, R>(value);
}

// Type guards
function isNil<A>(g: ListGADT<A>): g is { tag: 'Nil'; payload: {} } {
  return g.tag === 'Nil';
}

function isCons<A>(g: ListGADT<A>): g is { tag: 'Cons'; payload: { head: A; tail: any[] } } {
  return g.tag === 'Cons';
}

function isEmptyMap<K,V>(g: MapGADT<K,V>): g is { tag: 'Empty'; payload: {} } {
  return g.tag === 'Empty';
}

function isNonEmptyMap<K,V>(g: MapGADT<K,V>): g is { tag: 'NonEmpty'; payload: { key: K; value: V; rest: any } } {
  return g.tag === 'NonEmpty';
}

// Test cases
function testList(): boolean {
  const g: ListGADT<number> = { tag: 'Cons', payload: { head: 42, tail: [] } };
  
  const result = pmatchList<number, string>(g)
    .with('Nil', () => 'empty')
    .with('Cons', ({ head }) => `head is ${head}`)
    .exhaustive();
  
  const isConsTest = isCons(g) && g.payload.head === 42;
  const isNotNil = !isNil(g);
  
  return result === 'head is 42' && isConsTest && isNotNil;
}

function testMap(): boolean {
  const g: MapGADT<string, number> = { tag: 'NonEmpty', payload: { key: 'test', value: 123, rest: {} } };
  
  const result = pmatchMap<string, number, number>(g)
    .with('Empty', () => 0)
    .with('NonEmpty', ({ value }) => value * 2)
    .exhaustive();
  
  const isNonEmptyTest = isNonEmptyMap(g) && g.payload.value === 123;
  const isNotEmpty = !isEmptyMap(g);
  
  return result === 246 && isNonEmptyTest && isNotEmpty;
}

// Run tests
try {
  const listOk = testList();
  const mapOk = testMap();
  const allOk = listOk && mapOk;
  
  console.log('List test:', listOk ? 'PASS' : 'FAIL');
  console.log('Map test:', mapOk ? 'PASS' : 'FAIL');
  console.log('Overall:', allOk ? 'OK' : 'FAIL');
} catch (error) {
  console.log('ERROR:', error);
  console.log('FAIL');
}
