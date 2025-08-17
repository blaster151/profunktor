/**
 * Readonly GADT Pattern Matching - Usage Examples
 * 
 * This demonstrates the readonly-aware GADT pattern matching API that enforces
 * Immutable payloads while delegating to the existing pmatch infrastructure.
 */

// Sample GADT definition
type Expr =
  | GADT<'Const', { value: number }>
  | GADT<'Add', { left: Expr; right: Expr }>
  | GADT<'Neg', { value: Expr }>;

// ============================================================================
// 1. Exhaustive Pattern Matching
// ============================================================================

// pmatchReadonly enforces all cases and guarantees Immutable payloads
const evalExpr = (expr: Expr): number =>
  pmatchReadonly(expr, {
    Const: ({ value }) => value,
    Add: ({ left, right }) => evalExpr(left) + evalExpr(right),
    Neg: ({ value }) => -evalExpr(value)
  });

// ============================================================================
// 2. Partial Pattern Matching
// ============================================================================

// pmatchReadonlyPartial returns R | undefined for missing handlers
const extractConstValue = (expr: Expr) =>
  pmatchReadonlyPartial(expr, {
    Const: ({ value }) => value
    // Add and Neg cases omitted - returns undefined for those
  }); // returns number | undefined

// ============================================================================
// 3. Curryable Factory
// ============================================================================

// createReadonlyGADTMatcher creates a reusable total function
const renderExpr = createReadonlyGADTMatcher<Expr, string>({
  Const: ({ value }) => value.toString(),
  Add: ({ left, right }) => `(${renderExpr(left)} + ${renderExpr(right)})`,
  Neg: ({ value }) => `-(${renderExpr(value)})`
});

// Usage: renderExpr(someExpr) returns string

// ============================================================================
// 4. Builder-style Construction
// ============================================================================

// createReadonlyPmatchBuilder allows incremental handler construction
const doubler = createReadonlyPmatchBuilder<Expr, number>(someExpr)
  .with('Const', ({ value }) => value * 2)
  .with('Add', ({ left, right }) => (evalExpr(left) + evalExpr(right)) * 2)
  .with('Neg', ({ value }) => -evalExpr(value) * 2)
  .exhaustive(); // throws if any cases missing

// Partial evaluation during construction
const partialBuilder = createReadonlyPmatchBuilder<Expr, string>(someExpr)
  .with('Const', ({ value }) => `constant ${value}`);

partialBuilder.partial(); // returns string | undefined
// partialBuilder.exhaustive(); // would throw - Add and Neg missing

// ============================================================================
// 5. K-style Hook (Future HKT Integration)
// ============================================================================

// pmatchReadonlyK provides stable API for future Kind integration
const resultWithKind = pmatchReadonlyK(
  someKind, // placeholder for future HKT encoding
  expr,
  {
    Const: ({ value }) => value,
    Add: ({ left, right }) => evalExpr(left) + evalExpr(right),
    Neg: ({ value }) => -evalExpr(value)
  }
);

// ============================================================================
// Key Benefits
// ============================================================================

/**
 * 1. Type Safety: All payloads are Immutable<T> at the handler boundary
 * 2. Exhaustiveness: Compile-time checking that all cases are handled
 * 3. Delegation: Leverages existing pmatch infrastructure for runtime behavior
 * 4. Flexibility: Supports exhaustive, partial, curryable, and builder patterns
 * 5. Future-proof: K-style hooks ready for HKT integration
 * 6. Zero overhead: Type-level guarantees with minimal runtime cost
 */
