/**
 * Free Monad as Module over Cofree Comonad
 * 
 * Based on "Pattern runs on matter: The free monad monad as a module over the cofree comonad comonad"
 * by Sophie Libkind and David I. Spivak
 * 
 * Key insight: Free Monad (pattern) is a module over Cofree Comonad (matter)
 * via the module action Ξ: Mp ⊗ Cq → Mp⊗q
 */

import type { Kind1, Kind2, Apply } from './fp-hkt';
import type { Functor, Monad, Comonad } from './fp-typeclasses-hkt';

// ============================================================================
// CORE TYPES: Pattern (Free Monad) and Matter (Cofree Comonad)
// ============================================================================

/**
 * Free Monad - represents "terminating decision trees" (patterns)
 * 
 * "Whereas patterns start and end, matter is never destroyed."
 * Elements of mp are "well-founded trees" (finite height if p is finitary)
 */
export type FreeMonad<F extends Kind1, A> = 
  | { type: 'Pure'; value: A }
  | { type: 'Suspend'; f: Apply<F, [FreeMonad<F, A>]> };

/**
 * Cofree Comonad - represents "infinite behavior trees" (matter)
 * 
 * Elements of cq are "generally non-wellfounded" (e.g., infinite in height)
 */
export type CofreeComonad<F extends Kind1, A> = {
  extract: A;
  duplicate: CofreeComonad<F, CofreeComonad<F, A>>;
  extend: <B>(f: (wa: CofreeComonad<F, A>) => B) => CofreeComonad<F, B>;
};

// ============================================================================
// MODULE ACTION: Ξ (pattern runs on matter)
// ============================================================================

/**
 * Module Action Ξ: Mp ⊗ Cq → Mp⊗q
 * 
 * "The module map Ξp,q pairs the wellfounded tree with the non-wellfounded tree,
 * following the shape of the wellfounded one."
 */
export interface ModuleAction<Pattern, Matter, PatternMatter> {
  runOn: (pattern: Pattern, matter: Matter) => PatternMatter;
}

/**
 * Free Monad as Module over Cofree Comonad
 * 
 * This implements the core insight: Free Monad is a module over Cofree Comonad
 */
export interface FreeMonadModule<F extends Kind1> {
  // Module action: pattern runs on matter
  runOn: <A, B>(
    pattern: FreeMonad<F, A>,
    matter: CofreeComonad<F, B>
  ) => FreeMonad<F, [A, B]>;
  
  // Utility operations
  pure: <A>(a: A) => FreeMonad<F, A>;
  suspend: <A>(f: Apply<F, [FreeMonad<F, A>]>) => FreeMonad<F, A>;
}

// ============================================================================
// CONCRETE IMPLEMENTATIONS
// ============================================================================

/**
 * Free Monad implementation with module action
 */
export class FreeMonadImpl<F extends Kind1> implements FreeMonadModule<F> {
  constructor(private functor: Functor<F>) {}

  pure<A>(a: A): FreeMonad<F, A> {
    return { type: 'Pure', value: a };
  }

  suspend<A>(f: Apply<F, [FreeMonad<F, A>]>): FreeMonad<F, A> {
    return { type: 'Suspend', f };
  }

  /**
   * Core module action: pattern runs on matter
   * 
   * This implements the formula: Ξp,q: Mp ⊗ Cq → Mp⊗q
   */
  runOn<A, B>(
    pattern: FreeMonad<F, A>,
    matter: CofreeComonad<F, B>
  ): FreeMonad<F, [A, B]> {
    switch (pattern.type) {
      case 'Pure':
        // Pure pattern runs on matter by pairing values
        return this.pure([pattern.value, matter.extract]);
      
      case 'Suspend':
        // Suspend pattern runs on matter by suspending the interaction
        const suspendedMatter = matter.extend(m => m);
        const suspendedPattern = this.functor.map(
          pattern.f,
          (freeMonad) => this.runOn(freeMonad, suspendedMatter)
        );
        return this.suspend(suspendedPattern);
    }
  }

  /**
   * Fold a free monad into a concrete value
   */
  fold<A, R>(
    free: FreeMonad<F, A>,
    pure: (a: A) => R,
    suspend: (f: Apply<F, [R]>) => R
  ): R {
    switch (free.type) {
      case 'Pure':
        return pure(free.value);
      case 'Suspend':
        const mapped = this.functor.map(free.f, (f) => this.fold(f, pure, suspend));
        return suspend(mapped);
    }
  }
}

// ============================================================================
// COFREE COMONAD IMPLEMENTATION
// ============================================================================

/**
 * Cofree Comonad implementation
 */
export class CofreeComonadImpl<F extends Kind1> {
  constructor(private functor: Functor<F>) {}

  /**
   * Create a cofree comonad from a coalgebra
   */
  unfold<A, B>(
    coalgebra: (b: B) => [A, Apply<F, [B]>]
  ): (b: B) => CofreeComonad<F, A> {
    return (b: B) => {
      const [a, fb] = coalgebra(b);
      return {
        extract: a,
        duplicate: this.unfold(coalgebra)(b),
        extend: <C>(f: (wa: CofreeComonad<F, A>) => C) => {
          const mapped = this.functor.map(fb, (nextB) => 
            this.unfold(coalgebra)(nextB)
          );
          return {
            extract: f(this.unfold(coalgebra)(b)),
            duplicate: this.unfold(coalgebra)(b),
            extend: <D>(g: (wc: CofreeComonad<F, C>) => D) => 
              this.unfold(coalgebra)(b)
          };
        }
      };
    };
  }
}

// ============================================================================
// REAL-WORLD APPLICATIONS (from the paper)
// ============================================================================

