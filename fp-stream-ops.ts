// Unified common stream ops mixin for ObservableLite and structurally similar types

import { ObservableLite } from './fp-observable-lite';
import { attachPurityMarker, extractPurityMarker } from './fp-purity';

export interface CommonStreamOps<A = any> {
	map<B>(f: (a: A) => B): any;
	filter(pred: (a: A) => boolean): any;
	filterMap<B>(f: (a: A) => B | undefined): any;
	scan<B>(reducer: (acc: B, value: A) => B, seed: B): any;
	chain<B>(f: (a: A) => any): any;
	flatMap<B>(f: (a: A) => any): any;
	bichain<L, R>(left: (l: L) => any, right: (r: R) => any): any;
	bimap<B, C>(f: (a: A) => B, g: (err: any) => C): any;
	take(count: number): any;
	skip(count: number): any;
	distinct(): any;
	pipe<B>(...operators: Array<(stream: any) => any>): any;
}

function _isObservableLite(value: any): value is ObservableLite<any> {
	return value instanceof ObservableLite;
}

function _isStatefulStream(value: any): value is { run: Function; __purity?: string } {
	return value && typeof value.run === 'function';
}

export function addCommonOps(proto: any): any {
	if (!proto) return proto;

	// Functor
	if (typeof proto.map !== 'function') {
		proto.map = function<B>(f: (a: any) => B): any {
			if (_isObservableLite(this)) {
				const result = (ObservableLite.prototype.map as any).call(this, f);
				return attachPurityMarker(result as any, 'Pure');
			}
			throw new Error('map not available on this stream type');
		};
	}

	// Filter
	if (typeof proto.filter !== 'function') {
		proto.filter = function(pred: (a: any) => boolean): any {
			if (_isObservableLite(this)) {
				const result = (ObservableLite.prototype.filter as any).call(this, pred);
				return attachPurityMarker(result as any, 'Pure');
			}
			throw new Error('filter not available on this stream type');
		};
	}

	// FilterMap
	if (typeof proto.filterMap !== 'function') {
		proto.filterMap = function<B>(f: (a: any) => B | undefined): any {
			if (_isObservableLite(this)) {
				const mapped = (ObservableLite.prototype.map as any).call(this, f);
				const filtered = (ObservableLite.prototype.filter as any).call(mapped, (x: any) => x !== undefined);
				return attachPurityMarker(filtered as any, 'Pure');
			}
			throw new Error('filterMap not available on this stream type');
		};
	}

	// Scan
	if (typeof proto.scan !== 'function') {
		proto.scan = function<B>(reducer: (acc: B, value: any) => B, seed: B): any {
			if (_isObservableLite(this)) {
				const result = (ObservableLite.prototype.scan as any).call(this, reducer, seed);
				return attachPurityMarker(result as any, 'State');
			}
			throw new Error('scan not available on this stream type');
		};
	}

	// Chain/flatMap
	proto.chain = function<B>(f: (a: any) => any): any {
		if (_isObservableLite(this)) {
			const result = ObservableLite.prototype.flatMap.call(this, f);
			return attachPurityMarker(result as any, 'State');
		}
		throw new Error('chain not available on this stream type');
	};
	proto.flatMap = function<B>(f: (a: any) => any): any {
		return this.chain(f);
	};

	// Bifunctor-like helpers
	if (typeof proto.bimap !== 'function') {
		proto.bimap = function<B, C>(f: (a: any) => B, g: (err: any) => C): any {
			if (_isObservableLite(this)) {
				const result = (ObservableLite.prototype.bimap as any).call(this, f, g);
				return attachPurityMarker(result as any, 'Pure');
			}
			throw new Error('bimap not available on this stream type');
		};
	}
	if (typeof proto.bichain !== 'function') {
		proto.bichain = function<L, R>(left: (l: L) => any, right: (r: R) => any): any {
			if (_isObservableLite(this) && typeof this.bichain === 'function') {
				const result = this.bichain(left, right);
				return attachPurityMarker(result as any, 'State');
			}
			throw new Error('bichain not available on this stream type');
		};
	}

	// Utility
	if (typeof proto.take !== 'function') {
		proto.take = function(count: number): any {
			if (_isObservableLite(this)) {
				const result = (ObservableLite.prototype.take as any).call(this, count);
				return attachPurityMarker(result as any, 'State');
			}
			throw new Error('take not available on this stream type');
		};
	}
	if (typeof proto.skip !== 'function') {
		proto.skip = function(count: number): any {
			if (_isObservableLite(this)) {
				const result = (ObservableLite.prototype.skip as any).call(this, count);
				return attachPurityMarker(result as any, 'State');
			}
			throw new Error('skip not available on this stream type');
		};
	}
	if (typeof proto.distinct !== 'function') {
		proto.distinct = function(): any {
			if (_isObservableLite(this)) {
				const result = (ObservableLite.prototype.distinct as any).call(this);
				return attachPurityMarker(result as any, 'State');
			}
			throw new Error('distinct not available on this stream type');
		};
	}

	// Pipe
	if (typeof proto.pipe !== 'function') {
		proto.pipe = function<B>(...operators: Array<(stream: any) => any>): any {
			let result: any = this;
			for (const op of operators) {
				result = op(result);
			}
			if (_isObservableLite(this)) {
				const purity = (extractPurityMarker(this as any)?.effect) || 'Async';
				return attachPurityMarker(result as any, purity);
			}
			return result;
		};
	}

	return proto;
}

