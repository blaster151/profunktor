// cocomplete-wrt.ts
export function isCocompleteWrtTStar<C extends Category>(
  C: C,
  Tstar: { onObj: (x: any) => any },
  testObjs: any[],
  canColim: (A: any) => boolean
): { ok: true } | { ok: false; missing: any[] } {
  const missing = testObjs.filter(A => !canColim(A))
  return missing.length === 0 ? { ok: true } : { ok: false, missing }
}
