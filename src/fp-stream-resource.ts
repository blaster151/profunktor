// fp-stream-resource.ts
import { Kind1, Apply } from 'fp-hkt';
import { StreamK } from './fp-stream-core';
import { makeResource, Bracket, Resource } from './fp-resource';
import { Pull, streamFromPull } from './fp-stream-pull';
import { Chunk } from './fp-stream-core';

export function resourceAsStream<F extends Kind1, A>(
  F: Bracket<F>,
  runF: <X>(fx: Apply<F, [X]>) => Promise<X>,
  acquire: Apply<F, [A]>,
  release: (a: A) => Apply<F, [void]>
): StreamK<F, A> {
  const R = makeResource(F, acquire, release);
  const pull = Pull.eval<F, A, A>(R.use((a) => (null as any) as Apply<F, [A]>), (a) =>
    Pull.emit<F, A>(Chunk.singleton(a), Pull.done<void>(undefined as any))
  );
  const StreamImpl = streamFromPull<F, A>(runF);
  return new StreamImpl(pull);
}
