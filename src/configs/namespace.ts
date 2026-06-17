/** The namespace used when no name is provided to a script. */
export const DEFAULT_NAMESPACE = 'main';

/** Valid components that can be created inside a namespace under `active/`. */
export const NAMESPACE_COMPONENTS = ['skills', 'agents'] as const;

export type NamespaceComponent = (typeof NAMESPACE_COMPONENTS)[number];

/**
 * Entry file name for folder-based items, keyed by component.
 * Components listed here support both flat (.md) and folder formats.
 * Components not listed are file-only.
 */
export const COMPONENT_FOLDER_ENTRY: Partial<Record<NamespaceComponent, string>> = {
  skills: 'SKILL.md',
  // agents: 'AGENT.md', // uncomment when agents support folder format
};
