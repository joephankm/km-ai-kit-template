import { basename, join } from 'path';
import { lstatSync } from 'fs';
import { parseArgs } from 'util';
import { DEFAULT_NAMESPACE, NAMESPACE_COMPONENTS } from '@/configs/namespace';
import { isFolderItem } from '@/helpers/claude';
import { collectItems, expandGlob } from '@/helpers/items';
import { normalizeComponent } from '@/helpers/namespace';
import { ROOT, relPath, removePath } from '@/utils/fs';
import { logger } from '@/utils/logger';

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    ns: { type: 'string', default: DEFAULT_NAMESPACE },
  },
  allowPositionals: true,
});

const cmd = process.env.npm_lifecycle_event ?? '<component>:unload';

if (positionals.length < 2) {
  logger.error(`Usage: pnpm ${cmd} <name|path...> [--ns <namespace>]`);
  logger.dim('Examples:');
  logger.dim(`  pnpm ${cmd} kmt-skill-flat              # remove by name from active`);
  logger.dim(`  pnpm ${cmd} <category>/                 # expand library folder, remove all matches from active`);
  logger.dim(`  pnpm ${cmd} <category>/<item>           # expand library path, remove match from active`);
  process.exit(1);
}

const [rawComponent, ...rawItems] = positionals;
const namespace = values.ns!;

const component = normalizeComponent(rawComponent);
if (!component) {
  logger.error(`Invalid component: "${rawComponent}"`);
  logger.dim(`Allowed: ${NAMESPACE_COMPONENTS.join(', ')}`);
  process.exit(1);
}

const resolvedComponent = component;
const activeDir = join(ROOT, 'active', namespace, resolvedComponent);

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
    return expandGlob(raw, resolvedComponent, ROOT, cmd, 'unload').map(toBaseName);
  }

  // Check active directly
  const fileStat = lstatSync(join(activeDir, `${raw}.md`), { throwIfNoEntry: false });
  const folderStat = lstatSync(join(activeDir, raw), { throwIfNoEntry: false });
  if (fileStat || folderStat) return [raw];

  // Not in active — check if it's a category folder in the library
  const libDir = join(ROOT, resolvedComponent, raw);
  const libDirStat = lstatSync(libDir, { throwIfNoEntry: false });
  if (libDirStat?.isDirectory() && !isFolderItem(libDir, resolvedComponent)) {
    return collectItems(libDir, raw, resolvedComponent).map(toBaseName);
  }

  return [raw]; // not found anywhere — let the loop emit the warning
}

const names = rawItems.flatMap(resolveNames);

logger.info(`Unloading ${names.length} item(s) from "${namespace}/${resolvedComponent}"`);

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
