/**
 * Effect Monads - Re-exports from complete implementation
 * 
 * This module re-exports the canonical effect monads from fp-effect-monads-complete.ts
 * to avoid duplicate class definitions and ensure consistency.
 */

// Re-export the canonical implementations including HKT definitions
export {
  IO,
  Task,
  State,
  IOK,
  TaskK,
  StateK,
  IOFunctor,
  IOApplicative,
  IOMonad,
  TaskFunctor,
  TaskApplicative,
  TaskMonad,
  StateFunctor,
  StateApplicative,
  StateMonad,
  IODerivedInstances,
  TaskDerivedInstances,
  StateDerivedInstances,
  deriveStateInstances,
  addIOFluentMethods,
  addTaskFluentMethods,
  addStateFluentMethods,
  registerEffectMonadInstances
} from './fp-effect-monads-complete';

// Re-export utility functions
export {
  ioToTask,
  unsafeTaskToIO,
  stateToIO,
  ioToState
} from './fp-effect-monads-complete'; 