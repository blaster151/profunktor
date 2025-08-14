// Minimal Traversal shim to support progressive enablement without heavy deps

export type Traversal<S, T, A, B> = {
    __type: 'Traversal';
    getAll: (s: S) => A[];
    modify: (f: (a: A) => B, s: S) => T;
};

export function traversal<S, T, A, B>(
    modifyFn: (f: (a: A) => B, s: S) => T,
    getAllFn: (s: S) => A[]
): Traversal<S, T, A, B> {
    return {
        __type: 'Traversal',
        getAll: getAllFn,
        modify: modifyFn
    };
}

// Simple array and record traversals (minimal)
export function arrayTraversal<S extends any[], T extends any[], A, B>(): Traversal<S, T, A, B> {
    return traversal<S, T, A, B>(
        (f, s) => s.map(f) as T,
        (s) => s as unknown as A[]
    );
}

export function valuesTraversal<S extends Record<string, any>, T extends Record<string, any>, A, B>(): Traversal<S, T, A, B> {
    return traversal<S, T, A, B>(
        (f, s) => {
            const r: any = {};
            for (const k of Object.keys(s)) r[k] = f((s as any)[k]);
            return r as T;
        },
        (s) => Object.values(s) as unknown as A[]
    );
}

export function keysTraversal<S extends Record<string, any>, T extends Record<string, any>, A, B>(): Traversal<S, T, A, B> {
    return traversal<S, T, A, B>(
        (f, s) => {
            const r: any = {};
            for (const k of Object.keys(s)) r[f(k as unknown as A) as unknown as string] = (s as any)[k];
            return r as T;
        },
        (s) => Object.keys(s) as unknown as A[]
    );
}

export function nestedArrayTraversal<S extends any[][], T extends any[][], A, B>(): Traversal<S, T, A, B> {
    return traversal<S, T, A, B>(
        (f, s) => s.map(inner => inner.map(f)) as T,
        (s) => ([] as A[]).concat(...(s as any[])) as A[]
    );
}

export function modifyOf<S, T, A, B>(t: Traversal<S, T, A, B>, f: (a: A) => B): (s: S) => T {
    return (s: S) => t.modify(f, s);
}

export function setOf<S, T, A, B>(t: Traversal<S, T, A, B>, b: B): (s: S) => T {
    return (s: S) => t.modify(() => b, s);
}

export function overOf<S, T, A, B>(t: Traversal<S, T, A, B>, f: (a: A) => B): (s: S) => T {
    return modifyOf(t, f);
}

export function getAllOf<S, T, A, B>(t: Traversal<S, T, A, B>, s: S): A[] {
    return t.getAll(s);
}

export function foldOf<S, T, A, B, R>(
    t: Traversal<S, T, A, B>,
    reducer: (acc: R, a: A) => R,
    initial: R,
    s: S
): R {
    return t.getAll(s).reduce(reducer, initial);
}

export function foldMapOf<S, T, A, B, M>(
    t: Traversal<S, T, A, B>,
    monoid: { empty(): M; concat(a: M, b: M): M },
    f: (a: A) => M,
    s: S
): M {
    const values = t.getAll(s);
    return values.reduce((acc, a) => monoid.concat(acc, f(a)), monoid.empty());
}

// ---------------------------------------------
// Composition helpers with Lens/Prism/Optional
// ---------------------------------------------
import { Lens, Prism, Optional } from './fp-optics-core';

export function composeTraversalTraversal<S, T, A, B, A2, B2>(
    outer: Traversal<S, T, A, B>,
    inner: Traversal<A, B, A2, B2>
): Traversal<S, T, A2, B2> {
    return traversal<S, T, A2, B2>(
        (f, s) => outer.modify(a => inner.modify(f, a), s),
        (s) => {
            const as = outer.getAll(s);
            const result: A2[] = [];
            for (const a of as) result.push(...inner.getAll(a));
            return result;
        }
    );
}

export function composeTraversalLens<S, T, A, B, A2, B2>(
    outer: Traversal<S, T, A, B>,
    ln: Lens<A, B, A2, B2>
): Traversal<S, T, A2, B2> {
    return traversal<S, T, A2, B2>(
        (f, s) => outer.modify(a => ln.set(f(ln.get(a)), a), s),
        (s) => outer.getAll(s).map(a => ln.get(a)) as unknown as A2[]
    );
}

export function composeTraversalOptional<S, T, A, B, A2, B2>(
    outer: Traversal<S, T, A, B>,
    opt: Optional<A, B, A2, B2>
): Traversal<S, T, A2, B2> {
    return traversal<S, T, A2, B2>(
        (f, s) => outer.modify(a => {
            const m = opt.getOption(a) as any;
            if (m && m.tag === 'Just') {
                return opt.set(f(m.value), a);
            }
            return a as unknown as B;
        }, s),
        (s) => {
            const acc: A2[] = [];
            for (const a of outer.getAll(s)) {
                const m = opt.getOption(a) as any;
                if (m && m.tag === 'Just') acc.push(m.value as A2);
            }
            return acc;
        }
    );
}

export function composeTraversalPrism<S, T, A, B, A2, B2>(
    outer: Traversal<S, T, A, B>,
    pr: Prism<A, B, A2, B2>
): Traversal<S, T, A2, B2> {
    return traversal<S, T, A2, B2>(
        (f, s) => outer.modify(a => {
            const m = pr.getOption(a) as any;
            if (m && m.tag === 'Just') {
                const built = pr.build(f(m.value));
                return built;
            }
            return a as unknown as B;
        }, s),
        (s) => {
            const acc: A2[] = [];
            for (const a of outer.getAll(s)) {
                const m = pr.getOption(a) as any;
                if (m && m.tag === 'Just') acc.push(m.value as A2);
            }
            return acc;
        }
    );
}

export function composeTraversalWithOptic<S, T, A, B, A2, B2>(
    outer: Traversal<S, T, A, B>,
    next: Traversal<A, B, A2, B2> | Lens<A, B, A2, B2> | Prism<A, B, A2, B2> | Optional<A, B, A2, B2>
): Traversal<S, T, A2, B2> {
    const anyNext: any = next as any;
    if (anyNext && anyNext.__type === 'Traversal' && anyNext.getAll && anyNext.modify) {
        return composeTraversalTraversal(outer, next as Traversal<A, B, A2, B2>);
    }
    if (anyNext && typeof anyNext.get === 'function' && typeof anyNext.set === 'function') {
        return composeTraversalLens(outer, next as Lens<A, B, A2, B2>);
    }
    if (anyNext && typeof anyNext.getOption === 'function' && typeof anyNext.set === 'function') {
        return composeTraversalOptional(outer, next as Optional<A, B, A2, B2>);
    }
    if (anyNext && typeof anyNext.getOption === 'function' && typeof anyNext.build === 'function') {
        return composeTraversalPrism(outer, next as Prism<A, B, A2, B2>);
    }
    // Fallback: treat as identity traversal of A2==A, B2==B
    return outer as unknown as Traversal<S, T, A2, B2>;
}


