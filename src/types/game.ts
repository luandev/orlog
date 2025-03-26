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
  currentPlayer: PlayerType | null;
  gamePhase: GamePhase;
  playerDice: DiceSymbol[];
  opponentDice: DiceSymbol[];
  playerSelectedDice: DiceSymbol[];
  opponentSelectedDice: DiceSymbol[];
  playerGodTokens: number;
  opponentGodTokens: number;
  roundNumber: number;
}

// Message types for communication
export type GameMessageType = 'dice_roll' | 'dice_selection' | 'game_over';

// Base message interface
export interface GameMessage {
  type: GameMessageType;
}

// Dice roll message
export interface DiceRollMessage extends GameMessage {
  type: 'dice_roll';
  dice: DiceSymbol[];
}

// Dice selection message
export interface DiceSelectionMessage extends GameMessage {
  type: 'dice_selection';
  selection: DiceSymbol[];
}

// Game over message
export interface GameOverMessage extends GameMessage {
  type: 'game_over';
  winner: PlayerType;
}

// Union type for all game messages
export type GameMessageUnion = DiceRollMessage | DiceSelectionMessage | GameOverMessage;
