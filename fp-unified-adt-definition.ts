/**
 * Unified ADT Definition System
 * 
 * Provides a single entry point for defining ADTs with automatic:
 * - Type and constructor declaration
 * - Registry registration
 * - Typeclass instance derivation (Functor, Applicative, Monad, Bifunctor)
 * - Eq, Ord, Show instance derivation
 * - Fluent API generation (map, chain, filter, etc.)
 * - Optics system integration (Lens/Prism derivation)
 * 
 * Usage:
 * ```ts
 * const MyType = defineADT("MyType", { CaseA: ["x"], CaseB: [] });
 * MyType.of(42).map(x => x + 1);
 * ```
 */

import {
  createSumType,
  createProductType,
  ConstructorSpec,
  ProductFields,
  SumTypeConfig,
  ProductTypeConfig,
  ADTPurityConfig
} from './fp-adt-builders-enhanced';

import {
  deriveFunctorInstance,
  deriveApplicativeInstance,
  deriveMonadInstance,
  deriveBifunctorInstance,
  deriveEqInstance,
  deriveOrdInstance,
  deriveShowInstance,
  DerivationConfig
} from './fp-derivation-helpers';

import {
  applyFluentOps,
  FluentImpl
} from './fp-fluent-api';

import {
  getFPRegistry,
  registerADTMetadata
} from './fp-auto-derivation-complete';

import {
  Kind1, Kind2, Kind3,
  Apply, Type, TypeArgs, KindArity, KindResult
} from './fp-hkt';

import {
  EffectTag, EffectOf, Pure, IO, Async
} from './fp-purity';

// ============================================================================
// Part 1: Unified ADT Definition Types
// ============================================================================

/**
 * Configuration for ADT definition
 */
export interface ADTDefinitionConfig {
  // Typeclass derivation options
  functor?: boolean;
  applicative?: boolean;
  monad?: boolean;
  bifunctor?: boolean;
  eq?: boolean;
  ord?: boolean;
  show?: boolean;
  
  // Purity configuration
  purity?: 'Pure' | 'Impure' | 'Async';
  
  // Fluent API options
  fluent?: boolean;
  customFluentMethods?: Record<string, (instance: any, ...args: any[]) => any>;
  
  // Optics options
  optics?: boolean;
  
  // Custom derivation functions
  customMap?: <A, B>(fa: any, f: (a: A) => B) => any;
  customChain?: <A, B>(fa: any, f: (a: A) => any) => any;
  customBimap?: <A, B, C, D>(fab: any, f: (a: A) => C, g: (b: B) => D) => any;
  customEq?: (a: any, b: any) => boolean;
  customOrd?: (a: any, b: any) => number;
  customShow?: (a: any) => string;
  
  // Registry options
  register?: boolean;
  namespace?: string;
}

/**
 * ADT metadata for registry
 */
export interface ADTMetadata {
  name: string;
  constructors: string[];
  isSumType: boolean;
  isProductType: boolean;
  hasMatch: boolean;
  hasTag: boolean;
  fieldTypes: Record<string, any[]>;
  purity: 'Pure' | 'Impure' | 'Async';
  typeclasses: string[];
  fluentMethods: string[];
  optics: boolean;
  customEq?: (a: any, b: any) => boolean;
  customOrd?: (a: any, b: any) => number;
  customShow?: (a: any) => string;
}

/**
 * Unified ADT instance with all capabilities
 */
export interface UnifiedADTInstance<Spec extends ConstructorSpec> {
  // Core ADT functionality
  readonly tag: keyof Spec;
  readonly payload: any;
  
  // Pattern matching
  match<Result>(handlers: any): Result;
  matchTag<Result>(handlers: any): Result;
  is<K extends keyof Spec>(tag: K): boolean;
  getPayload(): any;
  getTag(): keyof Spec;
  
  // Fluent API methods
  map<B>(f: (a: any) => B): any;
  chain<B>(f: (a: any) => any): any;
  flatMap<B>(f: (a: any) => any): any;
  ap<B>(fab: any): any;
  filter(predicate: (a: any) => boolean): any;
  filterMap<B>(f: (a: any) => any): any;
  bimap<C, D>(f: (a: any) => C, g: (b: any) => D): any;
  mapLeft<C>(f: (a: any) => C): any;
  mapRight<D>(g: (b: any) => D): any;
  
  // Optics methods (if enabled)
  lens<K extends string>(key: K): any;
  prism<K extends string>(key: K): any;
  
  // Utility methods
  equals(other: any): boolean;
  compare(other: any): number;
  show(): string;
  toJSON(): any;
  toString(): string;
}

/**
 * Unified ADT builder with all capabilities
 */
export interface UnifiedADTBuilder<Spec> {
  // Constructor functions - using simpler mapped type
  [K in keyof Spec]: any;
  
