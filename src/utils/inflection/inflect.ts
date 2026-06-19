/**
 * Converts a plural word to its singular form.
 * Handles the two common English plural endings:
 *   -es after s/x/z/ch/sh  (buses → bus, boxes → box)
 *   -s   everything else   (cases → case, skills → skill)
 */
export function singularOf(word: string): string {
  if (/(?:s|x|z|ch|sh)es$/.test(word)) return word.slice(0, -2);
  if (word.endsWith('s')) return word.slice(0, -1);
  return word;
}

/**
 * Converts a singular word to its plural form.
 * Mirrors singularOf — adds -es after s/x/z/ch/sh, -s otherwise.
 */
export function pluralOf(word: string): string {
  if (/(?:s|x|z|ch|sh)$/.test(word)) return `${word}es`;
  return `${word}s`;
}
