import { createInterface } from 'readline/promises';

/** Asks a yes/no question and returns true if the user answered yes. */
export async function confirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(`${question} (y/n) `);
  rl.close();
  return answer.trim().toLowerCase() === 'y';
}
