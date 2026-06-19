import { join } from 'path';
import { lstatSync, readdirSync } from 'fs';
import { COMPONENTS, DEFAULT_NAMESPACE, type NamespaceComponent } from '@/configs/namespace';
import { normalizeComponent } from '@/helpers/namespace';
import { ROOT, relPath, removePath } from '@/utils/fs';
import { logger } from '@/utils/shellLogger';
import { confirm } from '@/utils/prompt';
import { parseCommandArgv } from '@/utils/shellCommand';

const { options, args } = parseCommandArgv({
  args: {
    components: { description: 'Components to clean — omit or pass "all" for all', optional: true, rest: true },
  },
  options: {
    ns: { default: DEFAULT_NAMESPACE, description: 'Namespace to use' },
    delete: { type: 'boolean', description: 'Delete component folders instead of clearing' },
  },
  examples: ['--ns main', 'skills', 'all --delete', 'skills --ns work'],
});

const useAll = args.components.length === 0 || args.components.includes('all');

if (!useAll) {
  const invalid = args.components.filter(c => !normalizeComponent(c));
  if (invalid.length > 0) {
    logger.error(`Invalid components: ${invalid.join(', ')}`, `Allowed: ${Object.keys(COMPONENTS).join(', ')}, all`);
    process.exit(1);
  }
}

const resolvedComponents = useAll
  ? (Object.keys(COMPONENTS) as NamespaceComponent[])
  : args.components.map(c => normalizeComponent(c)!);

const nsDir = join(ROOT, 'active', options.ns!);

logger.info(`Cleaning namespace: ${options.ns!}${options.delete ? ' (delete)' : ''}`);

async function execute() {
  if (useAll && options.delete) {
    if (!lstatSync(nsDir, { throwIfNoEntry: false })) {
      logger.warn(`Namespace not found: ${relPath(nsDir)} — nothing to do.`);
      return;
    }
    logger.info(`Will delete namespace: ${relPath(nsDir)}`);
    if (!(await confirm('Proceed?', true))) process.exit(0);
    removePath(nsDir);
    logger.success(`Deleted: ${relPath(nsDir)}`);
    return;
  }

  type Action = { compDir: string; items: string[] | null };
  const actions: Action[] = [];

  for (const component of resolvedComponents) {
    const compDir = join(nsDir, component);
    const compStat = lstatSync(compDir, { throwIfNoEntry: false });

    if (!compStat?.isDirectory()) {
      if (useAll) continue;
      logger.error(`Component not found: ${relPath(compDir)}`);
      process.exit(1);
    }

    if (options.delete) {
      actions.push({ compDir, items: null });
    } else {
      const items = readdirSync(compDir);
      if (items.length === 0) {
        logger.warn(`Already empty: ${relPath(compDir)}`);
      } else {
        actions.push({ compDir, items });
      }
    }
  }

  if (actions.length === 0) return;

  if (options.delete) {
    logger.info(`Will delete: ${actions.map(a => relPath(a.compDir)).join(', ')}`);
  } else {
    const total = actions.reduce((sum, a) => sum + (a.items?.length ?? 0), 0);
    logger.info(
      `Will remove ${total} item(s) from: ${actions.map(a => `${relPath(a.compDir)} (${a.items?.length})`).join(', ')}`
    );
  }

  if (!(await confirm('Proceed?', true))) process.exit(0);

  for (const { compDir, items } of actions) {
    if (options.delete) {
      removePath(compDir);
      logger.success(`Deleted: ${relPath(compDir)}`);
    } else {
      items!.forEach(f => removePath(join(compDir, f)));
      logger.success(`Cleaned: ${relPath(compDir)} (${items!.length} item(s) removed)`);
    }
  }
}

execute().catch(e => {
  logger.error(String(e));
  process.exit(1);
});
