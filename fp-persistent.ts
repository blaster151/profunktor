/**
 * Persistent Immutable Data Structures
 * 
 * This module provides persistent immutable collections with structural sharing
 * for efficient value-level performance without copying entire structures.
 * 
 * Features:
 * - PersistentList<T> - Efficient immutable list with O(log n) operations
 * - PersistentMap<K, V> - Hash Array Mapped Trie (HAMT) for efficient key-value storage
 * - PersistentSet<T> - Immutable set built on PersistentMap
 * - FP integration with typeclass instances
 * - Structural sharing for memory efficiency
 * - Transient mode for batch operations
 */

import {
  Kind1, Kind2, Kind3,
  Apply, Type, TypeArgs, KindArity, KindResult,
  ArrayK, MaybeK, EitherK, TupleK, FunctionK,
  Maybe, Either
} from './fp-hkt';

import {
  Functor, Applicative, Monad, Bifunctor,
  deriveFunctor, deriveApplicative, deriveMonad,
  lift2, composeK, sequence, traverse
} from './fp-typeclasses-hkt';



import { 
  deriveEqInstance, 
  deriveOrdInstance, 
  deriveShowInstance,
  deriveFunctorInstance,
  deriveApplicativeInstance,
  deriveMonadInstance,
  deriveBifunctorInstance
} from './fp-derivation-helpers';

import { applyFluentOps, FluentImpl } from './fp-fluent-api';

// ============================================================================
// Part 1: Internal Data Structures
// ============================================================================

/**
 * Internal node for PersistentList
 * Uses a vector trie structure for efficient random access and updates
 */
class ListNode<T> {
  constructor(
    public readonly elements: readonly T[],
    public readonly children: readonly ListNode<T>[],
    public readonly height: number
  ) {}
}

/**
 * Internal node for PersistentMap (HAMT)
 * Hash Array Mapped Trie node for efficient key-value storage
 */
class MapNode<K, V> {
  constructor(
    public readonly bitmap: number,
    public readonly children: readonly (MapNode<K, V> | [K, V])[]
  ) {}
}

/**
 * Transient wrapper for batch operations
 * Allows efficient batch mutations that yield immutable results
 */
class Transient<T> {
  private isMutable = true;
  
  constructor(private data: T) {}
  
  get(): T {
    if (!this.isMutable) {
      throw new Error('Transient has been frozen');
    }
    return this.data;
  }
  
  set(data: T): void {
    if (!this.isMutable) {
      throw new Error('Transient has been frozen');
    }
    this.data = data;
  }
  
  freeze(): T {
    this.isMutable = false;
    return this.data;
  }
}

// ============================================================================
// Part 2: PersistentList Implementation
// ============================================================================

/**
 * Persistent immutable list with structural sharing
 * Uses a vector trie for O(log n) random access and updates
 */
export class PersistentList<T> {
  private constructor(
    private readonly root: ListNode<T> | null,
    private readonly _size: number
  ) {}
  
  /**
   * Get the size of the list
   */
  get size(): number {
    return this._size;
  }
  
  /**
   * Create an empty persistent list
   */
  static empty<T>(): PersistentList<T> {
    return new PersistentList<T>(null, 0);
  }
  
  /**
   * Create a persistent list from an array
   */
  static fromArray<T>(arr: readonly T[]): PersistentList<T> {
    if (arr.length === 0) {
      return PersistentList.empty<T>();
    }
    
    // Build a balanced vector-trie: compute height from array length and branch factor (32)
    const BRANCH_FACTOR = 32;
    const height = Math.max(0, Math.ceil(Math.log(arr.length) / Math.log(BRANCH_FACTOR)) - 1);
    const root = PersistentList.createNode(arr, height);
    return new PersistentList<T>(root, arr.length);
  }
  
  /**
   * Create a persistent list from a single value
   */
  static of<T>(value: T): PersistentList<T> {
    return PersistentList.fromArray([value]);
  }
  
  /**
   * Get an element at the specified index
   */
  get(index: number): T | undefined {
    if (index < 0 || index >= this._size || !this.root) {
      return undefined;
    }
    
    return PersistentList.getAt(this.root, index, this.root.height);
  }
  
  /**
   * Append a value to the end of the list
   */
  append(value: T): PersistentList<T> {
    if (!this.root) {
      return PersistentList.of(value);
    }
    
    const newRoot = PersistentList.appendTo(this.root, value, this.root.height);
    return new PersistentList<T>(newRoot, this._size + 1);
  }
  
  /**
   * Prepend a value to the beginning of the list
   */
  prepend(value: T): PersistentList<T> {
    if (!this.root) {
      return PersistentList.of(value);
    }
    
    const newRoot = PersistentList.prependTo(this.root, value, this.root.height);
    return new PersistentList<T>(newRoot, this._size + 1);
  }
  
  /**
   * Insert a value at the specified index
   */
  insert(index: number, value: T): PersistentList<T> {
    if (index < 0 || index > this._size) {
      throw new Error(`Index ${index} out of bounds`);
    }
    
    if (index === 0) {
      return this.prepend(value);
    }
    
    if (index === this._size) {
      return this.append(value);
    }
    
    if (!this.root) {
      return PersistentList.of(value);
    }
    
    const newRoot = PersistentList.insertAt(this.root, index, value, this.root.height);
    return new PersistentList<T>(newRoot, this._size + 1);
  }
  
  /**
   * Remove an element at the specified index
   */
  remove(index: number): PersistentList<T> {
    if (index < 0 || index >= this._size || !this.root) {
      return this;
    }
    
    if (this._size === 1) {
      return PersistentList.empty<T>();
    }
    
    const newRoot = PersistentList.removeAt(this.root, index, this.root.height);
    return new PersistentList<T>(newRoot, this._size - 1);
  }
  
  /**
   * Update an element at the specified index
   */
  set(index: number, value: T): PersistentList<T> {
    if (index < 0 || index >= this._size || !this.root) {
      throw new Error(`Index ${index} out of bounds`);
    }
    
    const newRoot = PersistentList.setAt(this.root, index, value, this.root.height);
    return new PersistentList<T>(newRoot, this._size);
  }
  
  /**
   * Map over all elements
   */
  map<U>(fn: (value: T, index: number) => U): PersistentList<U> {
    const result: U[] = [];
    let index = 0;
    
    if (this.root) {
      PersistentList.traverseNode(this.root, (value) => {
        result.push(fn(value, index++));
      });
    }
    
    return PersistentList.fromArray(result);
  }
  
  /**
   * Filter elements
   */
  filter(fn: (value: T, index: number) => boolean): PersistentList<T> {
    const result: T[] = [];
    let index = 0;
    
    if (this.root) {
      PersistentList.traverseNode(this.root, (value) => {
        if (fn(value, index)) {
          result.push(value);
        }
        index++;
      });
    }
    
    return PersistentList.fromArray(result);
  }
  
