import { basename, join } from 'path';
import { lstatSync } from 'fs';
import { COMPONENT_ENUM, DEFAULT_NAMESPACE } from '@/configs/namespace';
import { isFolderItem } from '@/helpers/claude';
import { collectItems, expandGlob } from '@/helpers/items';
import { normalizeComponent } from '@/helpers/namespace';
import { ROOT, relPath, removePath } from '@/utils/fs';
import { logger } from '@/utils/shellLogger';
import { parseCommandArgv } from '@/utils/shellCommand';

const { options, args, meta } = parseCommandArgv({
  args: {
    component: { type: 'enum', enum: COMPONENT_ENUM, description: 'Namespace component' },
    items: { description: 'Item name(s) or library path(s) to unload', placeholder: 'name|path', rest: true },
  },
  options: {
    ns: { default: DEFAULT_NAMESPACE, description: 'Namespace to use', value: 'namespace' },
  },
  examples: [
    { args: 'skills kmt-skill-flat', desc: 'Remove by name from active' },
    { args: 'skills <category>/', desc: 'Expand library folder, remove all matches' },
    { args: 'skills <category>/<item>', desc: 'Expand library path, remove match' },
  ],
});

const resolvedComponent = normalizeComponent(args.component)!;
const activeDir = join(ROOT, 'active', options.ns!, resolvedComponent);

if (!lstatSync(activeDir, { throwIfNoEntry: false })) {
  logger.warn(`Namespace component not initialized: ${relPath(activeDir)} — nothing to unload.`);
  process.exit(0);
}

const toBaseName = (item: string) => basename(item.endsWith('.md') ? item.slice(0, -3) : item);

/**
 * Resolves a raw input to a list of basenames to remove from active.
 *
 * - Has `/`    → library expansion, extract basenames.
 * - No `/`     → check active first; if not found, fall back to library category expansion;
 *               if neither, return as-is so the loop can emit the "not found" warning.
 */
function resolveNames(raw: string): string[] {
  if (raw.includes('/')) {
    return expandGlob(raw, resolvedComponent, ROOT, meta.command, 'unload').map(toBaseName);
  }

  const fileStat = lstatSync(join(activeDir, `${raw}.md`), { throwIfNoEntry: false });
  const folderStat = lstatSync(join(activeDir, raw), { throwIfNoEntry: false });
  if (fileStat || folderStat) return [raw];

  const libDir = join(ROOT, resolvedComponent, raw);
  const libDirStat = lstatSync(libDir, { throwIfNoEntry: false });
  if (libDirStat?.isDirectory() && !isFolderItem(libDir, resolvedComponent)) {
    return collectItems(libDir, raw, resolvedComponent).map(toBaseName);
  }

  return [raw];
}

const names = args.items.flatMap(resolveNames);

logger.info(`Unloading ${names.length} item(s) from "${options.ns!}/${resolvedComponent}"`);

for (const name of names) {
  const filePath = join(activeDir, `${name}.md`);
  const folderPath = join(activeDir, name);

  const fileStat = lstatSync(filePath, { throwIfNoEntry: false });
  const folderStat = lstatSync(folderPath, { throwIfNoEntry: false });

  if (!fileStat && !folderStat) {
    logger.warn(`Not found in active: ${name}`);
    continue;
  }

  if (fileStat) {
    removePath(filePath);
    logger.success(`Removed: ${relPath(filePath)}`);
  }
  if (folderStat) {
    removePath(folderPath);
    logger.success(`Removed: ${relPath(folderPath)}`);
  }
}
