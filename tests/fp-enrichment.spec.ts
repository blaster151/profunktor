import { describe, it, expect } from 'vitest';
import { 
  EnrichedCategory, 
  isSimplicial, 
  supportsGoodRealization, 
  ensureSimplicialRealization,
  enrichNone,
  enrichSimplicial,
  enrichTopological
} from './fp-enrichment';

interface Dummy { name: string; }

describe('fp-enrichment', () => {
  describe('isSimplicial', () => {
    it('returns true for simplicially enriched categories', () => {
      const E: EnrichedCategory<Dummy> = {
        base: { name: 'SimplicialSet' },
        enrichment: 'simplicial',
        hasStandardSimplices: true,
        hasGoodRealization: true,
      };

      expect(isSimplicial(E)).toBe(true);
    });

    it('returns false for non-simplicial enrichments', () => {
      const plain: EnrichedCategory<Dummy> = {
        base: { name: 'PlainSet' },
        enrichment: 'none',
      };

      const topological: EnrichedCategory<Dummy> = {
        base: { name: 'TopSpace' },
        enrichment: 'topological',
      };

      expect(isSimplicial(plain)).toBe(false);
      expect(isSimplicial(topological)).toBe(false);
    });
  });

  describe('supportsGoodRealization', () => {
    it('returns true when all Theorem 8.2 hypotheses are satisfied', () => {
      const E: EnrichedCategory<Dummy> = {
        base: { name: 'E' },
        enrichment: 'simplicial',
        hasStandardSimplices: true,
        hasGoodRealization: true,
      };

      expect(supportsGoodRealization(E)).toBe(true);
    });

    it('returns false when enrichment is not simplicial', () => {
      const plain: EnrichedCategory<Dummy> = {
        base: { name: 'PlainSet' },
        enrichment: 'none',
      };

      expect(supportsGoodRealization(plain)).toBe(false);
    });

    it('returns false when missing hasStandardSimplices', () => {
      const E: EnrichedCategory<Dummy> = {
        base: { name: 'E' },
        enrichment: 'simplicial',
        hasStandardSimplices: false,
        hasGoodRealization: true,
      };

      expect(supportsGoodRealization(E)).toBe(false);
    });

    it('returns false when missing hasGoodRealization', () => {
      const E: EnrichedCategory<Dummy> = {
        base: { name: 'E' },
        enrichment: 'simplicial',
        hasStandardSimplices: true,
        hasGoodRealization: false,
      };

      expect(supportsGoodRealization(E)).toBe(false);
    });

    it('returns false when both flags are missing', () => {
      const E: EnrichedCategory<Dummy> = {
        base: { name: 'E' },
        enrichment: 'simplicial',
        hasStandardSimplices: false,
        hasGoodRealization: false,
      };

      expect(supportsGoodRealization(E)).toBe(false);
    });

    it('returns false when flags are undefined', () => {
      const E: EnrichedCategory<Dummy> = {
        base: { name: 'E' },
        enrichment: 'simplicial',
      };

      expect(supportsGoodRealization(E)).toBe(false);
    });
  });

  describe('ensureSimplicialRealization', () => {
    it('does not throw when prerequisites are satisfied', () => {
      const E: EnrichedCategory<Dummy> = {
        base: { name: 'E' },
        enrichment: 'simplicial',
        hasStandardSimplices: true,
        hasGoodRealization: true,
      };

      expect(() => ensureSimplicialRealization(E, 'homotopy-colimit')).not.toThrow();
    });

    it('throws an explanatory error when enrichment is missing', () => {
      const E: EnrichedCategory<Dummy> = {
        base: { name: 'PlainSet' },
        enrichment: 'none',
      };

      expect(() => ensureSimplicialRealization(E, 'homotopy-colimit')).toThrowError(
        /requires simplicial enrichment/
      );
      expect(() => ensureSimplicialRealization(E, 'homotopy-colimit')).toThrowError(
        /Got enrichment=none/
      );
    });

    it('throws an explanatory error when hasStandardSimplices is missing', () => {
      const E: EnrichedCategory<Dummy> = {
        base: { name: 'E' },
        enrichment: 'simplicial',
        hasStandardSimplices: false,
        hasGoodRealization: true,
      };

      expect(() => ensureSimplicialRealization(E, 'bousfield-kan')).toThrowError(
        /hasStandardSimplices=false/
      );
    });

    it('throws an explanatory error when hasGoodRealization is missing', () => {
      const E: EnrichedCategory<Dummy> = {
        base: { name: 'E' },
        enrichment: 'simplicial',
        hasStandardSimplices: true,
        hasGoodRealization: false,
      };

      expect(() => ensureSimplicialRealization(E, 'realization-functor')).toThrowError(
        /hasGoodRealization=false/
      );
    });

    it('includes the feature name in the error message', () => {
      const E: EnrichedCategory<Dummy> = {
        base: { name: 'E' },
        enrichment: 'none',
      };

      expect(() => ensureSimplicialRealization(E, 'my-special-feature')).toThrowError(
        /Feature "my-special-feature"/
      );
    });

    it('references Theorem 8.2 in the error message', () => {
      const E: EnrichedCategory<Dummy> = {
        base: { name: 'E' },
        enrichment: 'none',
      };

      expect(() => ensureSimplicialRealization(E, 'test')).toThrowError(
        /See Thm\. 8\.2 \(Batanin–Berger\)/
      );
    });
  });

  describe('constructor helpers', () => {
    describe('enrichNone', () => {
      it('creates an enriched category with no enrichment', () => {
        const base = { name: 'PlainSet' };
        const enriched = enrichNone(base);

        expect(enriched.base).toBe(base);
        expect(enriched.enrichment).toBe('none');
        expect(enriched.hasStandardSimplices).toBeUndefined();
        expect(enriched.hasGoodRealization).toBeUndefined();
      });
    });

    describe('enrichSimplicial', () => {
      it('creates a simplicially enriched category with default flags', () => {
        const base = { name: 'SimplicialSet' };
        const enriched = enrichSimplicial(base);

        expect(enriched.base).toBe(base);
        expect(enriched.enrichment).toBe('simplicial');
        expect(enriched.hasStandardSimplices).toBe(false);
        expect(enriched.hasGoodRealization).toBe(false);
      });

      it('creates a simplicially enriched category with custom flags', () => {
        const base = { name: 'SimplicialSet' };
        const enriched = enrichSimplicial(base, true, true);

        expect(enriched.base).toBe(base);
        expect(enriched.enrichment).toBe('simplicial');
        expect(enriched.hasStandardSimplices).toBe(true);
        expect(enriched.hasGoodRealization).toBe(true);
      });

      it('creates a simplicially enriched category with mixed flags', () => {
        const base = { name: 'SimplicialSet' };
        const enriched = enrichSimplicial(base, true, false);

        expect(enriched.base).toBe(base);
        expect(enriched.enrichment).toBe('simplicial');
        expect(enriched.hasStandardSimplices).toBe(true);
        expect(enriched.hasGoodRealization).toBe(false);
      });
    });

    describe('enrichTopological', () => {
      it('creates a topologically enriched category', () => {
        const base = { name: 'TopSpace' };
        const enriched = enrichTopological(base);

        expect(enriched.base).toBe(base);
        expect(enriched.enrichment).toBe('topological');
        expect(enriched.hasStandardSimplices).toBeUndefined();
        expect(enriched.hasGoodRealization).toBeUndefined();
      });
    });
  });

  describe('integration scenarios', () => {
    it('supports Theorem 8.2 use cases', () => {
      // Simulate a category that satisfies Theorem 8.2 hypotheses
      const sSet: EnrichedCategory<Dummy> = enrichSimplicial(
        { name: 'sSet' }, 
        true,  // hasStandardSimplices
        true   // hasGoodRealization
      );

      expect(supportsGoodRealization(sSet)).toBe(true);
      expect(() => ensureSimplicialRealization(sSet, 'bousfield-kan')).not.toThrow();
    });

    it('handles partial simplicial enrichment gracefully', () => {
      // Simulate a category with simplicial enrichment but missing some hypotheses
      const partial: EnrichedCategory<Dummy> = enrichSimplicial(
        { name: 'Partial' }, 
        false,  // no standard simplices
        true    // has good realization
      );

      expect(isSimplicial(partial)).toBe(true);
      expect(supportsGoodRealization(partial)).toBe(false);
      expect(() => ensureSimplicialRealization(partial, 'feature')).toThrow();
    });

    it('distinguishes between different enrichment types', () => {
      const plain = enrichNone({ name: 'Plain' });
      const simplicial = enrichSimplicial({ name: 'Simplicial' }, true, true);
      const topological = enrichTopological({ name: 'Topological' });

      expect(plain.enrichment).toBe('none');
      expect(simplicial.enrichment).toBe('simplicial');
      expect(topological.enrichment).toBe('topological');

      expect(isSimplicial(plain)).toBe(false);
      expect(isSimplicial(simplicial)).toBe(true);
      expect(isSimplicial(topological)).toBe(false);

      expect(supportsGoodRealization(plain)).toBe(false);
      expect(supportsGoodRealization(simplicial)).toBe(true);
      expect(supportsGoodRealization(topological)).toBe(false);
    });
  });
});
