import { createInterface } from 'readline/promises';

/**
 * Asks a yes/no question and returns true if the user answered yes.
 */
export async function confirm(question: string, defaultYes = false): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const hint = defaultYes ? '(Y/n)' : '(y/n)';
  const answer = await rl.question(`${question} ${hint} `);
  rl.close();
  if (answer.trim() === '') return defaultYes;
  return answer.trim().toLowerCase() === 'y';
}
