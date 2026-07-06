// Dice rolling logic. Pure function.
import { DiceResult } from './types';

export function rollDice(): DiceResult {
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  return { die1, die2, total: die1 + die2, isDoubles: die1 === die2 };
}
