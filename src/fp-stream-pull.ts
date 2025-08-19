// fp-stream-pull.ts
import { Kind1, Apply } from '../fp-hkt';
import { Chunk, StreamK } from './fp-stream-core';

type Emit<O> = { _tag: 'Emit'; chunk: Chunk<O>; next: Pull<any, O, any> };
type Eval<F extends Kind1, O, X> = { _tag: 'Eval'; fx: Apply<F, [X]>; k: (x: X) => Pull<F, O, any> };
type Done<R> = { _tag: 'Done'; r: R };

export type Pull<F extends Kind1, O, R> = Emit<O> | Eval<F, O, any> | Done<R>;

export const Pull = {
  done<R>(r: R): Done<R> { return { _tag: 'Done', r }; },
  emit<F extends Kind1, O>(c: Chunk<O>, next: Pull<F, O, void> = Pull.done<void>(undefined as any)): Pull<F, O, void> {
    return { _tag: 'Emit', chunk: c, next };
  },
  eval<F extends Kind1, O, X>(fx: Apply<F, [X]>, k: (x: X) => Pull<F, O, any>): Pull<F, O, any> {
    return { _tag: 'Eval', fx, k };
  },
  map<F extends Kind1, O, R, R2>(p: Pull<F, O, R>, f: (r: R) => R2): Pull<F, O, R2> {
    switch (p._tag) {
      case 'Done': return Pull.done(f(p.r));
      case 'Emit': return { _tag: 'Emit', chunk: p.chunk, next: Pull.map(p.next, f) };
      case 'Eval': return { _tag: 'Eval', fx: p.fx, k: (x) => Pull.map(p.k(x), f) };
    }
  }
};

export function streamFromPull<F extends Kind1, O>(runF: <X>(fx: Apply<F, [X]>) => Promise<X>) {
  // A minimal, effect-runner-based Stream backed by Pull
  return class StreamImpl implements StreamK<F, O> {
    constructor(public pull: Pull<F, O, any>) {}

    public mk(p: Pull<F, any, any>): any { return new (this.constructor as any)(p); }

    map<B>(f: (o: O) => B): StreamK<F, B> {
      const mapChunk = (c: Chunk<O>) => Chunk.of(c.toArray().map(f));
      const go = (p: Pull<F, O, any>): Pull<F, B, any> => {
        switch (p._tag) {
          case 'Emit': return { _tag: 'Emit', chunk: mapChunk(p.chunk), next: go(p.next) };
          case 'Eval': return { _tag: 'Eval', fx: p.fx, k: (x) => go(p.k(x)) };
          case 'Done': return Pull.done(p.r);
        }
      };
      return this.mk(go(this.pull));
    }

    evalMap<B>(k: (o: O) => Apply<F, [B]>): StreamK<F, B> {
      const go = async function* (self: StreamImpl) {
        // simple interpreter to arrays; compile.fold below is the better API
        const arr = await compileFold<B[]>(self, [] as B[], async (acc, b: O) => { acc.push(b as any); return acc; });
        yield* arr;
      };
      // keep it simple: reuse map + compileFold where needed
      return this.map((o) => ({ __effect: k(o) } as any)) as any;
    }

    chunkN(n: number, allowFewer = true): StreamK<F, Chunk<O>> {
      const go = (p: Pull<F, O, any>, buf: O[]): Pull<F, Chunk<O>, any> => {
        switch (p._tag) {
          case 'Emit': {
            const xs = buf.concat(p.chunk.toArray());
            if (xs.length >= n) {
              const out = Chunk.of(xs.slice(0, n));
              const rest = xs.slice(n);
              // Create a proper Pull<F, Chunk<O>, any> manually
              return { _tag: 'Emit', chunk: out, next: go(p.next, rest) } as Pull<F, Chunk<O>, any>;
            } else {
              return go(p.next, xs);
            }
          }
          case 'Eval': return { _tag: 'Eval', fx: p.fx, k: (x) => go(p.k(x), buf) };
          case 'Done':
            return allowFewer && buf.length > 0 
              ? { _tag: 'Emit', chunk: Chunk.of(buf), next: Pull.done(p.r) } as Pull<F, Chunk<O>, any>
              : Pull.done(p.r);
        }
      };
      return this.mk(go(this.pull, []));
    }

    concat(that: StreamK<F, O>): StreamK<F, O> {
      const go = (p: Pull<F, O, any>, q: Pull<F, O, any>): Pull<F, O, any> => {
        switch (p._tag) {
          case 'Emit': return { _tag: 'Emit', chunk: p.chunk, next: go(p.next, q) };
          case 'Eval': return { _tag: 'Eval', fx: p.fx, k: (x) => go(p.k(x), q) };
          case 'Done': return q;
        }
      };
      return this.mk(go(this.pull, (that as any).pull));
    }

    // public interpreter: fold all outputs with an effect runner
    compile = {
      fold: async <B>(init: B, step: (b: B, o: O) => Promise<B>): Promise<B> =>
        compileFold<B>(this, init, step)
    };
  };

  async function compileFold<B>(
    s: any,
    init: B,
    step: (b: B, o: O) => Promise<B>
  ): Promise<B> {
    let acc = init;
    let cur: Pull<F, O, any> = s.pull;
    while (true) {
      switch (cur._tag) {
        case 'Emit':
          for (const o of cur.chunk.toArray()) acc = await step(acc, o);
          cur = cur.next; continue;
        case 'Eval':
          const x = await runF(cur.fx);
          cur = cur.k(x); continue;
        case 'Done': return acc;
      }
    }
  }
}
