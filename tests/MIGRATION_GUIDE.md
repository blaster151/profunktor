# Test Migration Guide

- All new and canonical unit tests should be placed in the `tests/` directory.
- Ignore `/importedTests` for legacy/compat tests.
- If you migrate a test from another location, update imports as needed.
- Use `.spec.ts` or `.test.ts` naming for test files.
