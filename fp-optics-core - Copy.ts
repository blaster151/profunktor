// Minimal optics core shim for progressive reintegration

export type BaseOptic<S, T, A, B> = {
  readonly __effect?: 'Pure' | 'IO' | 'Async';
  readonly __type: 'Lens' | 'Prism' | 'Optional' | 'Traversal';
};

export type Lens<S, T, A, B> = BaseOptic<S, T, A, B> & {
  readonly __type: 'Lens';
  get: (s: S) => A;
  set: (b: B, s: S) => T;
  modify: (f: (a: A) => B) => (s: S) => T;
};

export type Optional<S, T, A, B> = BaseOptic<S, T, A, B> & {
  readonly __type: 'Optional';
  getOption: (s: S) => { tag: 'Just'; value: A } | { tag: 'Nothing' };
  set: (b: B, s: S) => T;
  modify: (f: (a: A) => B) => (s: S) => T;
};

export type Prism<S, T, A, B> = BaseOptic<S, T, A, B> & {
  readonly __type: 'Prism';
  getOption: (s: S) => { tag: 'Just'; value: A } | { tag: 'Nothing' };
  build: (b: B) => T;
  modify: (f: (a: A) => B) => (s: S) => T;
};

export function lens<S, T, A, B>(
  get: (s: S) => A,
  set: (b: B, s: S) => T
): Lens<S, T, A, B> {
  return {
    __type: 'Lens',
    __effect: 'Pure',
    get,
    set,
    modify: (f: (a: A) => B) => (s: S) => set(f(get(s)), s)
  };
}

export function optional<S, T, A, B>(
  getOption: (s: S) => { tag: 'Just'; value: A } | { tag: 'Nothing' },
  set: (b: B, s: S) => T
): Optional<S, T, A, B> {
  return {
    __type: 'Optional',
    __effect: 'Pure',
    getOption,
    set,
    modify: (f: (a: A) => B) => (s: S) => {
      const m = getOption(s);
      return m.tag === 'Just' ? set(f(m.value), s) : (s as unknown as T);
    }
  };
}

export function prism<S, T, A, B>(
  match: (s: S) => { tag: 'Just'; value: A } | { tag: 'Nothing' },
  build: (b: B) => T
): Prism<S, T, A, B> {
  return {
    __type: 'Prism',
    __effect: 'Pure',
    getOption: match,
    build,
    modify: (f: (a: A) => B) => (s: S) => {
      const m = match(s);
      return m.tag === 'Just' ? build(f(m.value)) : (s as unknown as T);
    }
  };
}

export function isLens(x: any): x is Lens<any, any, any, any> {
  return !!x && x.__type === 'Lens';
}
export function isOptional(x: any): x is Optional<any, any, any, any> {
  return !!x && x.__type === 'Optional';
}
export function isPrism(x: any): x is Prism<any, any, any, any> {
  return !!x && x.__type === 'Prism';
}

export function markPure<O extends BaseOptic<any, any, any, any>>(o: O): O {
  return Object.assign(o, { __effect: 'Pure' as const });
}
export function markAsync<O extends BaseOptic<any, any, any, any>>(o: O): O {
  return Object.assign(o, { __effect: 'Async' as const });
}
export function markIO<O extends BaseOptic<any, any, any, any>>(o: O): O {
  return Object.assign(o, { __effect: 'IO' as const });
}


