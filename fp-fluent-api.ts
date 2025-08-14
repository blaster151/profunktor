// Temporary stub for fluent API integration used by fp-observable-lite

export type FluentImpl<A = any> = {
  map?: (self: any, f: (a: A) => any) => any;
  chain?: (self: any, f: (a: A) => any) => any;
  flatMap?: (self: any, f: (a: A) => any) => any;
  filter?: (self: any, pred: (a: A) => boolean) => any;
  filterMap?: (self: any, f: (a: A) => any) => any;
  scan?: (self: any, reducer: (acc: any, value: any) => any, seed: any) => any;
  take?: (self: any, n: number) => any;
  skip?: (self: any, n: number) => any;
  distinct?: (self: any) => any;
  drop?: (self: any, n: number) => any;
  slice?: (self: any, start: number, end?: number) => any;
  reverse?: (self: any) => any;
  sortBy?: (self: any, fn: (a: A) => any) => any;
  pipe?: (self: any, ...fns: Array<(x: any) => any>) => any;
};

export function applyFluentOps<A>(instance: any, impl?: FluentImpl<A>): any {
  if (!instance || !impl) return instance;
  for (const key of Object.keys(impl) as Array<keyof FluentImpl<A>>) {
    const fn = impl[key];
    if (typeof fn === 'function') {
      Object.defineProperty(instance, key, {
        configurable: true,
        enumerable: false,
        writable: true,
        value: function(this: any, ...args: any[]) {
          return (fn as Function)(this, ...args);
        }
      });
    }
  }
  return instance;
}

// Alias to align with prototype-oriented usage
export const applyFluentOpsToPrototype = applyFluentOps;


