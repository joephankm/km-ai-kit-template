import { join } from 'path';
import { lstatSync, renameSync, symlinkSync } from 'fs';
import { COMPONENT_ENUM } from '@/configs/namespace';
import { resolveClaudeTarget } from '@/helpers/claude';
import { normalizeComponent } from '@/helpers/namespace';
import { ROOT, ensureDir, relPath } from '@/utils/fs';
import { logger } from '@/utils/shellLogger';
import { confirm } from '@/utils/prompt';
import { parseCommandArgv } from '@/utils/shellCommand';

const { options, args } = parseCommandArgv({
  args: {
    component: { type: 'enum', enum: COMPONENT_ENUM, description: 'Namespace component' },
    target: { description: 'Target Claude directory' },
    name: { description: 'Name of the item in target' },
    libraryFolder: { description: 'Destination folder in the library', placeholder: 'library-folder' },
  },
  options: {
    rename: { description: 'Persist under a different name', value: 'new-name' },
  },
  examples: ['skills ~ my-skill coding', 'skills ~/myproject my-skill coding --rename new-name'],
});

const resolvedComponent = normalizeComponent(args.component)!;
const targetDir = resolveClaudeTarget(args.target, resolvedComponent);

if (!lstatSync(targetDir, { throwIfNoEntry: false })) {
  logger.error(`Target not found: ${targetDir}`);
  process.exit(1);
}

const fileInTarget = join(targetDir, `${args.name}.md`);
const folderInTarget = join(targetDir, args.name);

const fileStat = lstatSync(fileInTarget, { throwIfNoEntry: false });
const folderStat = lstatSync(folderInTarget, { throwIfNoEntry: false });

let itemPath: string;
let isFolder: boolean;

if (fileStat) {
  if (fileStat.isSymbolicLink()) {
    logger.error(
      `"${args.name}.md" is already a symlink — persist only works on real (non-linked) items.`,
      'The item must be a file or folder you created directly, not loaded from the library.'
    );
    process.exit(1);
  }
  itemPath = fileInTarget;
  isFolder = false;
} else if (folderStat) {
  if (folderStat.isSymbolicLink()) {
    logger.error(
      `"${args.name}" is already a symlink — persist only works on real (non-linked) items.`,
      'The item must be a file or folder you created directly, not loaded from the library.'
    );
    process.exit(1);
  }
  itemPath = folderInTarget;
  isFolder = true;
} else {
  logger.error(`Not found in target: "${args.name}"`, `Looked in: ${targetDir}`);
  process.exit(1);
}

async function execute() {
  const libItemDir = join(ROOT, resolvedComponent, args.libraryFolder);
  const libDirStat = lstatSync(libItemDir, { throwIfNoEntry: false });
  if (!libDirStat?.isDirectory()) {
    logger.warn(`Destination folder not found: ${relPath(libItemDir)}`);
    const yes = await confirm(`Create folder "${relPath(libItemDir)}"?`, true);
    if (!yes) {
      logger.error(`Destination folder not found: ${relPath(libItemDir)}`);
      process.exit(1);
    }
    ensureDir(libItemDir);
  }

  const libItemName = options.rename ?? args.name;
  const libItemPath = isFolder ? join(libItemDir, libItemName) : join(libItemDir, `${libItemName}.md`);

  if (lstatSync(libItemPath, { throwIfNoEntry: false })) {
    if (!options.rename) {
      logger.error(
        `Already exists in library: ${relPath(libItemPath)}`,
        `Use --rename <new-name> to persist under a different name.`
      );
    } else {
      logger.error(`Already exists in library: ${relPath(libItemPath)}`);
    }
    process.exit(1);
  }

  renameSync(itemPath, libItemPath);
  logger.success(`Moved:  ${itemPath} → ${relPath(libItemPath)}`);

  symlinkSync(libItemPath, itemPath);
  logger.success(`Linked: ${itemPath} → ${relPath(libItemPath)}`);
}

execute().catch(e => {
  logger.error(String(e));
  process.exit(1);
});
