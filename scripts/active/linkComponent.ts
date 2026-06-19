import { dirname, join } from 'path';
import { lstatSync, readdirSync, rmdirSync, symlinkSync } from 'fs';
import { COMPONENT_ENUM, DEFAULT_NAMESPACE } from '@/configs/namespace';
import { normalizeComponent } from '@/helpers/namespace';
import { ROOT, ensureDir, relPath } from '@/utils/fs';
import { logger } from '@/utils/shellLogger';
import { resolveClaudeTarget } from '@/helpers/claude';
import { parseCommandArgv } from '@/utils/shellCommand';

const { options, args, meta } = parseCommandArgv({
  args: {
    component: { type: 'enum', enum: COMPONENT_ENUM, description: 'Namespace component' },
    target: { description: 'Target Claude directory (default: ~/.claude)', optional: true },
  },
  options: {
    ns: { default: DEFAULT_NAMESPACE, description: 'Namespace to use', value: 'namespace' },
  },
  examples: ['skills', { args: 'skills ~/myproject --ns main', desc: 'Link to a project-specific directory' }],
});

const resolvedComponent = normalizeComponent(args.component)!;
const source = join(ROOT, 'active', options.ns!, resolvedComponent);
const sourceStat = lstatSync(source, { throwIfNoEntry: false });
if (!sourceStat) {
  logger.error(
    `Source not found: ${relPath(source)}`,
    `Run: ${meta.command.replace(/\w+$/, 'initNamespace')} --ns ${options.ns!} ${resolvedComponent}`
  );
  process.exit(1);
}

const resolvedTarget = resolveClaudeTarget(args.target ?? '~', resolvedComponent);

logger.info(
  `Linking "${resolvedComponent}" (ns: ${options.ns!})`,
  `source → ${relPath(source)}`,
  `target → ${resolvedTarget}`
);

const targetStat = lstatSync(resolvedTarget, { throwIfNoEntry: false });
if (targetStat) {
  if (targetStat.isSymbolicLink()) {
    logger.warn(`Target is already a symlink — nothing to do.`);
    process.exit(0);
  }

  if (targetStat.isDirectory()) {
    const contents = readdirSync(resolvedTarget);
    if (contents.length > 0) {
      logger.error(
        `Target already has content: ${resolvedTarget}`,
        'Option 1 — Move content into the namespace then re-link:',
        `  mv ${resolvedTarget}/* ${source}/`,
        `  ${meta.command} ${resolvedComponent} ${args.target ?? '~'} --ns ${options.ns!}`,
        'Option 2 — Create individual symlinks manually:',
        `  ln -s ${source}/<item> ${resolvedTarget}/<item>`
      );
      process.exit(1);
    }
    rmdirSync(resolvedTarget);
  }
}

ensureDir(dirname(resolvedTarget));
symlinkSync(source, resolvedTarget);
logger.success(`Linked: ${resolvedTarget}`);
