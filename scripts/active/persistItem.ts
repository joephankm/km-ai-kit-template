import { join } from 'path';
import { lstatSync, renameSync, symlinkSync } from 'fs';
import { DEFAULT_NAMESPACE, NAMESPACE_COMPONENTS } from '@/configs/namespace';
import { normalizeComponent } from '@/helpers/namespace';
import { ROOT, ensureDir, relPath } from '@/utils/fs';
import { logger } from '@/utils/shellLogger';
import { confirm } from '@/utils/prompt';
import { parseCommandArgv } from '@/utils/shellCommand';

const cmd = process.env.npm_lifecycle_event ?? '<component>:persist';

const { options, args } = parseCommandArgv({
  command: `pnpm ${cmd}`,
  args: {
    component:     { description: 'Namespace component (e.g. skills, agents)' },
    name:          { description: 'Name of the item in active' },
    libraryFolder: { description: 'Target folder in the library', placeholder: 'library-folder' },
  },
  options: {
    ns:     { default: DEFAULT_NAMESPACE, description: 'Namespace to use', value: 'namespace' },
    rename: { description: 'Persist under a different name', value: 'new-name' },
  },
  examples: [
    { args: 'skills my-skill coding',                       desc: '→ skills/coding/my-skill' },
    { args: 'skills my-skill coding --rename new-name',     desc: '→ skills/coding/new-name' },
  ],
});

const { component: rawComponent, name: activeName, libraryFolder: rawLibraryFolder } = args;
const ns = options.ns!;

const component = normalizeComponent(rawComponent);
if (!component) {
  logger.error(`Invalid component: "${rawComponent}"`, `Allowed: ${NAMESPACE_COMPONENTS.join(', ')}`);
  process.exit(1);
}

const resolvedComponent = component;
const activeDir = join(ROOT, 'active', ns, resolvedComponent);

if (!lstatSync(activeDir, { throwIfNoEntry: false })) {
  logger.error(`Namespace component not initialized: ${relPath(activeDir)}`);
  process.exit(1);
}

const fileInActive = join(activeDir, `${activeName}.md`);
const folderInActive = join(activeDir, activeName);

const fileStat = lstatSync(fileInActive, { throwIfNoEntry: false });
const folderStat = lstatSync(folderInActive, { throwIfNoEntry: false });

let activeItemPath: string;
let isFolder: boolean;

if (fileStat) {
  if (fileStat.isSymbolicLink()) {
    logger.error(
      `"${activeName}.md" is already a symlink — persist only works on real (non-linked) items.`,
      'The item must be a file or folder you created directly, not loaded from the library.'
    );
    process.exit(1);
  }
  activeItemPath = fileInActive;
  isFolder = false;
} else if (folderStat) {
  if (folderStat.isSymbolicLink()) {
    logger.error(
      `"${activeName}" is already a symlink — persist only works on real (non-linked) items.`,
      'The item must be a file or folder you created directly, not loaded from the library.'
    );
    process.exit(1);
  }
  activeItemPath = folderInActive;
  isFolder = true;
} else {
  logger.error(`Not found in active: "${activeName}"`, `Looked in: ${relPath(activeDir)}`);
  process.exit(1);
}

async function main() {
  const libItemDir = join(ROOT, resolvedComponent, rawLibraryFolder);
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

  const libItemName = options.rename ?? activeName;
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

  renameSync(activeItemPath, libItemPath);
  logger.success(`Moved:  ${relPath(activeItemPath)} → ${relPath(libItemPath)}`);

  symlinkSync(libItemPath, activeItemPath);
  logger.success(`Linked: ${relPath(activeItemPath)} → ${relPath(libItemPath)}`);
}

main().catch(e => {
  logger.error(String(e));
  process.exit(1);
});
