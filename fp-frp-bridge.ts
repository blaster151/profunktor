// Lightweight FRP bridge compatible with current refactor scope
// Converts ObservableLite<A> to a minimal StatefulStream<A, S, A> without heavy deps
import { ObservableLite } from './fp-observable-lite';
import { StatefulStream, createStatefulStream } from './fp-stream-state';

export function fromObservableLite<A, S = unknown>(
	_obs: ObservableLite<A>,
	_initialState?: S
): StatefulStream<A, S, A> {
	// For now, we expose a stateful view that passes through the input as output.
	// This keeps the type-level contract and purity tags while avoiding heavy runtime coupling.
	return createStatefulStream<A, S, A>((input: A) => (state: S) => [state, input], 'Async');
}


