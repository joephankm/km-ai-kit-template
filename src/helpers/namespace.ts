import { NAMESPACE_COMPONENTS, type NamespaceComponent } from '@/configs/namespace';

/** Resolves both singular and plural forms to the canonical component name. */
export function normalizeComponent(input: string): NamespaceComponent | undefined {
  if (NAMESPACE_COMPONENTS.includes(input as NamespaceComponent)) return input as NamespaceComponent;
  const plural = `${input}s` as NamespaceComponent;
  if (NAMESPACE_COMPONENTS.includes(plural)) return plural;
  return undefined;
}
