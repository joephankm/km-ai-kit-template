import { join } from 'path';
import { lstatSync, readdirSync } from 'fs';
import { type NamespaceComponent } from '@/configs/namespace';
import { isFolderItem } from '@/helpers/claude';
import { relPath } from '@/utils/fs';
import { logger } from '@/utils/logger';

/** Recursively collects all item paths (flat .md files and folder skills) under a directory. */
export function collectItems(absDir: string, relDir: string, component: NamespaceComponent): string[] {
  return readdirSync(absDir).flatMap(f => {
    const absPath = join(absDir, f);
    const relItemPath = join(relDir, f);
    if (f.endsWith('.md')) return [relItemPath];
    const stat = lstatSync(absPath, { throwIfNoEntry: false });
    if (!stat?.isDirectory()) return [];
    if (isFolderItem(absPath, component)) return [relItemPath];
    return collectItems(absPath, relItemPath, component); // category folder — recurse deeper
  });
}

/**
 * Resolves a raw input string to a list of library-relative item paths.
 *
 * Trailing `/` forces category expansion. Without it:
 * - Prefers skill over category when both share the same name (warns + shows re-run command).
 * - Falls back to category expansion when no skill matches.
 */
export function expandGlob(
  raw: string,
  component: NamespaceComponent,
  root: string,
  cmd: string,
  verb = 'load'
): string[] {
  const isExplicitGlob = raw.endsWith('/');
  const dirPath = join(root, component, raw.replace(/\/$/, ''));
  const flatPath = join(root, component, `${raw}.md`);

  if (isExplicitGlob) {
    if (!lstatSync(dirPath, { throwIfNoEntry: false })?.isDirectory()) {
      logger.error(`Directory not found: ${relPath(dirPath)}`);
      process.exit(1);
    }
    return collectItems(dirPath, raw.slice(0, -1), component);
  }

  // No trailing slash — disambiguate
  const flatExists = !!lstatSync(flatPath, { throwIfNoEntry: false });
  const dirStat = lstatSync(dirPath, { throwIfNoEntry: false });
  const isDir = !!dirStat?.isDirectory();
  const isFolderSkillDir = isDir && isFolderItem(dirPath, component);
  const isCategoryDir = isDir && !isFolderSkillDir;

  if ((flatExists || isFolderSkillDir) && isCategoryDir) {
    logger.warn(`"${raw}" matches both a skill and a category folder — ${verb}ing the skill.`);
    logger.dim(`  To ${verb} the folder contents: pnpm ${cmd} ${raw}/`);
    return [raw];
  }

  if (flatExists || isFolderSkillDir) return [raw];

  if (isCategoryDir) return collectItems(dirPath, raw, component);

  return [raw]; // not found — let the caller emit the error
}
