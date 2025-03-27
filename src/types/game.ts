// Player type
export type PlayerType = 'player' | 'opponent';

// Game phases
export type GamePhase = 'waiting' | 'rolling' | 'selecting' | 'resolution';

// Dice symbol types
export type DiceSymbolType = 'attack' | 'defense' | 'steal' | 'god_token';

// Dice symbol interface
export interface DiceSymbol {
  name: string;
  type: DiceSymbolType;
}

// Game state interface
export interface GameState {
  playerHealth: number;
  opponentHealth: number;
  currentPlayer: PlayerType;
  gamePhase: GamePhase;
  playerDice: DiceSymbol[];
  opponentDice: DiceSymbol[];
  playerSelectedDice: DiceSymbol[];
  opponentSelectedDice: DiceSymbol[];
  playerGodTokens: number;
  opponentGodTokens: number;
  roundNumber: number;
}
