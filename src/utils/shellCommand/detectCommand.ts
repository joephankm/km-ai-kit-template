import { basename, relative } from 'path';

export type CommandMeta = {
  runner: string; // execution runner: 'tsx', 'ts-node', 'node', 'bun', etc.
  packageManager?: string; // present when invoked via a package manager: 'pnpm', 'npm', 'yarn'
  command: string; // full command for usage display, always in direct form (e.g. 'tsx scripts/active/loadItem')
};

/**
 * Detects the runner used for direct execution (tsx, ts-node, node, etc.)
 * by inspecting execArgv for registered loaders/importers.
 */
function detectRunner(): string {
  const execArgv = process.execArgv.join(' ');
  if (execArgv.includes('tsx')) return 'tsx';
  if (execArgv.includes('ts-node')) return 'ts-node';
  return basename(process.argv[0]);
}

/**
 * Detects the package manager from the user agent string set by npm/pnpm/yarn.
 */
function detectPackageManager(): string | undefined {
  const agent = (process.env.npm_config_user_agent ?? '').split('/')[0];
  return agent || undefined;
}

/**
 * Resolves runtime invocation metadata: runner, package manager (if any), and display command.
 * Always uses the direct invocation form for `command` so usage output shows the full argument
 * list regardless of how the script was launched.
 */
export function detectCommand(): CommandMeta {
  // TODO: when invoked via a package manager, show `pnpm skill:load <items...>` (without the
  //   pre-filled positionals injected by the script definition) instead of the tsx form.
  //   Requires knowing which positionals were injected so they can be stripped from the usage line.
  // const lifecycleEvent = process.env.npm_lifecycle_event;
  //
  // if (lifecycleEvent) {
  //   const { name, needsRun } = detectPackageManager();
  //   return needsRun ? `${name} run ${lifecycleEvent}` : `${name} ${lifecycleEvent}`;
  // }

  const runner = detectRunner();
  const packageManager = detectPackageManager();
  const scriptPath = relative(process.cwd(), process.argv[1]).replace(/\.[jt]sx?$/, '');
  return { runner, packageManager, command: `${runner} ${scriptPath}` };
}
