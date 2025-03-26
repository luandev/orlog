import { DiceRollMessage, DiceSelectionMessage, GameMessageUnion, GameOverMessage } from '../types/game';
import { gameState } from '../game/game-state';
import { renderDiceResults } from '../ui/ui-renderer';
import { updateStatus } from '../ui/ui-renderer';

// Handle game messages from opponent
export function handleGameMessage(message: GameMessageUnion): void {
  switch (message.type) {
    case 'dice_roll':
      handleDiceRollMessage(message);
      break;
      
    case 'dice_selection':
      handleDiceSelectionMessage(message);
      break;
      
    case 'game_over':
      handleGameOverMessage(message);
      break;
      
    default:
      console.warn('Unknown message type:', (message as any).type);
  }
}

// Handle dice roll message
function handleDiceRollMessage(message: DiceRollMessage): void {
  if (gameState.currentPlayer === 'opponent') {
    gameState.opponentDice = message.dice;
    renderDiceResults('opponent', message.dice);
    updateStatus('Opponent has rolled their dice.');
  }
}

// Handle dice selection message
function handleDiceSelectionMessage(message: DiceSelectionMessage): void {
  if (gameState.currentPlayer === 'opponent') {
    gameState.opponentSelectedDice = message.selection;
    renderDiceResults('opponent', gameState.opponentDice);
    updateStatus('Opponent has selected their dice.');
    
    // If player has already selected, move to resolution
    if (gameState.playerSelectedDice.length === 3) {
      gameState.gamePhase = 'resolution';
      document.getElementById('resolve-turn-btn')?.classList.remove('hidden');
      updateStatus('Both players have selected dice. Ready to resolve the turn.');
    }
  }
}

// Handle game over message
function handleGameOverMessage(message: GameOverMessage): void {
  // Game already handled locally, but could add additional processing here
  console.log('Game over event received:', message.winner);
}
