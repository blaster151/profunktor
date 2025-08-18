/**
 * Ambient augmentations live here if we ever opt-in.
 * Keep this the **only** file with `declare global` or module augmentation to
 * avoid duplicate identifier errors.
 *
 * Example (disabled):
 *
 * // declare module './fp-maybe' {
 * //   interface Maybe<A> {
 * //     map<B>(f: (a:A)=>B): Maybe<B>;
 * //   }
 * // }
 *
 * // declare global {
 * //   interface Array<T> {
 * //     toMaybe(): Maybe<T>;
 * //   }
 * // }
 *
 * // declare module './fp-either' {
 * //   interface Either<L, R> {
 * //     bimap<L2, R2>(fL: (l:L)=>L2, fR: (r:R)=>R2): Either<L2, R2>;
 * //   }
 * // }
 */

// This export statement ensures the compiler recognizes this file as a module
export {};
