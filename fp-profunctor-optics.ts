// Minimal Profunctor Optics facade (adapter-backed)
// Stable surface for demos/docs without heavy profunctor machinery.

import {
  lens,
  prism,
  optional,
  traversal,
  view,
  set,
  over,
  preview,
  review,
  isLens,
  isPrism,
  isOptional,
  isTraversal,
  arrayTraversal,
  valuesTraversal,
  keysTraversal,
  nestedArrayTraversal,
  composeTraversalWithOptic,
  composeTraversalTraversal,
  composeTraversalLens,
  composeTraversalPrism,
  composeTraversalOptional
} from './fp-optics';

export type { Lens, Prism, Optional, Traversal } from './fp-optics';

export const OpticsAPI = {
  lens,
  prism,
  optional,
  traversal,
  view,
  set,
  over,
  preview,
  review,
  isLens,
  isPrism,
  isOptional,
  isTraversal,
  arrayTraversal,
  valuesTraversal,
  keysTraversal,
  nestedArrayTraversal,
  composeTraversalWithOptic,
  composeTraversalTraversal,
  composeTraversalLens,
  composeTraversalPrism,
  composeTraversalOptional
};

export {
  lens,
  prism,
  optional,
  traversal,
  view,
  set,
  over,
  preview,
  review,
  isLens,
  isPrism,
  isOptional,
  isTraversal,
  arrayTraversal,
  valuesTraversal,
  keysTraversal,
  nestedArrayTraversal,
  composeTraversalWithOptic,
  composeTraversalTraversal,
  composeTraversalLens,
  composeTraversalPrism,
  composeTraversalOptional
};


