/**
 * Transforms each value in a record, keeping the same keys.
 */
export function mapValues<Val, Res>(obj: Record<string, Val>, fn: (val: Val, key: string) => Res): Record<string, Res> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v, k)]));
}

/**
 * Picks selected keys from src, omitting keys whose resolved value is undefined.
 * Defaults are applied before the undefined check, so they can ensure a key is always present.
 */
export function pickValues<T extends Record<string, unknown>>(
  src: T,
  keys: (keyof T)[],
  defaults?: Partial<T>
): Partial<T> {
  const result: Partial<T> = {};
  for (const key of keys) {
    const val = src[key] ?? defaults?.[key];
    if (val !== undefined) result[key] = val as T[typeof key];
  }
  return result;
}
