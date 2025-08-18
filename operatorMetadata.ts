// operatorMetadata.ts
// Operator registry with fusibility information for stream fusion

export interface FusionRule {
  name: string;
  condition?: (a: any, b: any) => boolean;
  transform: (a: any, b: any) => any;
}

export interface OperatorInfo {
  name: string;
  category: 'stateless' | 'stateful' | 'sink' | 'source';
  multiplicity: 'preserve' | 'reduce' | 'expand' | 'unknown';
  fusibleBefore: string[];
  fusibleAfter: string[];
  fusionRules: FusionRule[];
  transformBuilder?: any; // Auto-initialized
}

export const operatorRegistry: Record<string, OperatorInfo> = {
  map: {
    name: 'map',
    category: 'stateless',
    multiplicity: 'preserve',
    fusibleBefore: ['map', 'filter', 'scan'],
    fusibleAfter: ['map', 'filter', 'scan'],
    fusionRules: [
      {
        name: 'map-map-fusion',
        transform: (f: any, g: any) => (x: any) => f(g(x))
      }
    ],
    transformBuilder: undefined
  },
  filter: {
    name: 'filter',
    category: 'stateless',
    multiplicity: 'preserve',
    fusibleBefore: ['map', 'filter'],
    fusibleAfter: ['map', 'filter'],
    fusionRules: [
      {
        name: 'filter-filter-fusion',
        transform: (p1: any, p2: any) => (x: any) => p1(x) && p2(x)
      }
    ],
    transformBuilder: undefined
  },
  scan: {
    name: 'scan',
    category: 'stateful',
    multiplicity: 'preserve',
    fusibleBefore: ['map', 'filter'],
    fusibleAfter: ['map', 'filter', 'take', 'drop'],
    fusionRules: [],
    transformBuilder: undefined
  },
  take: {
    name: 'take',
    category: 'stateful',
    multiplicity: 'reduce',
    fusibleBefore: ['map', 'filter', 'scan', 'take'],
    fusibleAfter: ['map', 'filter'],
    fusionRules: [
      {
        name: 'take-take-fusion',
        transform: (n1: number, n2: number) => Math.min(n1, n2)
      }
    ],
    transformBuilder: undefined
  },
  drop: {
    name: 'drop',
    category: 'stateful',
    multiplicity: 'reduce',
    fusibleBefore: ['map', 'filter', 'scan', 'drop'],
    fusibleAfter: ['map', 'filter', 'take'],
    fusionRules: [
      {
        name: 'drop-drop-fusion',
        transform: (n1: number, n2: number) => n1 + n2
      }
    ],
    transformBuilder: undefined
  },
  fold: {
    name: 'fold',
    category: 'sink',
    multiplicity: 'reduce',
    fusibleBefore: ['map', 'filter', 'scan', 'take', 'drop'],
    fusibleAfter: [],
    fusionRules: [],
    transformBuilder: undefined
  },
  forEach: {
    name: 'forEach',
    category: 'sink',
    multiplicity: 'reduce',
    fusibleBefore: ['map', 'filter', 'scan', 'take', 'drop'],
    fusibleAfter: [],
    fusionRules: [],
    transformBuilder: undefined
  },
  flatMap: {
    name: 'flatMap',
    category: 'stateless',
    multiplicity: 'expand',
    fusibleBefore: ['map', 'filter'],
    fusibleAfter: ['map', 'filter', 'take', 'drop'],
    fusionRules: [],
    transformBuilder: undefined
  },
  concat: {
    name: 'concat',
    category: 'stateless',
    multiplicity: 'expand',
    fusibleBefore: [],
    fusibleAfter: ['map', 'filter', 'take', 'drop'],
    fusionRules: [],
    transformBuilder: undefined
  },
  merge: {
    name: 'merge',
    category: 'stateful',
    multiplicity: 'expand',
    fusibleBefore: [],
    fusibleAfter: ['map', 'filter', 'take', 'drop'],
    fusionRules: [],
    transformBuilder: undefined
  },
  distinct: {
    name: 'distinct',
    category: 'stateful',
    multiplicity: 'reduce',
    fusibleBefore: ['map', 'filter'],
    fusibleAfter: ['map', 'filter', 'take', 'drop'],
    fusionRules: [],
    transformBuilder: undefined
  },
  buffer: {
    name: 'buffer',
    category: 'stateful',
    multiplicity: 'preserve',
    fusibleBefore: ['map', 'filter', 'scan'],
    fusibleAfter: ['map', 'filter'],
    fusionRules: [],
    transformBuilder: undefined
  },
  debounce: {
    name: 'debounce',
    category: 'stateful',
    multiplicity: 'reduce',
    fusibleBefore: ['map', 'filter'],
    fusibleAfter: ['map', 'filter', 'take'],
    fusionRules: [],
    transformBuilder: undefined
  },
  throttle: {
    name: 'throttle',
    category: 'stateful',
    multiplicity: 'reduce',
    fusibleBefore: ['map', 'filter'],
    fusibleAfter: ['map', 'filter', 'take'],
    fusionRules: [],
    transformBuilder: undefined
  }
};

// Helper function to get operator info
export function getOperatorInfo(name: string): OperatorInfo | undefined {
  return operatorRegistry[name];
}

// Helper function to check if two operators can be fused
export function canFuse(before: string, after: string): boolean {
  const beforeInfo = operatorRegistry[before];
  if (!beforeInfo) return false;
  return beforeInfo.fusibleAfter.includes(after);
}

// Helper function to get all fusible operators after a given operator
export function getFusibleAfter(name: string): string[] {
  const info = operatorRegistry[name];
  return info ? info.fusibleAfter : [];
}

// Helper function to get all fusible operators before a given operator
export function getFusibleBefore(name: string): string[] {
  const info = operatorRegistry[name];
  return info ? info.fusibleBefore : [];
}
