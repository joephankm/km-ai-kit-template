import { join } from 'path';
import { parseArgs } from 'util';
import { DEFAULT_NAMESPACE, NAMESPACE_COMPONENTS } from '@/configs/namespace';
import { normalizeComponent } from '@/helpers/namespace';
import { ROOT, ensureDir, relPath } from '@/utils/fs';
import { logger } from '@/utils/logger';

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    ns: { type: 'string', default: DEFAULT_NAMESPACE },
  },
  allowPositionals: true,
});

const namespace = values.ns!;
const useAll = positionals.length === 0 || positionals.includes('all');
const requestedComponents = useAll ? [...NAMESPACE_COMPONENTS] : positionals;

const invalidComponents = requestedComponents.filter(c => !normalizeComponent(c));
if (invalidComponents.length > 0) {
  logger.error(`Invalid components: ${invalidComponents.join(', ')}`);
  logger.dim(`Allowed: ${NAMESPACE_COMPONENTS.join(', ')}, all`);
  process.exit(1);
}

const resolvedComponents = requestedComponents.map(c => normalizeComponent(c)!);

const nsDir = join(ROOT, 'active', namespace);

logger.info(`Initializing namespace: ${namespace}`);

const created = resolvedComponents.map(c => join(nsDir, c)).filter(dir => ensureDir(dir));

if (created.length === 0) {
  logger.warn(`Namespace "${namespace}" already exists — nothing to do.`);
} else {
  created.forEach(dir => logger.success(`Created ${relPath(dir)}`));
  logger.success(`Namespace "${namespace}" is ready.`);
}
