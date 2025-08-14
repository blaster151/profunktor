// fp-dg-core.ts
// Minimal "dg" core: degrees, signs, formal sums, and a zero-differential wrapper.
// Keeps simple/strict code untouched; import this only when you want homotopy features.

export type Degree = number;

// Koszul sign helpers
export const parity = (n: Degree) => ((n % 2) + 2) % 2;        // 0|1
export const koszul = (m: Degree, n: Degree) => (parity(m) * parity(n)) % 2 === 0 ? +1 : -1;
export const signPow = (s: 1 | -1, k: Degree) => (k % 2 === 0 ? +1 : s);

// Formal sums with small utilities
export interface Term<T> { coef: number; term: T; }
export type Sum<T> = readonly Term<T>[];

export const sum = <T>(...xs: Term<T>[]): Sum<T> => xs;
export const zero = <T>(): Sum<T> => [];
export const scale = <T>(k: number, s: Sum<T>): Sum<T> =>
  k === 0 ? [] : s.map(({ coef, term }) => ({ coef: k * coef, term }));
export const plus = <T>(a: Sum<T>, b: Sum<T>): Sum<T> => a.concat(b);

// Merge by a user-stable key (caller provides key to identify alpha-equivalent terms)
export function normalizeByKey<T>(s: Sum<T>, key: (t: T) => string): Sum<T> {
  const m = new Map<string, { coef: number; term: T }>();
  for (const { coef, term } of s) {
    const k = key(term);
    const prev = m.get(k);
    if (prev) prev.coef += coef;
    else m.set(k, { coef, term });
  }
  return [...m.values()].filter(x => x.coef !== 0);
}

// DG module witness for "values of type T carried with a degree"
export interface DgModule<T> {
  degree(t: T): Degree;
  d(t: T): Sum<T>; // linear differential (graded derivation/leibniz handled by callers)
}

// "Strict as DG": wrap a degree-0 world with zero differential
export function strictAsDG<T>(degree: (t: T) => Degree = () => 0): DgModule<T> {
  return {
    degree,
    d: (_: T) => zero<T>()
  };
}

// Convenience: compute (-1)^{deg(x)} * s
export function signByDeg<T>(deg: Degree, s: Sum<T>): Sum<T> {
  return scale(signPow(-1, deg) as 1 | -1, s);
}
