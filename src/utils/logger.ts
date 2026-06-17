const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

export const logger = {
  info: (msg: string) => console.log(`${c.cyan}ℹ${c.reset}  ${msg}`),
  success: (msg: string) => console.log(`${c.green}✓${c.reset}  ${msg}`),
  warn: (msg: string) => console.log(`${c.yellow}⚠${c.reset}  ${msg}`),
  error: (msg: string) => console.error(`${c.red}✗${c.reset}  ${msg}`),
  dim: (msg: string) => console.log(`${c.gray}  ${msg}${c.reset}`),
};
