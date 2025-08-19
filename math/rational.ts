// src/math/rational.ts
export type Int = bigint;

const abs = (n: Int) => (n < 0n ? -n : n);
const gcd = (a: Int, b: Int): Int => {
  a = abs(a); b = abs(b);
  while (b !== 0n) { const t = b; b = a % b; a = t; }
  return a;
};

export class Rational {
  readonly num: Int;
  readonly den: Int; // > 0

  private constructor(n: Int, d: Int) {
    if (d === 0n) throw new Error('Rational: denominator 0');
    if (d < 0n) { n = -n; d = -d; }
    const g = gcd(n, d);
    this.num = n / g;
    this.den = d / g;
  }

  static from(n: Int | number): Rational {
    return typeof n === 'number' ? new Rational(BigInt(n), 1n) : new Rational(n, 1n);
  }
  static make(n: Int, d: Int) { return new Rational(n, d); }

  add(b: Rational) { return new Rational(this.num * b.den + b.num * this.den, this.den * b.den); }
  sub(b: Rational) { return new Rational(this.num * b.den - b.num * this.den, this.den * b.den); }
  mul(b: Rational) { return new Rational(this.num * b.num, this.den * b.den); }
  div(b: Rational) { return new Rational(this.num * b.den, this.den * b.num); }
  neg() { return new Rational(-this.num, this.den); }
  eq(b: Rational) { return this.num === b.num && this.den === b.den; }
  toNumber() { return Number(this.num) / Number(this.den); }
  toString() { return this.den === 1n ? `${this.num}` : `${this.num}/${this.den}`; }
}

export interface Semiring<T> {
  zero: T;
  one: T;
  add(a: T, b: T): T;
  mul(a: T, b: T): T;
}

export const RationalSemiring: Semiring<Rational> = {
  zero: Rational.from(0n),
  one: Rational.from(1n),
  add: (a, b) => a.add(b),
  mul: (a, b) => a.mul(b),
};

// tiny helpers
export const R = {
  zero: Rational.from(0n),
  fromInt: (n: Int | number) => Rational.from(n),
  inv: (x: Rational) => Rational.make(x.den, x.num),
};