  /**
   * Reduce from left to right
   */
  foldLeft<U>(initial: U, fn: (acc: U, value: T, index: number) => U): U {
    let acc = initial;
    let index = 0;
    
    if (this.root) {
      PersistentList.traverseNode(this.root, (value) => {
        acc = fn(acc, value, index++);
      });
    }
    
    return acc;
  }
  
  /**
   * Reduce from right to left
   */
  foldRight<U>(initial: U, fn: (acc: U, value: T, index: number) => U): U {
    let acc = initial;
    const elements: T[] = [];
    
    if (this.root) {
      PersistentList.traverseNode(this.root, (value) => {
        elements.push(value);
      });
    }
    
    // Process elements in reverse order
    for (let i = elements.length - 1; i >= 0; i--) {
      acc = fn(acc, elements[i], i);
    }
    
    return acc;
  }
  
  /**
   * Convert to array
   */
  toArray(): readonly T[] {
    const result: T[] = [];
    
    if (this.root) {
      PersistentList.traverseNode(this.root, (value) => {
        result.push(value);
      });
    }
    
    return result;
  }

  /**
   * Reduce from left to right (alias for foldLeft)
   */
  reduce<U>(fn: (acc: U, value: T, index: number) => U, initial: U): U {
    return this.foldLeft(initial, fn);
  }
  
  /**
   * Get head and tail (for pattern matching)
   */
  head(): T | undefined {
    return this.get(0);
  }
  
  /**
   * Get tail (all elements except head)
   */
  tail(): PersistentList<T> {
    if (this._size <= 1) {
      return PersistentList.empty<T>();
    }
    
    const tailArray: T[] = [];
    let index = 0;
    
    if (this.root) {
      PersistentList.traverseNode(this.root, (value) => {
        if (index > 0) { // Skip the first element (head)
          tailArray.push(value);
        }
        index++;
      });
    }
    
    return PersistentList.fromArray(tailArray);
  }
  
  /**
   * Check if list is empty
   */
  isEmpty(): boolean {
    return this._size === 0;
  }
  
  /**
   * Iterator support
   */
  [Symbol.iterator](): Iterator<T> {
    // Cache all values once using traverseNode for O(n) performance
    const values: T[] = [];
    if (this.root) {
      PersistentList.traverseNode(this.root, (value) => {
        values.push(value);
      });
    }
    
    let index = 0;
    return {
      next: (): IteratorResult<T> => {
        if (index >= values.length) {
          return { done: true, value: undefined };
        }
        const value = values[index];
        index++;
        return { done: false, value };
      }
    };
  }
  
  /**
   * FlatMap operation for PersistentList
   */
  flatMap<U>(fn: (value: T, index: number) => PersistentList<U>): PersistentList<U> {
    const result: U[] = [];
    let index = 0;
    
    if (this.root) {
      PersistentList.traverseNode(this.root, (value) => {
        const mapped = fn(value, index);
        for (const v of mapped) {
          result.push(v);
        }
        index++;
      });
    }
    
    return PersistentList.fromArray(result);
  }

  /**
   * Concatenate this list with another list
   * @param other - The list to concatenate with
   * @returns A new list containing all elements from both lists
   */
  concat(other: PersistentList<T>): PersistentList<T> {
    if (other.isEmpty()) {
      return this;
    }
    if (this.isEmpty()) {
      return other;
    }
    
    // Use the optimized internal iterator for better performance
    const result: T[] = [];
    
    // Add elements from this list
    if (this.root) {
      PersistentList.traverseNode(this.root, (value) => {
        result.push(value);
      });
    }
    
    // Add elements from other list
    if (other.root) {
      PersistentList.traverseNode(other.root, (value) => {
        result.push(value);
      });
    }
    
    return PersistentList.fromArray(result);
  }

  /**
   * ForEach operation for PersistentList
   */
  forEach(fn: (value: T, index: number) => void): void {
    let index = 0;
    
    if (this.root) {
      PersistentList.traverseNode(this.root, (value) => {
        fn(value, index);
        index++;
      });
    }
  }


  
  // Private helper methods for internal operations
  private static createNode<T>(arr: readonly T[], height: number): ListNode<T> {
    const BRANCH_FACTOR = 32;
    const elements: T[] = [];
    const children: ListNode<T>[] = [];
    
    if (height === 0) {
      // Leaf node
      for (let i = 0; i < Math.min(arr.length, BRANCH_FACTOR); i++) {
        elements.push(arr[i]);
      }
    } else {
      // Internal node
      const childSize = Math.pow(BRANCH_FACTOR, height);
      for (let i = 0; i < Math.ceil(arr.length / childSize); i++) {
        const start = i * childSize;
        const end = Math.min(start + childSize, arr.length);
        const childArr = arr.slice(start, end);
        children.push(PersistentList.createNode(childArr, height - 1));
      }
    }
    
    return new ListNode(elements, children, height);
  }
  
  private static getAt<T>(node: ListNode<T>, index: number, height: number): T | undefined {
    const BRANCH_FACTOR = 32;
    
    if (height === 0) {
      // Leaf case: index should be modulo BRANCH_FACTOR since leaf can contain multiple leaves' worth of data
      return node.elements[index % BRANCH_FACTOR];
    }
    
    const childIndex = Math.floor(index / Math.pow(BRANCH_FACTOR, height));
    const childOffset = index % Math.pow(BRANCH_FACTOR, height);
    
    if (childIndex >= node.children.length) {
      return undefined;
    }
    
    const child = node.children[childIndex];
    return PersistentList.getAt(child, childOffset, height - 1);
  }
  
  private static appendTo<T>(node: ListNode<T>, value: T, height: number): ListNode<T> {
    const BRANCH_FACTOR = 32;
    
    if (height === 0) {
      const newElements = [...node.elements, value];
      return new ListNode(newElements, node.children, height);
    }
    
    const newChildren = [...node.children];
    if (newChildren.length === 0) {
      const child = PersistentList.createNode([value], height - 1);
      newChildren.push(child);
    } else {
      const lastChild = newChildren[newChildren.length - 1];
      const newLastChild = PersistentList.appendTo(lastChild, value, height - 1);
      newChildren[newChildren.length - 1] = newLastChild;
    }
    
    return new ListNode(node.elements, newChildren, height);
  }
  
  private static prependTo<T>(node: ListNode<T>, value: T, height: number): ListNode<T> {
    const BRANCH_FACTOR = 32;
    
    if (height === 0) {
      const newElements = [value, ...node.elements];
      return new ListNode(newElements, node.children, height);
    }
    
    const newChildren = [...node.children];
    if (newChildren.length === 0) {
      const child = PersistentList.createNode([value], height - 1);
      newChildren.unshift(child);
    } else {
      const firstChild = newChildren[0];
      const newFirstChild = PersistentList.prependTo(firstChild, value, height - 1);
      newChildren[0] = newFirstChild;
    }
    
    return new ListNode(node.elements, newChildren, height);
  }
  
