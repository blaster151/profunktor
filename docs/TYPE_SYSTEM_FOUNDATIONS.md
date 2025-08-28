# Type System Foundations: HKT, HOK, and Typeclasses

This document consolidates the core type-level foundations powering the library: Higher-Kinded Types (HKT), Higher-Order Kinds (HOK), and the FP typeclass suite built atop them.

---

## 1) HKT — Higher-Kinded Types Overview
- Core types: `Kind<Args>`, `Apply<F, Args>`, and shorthands `Kind1`, `Kind2`.
- Type constructors as first-class: write instances generically over any `Kind1`/`Kind2`.
- Generic algorithms (`lift2`, `composeK`, `sequence`, `traverse`) work across any compliant constructor.

Example (Kind1 functor):
```typescript
interface Functor<F extends Kind1> {
  map<A,B>(fa: Apply<F,[A]>, f: (a:A)=>B): Apply<F,[B]>;
}
```

---

## 2) HOK — Higher-Order Kinds
- Treat type constructors as inputs/outputs of type-level functions.
- Adds `HigherKind<In,Out>` with utilities `KindInput<F>`, `KindOutput<F>`, composition `ComposeHOK`.
- Enables polymorphic typeclasses that operate uniformly across arities.

Comparison (before/after):
```typescript
// Before (HKT)
interface Bifunctor<F extends Kind2> { /* ... */ }

// After (HOK)
interface Bifunctor<F extends HigherKind<Kind2, Kind2>> { /* ... */ }
```

Benefits:
- More powerful abstraction and composition
- Cross-arity polymorphism
- Backward compatible with HKT-based code

---

## 3) FP Typeclass Suite
- Functor, Applicative, Monad for `Kind1`
- Bifunctor, Profunctor for `Kind2`
- Laws documented and expected (identity, composition, homomorphism, associativity, etc.)

Example signatures:
```typescript
interface Applicative<F extends Kind1> extends Functor<F> {
  of<A>(a:A): Apply<F,[A]>;
  ap<A,B>(fab: Apply<F,[(a:A)=>B]>, fa: Apply<F,[A]>): Apply<F,[B]>;
}

interface Profunctor<F extends Kind2> {
  dimap<A,B,C,D>(p: Apply<F,[A,B]>, f:(c:C)=>A, g:(b:B)=>D): Apply<F,[C,D]>;
}
```

---

## 4) Putting It Together
- Define HKT wrappers for your data types (e.g., `ArrayK`, `EitherK`, `TreeK`).
- Provide typeclass instances referencing those wrappers.
- Use generic algorithms that accept any compliant instance.
- For advanced composition or cross-arity abstractions, layer in HOK.

---

## 5) Example Patterns

### Deriving a Monad from minimal ops
```typescript
export function deriveMonad<F extends Kind1>(
  of: <A>(a:A)=>Apply<F,[A]>,
  chain: <A,B>(fa: Apply<F,[A]>, f:(a:A)=>Apply<F,[B]>)=>Apply<F,[B]>
){
  return {
    of, chain,
    map: <A,B>(fa: Apply<F,[A]>, f:(a:A)=>B)=> chain(fa, a=>of(f(a))),
    ap:  <A,B>(ff: Apply<F,[(a:A)=>B]>, fa: Apply<F,[A]>)=> chain(ff, f=>chain(fa, a=>of(f(a))))
  };
}
```

### Polymorphic Functor via HOK
```typescript
type AnyFunctor = Functor<HigherKind<KindAny, KindAny>>;
```

---

## 6) Laws and Testing
- Functor/Applicative/Monad laws enforced by suites.
- HKT laws (apply identity/composition, kind preservation).
- Keep instances law-abiding; test across multiple constructors.

---

## 7) Benefits and Roadmap
- Type safety, genericity, composability, extensibility, and zero-runtime overhead.
- Future: fuller Kind3 coverage, richer higher-order kind transformations, effect-tracking via phantom kinds, derivation macros, better IDE support.