import { COMPONENTS, type NamespaceComponent } from '@/configs/namespace';
import { pluralOf } from '@/utils/inflection';

/**
 * Resolves both singular and plural forms to the canonical component name.
 */
export function normalizeComponent(input: string): NamespaceComponent | undefined {
  if (input in COMPONENTS) return input as NamespaceComponent;
  const plural = pluralOf(input);
  if (plural in COMPONENTS) return plural as NamespaceComponent;
  return undefined;
}
