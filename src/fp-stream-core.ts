// fp-stream-core.ts
import { Kind1, Apply } from '../fp-hkt';

export interface Chunk<A> {
  readonly size: number;
  readonly at: (i: number) => A;
  readonly toArray: () => A[];
}

export const Chunk = {
  of<A>(xs: ReadonlyArray<A>): Chunk<A> {
    const arr = xs.slice();
    return { 
      size: arr.length, 
      at: (i) => {
        const value = arr[i];
        if (value === undefined) throw new Error(`Index ${i} out of bounds`);
        return value;
      }, 
      toArray: () => arr.slice() 
    };
  },
  singleton<A>(a: A): Chunk<A> { return Chunk.of([a]); },
  empty<A>(): Chunk<A> { return Chunk.of([]); }
};

// Stream facade parameterized by an effect F
export interface StreamK<F extends Kind1, O> {
  // tiny algebra; implementations provided by Pull in Prompt 3
  map<B>(f: (o: O) => B): StreamK<F, B>;
  evalMap<B>(k: (o: O) => Apply<F, [B]>): StreamK<F, B>;
  chunkN(n: number, allowFewer?: boolean): StreamK<F, Chunk<O>>;
  concat(that: StreamK<F, O>): StreamK<F, O>;
}

export type PipeK<F extends Kind1, I, O> = (s: StreamK<F, I>) => StreamK<F, O>;
