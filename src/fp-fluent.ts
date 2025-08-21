/**
 * Fluent barrel - side-effect-free exports with explicit installer.
 * 
 * This module safely re-exports all fluent functionality without executing
 * any top-level installation code. Use installFluent() to opt-in to instance methods.
 */

// Re-export core utilities and types (no side effects)
export {
  SAFE_INSTALL_FLAG,
  getGlobal,
  alreadyInstalled,
  markInstalled,
  safeDefine,
  hasOwn,
  noopInstaller
} from './fp-fluent-core';

// Re-export fluent wrapper types and factories (no side effects)
// Point to actual fluent module under src/fluent
export {
  // basic surface re-exports guarded by that module
} from './fluent/fluent';

// Re-export traversal utilities (no side effects)
export { } from './fluent/typeclass-interfaces';

// Re-export ADT-aware composition helpers (no side effects)
export {
  mapMaybe,
  mapEither,
  chainMaybe,
  chainEither,
  matchMaybe,
  matchEither,
  composePrismLike
} from './fp-fluent-adt-complete';

// Re-export installer function WITHOUT calling it (no side effects)
export { } from './fluent/index';