  // Static methods
  of<A>(value: A): UnifiedADTInstance<Spec>;
  from<A>(value: A): UnifiedADTInstance<Spec>;
  
  // Typeclass instances
  functor: any;
  applicative: any;
  monad: any;
  bifunctor: any;
  eq: any;
  ord: any;
  show: any;
  
  // Registry metadata
  metadata: ADTMetadata;
  
  // Utility methods
  is(instance: any): instance is UnifiedADTInstance<Spec>;
  create<K extends keyof Spec>(tag: K, payload?: any): UnifiedADTInstance<Spec>;
  match<Result>(instance: UnifiedADTInstance<Spec>, handlers: any): Result;
  matchTag<Result>(instance: UnifiedADTInstance<Spec>, handlers: any): Result;
}

// ============================================================================
// Part 2: Unified ADT Definition Function
// ============================================================================

/**
 * Define a unified ADT with automatic capabilities
 */
export function defineADT<Spec extends ConstructorSpec>(
  name: string,
  spec: Spec,
  config: ADTDefinitionConfig = {}
): UnifiedADTBuilder<Spec> {
  console.log(`🔧 Defining unified ADT: ${name}`);
  
  // Default configuration
  const defaultConfig: Required<ADTDefinitionConfig> = {
    functor: true,
    applicative: true,
    monad: true,
    bifunctor: true,
    eq: true,
    ord: true,
    show: true,
    purity: 'Pure',
    fluent: true,
    customFluentMethods: {},
    optics: true,
    register: true,
    namespace: 'default',
    customMap: undefined,
    customChain: undefined,
    customBimap: undefined,
    customEq: undefined,
    customOrd: undefined,
    customShow: undefined
  };
  
  const finalConfig = { ...defaultConfig, ...config };
  
  // Create base ADT builder
  const baseBuilder = createSumType(spec, {
    name,
    effect: ((finalConfig.purity !== undefined ? finalConfig.purity : 'Pure') as any),
    enableHKT: true,
    enableDerivableInstances: false,
    enableRuntimeMarkers: false
  });
  
  // Derive typeclass instances
  const derivationConfig: DerivationConfig = {
    functor: finalConfig.functor,
    applicative: finalConfig.applicative,
    monad: finalConfig.monad,
    bifunctor: finalConfig.bifunctor,
    eq: finalConfig.eq,
    ord: finalConfig.ord,
    show: finalConfig.show,
    customMap: finalConfig.customMap,
    customChain: finalConfig.customChain,
    customBimap: finalConfig.customBimap,
    customEq: finalConfig.customEq,
    customOrd: finalConfig.customOrd,
    customShow: finalConfig.customShow
  };
  
  const instances = deriveAllInstances(name, derivationConfig);
  
  // Create fluent implementation
  const fluentImpl = createFluentImpl(name, instances, finalConfig.customFluentMethods);
  
  // Create unified ADT class
  class UnifiedADT implements UnifiedADTInstance<Spec> {
    readonly tag: keyof Spec;
    readonly payload: any;
    
    constructor(tag: keyof Spec, payload?: any) {
      this.tag = tag;
      this.payload = payload;
    }
    
    // Pattern matching methods
    match<Result>(handlers: any): Result {
      const tag = this.tag as string;
      const h = handlers[tag] ?? handlers._ ?? handlers.otherwise;
      if (!h) throw new Error(`Unhandled case: ${tag}`);
      // convention: case handler receives the payload object
      return h(this.payload);
    }
    
    matchTag<Result>(handlers: any): Result {
      const tag = this.tag as string;
      const h = handlers[tag] ?? handlers._ ?? handlers.otherwise;
      if (!h) throw new Error(`Unhandled tag: ${tag}`);
      // tag-only handler receives the tag string
      return h(tag);
    }
    
    is<K extends keyof Spec>(tag: K): boolean {
      return this.tag === tag;
    }
    
    getPayload(): any {
      return this.payload;
    }
    
    getTag(): keyof Spec {
      return this.tag;
    }
    
    // Fluent API methods
    map<B>(f: (a: any) => B): any {
      return fluentImpl.map ? fluentImpl.map(this, f) : this;
    }
    
    chain<B>(f: (a: any) => any): any {
      return fluentImpl.chain ? fluentImpl.chain(this, f) : this;
    }
    
    flatMap<B>(f: (a: any) => any): any {
      return this.chain(f);
    }
    
    ap<B>(fab: any): any {
      return fluentImpl.ap ? fluentImpl.ap(this, fab) : this;
    }
    
        filter(predicate: (a: any) => boolean): any {
      return fluentImpl.filter ? fluentImpl.filter(this, predicate) : this;
    }

    filterMap<B>(f: (a: any) => any): any {
      return fluentImpl.filterMap ? fluentImpl.filterMap(this, f) : this;
    }

    bimap<C, D>(f: (a: any) => C, g: (b: any) => D): any {
      return fluentImpl.bimap ? fluentImpl.bimap(this, f, g) : this;
    }

    mapLeft<C>(f: (a: any) => C): any {
      return fluentImpl.mapLeft ? fluentImpl.mapLeft(this, f) : this;
    }

    mapRight<D>(g: (b: any) => D): any {
      return fluentImpl.mapRight ? fluentImpl.mapRight(this, g) : this;
    }
    
    // Optics methods (placeholder)
    lens<K extends string>(key: K): any {
      // TODO: Implement optics
      return null;
    }
    
    prism<K extends string>(key: K): any {
      // TODO: Implement optics
      return null;
    }
    
    // Utility methods
        equals(other: any): boolean {
      return instances.eq ? instances.eq.equals(this, other) : this === other;
    }

    compare(other: any): number {
      return instances.ord ? instances.ord.compare(this, other) : 0;
    }

    show(): string {
      return instances.show ? instances.show.show(this) : this.toString();
    }
    
    toJSON(): any {
      return {
        tag: this.tag,
        payload: this.payload
      };
    }
    
    toString(): string {
      return `${name}(${this.tag}, ${JSON.stringify(this.payload)})`;
    }
  }
  
  // Apply fluent operations to prototype
  if (finalConfig.fluent) {
    applyFluentOps(UnifiedADT.prototype, fluentImpl);
  }
  
  // Create constructor functions
  const constructors: any = {};
  for (const [tag, ctor] of Object.entries(spec)) {
    constructors[tag] = (...args: any[]) => {
      const payload = (ctor as any)(...args); // object: e.g. { value }, or {}
      return new UnifiedADT(tag as keyof Spec, payload);
    };
  }
  
  // Create metadata
  const metadata: ADTMetadata = {
    name,
    constructors: Object.keys(spec),
    isSumType: true,
    isProductType: false,
    hasMatch: true,
    hasTag: true,
    fieldTypes: ((): Record<string, any[]> => {
      const out: Record<string, any[]> = {};
      for (const tag of Object.keys(spec)) {
        const ctor = (spec as any)[tag];
        const n = typeof ctor === 'function' ? ctor.length : 0;
        const args = Array(n).fill(0).map((_, i) => `arg${i}`);
        out[tag] = args;
      }
      return out;
    })(),
    purity: finalConfig.purity,
    typeclasses: Object.keys(instances).filter(key => instances[key as keyof typeof instances]),
    fluentMethods: Object.keys(fluentImpl),
    optics: finalConfig.optics,
    customEq: finalConfig.customEq,
    customOrd: finalConfig.customOrd,
    customShow: finalConfig.customShow
  };
  
  // Register in registry if enabled
  if (finalConfig.register) {
    registerADTInRegistry(name, metadata, instances);
  }
  
  // Create unified builder
  const unifiedBuilder: UnifiedADTBuilder<Spec> = {
    ...constructors,
    
    // Static methods
    of<A>(value: A): UnifiedADTInstance<Spec> {
      // Try to find a suitable constructor
      const tags = Object.keys(spec);
      if (tags.length === 1) {
        return constructors[tags[0]](value);
      }
      // Default to first constructor
      return constructors[tags[0]](value);
    },
    
    from<A>(value: A): UnifiedADTInstance<Spec> {
      return this.of(value);
    },
    
    // Typeclass instances
    functor: instances.functor,
    applicative: instances.applicative,
    monad: instances.monad,
    bifunctor: instances.bifunctor,
    eq: instances.eq,
    ord: instances.ord,
    show: instances.show,
    
    // Metadata
    metadata,
    
    // Utility methods
    is(instance: any): instance is UnifiedADTInstance<Spec> {
      return instance instanceof UnifiedADT;
    },
    
    create<K extends keyof Spec>(tag: K, payload?: any): UnifiedADTInstance<Spec> {
      return new UnifiedADT(tag, payload);
    },
    
    match<Result>(instance: UnifiedADTInstance<Spec>, handlers: any): Result {
      return instance.match(handlers);
    },
    
    matchTag<Result>(instance: UnifiedADTInstance<Spec>, handlers: any): Result {
      return instance.matchTag(handlers);
    }
  };
  
  console.log(`✅ Unified ADT ${name} defined with ${Object.keys(instances).length} typeclass instances`);
  
  return unifiedBuilder;
}

