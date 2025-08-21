import { describe, it, expect } from 'vitest';
import { LazyCofree, lazyCofree } from '../fp-cofree-lazy';
import { AsyncLazyCofree, liftToAsync } from '../fp-cofree-async';
import { MaybeGADT, MaybeGADTK } from '../fp-gadt-enhanced';

describe('Cofree Integration Tests', () => {
  describe('LazyCofree - Basic functionality', () => {
    it('creates and accesses basic cofree structure', () => {
      const leaf = lazyCofree<MaybeGADTK, number>(
        42,
        () => MaybeGADT.Nothing()
      );

      expect(leaf.head).toBe(42);
      const tail = leaf.tail();
      expect(tail.tag).toBe('Nothing');
    });

    it('handles simple tree structure', () => {
      const child = lazyCofree<MaybeGADTK, number>(
        2,
        () => MaybeGADT.Nothing()
      );

      const tree = lazyCofree<MaybeGADTK, number>(
        1,
        () => MaybeGADT.Just(child)
      );

      expect(tree.head).toBe(1);
      const tail = tree.tail();
      expect(tail.tag).toBe('Just');
      if (tail.tag === 'Just') {
        expect(tail.payload.value.head).toBe(2);
      }
    });
  });

  describe('AsyncLazyCofree - Basic functionality', () => {
    it('lifts sync cofree to async', async () => {
      const syncTree = lazyCofree<MaybeGADTK, number>(
        10,
        () => MaybeGADT.Nothing()
      );

      const asyncTree = liftToAsync(syncTree);

      // Test head access (synchronous)
      const head = asyncTree.head;
      expect(head).toBe(10);

      // Test async tail evaluation
      const children = await asyncTree.tail();
      expect(children.tag).toBe('Nothing');
    });

    it('handles async tree with children', async () => {
      const child = lazyCofree<MaybeGADTK, number>(
        20,
        () => MaybeGADT.Nothing()
      );

      const syncTree = lazyCofree<MaybeGADTK, number>(
        10,
        () => MaybeGADT.Just(child)
      );

      const asyncTree = liftToAsync(syncTree);

      const head = asyncTree.head;
      expect(head).toBe(10);

      const children = await asyncTree.tail();
      expect(children.tag).toBe('Just');
      if (children.tag === 'Just') {
        expect(children.payload.value.head).toBe(20);
      }
    });
  });

  describe('Edge cases', () => {
    it('handles empty children', () => {
      const leaf = lazyCofree<MaybeGADTK, number>(
        42,
        () => MaybeGADT.Nothing()
      );

      expect(leaf.head).toBe(42);
      const tail = leaf.tail();
      expect(tail.tag).toBe('Nothing');
    });

    it('handles async empty children', async () => {
      const asyncTree = liftToAsync(
        lazyCofree<MaybeGADTK, number>(
          1,
          () => MaybeGADT.Nothing()
        )
      );

      const head = asyncTree.head;
      expect(head).toBe(1);

      const children = await asyncTree.tail();
      expect(children.tag).toBe('Nothing');
    });
  });
});
