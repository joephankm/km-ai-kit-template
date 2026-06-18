import { dirname, join } from 'path';
import { lstatSync, readdirSync, rmdirSync, symlinkSync } from 'fs';
import { DEFAULT_NAMESPACE, NAMESPACE_COMPONENTS } from '@/configs/namespace';
import { normalizeComponent } from '@/helpers/namespace';
import { ROOT, ensureDir, relPath } from '@/utils/fs';
import { logger } from '@/utils/shellLogger';
import { resolveClaudeTarget } from '@/helpers/claude';
import { parseCommandArgv } from '@/utils/shellCommand';

const cmd = process.env.npm_lifecycle_event ?? '<component>:link';

const { options, args } = parseCommandArgv({
  command: `pnpm ${cmd}`,
  args: {
    component: { description: 'Namespace component (e.g. skills, agents)' },
    target:    { description: 'Target Claude directory (default: ~/.claude)', optional: true },
  },
  options: {
    ns: { default: DEFAULT_NAMESPACE, description: 'Namespace to use', value: 'namespace' },
  },
  examples: [
    'skills',
    { args: 'skills ~/myproject --ns main', desc: 'Link to a project-specific directory' },
  ],
});

const { component: rawComponent, target } = args;
const rawTarget = target ?? '~';
const ns = options.ns!;

const component = normalizeComponent(rawComponent);
if (!component) {
  logger.error(`Invalid component: "${rawComponent}"`, `Allowed: ${NAMESPACE_COMPONENTS.join(', ')}`);
  process.exit(1);
}

const source = join(ROOT, 'active', ns, component);
const sourceStat = lstatSync(source, { throwIfNoEntry: false });
if (!sourceStat) {
  logger.error(`Source not found: ${relPath(source)}`, `Run: pnpm ns:init --ns ${ns} ${component}`);
  process.exit(1);
}

const resolvedTarget = resolveClaudeTarget(rawTarget, component);

logger.info(`Linking "${component}" (ns: ${ns})`, `source → ${relPath(source)}`, `target → ${resolvedTarget}`);

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
        `  pnpm ${component}:link ${rawTarget} --ns ${ns}`,
        'Option 2 — Link individual items instead:',
        `  pnpm ${component}:link:item <item> ${rawTarget} --ns ${ns}`
      );
      process.exit(1);
    }
    rmdirSync(resolvedTarget);
  }
}

ensureDir(dirname(resolvedTarget));
symlinkSync(source, resolvedTarget);
logger.success(`Linked: ${resolvedTarget}`);
