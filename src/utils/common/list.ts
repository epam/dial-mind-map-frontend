/**
 * Splits a string into an array using the specified separator, trims each item,
 * and filters out any empty strings.
 *
 * @param {string} str - The input string to split and filter.
 * @param {string} [separator=','] - The separator to use for splitting the string. Defaults to ','.
 * @returns {string[]} An array of non-empty, trimmed strings.
 *
 * @example
 * splitAndFilter('a, b, ,c,') // returns ['a', 'b', 'c']
 */
export const splitAndFilter = (str: string, separator: string = ',') =>
  str
    .split(separator)
    .map(s => s.trim())
    .filter(Boolean);
