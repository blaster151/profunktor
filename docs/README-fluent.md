## Fluent API (experimental)

This is an opt-in, explicit, and tree-shakeable fluent interface for working with unary typeclass instances.

```ts

import { fluent, withMonad } from './src/fluent';
import { EitherGADT, EitherGADTK } from './fp-gadt-enhanced';

const fa = EitherGADT.Right(2);
const result =
  withMonad({
    map: (fa, f) => fa.tag === 'Right' ? EitherGADT.Right(f(fa.payload.value)) : fa,
    of: (a) => EitherGADT.Right(a),
    ap: (ff, fa) => (ff.tag === 'Right' && fa.tag === 'Right')
      ? EitherGADT.Right(ff.payload.value(fa.payload.value))
      : ff.tag === 'Left' ? ff : fa,
    chain: (fa, f) => fa.tag === 'Right' ? f(fa.payload.value) : fa
  })(
    fluent(fa)
  )
  .map(x => x + 1)     // from WithFunctor
  .chain(x => EitherGADT.Right(x * 10))
  .value();
```

- No globals/proxies; explicit dictionaries keep this predictable and tree-shakeable.
- Methods are only available when you add the corresponding mixin (e.g., withMonad).
- Pairs perfectly with your ApplyLeft unary instances.
- Experimental and opt-in.
