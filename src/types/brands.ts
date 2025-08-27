declare const __brand: unique symbol;
export type Brand<T, Tag extends string> = T & { readonly [__brand]: Tag };
export type D    = Brand<unknown, 'InfinitesimalD'>;
export type Φ    = Brand<unknown, 'Formula'>;
export type Term = Brand<unknown, 'Term'>;
declare const __FPKeyBrand: unique symbol;
export type FPKey = string & { readonly [__FPKeyBrand]: "FPKey" };
export const toFPKey = (s: string): FPKey => s as FPKey;
export type OpName = Brand<string, 'OpName'>;
export type ExprId = Brand<string, 'ExprId'>;
export interface Subobject<X> { readonly contains: (x: X) => boolean; }
