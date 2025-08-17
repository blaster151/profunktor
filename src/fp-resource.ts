// fp-resource.ts
import { Kind1, Apply } from '../fp-hkt';

export interface Bracket<F extends Kind1> {
  bracket<A, B>(
    acquire: Apply<F, [A]>,
    use: (a: A) => Apply<F, [B]>,
    release: (a: A) => Apply<F, [void]>
  ): Apply<F, [B]>;
}

export interface Resource<F extends Kind1, A> {
  use<B>(k: (a: A) => Apply<F, [B]>): Apply<F, [B]>;
}

export function makeResource<F extends Kind1, A>(
  F: Bracket<F>,
  acquire: Apply<F, [A]>,
  release: (a: A) => Apply<F, [void]>
): Resource<F, A> {
  return {
    use: <B>(k: (a: A) => Apply<F, [B]>) =>
      F.bracket(acquire, k, release)
  };
}
