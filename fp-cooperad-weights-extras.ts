// fp-cooperad-weights-extras.ts
// --- Node shims and canonical type imports ---
declare const require: undefined | ((m: string) => any);
// Optional Node shims (undefined in browsers)
const _fs: any = (() => { try { return require?.('fs'); } catch { return null; } })();
const _events: any = (() => { try { return require?.('events'); } catch { return null; } })();
const once: undefined | ((em: any, ev: string) => Promise<any[]>) = _events?.once;

import type { WeightMonoid, Weight } from './fp-cooperad-weights';
// Extras for the cooperad weights:
//  - Polynomial semiring over sparse maps (Map<K, number>), keyed by a Monoid<K>
//  - BigInt semiring
//  - NDJSON streaming writers for deltaStream / deltaW

import {
  Semiring, NatSemiring, numberWeightMonoid, bigIntWeightMonoid,
  deltaStream, deltaW,
} from "./fp-cooperad-weights";

import type {
  Tree, Forest
} from "./fp-cooperad-trees";
import {
  keyOf, keyForest
} from "./fp-cooperad-trees";

// -------------------------------------------------------------
// 0) Minimal Monoid witness for keys
// -------------------------------------------------------------
export interface Monoid<K> {
  readonly empty: K;
  concat(x: K, y: K): K;
}

// Handy string-monoid (concatenation with a joiner)
export function StringMonoid(joiner = "·"): Monoid<string> {
  return {
    empty: "",
    concat: (x, y) => {
      if (!x) return y;
      if (!y) return x;
      return `${x}${joiner}${y}`;
    }
  };
}

// -------------------------------------------------------------
// 1) Polynomial semiring over sparse maps Map<K,number>
//    Given a Monoid<K> (to "multiply" keys) and a coefficient semiring R.
//    - add: merges coefficients on identical keys
//    - mul: Cauchy product: (a*b)[k1<>k2] += a[k1]*b[k2]
//    - zero: empty map
//    - one : { [empty]: 1 }
//    NOTE: We default coefficients to NatSemiring, but you can pass your own.
// -------------------------------------------------------------
export function PolynomialSemiring<K>(
  K: Monoid<K>,
  R: Semiring<number> = NatSemiring
): Semiring<Map<K, number>> {
  const normalize = (m: Map<K, number>) => {
    for (const [k, v] of m) {
      if (v === R.zero) m.delete(k);
    }
    return m;
  };

  const add = (a: Map<K, number>, b: Map<K, number>): Map<K, number> => {
    if (a.size === 0) return new Map(b);
    if (b.size === 0) return new Map(a);
    const out = new Map(a);
    for (const [k, v] of b) {
      const prev = out.get(k) ?? R.zero;
      const sum = R.add(prev, v);
      if (sum === R.zero) out.delete(k); else out.set(k, sum);
    }
    return normalize(out);
  };

  // TODO: Implement mul, zero, one as needed for the semiring
  // Placeholder implementation for demonstration
  return {
    add,
    mul: (a, b) => new Map(),
    zero: new Map(),
    one: new Map([[K.empty, R.one]])
  };
}
    export async function writeDeltaNDJSON<A>(
      tr: Tree<A>,
      filePath: string,
      opts: NDJSONOpts<A> = {}
    ): Promise<void> {
      if (!_fs || !once) {
        throw new Error("Node streams are unavailable in this build");
      }
      const flushEvery = opts.flushEvery ?? 1000;
      const structural = opts.structural ?? false;
      const encodeA = opts.encodeA ?? ((a: A) => a);

      const stream = _fs.createWriteStream(filePath);
      let lineCount = 0;

      try {
        for (const [forest, trunk] of deltaStream(tr)) {
          const line = structural
            ? { forest: forestToJSON(forest, encodeA), trunk: treeToJSON(trunk, encodeA) }
            : { forest: keyForest(forest), trunk: keyOf(trunk) };
          stream.write(JSON.stringify(line) + "\n");
          if (++lineCount % flushEvery === 0) {
            await once(stream, "drain");
          }
        }
      } finally {
        stream.end();
        await once(stream, "finish");
      }
    }

// -------------------------------------------------------------
// 2) BigInt semiring
// -------------------------------------------------------------
export const BigIntSemiring: Semiring<bigint> = {
  zero: 0n,
  one : 1n,
  add : (x, y) => x + y,
  mul : (x, y) => x * y,
};

// -------------------------------------------------------------
// 3) NDJSON streaming writers
// -------------------------------------------------------------


type ToJSON<A> = (a: A) => any;

export interface NDJSONOpts<A> {
  /** flush every N lines (default 1000) */
  flushEvery?: number;
  /** encode trees/forests as their structural JSON instead of compact keys (default: compact keys) */
  structural?: boolean;
  /** custom encoder for leaf labels */
  encodeA?: ToJSON<A>;
}

/** serialize a Tree structurally (fallback if you don't want keyOf) */
function treeToJSON<A>(t: Tree<A>, enc: ToJSON<A>): any {
  return { label: enc(t.label), kids: t.kids.map(k => treeToJSON(k, enc)) };
}

/** serialize a Forest structurally */
function forestToJSON<A>(f: Forest<A>, enc: ToJSON<A>): any {
  return f.map(t => treeToJSON(t, enc));
}

/**
 * Write raw Δ (forest ⊗ trunk) as NDJSON.
 * Each line: { forest: string|object, trunk: string|object }
 */
  /**
   * Write weighted Δ as NDJSON.
   * Each line: { coef: number, forest: string|object, trunk: string|object }
   */
  export async function writeDeltaWNDJSON<A, W = number>(
    tr: Tree<A>,
    filePath: string,
    monoid: WeightMonoid<W>,
    coefOf: (P: Forest<A>, R: Tree<A>) => Weight<W> = () => monoid.empty,
    opts: NDJSONOpts<A> = {}
  ): Promise<void> {
    if (!_fs || !once) {
      throw new Error("Node streams are unavailable in this build");
    }
    const flushEvery = opts.flushEvery ?? 1000;
    const structural = opts.structural ?? false;
    const encodeA = opts.encodeA ?? ((a: A) => a);

    const stream = _fs.createWriteStream(filePath);
    let lineCount = 0;

    try {
      const weighted = deltaW(tr, monoid, coefOf);
      for (const { coef, forest, trunk } of weighted.values()) {
        const line = structural
          ? { coef, forest: forestToJSON(forest, encodeA), trunk: treeToJSON(trunk, encodeA) }
          : { coef, forest: keyForest(forest), trunk: keyOf(trunk) };
        stream.write(JSON.stringify(line) + "\n");
        if (++lineCount % flushEvery === 0) {
          await once(stream, "drain");
        }
      }
    } finally {
      stream.end();
      await once(stream, "finish");
    }
  }

// Browser-compatible execution check
// Note: Examples can be called directly by creating a demo function
