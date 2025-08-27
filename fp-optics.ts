
// Prefer composing Traversals/Optics. Only lower to Bazaar at the edges.

// Re-export composition-friendly optics from core
export * from './fp-optics-core';
// Explicitly re-export unique/canonical symbols from everywhere and instances
export {
	OpticsFactory,
	withOptics,
	MaybeOptics,
	EitherOptics,
	ResultOptics,
	ArrayOptics,
	MapOptics,
	ObservableLiteWithOptics,
	OpticsMatcher,
	matchWithOptics,
	fuseOptics,
	observableWithNestedOptics,
	registerOpticsProfunctors,
	createOptics,
	createTypeOptics,
	composeOptics,
	lensTo,
	prismTo,
	hasOptics,
	isObservableWithOptics,
	isADT
} from './fp-optics-everywhere';
export {
	deriveLens,
	derivePrism,
	deriveOptional,
	matchWithOptic,
	opticMatch
} from './fp-optics-instances';

// Re-export RBazaar helpers
export { reifyBazaar, lowerRBazaar, composeRBazaar } from './fp-bazaar-reified';
export { Dialens, dialensH1, dialensH2, composeDialens, fromLens } from './fp-optics-dialens';
export { ClovenFibration, VCMor, composeVC, dualOf } from './fp-optics-fib-vertcart';
export { PLens, composePLens, plensFromDialens } from './fp-optics-plens';
export { Preoptic, StrictAction, toDialens as preopticToDialens } from './fp-optics-preoptic';
export { TernaryFactorization, Ambifibration, dualTernary } from './fp-optics-ambifibration';


