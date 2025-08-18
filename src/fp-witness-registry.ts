// src/fp-witness-registry.ts
// Minimal, centralized shapes for witnesses + a tiny registry.

export type Eq<A> = (x: A, y: A) => boolean;
export type Show<A> = (x: A) => string;
export type Gen<A> = (seed: number) => A; // tiny pure generator; runner will thread seed

// Core typeclass witnesses (extend as you like)
export interface FunctorW<F> { map<A,B>(fa: any, f:(a:A)=>B): any; }
export interface ApplicativeW<F> extends FunctorW<F> {
  of<A>(a:A): any; ap<A,B>(ff:any, fa:any): any;
}
export interface MonadW<F> extends ApplicativeW<F> { chain<A,B>(fa:any, f:(a:A)=>any): any; }

export interface ProfunctorW<P> { dimap<A,B,C,D>(p:any, f:(c:C)=>A, g:(b:B)=>D): any; }
export interface StrongW<P> extends ProfunctorW<P> { first<A,B,C>(p:any): any; }
export interface ChoiceW<P> extends ProfunctorW<P> { left<A,B,C>(p:any): any; }

export interface CategoryW<C> { id<A>(): any; compose<A,B,C>(g:any, f:any): any; }
export interface ArrowW<A_> extends CategoryW<A_> { arr<A,B>(f:(a:A)=>B): any; first<A,B,C>(p:any): any; }
export interface ArrowChoiceW<A_> extends ArrowW<A_> { left<A,B,C>(p:any): any; }

export type WitnessBag = Partial<{
  Eq: Eq<any>, Show: Show<any>, Gen: Gen<any>,
  Functor: FunctorW<any>, Applicative: ApplicativeW<any>, Monad: MonadW<any>,
  Profunctor: ProfunctorW<any>, Strong: StrongW<any>, Choice: ChoiceW<any>,
  Category: CategoryW<any>, Arrow: ArrowW<any>, ArrowChoice: ArrowChoiceW<any>
}>;

// Key a concrete instance by "name" (your HKT/profunctor id)
export interface InstanceRecord {
  name: string;
  tags: string[];        // e.g. ["Functor","Monad"] — decides which law suites attach
  witnesses: WitnessBag; // the actual dictionaries for this instance
}

const REGISTRY: InstanceRecord[] = [];

export function registerInstance(rec: InstanceRecord) { REGISTRY.push(rec); }
export function getRegistry(): readonly InstanceRecord[] { return REGISTRY; }

// Small helpers
export const has = (rec: InstanceRecord, tag: string) => rec.tags.includes(tag);
export const need = <K extends keyof WitnessBag>(rec: InstanceRecord, k: K) => {
  const w = rec.witnesses[k]; if (!w) throw new Error(`Missing witness ${String(k)} for ${rec.name}`);
  return w as NonNullable<typeof w>;
};
