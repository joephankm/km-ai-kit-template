import { basename, join } from 'path';
import { lstatSync } from 'fs';
import { COMPONENT_ENUM } from '@/configs/namespace';
import { isFolderItem, resolveClaudeTarget } from '@/helpers/claude';
import { collectItems, expandGlob } from '@/helpers/items';
import { normalizeComponent } from '@/helpers/namespace';
import { ROOT, relPath, removePath } from '@/utils/fs';
import { logger } from '@/utils/shellLogger';
import { parseCommandArgv } from '@/utils/shellCommand';

const { args, meta } = parseCommandArgv({
  args: {
    component: { type: 'enum', enum: COMPONENT_ENUM, description: 'Namespace component' },
    target: { description: 'Target Claude directory' },
    items: { description: 'Item name(s) or library path(s) to unload', placeholder: 'name|path', rest: true },
  },
  examples: [
    { args: 'skills ~ kmt-skill-flat', desc: 'Remove by name from target' },
    { args: 'skills ~/myproject <category>/', desc: 'Expand library folder, remove all matches' },
    { args: 'skills ~/myproject <category>/<item>', desc: 'Expand library path, remove match' },
  ],
});

const resolvedComponent = normalizeComponent(args.component)!;
const targetDir = resolveClaudeTarget(args.target, resolvedComponent);

if (!lstatSync(targetDir, { throwIfNoEntry: false })) {
  logger.warn(`Target not found: ${targetDir} — nothing to unload.`);
  process.exit(0);
}

const toBaseName = (item: string) => basename(item.endsWith('.md') ? item.slice(0, -3) : item);

/**
 * Resolves a raw input to a list of basenames to remove from the target.
 *
 * - Has `/`  → library expansion, extract basenames.
 * - No `/`   → check target first; if not found, fall back to library category expansion;
 *              if neither, return as-is so the loop can emit the "not found" warning.
 */
function resolveNames(raw: string): string[] {
  if (raw.includes('/')) {
    return expandGlob(raw, resolvedComponent, ROOT, meta.command, 'unload').map(toBaseName);
  }

  const fileStat = lstatSync(join(targetDir, `${raw}.md`), { throwIfNoEntry: false });
  const folderStat = lstatSync(join(targetDir, raw), { throwIfNoEntry: false });
  if (fileStat || folderStat) return [raw];

  const libDir = join(ROOT, resolvedComponent, raw);
  const libDirStat = lstatSync(libDir, { throwIfNoEntry: false });
  if (libDirStat?.isDirectory() && !isFolderItem(libDir, resolvedComponent)) {
    return collectItems(libDir, raw, resolvedComponent).map(toBaseName);
  }

  return [raw];
}

const names = args.items.flatMap(resolveNames);

logger.info(`Unloading ${names.length} item(s) from "${targetDir}"`);

for (const name of names) {
  const filePath = join(targetDir, `${name}.md`);
  const folderPath = join(targetDir, name);

  const fileStat = lstatSync(filePath, { throwIfNoEntry: false });
  const folderStat = lstatSync(folderPath, { throwIfNoEntry: false });

  if (!fileStat && !folderStat) {
    logger.warn(`Not found in target: ${name}`);
    continue;
  }

  if (fileStat) {
    removePath(filePath);
    logger.success(`Removed: ${filePath}`);
  }
  if (folderStat) {
    removePath(folderPath);
    logger.success(`Removed: ${folderPath}`);
  }
}
