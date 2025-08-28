/**
 * String assertion utilities
 * 
 * Helper functions for safely working with string types
 */

/**
 * Assert that a value is a string
 * 
 * @param s - The value to check
 * @param msg - Error message if assertion fails
 * @returns The string value if assertion passes
 * @throws Error if the value is not a string
 */
export const assertString = (s: string | undefined, msg: string): string => {
  if (typeof s !== "string") throw new Error(msg);
  return s;
};