/**
 * Application 1: Interviews run on people
 */
export interface Interview<Q, A> {
  question: Q;
  next: (answer: A) => Interview<Q, A> | null;
}

export interface Person<Q, A> {
  respond: (question: Q) => A;
  state: any; // Person's internal state
}

export function interviewRunsOnPerson<Q, A>(
  interview: Interview<Q, A>,
  person: Person<Q, A>
): FreeMonad<any, [Q, A][]> {
  // Convert interview to free monad (pattern)
  const interviewPattern = convertInterviewToFreeMonad(interview);
  
  // Convert person to cofree comonad (matter)
  const personMatter = convertPersonToCofreeComonad(person);
  
  // Pattern runs on matter
  return new FreeMonadImpl({} as any).runOn(interviewPattern, personMatter);
}

/**
 * Application 2: Programs run on operating systems
 */
export interface Program<I, O> {
  input: I;
  compute: (i: I) => O;
  next: (o: O) => Program<I, O> | null;
}

export interface OperatingSystem<I, O> {
  execute: (input: I) => O;
  resources: any; // OS resources
}

export function programRunsOnOS<I, O>(
  program: Program<I, O>,
  os: OperatingSystem<I, O>
): FreeMonad<any, [I, O][]> {
  // Convert program to free monad (pattern)
  const programPattern = convertProgramToFreeMonad(program);
  
  // Convert OS to cofree comonad (matter)
  const osMatter = convertOSToCofreeComonad(os);
  
  // Pattern runs on matter
  return new FreeMonadImpl({} as any).runOn(programPattern, osMatter);
}

/**
 * Application 3: Voting schemes run on voters
 */
export interface VotingScheme<Ballot, Result> {
  collect: (ballot: Ballot) => void;
  tally: () => Result;
  next: (result: Result) => VotingScheme<Ballot, Result> | null;
}

export interface Voter<Ballot, Result> {
  vote: () => Ballot;
  preferences: any; // Voter's preferences
}

export function votingSchemeRunsOnVoters<Ballot, Result>(
  scheme: VotingScheme<Ballot, Result>,
  voters: Voter<Ballot, Result>[]
): FreeMonad<any, [Ballot, Result][]> {
  // Convert scheme to free monad (pattern)
  const schemePattern = convertVotingSchemeToFreeMonad(scheme);
  
  // Convert voters to cofree comonad (matter)
  const votersMatter = convertVotersToCofreeComonad(voters);
  
  // Pattern runs on matter
  return new FreeMonadImpl({} as any).runOn(schemePattern, votersMatter);
}

/**
 * Application 4: Games run on players
 */
export interface Game<Move, State> {
  initialState: State;
  validMoves: (state: State) => Move[];
  applyMove: (state: State, move: Move) => State;
  isTerminal: (state: State) => boolean;
}

export interface Player<Move, State> {
  chooseMove: (state: State, validMoves: Move[]) => Move;
  strategy: any; // Player's strategy
}

export function gameRunsOnPlayers<Move, State>(
  game: Game<Move, State>,
  players: Player<Move, State>[]
): FreeMonad<any, [State, Move][]> {
  // Convert game to free monad (pattern)
  const gamePattern = convertGameToFreeMonad(game);
  
  // Convert players to cofree comonad (matter)
  const playersMatter = convertPlayersToCofreeComonad(players);
  
  // Pattern runs on matter
  return new FreeMonadImpl({} as any).runOn(gamePattern, playersMatter);
}

// ============================================================================
// UTILITY FUNCTIONS (to be implemented)
// ============================================================================

function convertInterviewToFreeMonad<Q, A>(interview: Interview<Q, A>): FreeMonad<any, Q> {
  // Implementation would convert interview structure to free monad
  return { type: 'Pure', value: interview.question };
}

function convertPersonToCofreeComonad<Q, A>(person: Person<Q, A>): CofreeComonad<any, A> {
  // Implementation would convert person behavior to cofree comonad
  return {
    extract: person.respond({} as Q),
    duplicate: {} as any,
    extend: () => ({} as any)
  };
}

function convertProgramToFreeMonad<I, O>(program: Program<I, O>): FreeMonad<any, I> {
  return { type: 'Pure', value: program.input };
}

function convertOSToCofreeComonad<I, O>(os: OperatingSystem<I, O>): CofreeComonad<any, O> {
  return {
    extract: os.execute({} as I),
    duplicate: {} as any,
    extend: () => ({} as any)
  };
}

function convertVotingSchemeToFreeMonad<Ballot, Result>(scheme: VotingScheme<Ballot, Result>): FreeMonad<any, Ballot> {
  return { type: 'Pure', value: {} as Ballot };
}

function convertVotersToCofreeComonad<Ballot, Result>(voters: Voter<Ballot, Result>[]): CofreeComonad<any, Result> {
  return {
    extract: {} as Result,
    duplicate: {} as any,
    extend: () => ({} as any)
  };
}

function convertGameToFreeMonad<Move, State>(game: Game<Move, State>): FreeMonad<any, State> {
  return { type: 'Pure', value: game.initialState };
}

function convertPlayersToCofreeComonad<Move, State>(players: Player<Move, State>[]): CofreeComonad<any, Move> {
  return {
    extract: {} as Move,
    duplicate: {} as any,
    extend: () => ({} as any)
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  FreeMonad,
  CofreeComonad,
  ModuleAction,
  FreeMonadModule,
  FreeMonadImpl,
  CofreeComonadImpl,
  interviewRunsOnPerson,
  programRunsOnOS,
  votingSchemeRunsOnVoters,
  gameRunsOnPlayers
};


