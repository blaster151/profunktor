# TypeScript Strict Mode Type Checking Report

## Summary

Running TypeScript with the following strict flags:
- `--noImplicitAny`
- `--exactOptionalPropertyTypes`
- `--noUncheckedIndexedAccess`

Results in **127 type errors** across multiple files.

## Error Categories

### 1. Object is possibly 'undefined' (TS2532) - 50 occurrences
Most common error. Occurs when accessing object properties without checking for undefined first.

**Example locations:**
- `fp-adt-builders.ts` (lines 723-724)
- `fp-do.ts` (line 226)
- `fp-persistent.ts` (multiple locations)
- `fp-semiring.ts` (multiple locations)

### 2. Argument type not assignable (TS2345) - 26 occurrences
Occurs when passing potentially undefined values to functions expecting defined values.

**Example:**
```typescript
// fp-monoids.ts(215,29)
Argument of type 'A | undefined' is not assignable to parameter of type 'A'
```

### 3. Value is possibly 'undefined' (TS18048) - 13 occurrences
Similar to TS2532 but for different contexts.

### 4. Duplicate index signature (TS2375) - 12 occurrences
Related to index signature conflicts in type definitions.

### 5. Type not assignable (TS2322) - 8 occurrences
General type assignment errors.

### 6. Cannot invoke possibly 'undefined' (TS2722) - 5 occurrences
Attempting to call functions that might be undefined.

### 7. Type must have Symbol.iterator (TS2488) - 4 occurrences
Attempting to iterate over possibly undefined values.

**Example:**
```typescript
// fp-persistent.ts(1328,13)
Type '[A, B] | undefined' must have a '[Symbol.iterator]()' method
```

### 8. Element has 'any' type (TS7053) - 3 occurrences
Due to `noUncheckedIndexedAccess`, accessing object properties with dynamic keys.

**Example:**
```typescript
// fp-polynomial-functors.ts(347,9)
Element implicitly has an 'any' type because expression of type '"Tea?"' 
can't be used to index type '(pos: "Tea?" | "Kind?") => { ... }'
```

### 9. Other errors (1-3 occurrences each)
- TS2538: Type cannot be used as index
- TS7006: Parameter implicitly has 'any' type
- TS2367: Comparison appears unintentional
- TS2339: Property does not exist

## Key Affected Files

1. **fp-persistent.ts** - Many undefined checks needed
2. **fp-polynomial-functors.ts** - Index access issues
3. **fp-adt-builders.ts** - Optional property access
4. **fp-typeclass-optimization.ts** - Multiple undefined checks
5. **src/bicategory/laws.ts** - Type assignment issues

## Recommendations

1. **Add undefined checks**: Most errors can be fixed by adding proper undefined checks before accessing properties or calling functions.

2. **Use optional chaining**: Replace `obj.prop` with `obj?.prop` where appropriate.

3. **Type guards**: Add type guards for array/object access when using `noUncheckedIndexedAccess`.

4. **Explicit type assertions**: Where you're certain a value exists, use non-null assertions (`!`) or type assertions.

5. **Update function signatures**: Some functions may need to accept `T | undefined` instead of just `T`.

## Impact Assessment

- **High impact**: The codebase heavily relies on assumptions about defined values
- **Medium effort**: Most fixes are mechanical (adding checks)
- **Low risk**: These checks will make the code more robust

Enabling these strict checks would significantly improve type safety but requires substantial refactoring of existing code.