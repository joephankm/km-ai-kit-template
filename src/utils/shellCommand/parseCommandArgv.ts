import { parseArgs } from 'util';
import type { ArgItem, ExampleItem, OptionsMap, UsageOptionsMap } from '@/utils/shellLogger';
import { commandLog, logger } from '@/utils/shellLogger';
import type {
  ArgDef,
  ArgsDef,
  ArgvOptionsDef,
  CommandExampleItem,
  ParseArgsFields,
  ParseCommandArgvConfig,
  ParsedArgs,
  ParsedOptions,
} from './types/parseCommandArgv';
import { mapValues, pickValues } from './objectUtils';
import { detectCommand } from './detectCommand';
export type { CommandMeta } from './detectCommand';

export type {
  ArgDef,
  ArgsDef,
  ArgValueType,
  ArgvOptionDef,
  ArgvOptionsDef,
  CommandExampleItem,
  ParseCommandArgvConfig,
  ParsedArgs,
  ParsedOptions,
} from './types/parseCommandArgv';

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[a.length][b.length];
}

// Two-pass match: edit distance ≤ 2 first (sorted closest), then substring-only after.
function bestMatches(input: string, candidates: string[], maxResults = 5): string[] {
  const close: { c: string; d: number }[] = [];
  const closeSet = new Set<string>();

  for (const c of candidates) {
    const d = levenshtein(input, c);
    if (d <= 2) {
      close.push({ c, d });
      closeSet.add(c);
    }
  }

  const subOnly = candidates.filter(c => !closeSet.has(c) && c.includes(input));

  return [...close.sort((a, b) => a.d - b.d).map(x => x.c), ...subOnly].slice(0, maxResults);
}

function toArgItems(argsDef: ArgsDef): ArgItem[] {
  return Object.entries(argsDef).map(([key, def]) => ({
    placeholder: def.rest ? `${def.placeholder ?? key}...` : (def.placeholder ?? key),
    description: def.description,
    optional: def.optional,
    enum: def.enum,
  }));
}

// Shows accepted enum values with descriptions — used in error output.
function logEnumChoices(enumDef: Record<string, string>): void {
  const entries = Object.entries(enumDef);
  const col = Math.max(...entries.map(([v]) => v.length)) + 4;
  const gray = (s: string) => `\x1b[90m${s}\x1b[0m`;
  console.log('  Acceptable values:');
  for (const [val, desc] of entries) {
    console.log(`    ${val}${' '.repeat(col - val.length)}${gray(desc)}`);
  }
}

function resolveExamples(examples: CommandExampleItem[], cmd: string): ExampleItem[] {
  return examples.map(ex => {
    if (typeof ex === 'string') return `${cmd} ${ex}`;
    const full = ex.full ? ex.args : `${cmd} ${ex.args}`;
    return ex.desc ? { cmd: full, desc: ex.desc } : full;
  });
}

function coerceArg(value: string, type: ArgDef['type']): string | number {
  return type === 'number' ? Number(value) : value;
}

function mapPositionals<Arg extends ArgsDef>(positionals: string[], argsDef: Arg): ParsedArgs<Arg> {
  const result: Record<string, string | number | string[] | number[] | undefined> = {};
  Object.entries(argsDef).forEach(([key, def], i) => {
    if (def.rest) {
      result[key] = positionals.slice(i).map(v => coerceArg(v, def.type)) as string[] | number[];
    } else {
      const raw = positionals[i];
      result[key] = raw !== undefined ? coerceArg(raw, def.type) : undefined;
    }
  });
  return result as ParsedArgs<Arg>;
}

