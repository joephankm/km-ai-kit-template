import { basename, join } from 'path';
import { cpSync, lstatSync, symlinkSync } from 'fs';
import { COMPONENT_ENUM } from '@/configs/namespace';
import { isFolderItem, resolveClaudeTarget } from '@/helpers/claude';
import { expandGlob } from '@/helpers/items';
import { normalizeComponent } from '@/helpers/namespace';
import { ROOT, ensureDir, relPath, removePath } from '@/utils/fs';
import { logger } from '@/utils/shellLogger';
import { parseCommandArgv } from '@/utils/shellCommand';

const { options, args, meta } = parseCommandArgv({
  args: {
    component: { type: 'enum', enum: COMPONENT_ENUM, description: 'Namespace component' },
    target: { description: 'Target Claude directory (e.g. ~ or ~/myproject)' },
    items: { description: 'Item paths to load (category/item or category/)', placeholder: 'item-path', rest: true },
  },
  options: {
    copy: { type: 'boolean', description: 'Copy instead of symlink' },
    force: { type: 'boolean', description: 'Overwrite existing items' },
  },
  examples: [
    'skills ~ <category>/<item>',
    'skills ~/myproject <category>/',
    { args: 'skills ~/myproject <category>/<item> --copy', desc: 'Load as a copy' },
  ],
});

const resolvedComponent = normalizeComponent(args.component)!;
const targetDir = resolveClaudeTarget(args.target, resolvedComponent);
const items = args.items.flatMap(raw => expandGlob(raw, resolvedComponent, ROOT, meta.command));

logger.info(`Loading ${items.length} item(s) directly into "${targetDir}" (${options.copy ? 'copy' : 'symlink'})`);

ensureDir(targetDir);

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
    if (!options.force) {
      logger.warn(`Already exists: ${targetName} (use --force to overwrite)`);
      continue;
    }
    removePath(target);
  }

  if (options.copy) {
    cpSync(source, target, { recursive: true });
    logger.success(`Copied: ${relPath(source)} → ${target}`);
  } else {
    symlinkSync(source, target);
    logger.success(`Linked: ${relPath(source)} → ${target}`);
  }
}
