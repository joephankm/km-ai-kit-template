import { theme as t } from './theme';

const details = (...args: string[]) => args.map(a => `${t.dim}${a}${t.reset}`).join('  ');
const format = (msg: string, args: string[]) => (args.length ? `${msg}  ${details(...args)}` : msg);

export default {
  info: (msg: string, ...args: string[]) => console.log(`🔵  ${format(msg, args)}`),
  success: (msg: string, ...args: string[]) => console.log(`✅  ${format(msg, args)}`),
  warn: (msg: string, ...args: string[]) => console.log(`⚠️  ${format(msg, args)}`),
  error: (msg: string, ...args: string[]) => console.error(`❌  ${format(msg, args)}`),
};
