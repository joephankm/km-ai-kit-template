import { singularOf } from '@/utils/inflection';

/** The namespace used when no name is provided to a script. */
export const DEFAULT_NAMESPACE = 'main';

export type ComponentConfig = {
  description: string; // shown in CLI enum display
  folderEntry?: string; // entry file for folder-based items (e.g. 'SKILL.md'); absent → file-only
};

export type NamespaceComponent = 'skills' | 'agents';

/**
 * Single source of truth for all namespace components.
 * Typed as Record<NamespaceComponent, ComponentConfig> so indexing always yields ComponentConfig.
 */
export const COMPONENTS: Record<NamespaceComponent, ComponentConfig> = {
  skills: { description: 'Reusable AI skills', folderEntry: 'SKILL.md' },
  agents: { description: 'Reusable subagents' },
};

/** Enum map for use with parseCommandArgv — includes both plural and singular aliases. */
export const COMPONENT_ENUM: Record<string, string> = Object.fromEntries([
  ...Object.entries(COMPONENTS).map(([k, v]) => [k, v.description]),
  ...Object.entries(COMPONENTS).map(([k]) => [singularOf(k), `Alias for '${k}'`]),
]);
