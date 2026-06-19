import { theme as t } from './theme';

const g = (s: string) => `${t.dim}${s}${t.reset}`;
const INDENT = '  ';

// --- Types ---

export type ExampleItem = string | { cmd: string; desc: string };

export type ArgItem = {
  placeholder: string; // display name without <>, e.g. 'item-path...' → <item-path...>
  description?: string;
  optional?: boolean;
  enum?: Record<string, string>; // accepted values → description; shown in full help
};

export type OptionDef = {
  type?: 'string' | 'boolean' | 'enum'; // drives value placeholder inference; 'enum' shows accepted values
  enum?: Record<string, string>; // accepted values → description; shown in full help
  description: string;
  short?: string;
  value?: string; // explicit placeholder text; overrides the inferred placeholder
  required?: boolean; // default false → wrapped in []
};

export type OptionsMap = Record<string, OptionDef>;

export type OptionsGroup = { title?: string; options: OptionsMap };

export type OptionsInput = OptionsMap | OptionsGroup;

// '*' key controls where [options] placeholder appears in the usage line.
// true | 'end' → end (default), 'start' → right after command, 'after-args' → after args
export type OptionsPlaceholder = boolean | 'start' | 'end' | 'after-args';

// Used only inside UsageItem.options — allows '*' as a special placeholder control key
export type UsageOptionsMap = Record<string, OptionDef | OptionsPlaceholder>;

export type UsageItem =
  | string
  | {
      command: string;
      description?: string;
      args?: ArgItem[];
      options?: UsageOptionsMap;
    };

// --- Helpers ---

function optionSig(name: string, def: OptionDef): string {
  const base = def.short ? `-${def.short}, --${name}` : `--${name}`;
  let placeholder: string | undefined;
  if (def.value) {
    placeholder = def.value;
  } else if (def.type === 'enum' && def.enum) {
    placeholder = Object.keys(def.enum).join('|');
  } else if (def.type === 'string') {
    placeholder = name;
  }
  const sig = placeholder ? `${base} <${placeholder}>` : base;
  return def.required ? sig : `[${sig}]`;
}

function isGrouped(input: OptionsInput): input is OptionsGroup {
  return 'options' in input;
}

function renderEnumValues(enumDef: Record<string, string>): void {
  const entries = Object.entries(enumDef);
  const col = Math.max(...entries.map(([v]) => v.length)) + 4;
  for (const [val, desc] of entries) {
    console.log(`${INDENT}${INDENT}${val}${' '.repeat(col - val.length)}${g(desc)}`);
  }
}

function renderOptionsMap(map: OptionsMap): void {
  const entries = Object.entries(map);
  if (entries.length === 0) return;

  const sigs = entries.map(([name, def]) => optionSig(name, def));
  const col = Math.max(...sigs.map(s => s.length)) + 4;

  sigs.forEach((sig, i) => {
    const def = entries[i][1];
    console.log(`${INDENT}${sig}${' '.repeat(col - sig.length)}${g(def.description)}`);
    if (def.type === 'enum' && def.enum) renderEnumValues(def.enum);
  });
}

// --- Export ---

export default {
  args(...items: ArgItem[]): void {
    console.log('Arguments:');
    console.log();
    const placeholders = items.map(item => (item.optional ? `[<${item.placeholder}>]` : `<${item.placeholder}>`));
    const col = Math.max(...placeholders.map(p => p.length)) + 4;
    items.forEach((item, i) => {
      const ph = placeholders[i];
      console.log(`${INDENT}${ph}${' '.repeat(col - ph.length)}${item.description ? g(item.description) : ''}`);
      if (item.enum) renderEnumValues(item.enum);
    });
  },

  example(...examples: ExampleItem[]): void {
    console.log('Examples:');
    examples.forEach((item, i) => {
      if (typeof item === 'string') {
        console.log(`${INDENT}${item}`);
      } else {
        console.log(`${INDENT}${g(`# ${item.desc}`)}`);
        console.log(`${INDENT}${item.cmd}`);
      }
      if (i < examples.length - 1) console.log();
    });
  },

  usage(...usages: UsageItem[]): void {
    usages.forEach((item, i) => {
      if (typeof item === 'string') {
        console.log(item);
      } else {
        const parts: string[] = [item.command];

        const optEntries = Object.entries(item.options ?? {});
        const placeholder = optEntries.find(([k]) => k === '*')?.[1] as OptionsPlaceholder | undefined;
        const individualOpts = optEntries.filter(([k]) => k !== '*') as [string, OptionDef][];

        if (placeholder === 'start') parts.push('[options]');

        for (const arg of item.args ?? []) {
          parts.push(arg.optional ? `[<${arg.placeholder}>]` : `<${arg.placeholder}>`);
        }

        if (placeholder === 'after-args') parts.push('[options]');

        for (const [name, def] of individualOpts) parts.push(optionSig(name, def));

        if (placeholder === true || placeholder === 'end') parts.push('[options]');

        console.log(`Usage: ${parts.join(' ')}`);
        if (item.description) {
          console.log();
          console.log(item.description);
        }
      }
      if (i < usages.length - 1) console.log();
    });
  },

  options(...inputs: OptionsInput[]): void {
    inputs.forEach((input, index) => {
      const grouped = isGrouped(input);
      const map = grouped ? input.options : input;
      const title = grouped ? input.title : undefined;

      if (index === 0) {
        console.log(title ?? 'Options:');
        console.log();
      } else if (title) {
        console.log();
        console.log(title);
        console.log();
      } else {
        console.log();
        console.log();
      }

      renderOptionsMap(map);
    });
  },
};
