// Minimal optics auto-derivation facade (adapter-backed, no global registry)

import { Lens, Prism, Traversal, lens, prism, traversal } from './fp-optics-adapter';

// Lightweight metadata types
export interface OpticsMetadata {
  name: string;
  adtName: string;
  opticType: 'Lens' | 'Prism' | 'Traversal';
  sourceType?: string;
  targetType?: string;
  constructor?: string;
  field?: string;
  optic?: any;
}

export interface ADTOptics {
  [key: string]: any;
}

export interface OpticsRegistry {
  optics: Map<string, ADTOptics>;
  metadata: Map<string, OpticsMetadata[]>;
  registerOptics(adtName: string, optics: ADTOptics, metadata?: OpticsMetadata[]): void;
  getOptics(adtName: string): ADTOptics | undefined;
  getOpticsMetadata(adtName: string): OpticsMetadata[] | undefined;
  getAllOptics(): Map<string, ADTOptics>;
}

class InMemoryOpticsRegistry implements OpticsRegistry {
  public optics = new Map<string, ADTOptics>();
  public metadata = new Map<string, OpticsMetadata[]>();
  registerOptics(adtName: string, optics: ADTOptics, metadata: OpticsMetadata[] = []): void {
    this.optics.set(adtName, optics);
    this.metadata.set(adtName, metadata);
  }
  getOptics(adtName: string): ADTOptics | undefined { return this.optics.get(adtName); }
  getOpticsMetadata(adtName: string): OpticsMetadata[] | undefined { return this.metadata.get(adtName); }
  getAllOptics(): Map<string, ADTOptics> { return this.optics; }
}

let singleton: OpticsRegistry | undefined;
export function getOpticsRegistry(): OpticsRegistry {
  if (!singleton) singleton = new InMemoryOpticsRegistry();
  return singleton;
}

export function initializeOptics(): void {
  // No-op in facade
}

export function getADTOptics(adtName: string): ADTOptics | undefined {
  return getOpticsRegistry().getOptics(adtName);
}

export function getADTOpticsMetadata(adtName: string): OpticsMetadata[] | undefined {
  return getOpticsRegistry().getOpticsMetadata(adtName);
}

// Convenience generators (adapter-backed)
export function fieldLens<K extends string>(key: K) {
  return <S extends Record<K, any>, T extends Record<K, any>, A, B>(): Lens<S, T, A, B> =>
    lens(
      (s: S) => s[key] as A,
      (b: B, s: S) => ({ ...s, [key]: b }) as unknown as T
    );
}

export function constructorPrism<Tag extends string>(tag: Tag) {
  return <S extends { tag: string; value?: any }, T, A, B>(): Prism<S, T, A, B> =>
    (prism(
      (s: S) =>
        s.tag === tag && (s as any).value !== undefined
          ? { tag: 'Just' as const, value: ((s as any).value as unknown as A) }
          : { tag: 'Nothing' as const },
      (b: B) => ({ tag, value: b } as unknown as T)
    ) as unknown as Prism<S, T, A, B>);
}

export function arrayTraversal<S extends any[], T extends any[], A, B>(): Traversal<S, T, A, B> {
  return traversal(
    (f: (a: A) => B, s: S) => s.map(f) as T,
    (s: S) => s as unknown as A[]
  );
}

export function objectTraversal<S extends Record<string, any>, T extends Record<string, any>, A, B>(): Traversal<S, T, A, B> {
  return traversal(
    (f: (a: A) => B, s: S) => {
      const out: Record<string, any> = {};
      for (const k of Object.keys(s)) out[k] = f((s as any)[k]);
      return out as T;
    },
    (s: S) => Object.values(s) as unknown as A[]
  );
}

export function isLens<S, T, A, B>(value: any): value is Lens<S, T, A, B> {
  return !!value && value.__type === 'Lens';
}
export function isPrism<S, T, A, B>(value: any): value is Prism<S, T, A, B> {
  return !!value && value.__type === 'Prism';
}
export function isTraversal<S, T, A, B>(value: any): value is Traversal<S, T, A, B> {
  return !!value && value.__type === 'Traversal';
}