// ============================================================================
// Part 3: Helper Functions
// ============================================================================

/**
 * Derive all typeclass instances for an ADT
 */
function deriveAllInstances(name: string, config: DerivationConfig) {
  const instances: any = {};
  
  try {
    if (config.functor) {
      instances.functor = deriveFunctorInstance(config);
    }
  } catch (error) {
    console.warn(`⚠️ Failed to derive Functor for ${name}:`, error);
  }
  
  try {
    if (config.applicative) {
      instances.applicative = deriveApplicativeInstance(config);
    }
  } catch (error) {
    console.warn(`⚠️ Failed to derive Applicative for ${name}:`, error);
  }
  
  try {
    if (config.monad) {
      instances.monad = deriveMonadInstance(config);
    }
  } catch (error) {
    console.warn(`⚠️ Failed to derive Monad for ${name}:`, error);
  }
  
  try {
    if (config.bifunctor) {
      instances.bifunctor = deriveBifunctorInstance(config);
    }
  } catch (error) {
    console.warn(`⚠️ Failed to derive Bifunctor for ${name}:`, error);
  }
  
  try {
    if (config.eq) {
      instances.eq = deriveEqInstance(config);
    }
  } catch (error) {
    console.warn(`⚠️ Failed to derive Eq for ${name}:`, error);
  }
  
  try {
    if (config.ord) {
      instances.ord = deriveOrdInstance(config);
    }
  } catch (error) {
    console.warn(`⚠️ Failed to derive Ord for ${name}:`, error);
  }
  
  try {
    if (config.show) {
      instances.show = deriveShowInstance(config);
    }
  } catch (error) {
    console.warn(`⚠️ Failed to derive Show for ${name}:`, error);
  }
  
  return instances;
}

