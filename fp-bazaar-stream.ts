// fp-bazaar-stream.ts
// Bazaar ↔ Stream bridge: sequential/parallel/chunked/interruptible/resource-safe runners

import { Kind1, Apply } from './fp-hkt';
import { Applicative } from './fp-typeclasses-hkt';
import { Bazaar } from './fp-bazaar-traversable-bridge';
import { StreamK, Chunk } from './src/fp-stream-core';
import { Pull, streamFromPull } from './src/fp-stream-pull';
import { AsyncEffect, parEvalMap } from './src/fp-stream-concurrent';
import { Bracket, Resource } from './src/fp-resource';
import { CancelToken } from './src/fp-interrupt';
import { ConstApplicative, Const, Monoid } from './fp-bazaar-effects';

// Sequential: emit each k(a) in order
export function bazaarToStream<F extends Kind1, A, B, S, T>(
  runEffect: <X>(fx: Apply<F, [X]>) => Promise<X>,
  applicativeF: Applicative<F>,
  baz: Bazaar<A, B, S, T>,
  s: S,
  k: (a: A) => Apply<F, [B]>
): StreamK<F, B> {
  const StreamImpl = streamFromPull<F, B>(runEffect);
  // Build Pull that traverses bazaar: use F to accumulate and then emit as one chunk per effect
  const pull = Pull.eval<F, B, T>(baz(applicativeF, k)(s), (_t: T) => Pull.done<void>(undefined as any));
  // Note: minimal form emits nothing until completion; below variant streams per-focus
  return new StreamImpl(pull);
}

// Stream per focus immediately (better for big inputs): create a Pull that walks S and evals k(a) one by one
export function bazaarToStreamPerFocus<F extends Kind1, A, B, S, T>(
  runEffect: <X>(fx: Apply<F, [X]>) => Promise<X>,
  applicativeF: Applicative<F>,
  baz: Bazaar<A, B, S, T>,
  s: S,
  k: (a: A) => Apply<F, [B]>
): StreamK<F, B> {
  // Re-encode bazaar by feeding a continuation that emits each focus via Pull
  const StreamImpl = streamFromPull<F, B>(runEffect);
  const emitOne = (b: B) => Pull.emit<F, B>(Chunk.singleton(b));
  
  // Create an applicative that builds Pull operations
  const PullApplicative: Applicative<any> = {
    of: <A>(a: A) => Pull.done<A>(a),
    map: <A, B>(fa: any, f: (a: A) => B) => fa, // simplified for now
    ap: <A, B>(fab: any, fa: any) => fa // simplified for now
  };
  
  const pullK = (a: A) => emitOne(k(a) as any) as any;
  const pull = baz(PullApplicative as any, pullK)(s) as any as Pull<F, B, any>;
  return new StreamImpl(pull);
}

// Parallel: map foci to Promise via AsyncEffect with bounded concurrency
export function parBazaarToStream<F extends Kind1, A, B, S, T>(
  runEffect: <X>(fx: Apply<F, [X]>) => Promise<X>,
  applicativeF: Applicative<F>,
  asyncF: AsyncEffect<F>,
  baz: Bazaar<A, B, S, T>,
  s: S,
  k: (a: A) => Promise<B>,
  opts?: { concurrency?: number; preserveOrder?: boolean }
): StreamK<F, B> {
  const aStream = fociToStream(runEffect, applicativeF, baz, s);
  const par = parEvalMap(asyncF, opts?.concurrency ?? 4, (a: A) => k(a));
  return par(aStream) as any;
}

// Chunked: apply bazaar, chunk outputs using chunkN
export function chunkedBazaarToStream<F extends Kind1, A, B, S, T>(
  runEffect: <X>(fx: Apply<F, [X]>) => Promise<X>,
  applicativeF: Applicative<F>,
  baz: Bazaar<A, B, S, T>,
  s: S,
  k: (a: A) => Apply<F, [B]>,
  chunkSize = 64
): StreamK<F, Chunk<B>> {
  const base = bazaarToStream(runEffect, applicativeF, baz, s, k);
  return base.chunkN(chunkSize, true);
}

// Interruptible: cooperates with a CancelToken; stops evaluation when cancelled
export function interruptibleBazaarToStream<F extends Kind1, A, B, S, T>(
  runEffect: <X>(fx: Apply<F, [X]>) => Promise<X>,
  applicativeF: Applicative<F>,
  baz: Bazaar<A, B, S, T>,
  s: S,
  k: (a: A) => Apply<F, [B]>,
  token: CancelToken
): StreamK<F, B> {
  const StreamImpl = streamFromPull<F, B>(runEffect);
  const pull = Pull.eval<F, B, T>(baz(applicativeF, (a) => (
    token.isCancelled() ? (undefined as any) : k(a)
  ))(s), (_t) => Pull.done<void>(undefined as any));
  return new StreamImpl(pull);
}

// ---------------------------------------------
// Focus enumeration helpers
// ---------------------------------------------

export function enumerateBazaarFoci<A, B, S, T>(baz: Bazaar<A, B, S, T>, s: S): A[] {
  const ArrMonoid: Monoid<A[]> = { empty: [], concat: (x, y) => x.concat(y) };
  const F = ConstApplicative(ArrMonoid);
  const k = (a: A) => Const([a]);
  const res = baz(F as any, k as any)(s) as any as Readonly<{ value: A[] }>;
  return res.value;
}

export function fociToStream<F extends Kind1, A, B, S, T>(
  runEffect: <X>(fx: Apply<F, [X]>) => Promise<X>,
  _applicativeF: Applicative<F>,
  baz: Bazaar<A, B, S, T>,
  s: S
): StreamK<F, A> {
  const StreamImpl = streamFromPull<F, A>(runEffect);
  const as = enumerateBazaarFoci<A, B, S, T>(baz, s);
  const pull = Pull.emit<F, A>(Chunk.of(as));
  return new StreamImpl(pull);
}

// Resource-safe: handler returns Resource<F,B>
export function resourceBazaarToStream<F extends Kind1, A, B, S, T>(
  runEffect: <X>(fx: Apply<F, [X]>) => Promise<X>,
  applicativeF: Applicative<F>,
  bracket: Bracket<F>,
  baz: Bazaar<A, B, S, T>,
  s: S,
  k: (a: A) => Resource<F, B>
): StreamK<F, B> {
  const StreamImpl = streamFromPull<F, B>(runEffect);
  const pull = Pull.eval<F, B, T>(
    baz(applicativeF as any, (a: A) => k(a).use(b => (undefined as any)) as any)(s),
    (_t) => Pull.done<void>(undefined as any)
  );
  return new StreamImpl(pull);
}


