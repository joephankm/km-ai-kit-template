import { lstatSync, unlinkSync } from 'fs';
import { parseArgs } from 'util';
import { NAMESPACE_COMPONENTS } from '@/configs/namespace';
import { normalizeComponent } from '@/helpers/namespace';
import { logger } from '@/utils/logger';
import { resolveClaudeTarget } from '@/helpers/claude';

const { positionals } = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true,
});

const cmd = process.env.npm_lifecycle_event ?? '<component>:unlink';
const [rawComponent, rawTarget = '~'] = positionals;

const component = normalizeComponent(rawComponent);
if (!component) {
  logger.error(`Invalid component: "${rawComponent}"`);
  logger.dim(`Allowed: ${NAMESPACE_COMPONENTS.join(', ')}`);
  process.exit(1);
}

const target = resolveClaudeTarget(rawTarget, component);

logger.info(`Unlinking "${component}"`);
logger.dim(`target → ${target}`);

const stat = lstatSync(target, { throwIfNoEntry: false });

if (!stat) {
  logger.warn(`Target does not exist — nothing to do.`);
  process.exit(0);
}

if (!stat.isSymbolicLink()) {
  logger.error(`Target is not a symlink: ${target}`);
  logger.dim(`Only symlinks created by ${cmd.replace('unlink', 'link')} can be removed.`);
  process.exit(1);
}

unlinkSync(target);
logger.success(`Unlinked: ${target}`);