/**
 * Create fluent implementation for an ADT
 */
function createFluentImpl(name: string, instances: any, customMethods: Record<string, (instance: any, ...args: any[]) => any>): FluentImpl<any> {
  const fluentImpl: FluentImpl<any> = {};
  
  // Map to typeclass instances
  if (instances.functor) {
    fluentImpl.map = (instance, f) => instances.functor.map(instance, f);
  }
  
  if (instances.monad) {
    fluentImpl.chain = (instance, f) => instances.monad.chain(instance, f);
    fluentImpl.flatMap = (instance, f) => instances.monad.chain(instance, f);
  }
  
  if (instances.applicative) {
    fluentImpl.ap = (instance, fab) => instances.applicative.ap(fab, instance);
  }
  
  if (instances.bifunctor) {
    fluentImpl.bimap = (instance, f, g) => instances.bifunctor.bimap(instance, f, g);
    fluentImpl.mapLeft = (instance, f) => instances.bifunctor.mapLeft(instance, f);
    fluentImpl.mapRight = (instance, g) => instances.bifunctor.mapRight(instance, g);
  }
  
  // Add custom methods
  Object.assign(fluentImpl, customMethods);
  
  return fluentImpl;
}

/**
 * Register ADT in the global registry
 */
function registerADTInRegistry(name: string, metadata: ADTMetadata, instances: any) {
  const registry = getFPRegistry();
  if (!registry) return;

  // One flat keyspace is simplest and avoids API-mismatch errors
  registry.register(`${name}.metadata`, metadata);
  if (instances.functor)     registry.register(`${name}.Functor`, instances.functor);
  if (instances.applicative) registry.register(`${name}.Applicative`, instances.applicative);
  if (instances.monad)       registry.register(`${name}.Monad`, instances.monad);
  if (instances.bifunctor)   registry.register(`${name}.Bifunctor`, instances.bifunctor);
  if (instances.eq)          registry.register(`${name}.Eq`, instances.eq);
  if (instances.ord)         registry.register(`${name}.Ord`, instances.ord);
  if (instances.show)        registry.register(`${name}.Show`, instances.show);

  // keep metadata in auto-derivation side too
  registerADTMetadata(name, metadata);
}

// ============================================================================
// Part 4: Product Type Definition
// ============================================================================

/**
 * Define a unified product type ADT
 */
export function defineProductADT<Fields extends ProductFields>(
  name: string,
  fields: Fields,
  config: ADTDefinitionConfig = {}
): UnifiedADTBuilder<{ Product: (...args: any[]) => Fields }> {
  console.log(`🔧 Defining unified product ADT: ${name}`);
  
  // Create product type spec
  const spec = {
    Product: (...args: any[]) => {
      const result: any = {};
      const fieldNames = Object.keys(fields);
      for (let i = 0; i < fieldNames.length; i++) {
        result[fieldNames[i]] = args[i];
      }
      return result;
    }
  } as any;
  
  // Define as regular ADT
  return defineADT(name, spec, config);
}

// ============================================================================
// Part 5: Export Everything
// ============================================================================

export {
  // Core types
  ADTDefinitionConfig,
  ADTMetadata,
  UnifiedADTInstance,
  UnifiedADTBuilder,
  
  // Main functions
  defineADT,
  defineProductADT,
  
  // Helper functions
  deriveAllInstances,
  createFluentImpl,
  registerADTInRegistry
}; 