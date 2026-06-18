import { lstatSync, unlinkSync } from 'fs';
import { NAMESPACE_COMPONENTS } from '@/configs/namespace';
import { normalizeComponent } from '@/helpers/namespace';
import { logger } from '@/utils/shellLogger';
import { resolveClaudeTarget } from '@/helpers/claude';
import { parseCommandArgv } from '@/utils/shellCommand';

const cmd = process.env.npm_lifecycle_event ?? '<component>:unlink';

const { args } = parseCommandArgv({
  command: `pnpm ${cmd}`,
  args: {
    component: { description: 'Namespace component (e.g. skills, agents)' },
    target:    { description: 'Target Claude directory (default: ~/.claude)', optional: true },
  },
  examples: ['skills', 'skills ~/myproject'],
});

const { component: rawComponent, target } = args;
const rawTarget = target ?? '~';

const component = normalizeComponent(rawComponent);
if (!component) {
  logger.error(`Invalid component: "${rawComponent}"`, `Allowed: ${NAMESPACE_COMPONENTS.join(', ')}`);
  process.exit(1);
}

const resolvedTarget = resolveClaudeTarget(rawTarget, component);

logger.info(`Unlinking "${component}"`, `target → ${resolvedTarget}`);

const stat = lstatSync(resolvedTarget, { throwIfNoEntry: false });

if (!stat) {
  logger.warn(`Target does not exist — nothing to do.`);
  process.exit(0);
}

if (!stat.isSymbolicLink()) {
  logger.error(
    `Target is not a symlink: ${resolvedTarget}`,
    `Only symlinks created by ${cmd.replace('unlink', 'link')} can be removed.`,
  );
  process.exit(1);
}

unlinkSync(resolvedTarget);
logger.success(`Unlinked: ${resolvedTarget}`);
