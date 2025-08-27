// src/kan/category-presentations.ts
// Minimal type definitions for category presentations used by chase-lkan.ts and cograph.ts

export type Obj = unknown;
export type Mor = unknown;

export interface Quiver {
  objects: Array<{ id: string }>;
  arrows: Array<{ id: string; src: string; dst: string }>;
}

export interface Path {
  at: string;
  arrows: string[];
}

export interface CategoryPresentation {
  Q: Quiver;
  E: Array<{ left: Path; right: Path }>;
}

export interface SmallCategory {
  objects: string[];
  morphisms: Array<{ id: string; src: string; dst: string }>;
}

export interface Functor {
  onObj: (obj: string) => string;
  onMor: (path: Path) => Path;
}

