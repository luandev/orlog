import { rollPlayerDice, keepSelectedDice, resolveTurn } from '../game/game-logic';

// Set up UI event handlers
export function setupUIHandlers(): void {
  // Roll dice button
  document.getElementById('roll-dice-btn')?.addEventListener('click', rollPlayerDice);
  
  // Keep selected dice button
  document.getElementById('keep-dice-btn')?.addEventListener('click', keepSelectedDice);
  
  // Resolve turn button
  document.getElementById('resolve-turn-btn')?.addEventListener('click', resolveTurn);
}
