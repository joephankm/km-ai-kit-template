import { dirname, join } from 'path';
import { lstatSync, readdirSync, rmdirSync, symlinkSync } from 'fs';
import { parseArgs } from 'util';
import { DEFAULT_NAMESPACE, NAMESPACE_COMPONENTS } from '@/configs/namespace';
import { normalizeComponent } from '@/helpers/namespace';
import { ROOT, ensureDir, relPath } from '@/utils/fs';
import { logger } from '@/utils/logger';
import { resolveClaudeTarget } from '@/helpers/claude';

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    ns: { type: 'string', default: DEFAULT_NAMESPACE },
  },
  allowPositionals: true,
});

const cmd = process.env.npm_lifecycle_event ?? '<component>:link';

if (positionals.length < 1) {
  logger.error(`Usage: pnpm ${cmd} [target] [--ns <namespace>]`);
  logger.dim(`Example: pnpm ${cmd} ~/myproject --ns main`);
  logger.dim(`Default target: ~ (root ~/.claude)`);
  process.exit(1);
}

const [rawComponent, rawTarget = '~'] = positionals;
const namespace = values.ns!;

const component = normalizeComponent(rawComponent);
if (!component) {
  logger.error(`Invalid component: "${rawComponent}"`);
  logger.dim(`Allowed: ${NAMESPACE_COMPONENTS.join(', ')}`);
  process.exit(1);
}

const source = join(ROOT, 'active', namespace, component);
const sourceStat = lstatSync(source, { throwIfNoEntry: false });
if (!sourceStat) {
  logger.error(`Source not found: ${relPath(source)}`);
  logger.dim(`Run: pnpm ns:init --ns ${namespace} ${component}`);
  process.exit(1);
}

const target = resolveClaudeTarget(rawTarget, component);

logger.info(`Linking "${component}" (ns: ${namespace})`);
logger.dim(`source → ${relPath(source)}`);
logger.dim(`target → ${target}`);

const targetStat = lstatSync(target, { throwIfNoEntry: false });
if (targetStat) {
  if (targetStat.isSymbolicLink()) {
    logger.warn(`Target is already a symlink — nothing to do.`);
    process.exit(0);
  }

  if (targetStat.isDirectory()) {
    const contents = readdirSync(target);
    if (contents.length > 0) {
      logger.error(`Target already has content: ${target}`);
      logger.dim('');
      logger.dim('Option 1 — Move content into the namespace then re-link:');
      logger.dim(`  mv ${target}/* ${source}/`);
      logger.dim(`  pnpm ${component}:link ${rawTarget} --ns ${namespace}`);
      logger.dim('');
      logger.dim('Option 2 — Link individual items instead:');
      logger.dim(`  pnpm ${component}:link:item <item> ${rawTarget} --ns ${namespace}`);
      process.exit(1);
    }
    rmdirSync(target);
  }
}

ensureDir(dirname(target));
symlinkSync(source, target);
logger.success(`Linked: ${target}`);
