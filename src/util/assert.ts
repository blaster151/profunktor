export function assertDefined<T>(v: T | undefined, msg: string): T {
  if (v === undefined) throw new Error(msg);
  return v;
}

export const isDefined = <T>(x: T | undefined | null): x is T => x != null;

export const assertString = (s: string | undefined, msg: string): string => {
  if (typeof s !== "string") throw new Error(msg);
  return s;
};

export function getRequired<T, K extends keyof T>(obj: T, key: K, msg: string): NonNullable<T[K]> {
  const v = (obj as T)[key];
  if (v === undefined) throw new Error(msg);
  return v as NonNullable<T[K]>;
}