  private static insertAt<T>(node: ListNode<T>, index: number, value: T, height: number): ListNode<T> {
    const BRANCH_FACTOR = 32;
    
    if (height === 0) {
      // Leaf case: index should be modulo BRANCH_FACTOR since leaf can contain multiple leaves' worth of data
      const newElements = [...node.elements];
      newElements.splice(index % BRANCH_FACTOR, 0, value);
      return new ListNode(newElements, node.children, height);
    }
    
    const childIndex = Math.floor(index / Math.pow(BRANCH_FACTOR, height));
    const childOffset = index % Math.pow(BRANCH_FACTOR, height);
    
    const newChildren = [...node.children];
    if (childIndex >= newChildren.length) {
      const child = PersistentList.createNode([value], height - 1);
      newChildren.push(child);
    } else {
      const child = newChildren[childIndex];
      const newChild = PersistentList.insertAt(child, childOffset, value, height - 1);
      newChildren[childIndex] = newChild;
    }
    
    return new ListNode(node.elements, newChildren, height);
  }
  
  private static removeAt<T>(node: ListNode<T>, index: number, height: number): ListNode<T> {
    const BRANCH_FACTOR = 32;
    
    if (height === 0) {
      // Leaf case: index should be modulo BRANCH_FACTOR since leaf can contain multiple leaves' worth of data
      const newElements = [...node.elements];
      newElements.splice(index % BRANCH_FACTOR, 1);
      return new ListNode(newElements, node.children, height);
    }
    
    const childIndex = Math.floor(index / Math.pow(BRANCH_FACTOR, height));
    const childOffset = index % Math.pow(BRANCH_FACTOR, height);
    
    const newChildren = [...node.children];
    const child = newChildren[childIndex];
    const newChild = PersistentList.removeAt(child, childOffset, height - 1);
    newChildren[childIndex] = newChild;
    
    return new ListNode(node.elements, newChildren, height);
  }
  
  private static setAt<T>(node: ListNode<T>, index: number, value: T, height: number): ListNode<T> {
    const BRANCH_FACTOR = 32;
    
    if (height === 0) {
      // Leaf case: index should be modulo BRANCH_FACTOR since leaf can contain multiple leaves' worth of data
      const newElements = [...node.elements];
      newElements[index % BRANCH_FACTOR] = value;
      return new ListNode(newElements, node.children, height);
    }
    
    const childIndex = Math.floor(index / Math.pow(BRANCH_FACTOR, height));
    const childOffset = index % Math.pow(BRANCH_FACTOR, height);
    
    const newChildren = [...node.children];
    const child = newChildren[childIndex];
    const newChild = PersistentList.setAt(child, childOffset, value, height - 1);
    newChildren[childIndex] = newChild;
    
    return new ListNode(node.elements, newChildren, height);
  }

  /**
   * Internal iterator that walks the trie structure in-order
   * This provides O(n) performance instead of O(n log n) for operations like map/filter/fold
   */
  private static traverseNode<T>(node: ListNode<T>, callback: (value: T) => void): void {
    if (node.height === 0) {
      // Leaf node: iterate over elements
      for (const element of node.elements) {
        callback(element);
      }
    } else {
      // Internal node: recursively traverse children
      for (const child of node.children) {
        PersistentList.traverseNode(child, callback);
      }
    }
  }
}

// ============================================================================
// Part 3: PersistentMap Implementation (HAMT)
// ============================================================================

/**
 * Persistent immutable map using Hash Array Mapped Trie (HAMT)
 * Provides O(log n) operations with structural sharing
 */
export class PersistentMap<K, V> {
  private constructor(
    private readonly root: MapNode<K, V> | null,
    private readonly _size: number
  ) {}
  
  /**
   * Get the size of the map
   */
  get size(): number {
    return this._size;
  }
  
  /**
   * Create an empty persistent map
   */
  static empty<K, V>(): PersistentMap<K, V> {
    return new PersistentMap<K, V>(null, 0);
  }
  
  /**
   * Create a persistent map from an object
   */
  static fromObject<T>(obj: Record<string, T>): PersistentMap<string, T> {
    const entries = Object.entries(obj);
    return PersistentMap.fromEntries(entries);
  }
  
  /**
   * Create a persistent map from entries
   */
  static fromEntries<K, V>(entries: readonly [K, V][]): PersistentMap<K, V> {
    let map = PersistentMap.empty<K, V>();
    for (const [key, value] of entries) {
      map = map.set(key, value);
    }
    return map;
  }
  
  /**
   * Get a value by key
   */
  get(key: K): V | undefined {
    if (!this.root) {
      return undefined;
    }
    
    const hash = this.hash(key);
    return PersistentMap.getFrom(this.root, key, hash, 0);
  }
  
  /**
   * Set a key-value pair
   */
  set(key: K, value: V): PersistentMap<K, V> {
    const hash = this.hash(key);
    
    if (!this.root) {
      const newRoot = new MapNode(1 << (hash & 31), [[key, value]]);
      return new PersistentMap<K, V>(newRoot, 1);
    }
    
    const newRoot = PersistentMap.setIn(this.root, key, value, hash, 0);
    const newSize = this.has(key) ? this._size : this._size + 1;
    return new PersistentMap<K, V>(newRoot, newSize);
  }
  
  /**
   * Delete a key
   */
  delete(key: K): PersistentMap<K, V> {
    if (!this.root) {
      return this;
    }
    
    const hash = this.hash(key);
    const newRoot = PersistentMap.deleteFrom(this.root, key, hash, 0);
    
    if (newRoot === this.root) {
      return this;
    }
    
    return new PersistentMap<K, V>(newRoot, this._size - 1);
  }
  
  /**
   * Check if key exists
   */
  has(key: K): boolean {
    return this.get(key) !== undefined;
  }
  
  /**
   * Update a value if key exists
   */
  update(key: K, fn: (value: V) => V): PersistentMap<K, V> {
    const value = this.get(key);
    if (value === undefined) {
      return this;
    }
    return this.set(key, fn(value));
  }
  
  /**
   * Map over all values
   */
  map<U>(fn: (value: V, key: K) => U): PersistentMap<K, U> {
    const entries: [K, U][] = [];
    for (const [key, value] of this.entries()) {
      entries.push([key, fn(value, key)]);
    }
    return PersistentMap.fromEntries(entries);
  }
  
