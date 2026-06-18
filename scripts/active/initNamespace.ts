import { join } from 'path';
import { DEFAULT_NAMESPACE, NAMESPACE_COMPONENTS } from '@/configs/namespace';
import { normalizeComponent } from '@/helpers/namespace';
import { ROOT, ensureDir, relPath } from '@/utils/fs';
import { logger } from '@/utils/shellLogger';
import { parseCommandArgv } from '@/utils/shellCommand';

const cmd = process.env.npm_lifecycle_event ?? 'ns:init';

const { options, args } = parseCommandArgv({
  command: `pnpm ${cmd}`,
  args: {
    components: { description: 'Components to initialize — omit or pass "all" for all', optional: true, rest: true },
  },
  options: {
    ns: { default: DEFAULT_NAMESPACE, description: 'Namespace to use' },
  },
  examples: ['--ns main', 'skills', 'skills agents', 'all --ns work'],
});

const ns = options.ns!;
const useAll = args.components.length === 0 || args.components.includes('all');
const requestedComponents = useAll ? [...NAMESPACE_COMPONENTS] : args.components;

const invalidComponents = requestedComponents.filter(c => !normalizeComponent(c));
if (invalidComponents.length > 0) {
  logger.error(`Invalid components: ${invalidComponents.join(', ')}`, `Allowed: ${NAMESPACE_COMPONENTS.join(', ')}, all`);
  process.exit(1);
}

const resolvedComponents = requestedComponents.map(c => normalizeComponent(c)!);
const nsDir = join(ROOT, 'active', ns);

logger.info(`Initializing namespace: ${ns}`);

const created = resolvedComponents.map(c => join(nsDir, c)).filter(dir => ensureDir(dir));

if (created.length === 0) {
  logger.warn(`Namespace "${ns}" already exists — nothing to do.`);
} else {
  created.forEach(dir => logger.success(`Created ${relPath(dir)}`));
  logger.success(`Namespace "${ns}" is ready.`);
}
