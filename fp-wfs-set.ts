// fp-wfs-set.ts
// Weak Factorization Systems (WFS) on Set, following Goodwillie classification.
// Provides six canonical WFS, with simple finite-set testers for monos, epis, isos, etc.

export interface SetMap {
  domain: any[];
  codomain: any[];
  map: (x: any) => any;
}

function image(f: SetMap): any[] {
  return f.domain.map(f.map);
}

function unique(xs: any[]): any[] {
  return Array.from(new Set(xs));
}

export function isMono(f: SetMap): boolean {
  const seen = new Map<any, any>();
  for (const x of f.domain) {
    const y = f.map(x);
    if (seen.has(y)) return false;
    seen.set(y, x);
  }
  return true;
}

export function isEpi(f: SetMap): boolean {
  const imgs = new Set(image(f));
  return f.codomain.every((c) => imgs.has(c));
}

export function isIso(f: SetMap): boolean {
  return isMono(f) && isEpi(f);
}

// For simplicity: split monos/epis mean there exists a section/retraction.
// We approximate by checking existence of left/right inverse.
export function isSplitMono(f: SetMap): boolean {
  if (!isMono(f)) return false;
  
  // A split monomorphism must be injective AND have a retraction
  // For finite sets, this means the codomain must be a subset of the image
  // and we must be able to define a retraction for all elements in the codomain
  
  // Check if every element in codomain has a preimage (i.e., f is surjective onto its image)
  const image = new Set(f.domain.map(f.map));
  const codomainSet = new Set(f.codomain);
  
  // For a split mono, the codomain must be contained in the image
  // and we must be able to construct a retraction
  return Array.from(codomainSet).every(y => image.has(y));
}

export function isSplitEpi(f: SetMap): boolean {
  if (!isEpi(f)) return false;
  
  // A split epimorphism must be surjective AND have a section
  // For finite sets, this means we must be able to choose a preimage for each element
  
  // Check if we can construct a section
  // For each element in codomain, we need to be able to choose a preimage
  const section = new Map<any, any>();
  
  for (const y of f.codomain) {
    const preimages = f.domain.filter(x => f.map(x) === y);
    if (preimages.length === 0) {
      return false; // No preimage found
    }
    // Choose the first preimage (this is a valid choice for a section)
    section.set(y, preimages[0]);
  }
  
  // Verify it's actually a section: f ∘ section = id
  return f.codomain.every(y => {
    const x = section.get(y);
    return x !== undefined && f.map(x) === y;
  });
}

export interface WFS {
  cof: string;
  fib: string;
  description: string;
}

export const ALL_WFS: WFS[] = [
  { cof: "Isomorphisms", fib: "All", description: "(Iso, All)" },
  { cof: "All", fib: "Isomorphisms", description: "(All, Iso)" },
  { cof: "Monomorphisms", fib: "Epimorphisms", description: "(Mono, Epi)" },
  { cof: "Epimorphisms", fib: "Monomorphisms", description: "(Epi, Mono)" },
  { cof: "SplitMonomorphisms", fib: "SplitEpimorphisms", description: "(SplitMono, SplitEpi)" },
  { cof: "SplitEpimorphisms", fib: "SplitMonomorphisms", description: "(SplitEpi, SplitMono)" },
];
