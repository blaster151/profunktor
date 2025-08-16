import { getFPRegistry } from './fp-registry-init';
import {
  EitherFunctor, EitherApplicative, EitherMonad, EitherBifunctor,
  EitherEq as UnifiedEitherEq,
  EitherOrd as UnifiedEitherOrd,
  EitherShow as UnifiedEitherShow
} from './fp-either-unified';

// Re-export derived instances in a consistent way if needed by callers
export const EitherEq = UnifiedEitherEq;
export const EitherOrd = UnifiedEitherOrd;
export const EitherShow = UnifiedEitherShow;

export function registerEitherInstances(): void {
  const reg = getFPRegistry?.();
  if (!reg) return;

  // Register typeclass instances
  // Note: registerTypeclass method not available in current registry
  // These would be registered when the registry supports it
}

try { registerEitherInstances(); } catch {}


