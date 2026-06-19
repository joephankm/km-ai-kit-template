import { lstatSync, unlinkSync } from 'fs';
import { COMPONENT_ENUM } from '@/configs/namespace';
import { normalizeComponent } from '@/helpers/namespace';
import { logger } from '@/utils/shellLogger';
import { resolveClaudeTarget } from '@/helpers/claude';
import { parseCommandArgv } from '@/utils/shellCommand';

const { args } = parseCommandArgv({
  args: {
    component: { type: 'enum', enum: COMPONENT_ENUM, description: 'Namespace component' },
    target: { description: 'Target Claude directory (default: ~/.claude)', optional: true },
  },
  examples: ['skills', 'skills ~/myproject'],
});

const resolvedComponent = normalizeComponent(args.component)!;
const resolvedTarget = resolveClaudeTarget(args.target ?? '~', resolvedComponent);

logger.info(`Unlinking "${resolvedComponent}"`, `target → ${resolvedTarget}`);

const stat = lstatSync(resolvedTarget, { throwIfNoEntry: false });

if (!stat) {
  logger.warn(`Target does not exist — nothing to do.`);
  process.exit(0);
}

if (!stat.isSymbolicLink()) {
  logger.error(
    `Target is not a symlink: ${resolvedTarget}`,
    `Only symlinks created by the link command can be removed.`
  );
  process.exit(1);
}

unlinkSync(resolvedTarget);
logger.success(`Unlinked: ${resolvedTarget}`);
