// src/semantics/arrow-category.ts
// Minimal Set-model adapter showing the bijection of Proposition 49.  :contentReference[oaicite:5]{index=5}

export interface ModelOfT<TCarriers> { carriers: TCarriers; ops: Record<string, Function>; }
export interface Hom<TCarriers> { map: Record<string, (x:any)=>any>; }

export interface ArrowModel<TCarriers> {
  src: ModelOfT<TCarriers>;
  dst: ModelOfT<TCarriers>;
  nat: Hom<TCarriers>; // single arrow with commuting squares implicit
}

export function asArrowModel<T>(M: ModelOfT<T>, alpha: Hom<T>, N: ModelOfT<T>): ArrowModel<T> {
  return { src: M, dst: N, nat: alpha };
}

export function fromArrowModel<T>(AM: ArrowModel<T>): { M: ModelOfT<T>; alpha: Hom<T>; N: ModelOfT<T> } {
  return { M: AM.src, alpha: AM.nat, N: AM.dst };
}
