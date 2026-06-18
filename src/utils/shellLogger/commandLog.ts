const c = { reset: '\x1b[0m', gray: '\x1b[90m' };

const g = (s: string) => `${c.gray}${s}${c.reset}`;
const INDENT = '  ';

// --- Types ---

export type ExampleItem = string | { cmd: string; desc: string };

export type ArgItem = {
  placeholder: string; // display name without <>, e.g. 'item-path...' → <item-path...>
  description?: string;
  optional?: boolean;
};

export type OptionDef = {
  type?: 'string' | 'boolean'; // mirrors ParseArgsOptionDescriptor; drives value placeholder inference
  description: string;
  short?: string;
  value?: string; // explicit placeholder text; if absent and type === 'string', key name is used
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
  const placeholder = def.value ?? (def.type === 'string' ? name : undefined);
  const sig = placeholder ? `${base} <${placeholder}>` : base;
  return def.required ? sig : `[${sig}]`;
}

function isGrouped(input: OptionsInput): input is OptionsGroup {
  return 'options' in input;
}

function renderOptionsMap(map: OptionsMap): void {
  const entries = Object.entries(map);
  if (entries.length === 0) return;

  const sigs = entries.map(([name, def]) => optionSig(name, def));
  const col = Math.max(...sigs.map(s => s.length)) + 4;

  sigs.forEach((sig, i) => {
    const desc = entries[i][1].description;
    console.log(`${INDENT}${sig}${' '.repeat(col - sig.length)}${g(desc)}`);
  });
}

// --- Export ---

export default {
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
