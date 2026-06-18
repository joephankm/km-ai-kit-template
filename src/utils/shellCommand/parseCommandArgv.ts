import { parseArgs } from 'util';
import type { ArgItem, ExampleItem, OptionsMap, UsageOptionsMap } from '@/utils/shellLogger';
import { commandLog } from '@/utils/shellLogger';
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

function toArgItems(argsDef: ArgsDef): ArgItem[] {
  return Object.entries(argsDef).map(([key, def]) => ({
    placeholder: def.rest ? `${def.placeholder ?? key}...` : (def.placeholder ?? key),
    description: def.description,
    optional: def.optional,
  }));
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
  const cmd = command ?? process.env.npm_lifecycle_event ?? 'command';
  const argEntries = Object.entries(args);

  const parseArgsOpts: Record<string, ParseArgsFields> = Object.fromEntries(
    Object.entries(opts).map(([k, v]) => [
      k,
      {
        type: v.type ?? 'string',
        multiple: v.multiple,
        default: v.default,
        short: v.short,
      },
    ])
  );

  const { values, positionals } = parseArgs({
    args: process.argv.slice(start),
    options: parseArgsOpts,
    allowPositionals: argEntries.length > 0,
    strict: true,
  });

  const displayOptions: OptionsMap = Object.fromEntries(
    Object.entries(opts).map(([key, def]) => [
      key,
      {
        type: def.type ?? 'string',
        description: def.description,
        short: def.short,
        value: def.value,
        required: def.required,
      },
    ])
  );

  const hasOptions = Object.keys(displayOptions).length > 0;
  const usageOptions: UsageOptionsMap | undefined = hasOptions ? { '*': true, ...displayOptions } : undefined;

  const argItems = toArgItems(args);
  const resolved = resolveExamples(examples, cmd);

  function log() {
    commandLog.usage({ command: cmd, args: argItems, options: usageOptions });
    if (hasOptions) commandLog.options(displayOptions);
    if (resolved.length > 0) commandLog.example(...resolved);
  }

  const requiredCount = minArgs ?? argEntries.filter(([, def]) => !def.optional).length;
  if (positionals.length < requiredCount) {
    log();
    process.exit(1);
  }

  return {
    options: values as ParsedOptions<Opt>,
    args: mapPositionals(positionals, args),
    log,
  };
}