export function addOptimizedOps(proto: any): any {
    if (!proto) return proto;
    // Add noop optimized variants matching the mixin API to maintain parity
    if (typeof proto._map !== 'function') proto._map = function(fn: (a: any) => any) { return this.map(fn); };
    if (typeof proto._filter !== 'function') proto._filter = function(pred: (a: any) => boolean) { return this.filter(pred); };
    if (typeof proto._filterMap !== 'function') proto._filterMap = function(fn: (a: any) => any) { return (this.map as any)(fn).filter((x: any) => x !== undefined); };
    if (typeof proto._scan !== 'function') proto._scan = function(reducer: (acc: any, v: any) => any, seed: any) { return this.scan(reducer, seed); };
    if (typeof proto._chain !== 'function') proto._chain = function(fn: (a: any) => any) { return this.chain(fn); };
    if (typeof proto._bichain !== 'function') proto._bichain = function(l: any, r: any) { return this.bichain ? this.bichain(l, r) : this.chain(r); };
    if (typeof proto._bimap !== 'function') proto._bimap = function(f: any, g: any) { return this.bimap ? this.bimap(f, g) : this.map(f); };
    if (typeof proto._take !== 'function') proto._take = function(n: number) { return this.take(n); };
    if (typeof proto._skip !== 'function') proto._skip = function(n: number) { return this.skip(n); };
    if (typeof proto._distinct !== 'function') proto._distinct = function() { return this.distinct(); };
    if (typeof proto._pipe !== 'function') proto._pipe = function(...ops: Array<(s: any) => any>) { return (this.pipe as any)(...ops); };
    return proto;
}

export const UnifiedStreamFunctor = {
	map: <A, B>(fa: CommonStreamOps<A>, f: (a: A) => B): any => fa.map(f)
};

export const UnifiedStreamMonad = {
	...UnifiedStreamFunctor,
	chain: <A, B>(fa: CommonStreamOps<A>, f: (a: A) => any): any => fa.chain(f)
};

export const UnifiedStreamBifunctor = {
	bimap: <A, B, C>(fa: CommonStreamOps<A>, f: (a: A) => B, g: (err: any) => C): any => fa.bimap(f, g)
};

export function applyCommonOps(target?: any): any {
	if (target) {
		addCommonOps(target);
		addOptimizedOps(target);
		return target;
	}
	if (typeof ObservableLite !== 'undefined') {
		addCommonOps(ObservableLite.prototype as any);
		addOptimizedOps(ObservableLite.prototype as any);
	}
	return undefined as any;
}

function _hasSameAPI(stream1: any, stream2: any): boolean {
	const methods = ['map', 'filter', 'scan', 'chain', 'bichain', 'take', 'skip', 'distinct', 'pipe'];
	for (const m of methods) {
		if (typeof stream1[m] !== typeof stream2[m]) return false;
	}
	return true;
}

function _createUnifiedStream<T>(source: any): CommonStreamOps<T> {
	if (_isObservableLite(source) || _isStatefulStream(source)) return source as any;
	throw new Error('Unsupported stream type');
}

export type AssertSame<T, U> = T extends U ? (U extends T ? true : never) : never;

// Named exports for external use, avoiding redeclare conflicts
export const isObservableLite = _isObservableLite;
export const isStatefulStream = _isStatefulStream;
export const hasSameAPI = _hasSameAPI;
export const createUnifiedStream = _createUnifiedStream;
