// fp-either-derivation.ts
import {
  deriveEqInstance,
  deriveOrdInstance,
  deriveShowInstance,
} from './fp-derivation-helpers';
import { register } from './fp-registry-init';

export function registerEitherAll() {
  // Derive Eq/Ord/Show using generic union-aware defaults
  const eq = deriveEqInstance();
  const ord = deriveOrdInstance();
  const show = deriveShowInstance();

  // Store in minimal registry under namespaced keys
  register('typeclass:Either:Eq', eq);
  register('typeclass:Either:Ord', ord);
  register('typeclass:Either:Show', show);

  return { eq, ord, show };
}

// Auto-register at module load (idempotent-friendly)
try { registerEitherAll(); } catch {}


