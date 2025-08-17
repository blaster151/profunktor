// fp-interrupt.ts
export interface CancelToken {
  readonly isCancelled: () => boolean;
  cancel(): void;
}

export function cancelToken(): CancelToken {
  let c = false;
  return { isCancelled: () => c, cancel: () => { c = true; } };
}

export function withTimeout<T>(ms: number, p: Promise<T>, onTimeout: () => T): Promise<T> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(onTimeout()), ms);
    p.then((x) => { clearTimeout(t); resolve(x); });
  });
}
