// Internal shape passed to Node's util.parseArgs — excludes display-only fields
export type ParseArgsFields = {
  type: 'string' | 'boolean';
  multiple?: boolean;
  default?: string | boolean | string[] | boolean[];
  short?: string;
};

// A single option definition combining parseArgs runtime config and commandLog display config.
// `type` defaults to 'string' when omitted.
export type ArgvOptionDef = {
  type?: 'string' | 'boolean';
  multiple?: boolean;
  default?: string | boolean | string[] | boolean[];
  short?: string;
  description: string;
  value?: string;      // explicit value placeholder; inferred from key when type is 'string'
  required?: boolean;
};

// A record of named option definitions passed to parseCommandArgv
export type ArgvOptionsDef = Record<string, ArgvOptionDef>;

// A single positional argument definition.
// The record key is used as the return property name and the default display placeholder.
// Only the last entry in ArgsDef may set rest: true.
export type ArgDef = {
  type?: 'string' | 'number';   // default 'string'; drives return type and future validation
  placeholder?: string;          // overrides key as display placeholder
  description?: string;
  optional?: boolean;
  rest?: boolean;                // collects all remaining positionals as an array
};

// A record of named positional argument definitions passed to parseCommandArgv
export type ArgsDef = Record<string, ArgDef>;

// Maps an ArgDef to its scalar value type based on the type field
export type ArgValueType<Def extends ArgDef> = Def extends { type: 'number' } ? number : string;

// Typed positional return — combines ArgValueType with rest and optional modifiers
export type ParsedArgs<Arg extends ArgsDef> = {
  [K in keyof Arg]: Arg[K] extends { rest: true }
    ? ArgValueType<Arg[K]>[]
    : Arg[K] extends { optional: true }
    ? ArgValueType<Arg[K]> | undefined
    : ArgValueType<Arg[K]>;
};

// Typed options return — mirrors parseArgs conditional return logic.
// Absent or 'string' type → string; 'boolean' → boolean; multiple → array variant.
export type ParsedOptions<Opt extends ArgvOptionsDef> = {
  [K in keyof Opt]?: Opt[K] extends { type: 'boolean'; multiple: true }
    ? boolean[]
    : Opt[K] extends { type: 'boolean' }
    ? boolean
    : Opt[K] extends { multiple: true }
    ? string[]
    : string;
};

// A single example entry for parseCommandArgv.
// String form is auto-prepended with the command name.
// Object form with full: true uses the args string as-is without prepending.
export type CommandExampleItem =
  | string
  | { args: string; desc?: string; full?: boolean };

// Full configuration object for parseCommandArgv
export type ParseCommandArgvConfig<
  Opt extends ArgvOptionsDef = ArgvOptionsDef,
  Arg extends ArgsDef = ArgsDef,
> = {
  start?: number;      // argv slice position, default 2
  command?: string;    // display name shown in usage, e.g. 'pnpm skills:load'
  args?: Arg;
  options?: Opt;
  examples?: CommandExampleItem[];
  minArgs?: number;    // override auto-calculated min (count of non-optional args)
};
