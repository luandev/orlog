import { DiceSymbol } from '../types/game';

// Dice symbols and their meanings
export const DICE_SYMBOLS: Record<string, DiceSymbol> = {
  AXE: { name: 'Axe', type: 'attack' },
  ARROW: { name: 'Arrow', type: 'attack' },
  HELMET: { name: 'Helmet', type: 'defense' },
  SHIELD: { name: 'Shield', type: 'defense' },
  HAND: { name: 'Hand', type: 'steal' },
  PRAYER: { name: 'Prayer', type: 'god_token' }
};

// Game constants
export const INITIAL_HEALTH = 15;
export const MAX_SELECTED_DICE = 3;
export const TOTAL_DICE = 6;
export const RESOLUTION_DELAY = 3000; // ms