export default function parseCommandArgv<Opt extends ArgvOptionsDef = ArgvOptionsDef, Arg extends ArgsDef = ArgsDef>(
  config: ParseCommandArgvConfig<Opt, Arg>
) {
  const { start = 2, command, args = {} as Arg, options, examples = [], minArgs } = config;
  const opts = (options ?? {}) as Opt;
  const meta = detectCommand();
  const cmd = command ?? meta.command;
  const argEntries = Object.entries(args);

  // 'enum' is a display/validation concept only — Node's parseArgs treats it as 'string'
  const parseArgsOpts = mapValues(opts, v => ({
    ...pickValues(v, ['multiple', 'default', 'short']),
    type: (v.type === 'enum' ? 'string' : (v.type ?? 'string')) as 'string' | 'boolean',
  })) as Record<string, ParseArgsFields>;

  const displayOptions: OptionsMap = mapValues(opts, def => ({
    description: def.description,
    ...pickValues(def, ['type', 'short', 'value', 'required', 'enum'], { type: 'string' as const }),
  }));

  const hasOptions = Object.keys(displayOptions).length > 0;
  // --help is always available so [options] always appears in the usage line
  const usageOptions: UsageOptionsMap = { '*': true, ...displayOptions };
  const argItems = toArgItems(args);
  const resolved = resolveExamples(examples, cmd);

  // Short: usage line + examples + hint to run --help. Shown on errors.
  function logShort() {
    commandLog.usage({ command: cmd, args: argItems, options: usageOptions });
    if (resolved.length > 0) commandLog.example(...resolved);
    console.log(`\n  Run \`${cmd} --help\` for full usage.`);
  }

  // Full: usage line + args + options + examples. Shown for --help.
  function logFull() {
    commandLog.usage({ command: cmd, args: argItems, options: usageOptions });
    if (argItems.length > 0) commandLog.args(...argItems);
    if (hasOptions) commandLog.options(displayOptions);
    if (resolved.length > 0) commandLog.example(...resolved);
  }

  // Early --help: raw argv scan so it works regardless of other positionals injected
  // by the package manager script definition (e.g. `pnpm skill:load --help` → argv has `skills --help`).
  if (process.argv.slice(start).includes('--help')) {
    logFull();
    process.exit(0);
  }

  let values: Record<string, string | boolean | string[] | boolean[] | undefined>;
  let positionals: string[];

  try {
    const result = parseArgs({
      args: process.argv.slice(start),
      options: parseArgsOpts,
      allowPositionals: argEntries.length > 0,
      strict: true,
    });
    values = result.values as typeof values;
    positionals = result.positionals;
  } catch (err) {
    if (err instanceof TypeError) {
      // Strip Node's verbose suffix ("To specify a positional argument starting with a '-'...")
      const message = err.message.replace(/\s+To specify a positional[\s\S]*/i, '').trim();
      logger.error(message);

      const unknownMatch = message.match(/Unknown option '(-{1,2})(.+?)'/);
      if (unknownMatch) {
        const [, dashes, name] = unknownMatch;
        const isShort = dashes === '-';
        const candidates = isShort
          ? Object.values(opts)
              .filter(v => v.short)
              .map(v => v.short!)
          : ['help', ...Object.keys(opts)];
        const matches = bestMatches(name, candidates);
        if (matches.length > 0) console.log(`  Did you mean: ${matches.map(m => `${dashes}${m}`).join(', ')}?`);
      }
    }
    logShort();
    process.exit(1);
  }

  const requiredCount = minArgs ?? argEntries.filter(([, def]) => !def.optional).length;
  if (positionals.length < requiredCount) {
    logShort();
    process.exit(1);
  }

  // Enum validation for options
  for (const [key, def] of Object.entries(opts)) {
    if (def.type === 'enum' && def.enum && values[key] !== undefined) {
      const val = values[key] as string;
      if (!(val in def.enum)) {
        logger.error(`Invalid value "${val}" for --${key}`);
        logEnumChoices(def.enum);
        logShort();
        process.exit(1);
      }
    }
  }

  const parsedArgs = mapPositionals(positionals, args);

  // Enum validation for positional args
  for (const [key, def] of Object.entries(args)) {
    if (def.type === 'enum' && def.enum) {
      const val = (parsedArgs as Record<string, unknown>)[key];
      if (typeof val === 'string' && !(val in def.enum)) {
        logger.error(`Invalid value "${val}" for <${def.placeholder ?? key}>`);
        logEnumChoices(def.enum);
        logShort();
        process.exit(1);
      }
    }
  }

  return {
    options: values as ParsedOptions<Opt>,
    args: parsedArgs,
    meta,
  };
}