  /**
   * Filter entries
   */
  filter(fn: (value: V, key: K) => boolean): PersistentMap<K, V> {
    const entries: [K, V][] = [];
    for (const [key, value] of this.entries()) {
      if (fn(value, key)) {
        entries.push([key, value]);
      }
    }
    return PersistentMap.fromEntries(entries);
  }
  
  /**
   * Get all keys
   */
  *keys(): IterableIterator<K> {
    for (const [k] of this.entries()) yield k;
  }
  
  /**
   * Get all values
   */
  *values(): IterableIterator<V> {
    for (const [, v] of this.entries()) yield v;
  }
  
  /**
   * Get all entries
   */
  entries(): Iterable<[K, V]> {
    const result: [K, V][] = [];
    if (this.root) {
      PersistentMap.collectEntries(this.root, result);
    }
    return result;
  }
  
  /**
   * Convert to object (for string keys)
   */
  toObject(): Record<string, V> {
    const obj: Record<string, V> = {};
    for (const [key, value] of this.entries()) {
      if (typeof key === 'string') {
        obj[key] = value;
      }
    }
    return obj;
  }
  
  /**
   * Check if map is empty
   */
  isEmpty(): boolean {
    return this._size === 0;
  }
  
  /**
   * Iterator support
   */
  [Symbol.iterator](): Iterator<[K, V]> {
    return this.entries()[Symbol.iterator]();
  }
  
  /**
   * FlatMap operation for PersistentMap
   */
  flatMap<U>(fn: (value: V, key: K) => PersistentMap<K, U>): PersistentMap<K, U> {
    const entries = Array.from(this.entries());
    const results: [K, U][] = [];
    for (const [k, v] of entries) {
      const mapped = fn(v, k);
      for (const [mk, mv] of mapped.entries()) {
        results.push([mk, mv]);
      }
    }
    return PersistentMap.fromEntries(results);
  }

