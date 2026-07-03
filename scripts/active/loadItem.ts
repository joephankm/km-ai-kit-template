import { basename, join } from 'path';
import { cpSync, lstatSync, symlinkSync } from 'fs';
import { spawnSync } from 'child_process';
import { COMPONENT_ENUM, DEFAULT_NAMESPACE } from '@/configs/namespace';
import { isFolderItem } from '@/helpers/claude';
import { expandGlob } from '@/helpers/items';
import { normalizeComponent } from '@/helpers/namespace';
import { ROOT, ensureDir, relPath, removePath } from '@/utils/fs';
import { logger } from '@/utils/shellLogger';
import { parseCommandArgv } from '@/utils/shellCommand';
import { confirm } from '@/utils/prompt';

const { options, args, meta } = parseCommandArgv({
  args: {
    component: { type: 'enum', enum: COMPONENT_ENUM, description: 'Namespace component' },
    items: { description: 'Item paths to load (category/item or category/)', rest: true },
  },
  options: {
    ns: { default: DEFAULT_NAMESPACE, description: 'Namespace to use' },
    copy: { type: 'boolean', description: 'Copy instead of symlink' },
    force: { type: 'boolean', description: 'Overwrite existing items' },
    rename: { description: 'Load under a different name (single item only)', value: 'new-name' },
  },
  examples: [
    'skills <category>/<item>',
    'skills <category>/<item1> <category>/<item2>',
    'skills <category>/',
    { args: 'skills <category>/<item> --rename my-item', desc: 'Load under a different name' },
  ],
});

const resolvedComponent = normalizeComponent(args.component)!;

async function execute() {
  const targetDir = join(ROOT, 'active', options.ns!, resolvedComponent);
  if (!lstatSync(targetDir, { throwIfNoEntry: false })) {
    logger.warn(`Namespace component not initialized: ${relPath(targetDir)}`);
    const initCmd = meta.command.replace(/\w+$/, 'initNamespace');
    const yes = await confirm(`Run "${initCmd} --ns ${options.ns!} ${resolvedComponent}" now?`, true);
    if (!yes) process.exit(0);
    const result = spawnSync(meta.packageManager ?? 'pnpm', ['ns:init', '--ns', options.ns!, resolvedComponent], {
      stdio: 'inherit',
    });
    if (result.status !== 0) process.exit(result.status ?? 1);
  }

  const items = args.items.flatMap(raw => expandGlob(raw, resolvedComponent, ROOT, meta.command));

  if (options.rename && items.length !== 1) {
    logger.error(`--rename requires exactly one item, got ${items.length}`);
    process.exit(1);
  }

  logger.info(
    `Loading ${items.length} item(s) into "${options.ns!}/${resolvedComponent}" (${options.copy ? 'copy' : 'symlink'})`
  );

  for (const rawItemPath of items) {
    const itemBase = rawItemPath.endsWith('.md') ? rawItemPath.slice(0, -3) : rawItemPath;
    const folderSource = join(ROOT, resolvedComponent, itemBase);
    const fileSource = join(ROOT, resolvedComponent, `${itemBase}.md`);

    let source: string;
    let targetName: string;

    if (isFolderItem(folderSource, resolvedComponent)) {
      source = folderSource;
      targetName = options.rename ?? basename(itemBase);
    } else if (lstatSync(fileSource, { throwIfNoEntry: false })) {
      source = fileSource;
      targetName = `${options.rename ?? basename(itemBase)}.md`;
    } else {
      logger.error(`Not found: ${relPath(fileSource)}`);
      continue;
    }

    const target = join(targetDir, targetName);
    const targetStat = lstatSync(target, { throwIfNoEntry: false });
    if (targetStat) {
      if (!options.force) {
        logger.warn(`Already loaded: ${targetName} (use --force to overwrite)`);
        continue;
      }
      removePath(target);
    }

    ensureDir(targetDir);
    if (options.copy) {
      cpSync(source, target, { recursive: true });
      logger.success(`Copied: ${relPath(source)} → ${relPath(target)}`);
    } else {
      symlinkSync(source, target);
      logger.success(`Linked: ${relPath(source)} → ${relPath(target)}`);
    }
  }
}

execute().catch(e => {
  logger.error(String(e));
  process.exit(1);
});
