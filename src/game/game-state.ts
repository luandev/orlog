import { GameState, PlayerType } from '../types/game';
import { INITIAL_HEALTH } from './constants';

// Initialize game state
export const gameState: GameState = {
  playerHealth: INITIAL_HEALTH,
  opponentHealth: INITIAL_HEALTH,
  currentPlayer: null,
  gamePhase: 'waiting',
  playerDice: [],
  opponentDice: [],
  playerSelectedDice: [],
  opponentSelectedDice: [],
  playerGodTokens: 0,
  opponentGodTokens: 0,
  roundNumber: 0
};

// Reset the game state
export function resetGameState(): void {
  gameState.playerHealth = INITIAL_HEALTH;
  gameState.opponentHealth = INITIAL_HEALTH;
  gameState.currentPlayer = null;
  gameState.gamePhase = 'waiting';
  gameState.playerDice = [];
  gameState.opponentDice = [];
  gameState.playerSelectedDice = [];
  gameState.opponentSelectedDice = [];
  gameState.playerGodTokens = 0;
  gameState.opponentGodTokens = 0;
  gameState.roundNumber = 0;
}

// Get the current player
export function getCurrentPlayer(): PlayerType | null {
  return gameState.currentPlayer;
}

// Set the current player
export function setCurrentPlayer(player: PlayerType): void {
  gameState.currentPlayer = player;
}

// Toggle the current player
export function toggleCurrentPlayer(): void {
  if (gameState.currentPlayer === 'player') {
    gameState.currentPlayer = 'opponent';
  } else {
    gameState.currentPlayer = 'player';
  }
}
