// Minimal optics adapter aligned with fp-optics-core and fp-optics-traversal
// Safe surface to progressively enable optics without conflicting symbols.

import {
	Lens,
	Prism,
	Optional,
	lens as coreLens,
	prism as corePrism,
	optional as coreOptional,
	isLens as coreIsLens,
	isPrism as coreIsPrism,
	isOptional as coreIsOptional
} from './fp-optics-core';
import { Traversal } from './fp-optics-traversal';
import { Just, isJust, fromJust } from './fp-maybe-unified';
import { Left, Right } from './fp-either-unified';
import { Ok, Err } from './fp-result-unified';

// Safe re-exports from traversal module to provide a consistent surface
import {
	traversal as traversalT,
	enhancedTraversal as enhancedTraversalT,
	arrayTraversal,
	valuesTraversal,
	keysTraversal,
	nestedArrayTraversal,
	composeTraversalWithOptic,
	composeTraversalTraversal,
	composeTraversalLens,
	composeTraversalPrism,
	composeTraversalOptional,
	modifyOf,
	setOf,
	overOf,
	getAllOf,
	foldOf,
	foldMapOf,
	markTraversalPure,
	markTraversalAsync,
	markTraversalIO
} from './fp-optics-traversal';

export { Lens, Prism, Optional, Traversal };

export const lens = coreLens;
export const prism = corePrism;
export const optional = coreOptional;

export function view<S, A>(ln: Lens<S, S, A, A>, s: S): A {
	return ln.get(s);
}

export function set<S, T, A, B>(ln: Lens<S, T, A, B>, b: B, s: S): T {
	return ln.set(b, s);
}

export function over<S, T, A, B>(ln: Lens<S, T, A, B>, f: (a: A) => B, s: S): T {
	return ln.modify(f)(s);
}

export function preview<S, A>(pr: Prism<S, S, A, A>, s: S): { tag: 'Just'; value: A } | { tag: 'Nothing' } {
	return pr.getOption(s);
}

export function review<S, T, A, B>(pr: Prism<S, T, A, B>, b: B): T {
	return pr.build(b);
}

export function isMatching<S, A>(pr: Prism<S, S, A, A>, s: S): boolean {
	return pr.getOption(s).tag === 'Just';
}

export const isLens = coreIsLens;
export const isPrism = coreIsPrism;
export const isOptional = coreIsOptional;

// Additional lightweight helpers for compatibility
export function isTraversal(value: any): boolean {
	return !!value && (value.__type === 'Traversal' || (typeof value?.getAll === 'function' && typeof value?.modify === 'function'));
}

export function to<S, A>(getter: (s: S) => A): Lens<S, S, A, A> {
	return lens(getter, (_b: A, s: S) => s);
}

export function sets<S, T, A, B>(setter: (f: (a: A) => B, s: S) => T): Lens<S, T, A, B> {
	return lens(
		(s: S) => undefined as unknown as A,
		(b: B, s: S) => setter(() => b, s)
	);
}

export function prop<K extends string>(key: K) {
	return <S extends Record<K, any>, T extends Record<K, any>, A, B>(): Lens<S, T, A, B> =>
		lens(
			(s: S) => s[key] as A,
			(b: B, s: S) => ({ ...s, [key]: b }) as T
		);
}

export function at(index: number) {
	return <S extends any[], T extends any[], A, B>(): Lens<S, T, A, B> =>
		lens(
			(s: S) => s[index] as A,
			(b: B, s: S) => {
				const a = [...s];
				a[index] = b;
				return a as T;
			}
		);
}

export function head<S extends any[], T extends any[], A, B>(): Lens<S, T, A, B> {
	return at(0)<S, T, A, B>();
}

export function last<S extends any[], T extends any[], A, B>(): Lens<S, T, A, B> {
	return lens(
		(s: S) => s[s.length - 1] as A,
		(b: B, s: S) => {
			const a = [...s];
			a[a.length - 1] = b;
			return a as T;
		}
	);
}

export function just<S extends any, T extends any, A, B>(): Prism<S, T, A, B> {
	return optional(
		(s: S) => isJust(s as any) ? { tag: 'Just' as const, value: fromJust(s as any) as A } : { tag: 'Nothing' as const },
		(b: B, _s: S) => Just(b) as unknown as T
	) as unknown as Prism<S, T, A, B>;
}

export function right<S extends any, T extends any, A, B>(): Prism<S, T, A, B> {
	return optional(
		(s: any) => ('right' in (s || {})) ? { tag: 'Just' as const, value: (s as any).right as A } : { tag: 'Nothing' as const },
		(b: B, _s: S) => Right(b) as unknown as T
	) as unknown as Prism<S, T, A, B>;
}

export function left<S extends any, T extends any, A, B>(): Prism<S, T, A, B> {
	return optional(
		(s: any) => ('left' in (s || {})) ? { tag: 'Just' as const, value: (s as any).left as A } : { tag: 'Nothing' as const },
		(b: B, _s: S) => Left(b) as unknown as T
	) as unknown as Prism<S, T, A, B>;
}

export function ok<S extends any, T extends any, A, B>(): Prism<S, T, A, B> {
	return optional(
		(s: any) => ('ok' in (s || {})) ? { tag: 'Just' as const, value: (s as any).ok as A } : { tag: 'Nothing' as const },
		(b: B, _s: S) => Ok(b) as unknown as T
	) as unknown as Prism<S, T, A, B>;
}

export function err<S extends any, T extends any, A, B>(): Prism<S, T, A, B> {
	return optional(
		(s: any) => ('err' in (s || {})) ? { tag: 'Just' as const, value: (s as any).err as A } : { tag: 'Nothing' as const },
		(b: B, _s: S) => Err(b) as unknown as T
	) as unknown as Prism<S, T, A, B>;
}

// Composition helpers (simple function composition for optics-like values)
export function compose(outer: (x: any) => any, inner: (x: any) => any) {
	return (x: any) => outer(inner(x));
}

export function composeMany(optics: Array<(x: any) => any>) {
	return optics.reduce((acc, o) => compose(acc, o));
}

// Traversal utilities re-exported under stable names
export const traversal = traversalT;
export const enhancedTraversal = enhancedTraversalT;
export {
	arrayTraversal,
	valuesTraversal,
	keysTraversal,
	nestedArrayTraversal,
	composeTraversalWithOptic,
	composeTraversalTraversal,
	composeTraversalLens,
	composeTraversalPrism,
	composeTraversalOptional,
	modifyOf,
	setOf,
	overOf,
	getAllOf,
	foldOf,
	foldMapOf,
	markTraversalPure,
	markTraversalAsync,
	markTraversalIO
};


