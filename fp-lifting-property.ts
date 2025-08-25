// fp-lifting-property.ts
// Lifting property implementation for SetMap

import { SetMap, isMono, isEpi, isSplitMono, isSplitEpi } from './fp-wfs-set';

/**
 * Check if a morphism has the lifting property with respect to another morphism.
 * 
 * The lifting property holds if either:
 * (a) π is a split epimorphism, OR
 * (b) ρ is a split monomorphism
 * 
 * For finite sets, we approximate this by checking:
 * - π is surjective (epi) and has a section, OR  
 * - ρ is injective (mono) and has a retraction
 */
export function hasLiftingProperty(pi: SetMap, rho: SetMap): boolean {
  // Case (a): π is a split epimorphism
  if (isSplitEpi(pi)) {
    return true;
  }
  
  // Case (b): ρ is a split monomorphism  
  if (isSplitMono(rho)) {
    return true;
  }
  
  return false;
}

// Re-export the types and functions from fp-wfs-set for convenience
export { SetMap, isMono, isEpi } from './fp-wfs-set';
