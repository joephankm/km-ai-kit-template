const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const details = (...args: string[]) => args.map(a => `${c.gray}${a}${c.reset}`).join('  ');
const format = (msg: string, args: string[]) => (args.length ? `${msg}  ${details(...args)}` : msg);

export default {
  info: (msg: string, ...args: string[]) => console.log(`${c.cyan}ℹ${c.reset}  ${format(msg, args)}`),
  success: (msg: string, ...args: string[]) => console.log(`${c.green}✓${c.reset}  ${format(msg, args)}`),
  warn: (msg: string, ...args: string[]) => console.log(`${c.yellow}⚠${c.reset}  ${format(msg, args)}`),
  error: (msg: string, ...args: string[]) => console.error(`${c.red}✗${c.reset}  ${format(msg, args)}`),
};
