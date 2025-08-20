// kind-branding.ts
// Single-source brand keys. Do NOT redeclare these anywhere else.
export const __KindBrand: unique symbol = Symbol("KindBrand");
export const __HKIn:      unique symbol = Symbol("HKIn");
export const __HKOut:     unique symbol = Symbol("HKOut");

// If older code used a different tag (e.g., __kind), make it an alias:
export const __LegacyKind = __KindBrand;