  /**
   * ForEach operation for PersistentMap
   */
  forEach(fn: (value: V, key: K) => void): void {
    for (const [k, v] of this.entries()) {
      fn(v, k);
    }
  }


  
  // Private helper methods
  // Instance hash used by public APIs before delegating to static trie ops
  private hash(key: K): number {
    if (typeof key === 'string') {
      let hash = 0;
      for (let i = 0; i < key.length; i++) {
        const char = key.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash;
    }
    
    if (typeof key === 'number') {
      return key;
    }
    
    // Simple hash for other types
    return JSON.stringify(key).split('').reduce((hash, char) => {
      return ((hash << 5) - hash) + char.charCodeAt(0);
    }, 0);
  }
  
  // Static hash helper for use within static trie operations
  private static hashKeyStatic(key: unknown): number {
    if (typeof key === 'string') {
      let hash = 0;
      for (let i = 0; i < key.length; i++) {
        const char = key.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash;
    }
    if (typeof key === 'number') {
      return key;
    }
    return JSON.stringify(key as any).split('').reduce((hash, char) => {
      return ((hash << 5) - hash) + char.charCodeAt(0);
    }, 0);
  }
  
  private static getFrom<K, V>(node: MapNode<K, V>, key: K, hash: number, level: number): V | undefined {
    const mask = 31;
    const shift = level * 5;
    const index = (hash >> shift) & mask;
    const bit = 1 << index;
    
    if ((node.bitmap & bit) === 0) {
      return undefined;
    }
    
    const childIndex = PersistentMap.popCount(node.bitmap & (bit - 1));
    const child = node.children[childIndex];
    
    if (Array.isArray(child)) {
      const [childKey, childValue] = child;
      return key === childKey ? childValue : undefined;
    }
    
    return PersistentMap.getFrom(child, key, hash, level + 1);
  }
  
  private static setIn<K, V>(node: MapNode<K, V>, key: K, value: V, hash: number, level: number): MapNode<K, V> {
    const mask = 31;
    const shift = level * 5;
    const index = (hash >> shift) & mask;
    const bit = 1 << index;
    
    if ((node.bitmap & bit) === 0) {
      // Key doesn't exist, add it
      const childIndex = PersistentMap.popCount(node.bitmap & (bit - 1));
      const newChildren = [...node.children];
      newChildren.splice(childIndex, 0, [key, value]);
      return new MapNode(node.bitmap | bit, newChildren);
    }
    
    // Key exists, update it
    const childIndex = PersistentMap.popCount(node.bitmap & (bit - 1));
    const child = node.children[childIndex];
    const newChildren = [...node.children];
    
    if (Array.isArray(child)) {
      const [childKey, childValue] = child;
      if (key === childKey) {
        newChildren[childIndex] = [key, value];
        return new MapNode(node.bitmap, newChildren);
      } else {
        // Collision, create new node
        const newChild = PersistentMap.createCollisionNode(childKey, childValue, key, value, hash, level + 1);
        newChildren[childIndex] = newChild;
        return new MapNode(node.bitmap, newChildren);
      }
    } else {
      newChildren[childIndex] = PersistentMap.setIn(child, key, value, hash, level + 1);
      return new MapNode(node.bitmap, newChildren);
    }
  }
  
  private static deleteFrom<K, V>(node: MapNode<K, V>, key: K, hash: number, level: number): MapNode<K, V> | null {
    const mask = 31;
    const shift = level * 5;
    const index = (hash >> shift) & mask;
    const bit = 1 << index;
    
    if ((node.bitmap & bit) === 0) {
      return node;
    }
    
    const childIndex = PersistentMap.popCount(node.bitmap & (bit - 1));
    const child = node.children[childIndex];
    const newChildren = [...node.children];
    
    if (Array.isArray(child)) {
      const [childKey] = child;
      if (key === childKey) {
        newChildren.splice(childIndex, 1);
        const newBitmap = node.bitmap & ~bit;
        return newChildren.length === 0 ? null : new MapNode(newBitmap, newChildren);
      }
      return node;
    }
    
    const newChild = PersistentMap.deleteFrom(child, key, hash, level + 1);
    if (newChild === null) {
      newChildren.splice(childIndex, 1);
      const newBitmap = node.bitmap & ~bit;
      return newChildren.length === 0 ? null : new MapNode(newBitmap, newChildren);
    }
    
    newChildren[childIndex] = newChild;
    return new MapNode(node.bitmap, newChildren);
  }
  
  private static collectEntries<K, V>(node: MapNode<K, V>, result: [K, V][]): void {
    for (const child of node.children) {
      if (Array.isArray(child)) {
        result.push(child);
      } else {
        PersistentMap.collectEntries(child, result);
      }
    }
  }
  
  private static popCount(n: number): number {
    let count = 0;
    while (n > 0) {
      count += n & 1;
      n >>= 1;
    }
    return count;
  }
  
  private static createCollisionNode<K, V>(key1: K, value1: V, key2: K, value2: V, hash2: number, level: number): MapNode<K, V> {
    // Proper collision handling: descend by 5-bit slices until indices diverge.
    // If they diverge at this level, build a node with two leaves at their respective bits.
    // If they do not diverge, build a single-bit node whose child continues the descent.
    const mask = 31;
    const shift = level * 5;
    const h1 = PersistentMap.hashKeyStatic(key1);
    const h2 = hash2;
    const idx1 = (h1 >> shift) & mask;
    const idx2 = (h2 >> shift) & mask;
    if (idx1 !== idx2) {
      const bit1 = 1 << idx1;
      const bit2 = 1 << idx2;
      const bitmap = bit1 | bit2;
      // Children must be ordered by index to align with popCount-based addressing
      const children: readonly ([K, V] | MapNode<K, V>)[] = idx1 < idx2
        ? [[key1, value1], [key2, value2]]
        : [[key2, value2], [key1, value1]];
      return new MapNode(bitmap, children);
    }
    // Same index at this level – continue descending under a single-bit child
    const bit = 1 << idx1;
    // Recurse to construct the deeper structure
    const child = PersistentMap.createCollisionNode(key1, value1, key2, value2, hash2, level + 1);
    return new MapNode(bit, [child]);
  }
}

// ============================================================================
// Part 4: PersistentSet Implementation
// ============================================================================

/**
 * Persistent immutable set built on PersistentMap
 * Provides efficient add/remove operations with structural sharing
 */
export class PersistentSet<T> {
  private constructor(private readonly internalMap: PersistentMap<T, true>) {}
  
  /**
   * Get the size of the set
   */
  get size(): number {
    return this.internalMap.size;
  }
  
  /**
   * Create an empty persistent set
   */
  static empty<T>(): PersistentSet<T> {
    return new PersistentSet<T>(PersistentMap.empty<T, true>());
  }
  
  /**
   * Create a persistent set from an array
   */
  static fromArray<T>(arr: readonly T[]): PersistentSet<T> {
    let set = PersistentSet.empty<T>();
    for (const item of arr) {
      set = set.add(item);
    }
    return set;
  }
  
  /**
   * Add a value to the set
   */
  add(value: T): PersistentSet<T> {
    return new PersistentSet<T>(this.internalMap.set(value, true));
  }
  
  /**
   * Remove a value from the set
   */
  delete(value: T): PersistentSet<T> {
    return new PersistentSet<T>(this.internalMap.delete(value));
  }
  
  /**
   * Check if value exists in the set
   */
  has(value: T): boolean {
    return this.internalMap.has(value);
  }
  
  /**
   * Union with another set
   */
  union(other: PersistentSet<T>): PersistentSet<T> {
    let result: PersistentSet<T> = this;
    for (const value of other) {
      result = result.add(value);
    }
    return result;
  }
  
  /**
   * Intersection with another set
   */
  intersection(other: PersistentSet<T>): PersistentSet<T> {
    let result = PersistentSet.empty<T>();
    for (const value of this) {
      if (other.has(value)) {
        result = result.add(value);
      }
    }
    return result;
  }
  
  /**
   * Difference with another set
   */
  difference(other: PersistentSet<T>): PersistentSet<T> {
    let result = PersistentSet.empty<T>();
    for (const value of this) {
      if (!other.has(value)) {
        result = result.add(value);
      }
    }
    return result;
  }
  
  /**
   * Map over all values
   */
  map<U>(fn: (value: T) => U): PersistentSet<U> {
    const result: U[] = [];
    for (const value of this) {
      result.push(fn(value));
    }
    return PersistentSet.fromArray(result);
  }
  
  /**
   * Filter values
   */
  filter(fn: (value: T) => boolean): PersistentSet<T> {
    let result = PersistentSet.empty<T>();
    for (const value of this) {
      if (fn(value)) {
        result = result.add(value);
      }
    }
    return result;
  }
  
  /**
   * Convert to array
   */
  toArray(): readonly T[] {
    return Array.from(this);
  }
  
  /**
   * Check if set is empty
   */
  isEmpty(): boolean {
    return this.size === 0;
  }
  
  /**
   * Iterator support
   */
  [Symbol.iterator](): Iterator<T> {
    return this.internalMap.keys()[Symbol.iterator]();
  }

  /**
   * FlatMap operation for PersistentSet
   */
  flatMap<U>(fn: (value: T) => PersistentSet<U>): PersistentSet<U> {
    const results: U[] = [];
    for (const value of this) {
      const mapped = fn(value);
      for (const v of mapped) {
        results.push(v);
      }
    }
    return PersistentSet.fromArray(results);
  }

  /**
   * ForEach operation for PersistentSet
   */
  forEach(fn: (value: T) => void): void {
    for (const value of this) {
      fn(value);
    }
  }


}

// ============================================================================
// Part 5: FP Integration - Kind Wrappers
// ============================================================================

/**
 * Kind wrapper for PersistentList
 */
export interface PersistentListK extends Kind1 {
  readonly type: PersistentList<this['arg0']>;
}

/**
 * Kind wrapper for PersistentMap
 */
export interface PersistentMapK extends Kind2 {
  readonly type: PersistentMap<this['arg0'], this['arg1']>;
}

/**
 * Kind wrapper for PersistentSet
 */
export interface PersistentSetK extends Kind1 {
  readonly type: PersistentSet<this['arg0']>;
}

// ============================================================================
// Typeclass Instances (Derived)
// ============================================================================

/**
 * PersistentList derived instances
 */
export const PersistentListFunctor = deriveFunctorInstance<PersistentListK>({
  customMap: <A, B>(fa: PersistentList<A>, f: (a: A) => B): PersistentList<B> => 
    fa.map(f)
});

export const PersistentListApplicative = deriveApplicativeInstance<PersistentListK>({
  customMap: <A, B>(fa: PersistentList<A>, f: (a: A) => B): PersistentList<B> => 
    fa.map(f)
});

export const PersistentListMonad = deriveMonadInstance<PersistentListK>({
  customMap: <A, B>(fa: PersistentList<A>, f: (a: A) => B): PersistentList<B> => 
    fa.map(f),
  customChain: <A, B>(fa: PersistentList<A>, f: (a: A) => PersistentList<B>): PersistentList<B> => {
    const result: B[] = [];
    for (const a of fa) {
      for (const b of f(a)) {
        result.push(b);
      }
    }
    return PersistentList.fromArray(result);
  }
});

/**
 * PersistentList standard typeclass instances
 */
export const PersistentListEq = deriveEqInstance({
  customEq: <A>(a: PersistentList<A>, b: PersistentList<A>): boolean => {
    if (a.size !== b.size) return false;
    const arrA = a.toArray();
    const arrB = b.toArray();
    return arrA.every((val, idx) => val === arrB[idx]);
  }
});

export const PersistentListOrd = deriveOrdInstance({
  customOrd: <A>(a: PersistentList<A>, b: PersistentList<A>): number => {
    const arrA = a.toArray();
    const arrB = b.toArray();
    const minLength = Math.min(arrA.length, arrB.length);
    for (let i = 0; i < minLength; i++) {
      if (arrA[i] < arrB[i]) return -1;
      if (arrA[i] > arrB[i]) return 1;
    }
    return arrA.length - arrB.length;
  }
});

export const PersistentListShow = deriveShowInstance({
  customShow: <A>(a: PersistentList<A>): string => 
    `PersistentList(${JSON.stringify(a.toArray())})`
});

/**
 * PersistentMap derived instances
 */
export const PersistentMapFunctor = deriveFunctorInstance<PersistentMapK>({
  customMap: <A, B>(fa: PersistentMap<any, A>, f: (a: A) => B): PersistentMap<any, B> => 
    fa.map(f)
});

export const PersistentMapBifunctor = deriveBifunctorInstance<PersistentMapK>({
  customBimap: <A, B, C, D>(
    fab: PersistentMap<A, B>,
    f: (a: A) => C,
    g: (b: B) => D
  ): PersistentMap<C, D> => {
    const entries: [C, D][] = [];
    for (const [key, value] of fab.entries()) {
      entries.push([f(key), g(value)]);
    }
    return PersistentMap.fromEntries(entries);
  }
});

/**
 * PersistentMap standard typeclass instances
 */
export const PersistentMapEq = deriveEqInstance({
  customEq: <A, B>(a: PersistentMap<A, B>, b: PersistentMap<A, B>): boolean => {
    if (a.size !== b.size) return false;
    for (const [key, value] of a.entries()) {
      if (!b.has(key) || b.get(key) !== value) return false;
    }
    return true;
  }
});

export const PersistentMapOrd = deriveOrdInstance({
  customOrd: <A, B>(a: PersistentMap<A, B>, b: PersistentMap<A, B>): number => {
    if (a.size !== b.size) return a.size - b.size;
    const entriesA = Array.from(a.entries()).sort();
    const entriesB = Array.from(b.entries()).sort();
    for (let i = 0; i < entriesA.length; i++) {
      const [keyA, valueA] = entriesA[i];
      const [keyB, valueB] = entriesB[i];
      if (keyA < keyB) return -1;
      if (keyA > keyB) return 1;
      if (valueA < valueB) return -1;
      if (valueA > valueB) return 1;
    }
    return 0;
  }
});

export const PersistentMapShow = deriveShowInstance({
  customShow: <A, B>(a: PersistentMap<A, B>): string => 
    `PersistentMap(${JSON.stringify(Object.fromEntries(a.entries()))})`
});

/**
 * PersistentSet derived instances
 */
export const PersistentSetFunctor = deriveFunctorInstance<PersistentSetK>({
  customMap: <A, B>(fa: PersistentSet<A>, f: (a: A) => B): PersistentSet<B> => {
    const result: B[] = [];
    for (const value of fa) {
      result.push(f(value));
    }
    return PersistentSet.fromArray(result);
  }
});

/**
 * PersistentSet standard typeclass instances
 */
export const PersistentSetEq = deriveEqInstance({
  customEq: <A>(a: PersistentSet<A>, b: PersistentSet<A>): boolean => {
    if (a.size !== b.size) return false;
    for (const value of a) {
      if (!b.has(value)) return false;
    }
    return true;
  }
});

export const PersistentSetOrd = deriveOrdInstance({
  customOrd: <A>(a: PersistentSet<A>, b: PersistentSet<A>): number => {
    if (a.size !== b.size) return a.size - b.size;
    const arrA = [...a.toArray()].sort();
    const arrB = [...b.toArray()].sort();
    for (let i = 0; i < arrA.length; i++) {
      if (arrA[i] < arrB[i]) return -1;
      if (arrA[i] > arrB[i]) return 1;
    }
    return 0;
  }
});

export const PersistentSetShow = deriveShowInstance({
  customShow: <A>(a: PersistentSet<A>): string => 
    `PersistentSet(${JSON.stringify(a.toArray())})`
});

// ============================================================================
// Part 7: Transient Mode for Batch Operations
// ============================================================================

/**
 * Transient wrapper for batch operations on PersistentList
 */
export class TransientList<T> {
  private constructor(private transient: Transient<PersistentList<T>>) {}
  
  /**
   * Create a transient from a persistent list
   */
  static from<T>(list: PersistentList<T>): TransientList<T> {
    return new TransientList<T>(new Transient(list));
  }
  
  /**
   * Append a value
   */
  append(value: T): TransientList<T> {
    const list = this.transient.get();
    this.transient.set(list.append(value));
    return this;
  }
  
  /**
   * Prepend a value
   */
  prepend(value: T): TransientList<T> {
    const list = this.transient.get();
    this.transient.set(list.prepend(value));
    return this;
  }
  
  /**
   * Insert a value at index
   */
  insert(index: number, value: T): TransientList<T> {
    const list = this.transient.get();
    this.transient.set(list.insert(index, value));
    return this;
  }
  
  /**
   * Remove value at index
   */
  remove(index: number): TransientList<T> {
    const list = this.transient.get();
    this.transient.set(list.remove(index));
    return this;
  }
  
  /**
   * Set value at index
   */
  set(index: number, value: T): TransientList<T> {
    const list = this.transient.get();
    this.transient.set(list.set(index, value));
    return this;
  }
  
  /**
   * Freeze and return persistent list
   */
  freeze(): PersistentList<T> {
    return this.transient.freeze();
  }
}

/**
 * Transient wrapper for batch operations on PersistentMap
 */
export class TransientMap<K, V> {
  private constructor(private transient: Transient<PersistentMap<K, V>>) {}
  
  /**
   * Create a transient from a persistent map
   */
  static from<K, V>(map: PersistentMap<K, V>): TransientMap<K, V> {
    return new TransientMap<K, V>(new Transient(map));
  }
  
  /**
   * Set a key-value pair
   */
  set(key: K, value: V): TransientMap<K, V> {
    const map = this.transient.get();
    this.transient.set(map.set(key, value));
    return this;
  }
  
  /**
   * Delete a key
   */
  delete(key: K): TransientMap<K, V> {
    const map = this.transient.get();
    this.transient.set(map.delete(key));
    return this;
  }
  
  /**
   * Update a value
   */
  update(key: K, fn: (value: V) => V): TransientMap<K, V> {
    const map = this.transient.get();
    this.transient.set(map.update(key, fn));
    return this;
  }
  
  /**
   * Freeze and return persistent map
   */
  freeze(): PersistentMap<K, V> {
    return this.transient.freeze();
  }
}

/**
 * Transient wrapper for batch operations on PersistentSet
 */
export class TransientSet<T> {
  private constructor(private transient: Transient<PersistentSet<T>>) {}
  
  /**
   * Create a transient from a persistent set
   */
  static from<T>(set: PersistentSet<T>): TransientSet<T> {
    return new TransientSet<T>(new Transient(set));
  }
  
  /**
   * Add a value
   */
  add(value: T): TransientSet<T> {
    const set = this.transient.get();
    this.transient.set(set.add(value));
    return this;
  }
  
  /**
   * Delete a value
   */
  delete(value: T): TransientSet<T> {
    const set = this.transient.get();
    this.transient.set(set.delete(value));
    return this;
  }
  
  /**
   * Freeze and return persistent set
   */
  freeze(): PersistentSet<T> {
    return this.transient.freeze();
  }
}

// ============================================================================
// Part 8: Pattern Matching Support
// ============================================================================

/**
 * Pattern matching support for PersistentList
 */
export function matchList<T, R>(
  list: PersistentList<T>,
  patterns: {
    empty: () => R;
    cons: (head: T, tail: PersistentList<T>) => R;
  }
): R {
  if (list.isEmpty()) {
    return patterns.empty();
  }
  
  const head = list.head();
  const tail = list.tail();
  
  if (head === undefined) {
    return patterns.empty();
  }
  
  return patterns.cons(head, tail);
}

/**
 * Destructure PersistentList into head and tail
 */
export function destructureList<T>(list: PersistentList<T>): [T | undefined, PersistentList<T>] {
  return [list.head(), list.tail()];
}

// ============================================================================
// Part 9: Utility Functions
// ============================================================================

/**
 * Create a range of numbers as PersistentList
 */
export function range(start: number, end: number, step: number = 1): PersistentList<number> {
  const result: number[] = [];
  for (let i = start; i < end; i += step) {
    result.push(i);
  }
  return PersistentList.fromArray(result);
}

/**
 * Repeat a value n times
 */
export function repeat<T>(value: T, count: number): PersistentList<T> {
  const result: T[] = [];
  for (let i = 0; i < count; i++) {
    result.push(value);
  }
  return PersistentList.fromArray(result);
}

/**
 * Zip two lists together
 */
export function zip<A, B>(list1: PersistentList<A>, list2: PersistentList<B>): PersistentList<[A, B]> {
  const result: [A, B][] = [];
  const minLength = Math.min(list1.size, list2.size);
  
  for (let i = 0; i < minLength; i++) {
    const a = list1.get(i);
    const b = list2.get(i);
    if (a !== undefined && b !== undefined) {
      result.push([a, b]);
    }
  }
  
  return PersistentList.fromArray(result);
}

/**
 * Unzip a list of tuples
 */
export function unzip<A, B>(list: PersistentList<[A, B]>): [PersistentList<A>, PersistentList<B>] {
  const as: A[] = [];
  const bs: B[] = [];
  
  for (const [a, b] of list) {
    as.push(a);
    bs.push(b);
  }
  
  return [PersistentList.fromArray(as), PersistentList.fromArray(bs)];
}

// ============================================================================
// Laws and Properties
// ============================================================================

/**
 * Persistent Data Structure Laws:
 * 
 * 1. Immutability: All operations return new instances, never mutate originals
 * 2. Structural Sharing: Unchanged parts maintain reference equality
 * 3. Performance: Operations are O(log n) or better
 * 4. Type Safety: Full TypeScript type safety throughout
 * 5. FP Integration: Works seamlessly with typeclasses and HKTs
 * 
 * Runtime Laws:
 * 
 * 1. Identity Law: list.append(x).remove(list.size - 1) === list
 * 2. Associativity Law: (list.append(x)).append(y) === list.append(x).append(y)
 * 3. Transient Law: Transient.from(list).freeze() === list
 * 4. Sharing Law: Unchanged parts maintain reference equality
 * 
 * Type-Level Laws:
 * 
 * 1. Kind Law: PersistentListK works with Functor, Applicative, Monad
 * 2. Map Law: PersistentMapK works with Functor, Bifunctor
 * 3. Set Law: PersistentSetK works with Functor
 * 4. Transient Law: Transient operations yield immutable results
 */ 

// ============================================================================
// Part 10: Alternative HKT Derivation (Commented Out)
// ============================================================================

/*
 * Alternative HKT-based derived instances
 * These are commented out to avoid conflicts with the main derived instances in Part 6
 * 
 * Uncomment and use these if you prefer HKT-based derivation over the current approach
 */

// Converted to individual instance functions using the preferred approach
export const PersistentListFunctorAlt = deriveFunctorInstance<PersistentListK>({
  customMap: <A, B>(fa: PersistentList<A>, f: (a: A) => B): PersistentList<B> => 
    fa.map(f)
});

export const PersistentListApplicativeAlt = deriveApplicativeInstance<PersistentListK>({
  customMap: <A, B>(fa: PersistentList<A>, f: (a: A) => B): PersistentList<B> => 
    fa.map(f)
});

export const PersistentListMonadAlt = deriveMonadInstance<PersistentListK>({
  customMap: <A, B>(fa: PersistentList<A>, f: (a: A) => B): PersistentList<B> => 
    fa.map(f),
  customChain: <A, B>(fa: PersistentList<A>, f: (a: A) => PersistentList<B>): PersistentList<B> => {
    if (fa.flatMap) {
      return fa.flatMap(f);
    }
    return fa.map(f).foldLeft(PersistentList.empty<B>(), (acc, bs) => acc.concat(bs)) as PersistentList<B>;
  }
});

export const PersistentMapFunctorAlt = deriveFunctorInstance<PersistentMapK>({
  customMap: <A, B>(fa: PersistentMap<any, A>, f: (a: A) => B): PersistentMap<any, B> => 
    fa.map(f)
});

export const PersistentMapBifunctorAlt = deriveBifunctorInstance<PersistentMapK>({
  customBimap: <A, B, C, D>(
    fab: PersistentMap<A, B>,
    f: (a: A) => C,
    g: (b: B) => D
  ): PersistentMap<C, D> => {
    const entries: [C, D][] = [];
    for (const [key, value] of fab.entries()) {
      entries.push([f(key), g(value)]);
    }
    return PersistentMap.fromEntries(entries);
  }
});

export const PersistentSetFunctorAlt = deriveFunctorInstance<PersistentSetK>({
  customMap: <A, B>(fa: PersistentSet<A>, f: (a: A) => B): PersistentSet<B> => {
    const result: B[] = [];
    for (const value of fa) {
      result.push(f(value));
    }
    return PersistentSet.fromArray(result);
  }
});

// ============================================================================
// Part 11: Fluent API Integration
// ============================================================================

/**
 * Apply fluent API to PersistentList
 */
const PersistentListFluentImpl: FluentImpl<any> = {
  map: (self, f) => {
    // Use the raw map method directly to avoid circular dependency
    const result: any[] = [];
    self.forEach((value) => {
      result.push(f(value));
    });
    return PersistentList.fromArray(result);
  },
  chain: (self, f) => {
    // Use the raw flatMap method directly to avoid circular dependency
    const result: any[] = [];
    self.forEach((value) => {
      const mapped = f(value);
      if (mapped instanceof PersistentList) {
        mapped.forEach(v => result.push(v));
      } else {
        result.push(mapped);
      }
    });
    return PersistentList.fromArray(result);
  },
  flatMap: (self, f) => {
    // Use the raw flatMap method directly to avoid circular dependency
    const result: any[] = [];
    self.forEach((value) => {
      const mapped = f(value);
      if (mapped instanceof PersistentList) {
        mapped.forEach(v => result.push(v));
      } else {
        result.push(mapped);
      }
    });
    return PersistentList.fromArray(result);
  },
  filter: (self, pred) => {
    // Use the raw filter method directly to avoid circular dependency
    const result: any[] = [];
    self.forEach((value) => {
      if (pred(value)) {
        result.push(value);
      }
    });
    return PersistentList.fromArray(result);
  },
  scan: (self, reducer, seed) => {
    let acc = seed;
    return self.map(v => { 
      acc = reducer(acc, v); 
      return acc; 
    });
  },

  pipe: (self, ...fns) => {
    let result = self;
    for (const fn of fns) {
      result = result.map(fn);
    }
    return result;
  }
};

/**
 * Apply fluent API to PersistentMap
 */
const PersistentMapFluentImpl: FluentImpl<any> = {
  map: (self, f) => self.map(f),
  chain: (self, f) => {
    if (self.flatMap) {
      return self.flatMap(f);
    }
    // Fallback implementation for chain
    const entries = Array.from(self.entries() as Iterable<[any, any]>);
    const results: any[] = [];
    for (const [k, v] of entries) {
      const result = f(v);
      if (result instanceof PersistentMap) {
        results.push(...Array.from(result.entries()));
      } else {
        results.push([k, result]);
      }
    }
    return PersistentMap.fromEntries(results);
  },
  flatMap: (self, f) => {
    // Check if the object has a native flatMap method (not the fluent API one)
    if (self.flatMap && self.flatMap !== PersistentMapFluentImpl.flatMap) {
      return self.flatMap(f);
    }
    const entries = Array.from(self.entries() as Iterable<[any, any]>);
    const results: any[] = [];
    for (const [k, v] of entries) {
      const result = f(v);
      if (result instanceof PersistentMap) {
        results.push(...Array.from(result.entries()));
      } else {
        results.push([k, result]);
      }
    }
    return PersistentMap.fromEntries(results);
  },
  filter: (self, pred) => self.filter(pred),
  scan: (self, reducer, seed) => {
    let acc = seed;
    return self.map(v => { 
      acc = reducer(acc, v); 
      return acc; 
    });
  },

  pipe: (self, ...fns) => {
    let result = self;
    for (const fn of fns) {
      result = result.map(fn);
    }
    return result;
  }
};

/**
 * Apply fluent API to PersistentSet
 */
const PersistentSetFluentImpl: FluentImpl<any> = {
  map: (self, f) => self.map(f),
  chain: (self, f) => {
    if (self.flatMap) {
      return self.flatMap(f);
    }
    // Fallback implementation for chain
    const results: any[] = [];
    for (const v of self) {
      const result = f(v);
      if (result instanceof PersistentSet) {
        results.push(...Array.from(result));
      } else {
        results.push(result);
      }
    }
    return PersistentSet.fromArray(results);
  },
  flatMap: (self, f) => {
    // Check if the object has a native flatMap method (not the fluent API one)
    if (self.flatMap && self.flatMap !== PersistentSetFluentImpl.flatMap) {
      return self.flatMap(f);
    }
    const results: any[] = [];
    for (const v of self) {
      const result = f(v);
      if (result instanceof PersistentSet) {
        results.push(...Array.from(result));
      } else {
        results.push(result);
      }
    }
    return PersistentSet.fromArray(results);
  },
  filter: (self, pred) => self.filter(pred),
  scan: (self, reducer, seed) => {
    let acc = seed;
    return self.map(v => { 
      acc = reducer(acc, v); 
      return acc; 
    });
  },

  pipe: (self, ...fns) => {
    let result = self;
    for (const fn of fns) {
      result = result.map(fn);
    }
    return result;
  }
};

// Apply fluent API to all persistent collection prototypes
applyFluentOps(PersistentList.prototype, PersistentListFluentImpl);
applyFluentOps(PersistentMap.prototype, PersistentMapFluentImpl);
applyFluentOps(PersistentSet.prototype, PersistentSetFluentImpl);

// ============================================================================
// Part 12: Registration
// ============================================================================

/**
 * Register persistent collection typeclass instances
 * 
 * Guards against duplicate registration during hot-reload scenarios
 * to prevent memory churn and unnecessary registry operations.
 */
export function registerPersistentInstances(): void {
  if (typeof globalThis !== 'undefined' && (globalThis as any).__FP_REGISTRY) {
    const registry = (globalThis as any).__FP_REGISTRY;
    
    // Check if already registered to prevent duplicate registration during hot-reload
    const registrationKey = '__PERSISTENT_INSTANCES_REGISTERED';
    if ((globalThis as any)[registrationKey]) {
      return; // Already registered, skip
    }
    
    // Register PersistentList instances
    registry.register('PersistentListFunctor', PersistentListFunctor);
    registry.register('PersistentListApplicative', PersistentListApplicative);
    registry.register('PersistentListMonad', PersistentListMonad);
    registry.register('PersistentListEq', PersistentListEq);
    registry.register('PersistentListOrd', PersistentListOrd);
    registry.register('PersistentListShow', PersistentListShow);
    
    // Register PersistentMap instances
    registry.register('PersistentMapFunctor', PersistentMapFunctor);
    registry.register('PersistentMapBifunctor', PersistentMapBifunctor);
    registry.register('PersistentMapEq', PersistentMapEq);
    registry.register('PersistentMapOrd', PersistentMapOrd);
    registry.register('PersistentMapShow', PersistentMapShow);
    
    // Register PersistentSet instances
    registry.register('PersistentSetFunctor', PersistentSetFunctor);
    registry.register('PersistentSetEq', PersistentSetEq);
    registry.register('PersistentSetOrd', PersistentSetOrd);
    registry.register('PersistentSetShow', PersistentSetShow);
    
    // Mark as registered to prevent future duplicate registrations
    (globalThis as any)[registrationKey] = true;
  }
}

// Auto-register instances
registerPersistentInstances(); 