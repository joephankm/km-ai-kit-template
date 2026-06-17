import { existsSync, lstatSync, mkdirSync, rmSync, unlinkSync } from 'fs';
import { resolve } from 'path';

export const ROOT = resolve(import.meta.dirname, '../..');

/** Creates a directory if it doesn't exist. Returns true if it was created. */
export function ensureDir(dirPath: string): boolean {
  if (existsSync(dirPath)) return false;
  mkdirSync(dirPath, { recursive: true });
  return true;
}

/** Removes a path regardless of whether it is a file, symlink, or directory. */
export function removePath(targetPath: string): void {
  const stat = lstatSync(targetPath, { throwIfNoEntry: false });
  if (!stat) return;
  stat.isDirectory() ? rmSync(targetPath, { recursive: true }) : unlinkSync(targetPath);
}

/** Returns path relative to repo root, for display purposes. */
export function relPath(absPath: string): string {
  return absPath.replace(ROOT + '/', '');
}
