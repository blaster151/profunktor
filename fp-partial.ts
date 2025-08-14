// fp-partial.ts
import { Kind1, Kind2, Kind3, Apply } from './fp-hkt';

// Type-level partials
export interface ApplyLeft<F extends Kind2, X> extends Kind1 {
  readonly type: Apply<F,[X, this['arg0']]>;
}
export interface ApplyRight<F extends Kind2, X> extends Kind1 {
  readonly type: Apply<F,[this['arg0'], X]>;
}
export interface Apply3Left<F extends Kind3, X,Y> extends Kind1 {
  readonly type: Apply<F,[X,Y,this['arg0']]>;
}

// Value-level dictionary lifters (example: map)
export function liftFunctorLeft<F extends Kind2, X>(Fmap: <A,B>(f: (a:A)=>B, fa: Apply<F,[X,A]>)=> Apply<F,[X,B]>) {
  return {
    map: <A,B>(fa: Apply<ApplyLeft<F,X>,[A]>, f: (a:A)=>B): Apply<ApplyLeft<F,X>,[B]> =>
      Fmap(f, fa as any) as any
  };
}
