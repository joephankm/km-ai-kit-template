import { join, resolve } from 'path';
import { lstatSync } from 'fs';
import { homedir } from 'os';
import { COMPONENT_FOLDER_ENTRY, type NamespaceComponent } from '@/configs/namespace';

/**
 * Resolves a user-provided target string to an absolute path for a Claude component.
 *
 * Resolution rules:
 *   `~` or `root`              → ~/.claude/<component>
 *   `~/foo` or `/abs/path`     → <expanded>/.claude/<component>  (unless already ends with /.claude or /<component>)
 *   `.../project/.claude`      → .../project/.claude/<component>
 *   `.../project/.claude/comp` → used as-is
 */
export function resolveClaudeTarget(raw: string, component: string): string {
  if (raw === '~' || raw === 'root') return join(homedir(), '.claude', component);
  const expanded = raw.startsWith('~/') ? join(homedir(), raw.slice(2)) : resolve(raw);
  if (expanded.endsWith(`/${component}`)) return expanded;
  if (expanded.endsWith('/.claude')) return join(expanded, component);
  return join(expanded, '.claude', component);
}

/** Returns true if the path is a folder-based item for the given component. */
export function isFolderItem(p: string, component: NamespaceComponent): boolean {
  const entryFile = COMPONENT_FOLDER_ENTRY[component];
  if (!entryFile) return false;
  return (
    !!lstatSync(p, { throwIfNoEntry: false })?.isDirectory() &&
    !!lstatSync(join(p, entryFile), { throwIfNoEntry: false })
  );
}
