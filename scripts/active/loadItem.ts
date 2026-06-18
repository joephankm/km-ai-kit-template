import { basename, join } from 'path';
import { cpSync, lstatSync, symlinkSync } from 'fs';
import { spawnSync } from 'child_process';
import { DEFAULT_NAMESPACE, NAMESPACE_COMPONENTS } from '@/configs/namespace';
import { isFolderItem } from '@/helpers/claude';
import { expandGlob } from '@/helpers/items';
import { normalizeComponent } from '@/helpers/namespace';
import { ROOT, ensureDir, relPath, removePath } from '@/utils/fs';
import { logger } from '@/utils/shellLogger';
import { parseCommandArgv } from '@/utils/shellCommand';
import { confirm } from '@/utils/prompt';

const cmd = process.env.npm_lifecycle_event ?? '<component>:load';

const { options, args, log } = parseCommandArgv({
  command: `pnpm ${cmd}`,
  args: {
    component: { description: 'Namespace component (e.g. skills, agents)' },
    items: { description: 'Item paths to load (category/item or category/)', rest: true },
  },
  options: {
    ns: { type: 'string', default: DEFAULT_NAMESPACE, description: 'Namespace to use' },
    copy: { type: 'boolean', description: 'Copy instead of symlink' },
    force: { type: 'boolean', description: 'Overwrite existing items' },
  },
  examples: ['skills <category>/<item>', 'skills <category>/<item1> <category>/<item2>', 'skills <category>/'],
});

const { component: rawComponent, items: rawItems } = args;
const ns = options.ns!;
const force = options.force!;
const copy = options.copy!;

const component = normalizeComponent(rawComponent);
if (!component) {
  logger.error(`Invalid component: "${rawComponent}"`, `Allowed: ${NAMESPACE_COMPONENTS.join(', ')}`);
  process.exit(1);
}

const resolvedComponent = component;

async function main() {
  const targetDir = join(ROOT, 'active', ns, resolvedComponent);
  if (!lstatSync(targetDir, { throwIfNoEntry: false })) {
    logger.warn(`Namespace component not initialized: ${relPath(targetDir)}`);
    const yes = await confirm(`Run "pnpm ns:init --ns ${ns} ${resolvedComponent}" now?`, true);
    if (!yes) process.exit(0);
    const result = spawnSync('pnpm', ['ns:init', '--ns', ns, resolvedComponent], { stdio: 'inherit' });
    if (result.status !== 0) process.exit(result.status ?? 1);
  }

  const items = rawItems.flatMap(raw => expandGlob(raw, resolvedComponent, ROOT, cmd));

  logger.info(`Loading ${items.length} item(s) into "${ns}/${resolvedComponent}" (${copy ? 'copy' : 'symlink'})`);

  for (const rawItemPath of items) {
    const itemBase = rawItemPath.endsWith('.md') ? rawItemPath.slice(0, -3) : rawItemPath;
    const folderSource = join(ROOT, resolvedComponent, itemBase);
    const fileSource = join(ROOT, resolvedComponent, `${itemBase}.md`);

    let source: string;
    let targetName: string;

    if (isFolderItem(folderSource, resolvedComponent)) {
      source = folderSource;
      targetName = basename(itemBase);
    } else if (lstatSync(fileSource, { throwIfNoEntry: false })) {
      source = fileSource;
      targetName = `${basename(itemBase)}.md`;
    } else {
      logger.error(`Not found: ${relPath(fileSource)}`);
      continue;
    }

    const target = join(targetDir, targetName);
    const targetStat = lstatSync(target, { throwIfNoEntry: false });
    if (targetStat) {
      if (!force) {
        logger.warn(`Already loaded: ${targetName} (use --force to overwrite)`);
        continue;
      }
      removePath(target);
    }

    ensureDir(targetDir);
    if (copy) {
      cpSync(source, target, { recursive: true });
      logger.success(`Copied: ${relPath(source)} → ${relPath(target)}`);
    } else {
      symlinkSync(source, target);
      logger.success(`Linked: ${relPath(source)} → ${relPath(target)}`);
    }
  }
}

main().catch(e => {
  logger.error(String(e));
  process.exit(1);
});
