// src/ct/partial.ts
// A typed "partial application" helper with zero `any` usage and full inference.

// RemainingArgs derives the rest of the args a function expects
// after a preset tuple `Preset` has been applied.
export type RemainingArgs<
  Fn extends (...args: unknown[]) => unknown,
  Preset extends unknown[]
> = Fn extends (...args: [...Preset, ...infer R]) => unknown ? R : never;

// The `partial` function captures some leading args and returns a function
// that accepts the remaining args with fully inferred types.
export function partial<
  Fn extends (...args: unknown[]) => unknown,
  Preset extends unknown[]
>(
  fn: Fn,
  ...preset: Preset
): (...later: RemainingArgs<Fn, Preset>) => ReturnType<Fn> {
  return (...later) => fn(...preset, ...later) as ReturnType<Fn>;
}

// Example (leave commented, for devs):
// const add = (a: number, b: number, c: number) => a + b + c;
// const add1 = partial(add, 1);
// const add1and2 = partial(add, 1, 2);
// const result = add1and2(3); // number
