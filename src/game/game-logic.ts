import { DiceSymbol, DiceSymbolType, PlayerType } from '../types/game';
import { MAX_SELECTED_DICE, RESOLUTION_DELAY } from './constants';
import { gameState, toggleCurrentPlayer } from './game-state';
import { init3DDice, rollDice } from '../rendering/dice';
import { renderDiceResults, renderHealthStones, updateStatus } from '../ui/ui-renderer';
import { sendGameData } from '../networking/webrtc';

// Initialize the game
export function initGame(isHost: boolean): void {
  // Initialize 3D dice
  init3DDice();
  
  // Set up initial game state
  gameState.currentPlayer = isHost ? 'player' : 'opponent';
  
  // Render health stones
  renderHealthStones('player', gameState.playerHealth);
  renderHealthStones('opponent', gameState.opponentHealth);
  
  // Start the game
  startNewRound();
}

// Start a new round
export function startNewRound(): void {
  gameState.roundNumber++;
  gameState.gamePhase = 'rolling';
  gameState.playerDice = [];
  gameState.opponentDice = [];
  gameState.playerSelectedDice = [];
  gameState.opponentSelectedDice = [];
  
  updateStatus(`Round ${gameState.roundNumber} - ${gameState.currentPlayer === 'player' ? 'Your' : 'Opponent\'s'} turn`);
  
  if (gameState.currentPlayer === 'player') {
    document.getElementById('roll-dice-btn')?.classList.remove('hidden');
    updateStatus('Your turn. Roll the dice!');
  } else {
    updateStatus('Opponent\'s turn. Waiting for opponent to roll dice...');
  }
}

// Roll dice for the current player
export async function rollPlayerDice(): Promise<void> {
  if (gameState.currentPlayer !== 'player' || gameState.gamePhase !== 'rolling') {
    return;
  }
  
  document.getElementById('roll-dice-btn')?.classList.add('hidden');
  updateStatus('Rolling dice...');
  
  // Roll 3D dice and get results
  const diceResults = await rollDice();
  gameState.playerDice = diceResults;
  
  // Render dice results in UI
  renderDiceResults('player', diceResults);
  
  // Enter selection phase
  gameState.gamePhase = 'selecting';
  document.getElementById('keep-dice-btn')?.classList.remove('hidden');
  updateStatus('Select dice to keep (click on dice)');
  
  // Send dice roll to opponent
  sendGameData({
    type: 'dice_roll',
    dice: diceResults
  });
}

// Handle dice selection
export function selectDie(player: PlayerType, index: number): void {
  if (player !== gameState.currentPlayer || gameState.gamePhase !== 'selecting') {
    return;
  }
  
  if (player === 'player') {
    const die = gameState.playerDice[index];
    const selectedIndex = gameState.playerSelectedDice.findIndex(d => d === die);
    
    if (selectedIndex === -1) {
      // Add to selected if not already selected
      if (gameState.playerSelectedDice.length < MAX_SELECTED_DICE) {
        gameState.playerSelectedDice.push(die);
      }
    } else {
      // Remove from selected
      gameState.playerSelectedDice.splice(selectedIndex, 1);
    }
    
    // Update UI to show selected dice
    renderDiceResults('player', gameState.playerDice);
  }
}

// Finalize dice selection
export function keepSelectedDice(): void {
  if (gameState.currentPlayer !== 'player' || gameState.gamePhase !== 'selecting') {
    return;
  }
  
  document.getElementById('keep-dice-btn')?.classList.add('hidden');
  
  // If not enough dice selected, auto-select up to MAX_SELECTED_DICE
  while (gameState.playerSelectedDice.length < MAX_SELECTED_DICE) {
    for (let i = 0; i < gameState.playerDice.length; i++) {
      const die = gameState.playerDice[i];
      if (!gameState.playerSelectedDice.includes(die)) {
        gameState.playerSelectedDice.push(die);
        if (gameState.playerSelectedDice.length === MAX_SELECTED_DICE) break;
      }
    }
  }
  
  // Send selection to opponent
  sendGameData({
    type: 'dice_selection',
    selection: gameState.playerSelectedDice
  });
  
  updateStatus('Waiting for opponent to finish their selection...');
  
  // If opponent has already selected, move to resolution
  if (gameState.opponentSelectedDice.length === MAX_SELECTED_DICE) {
    gameState.gamePhase = 'resolution';
    document.getElementById('resolve-turn-btn')?.classList.remove('hidden');
    updateStatus('Both players have selected dice. Ready to resolve the turn.');
  }
}

// Resolve the current turn
export function resolveTurn(): void {
  if (gameState.gamePhase !== 'resolution') {
    return;
  }
  
  document.getElementById('resolve-turn-btn')?.classList.add('hidden');
  
  // Count attacks, defenses, steals, and god tokens
  const playerAttacks = countDiceOfType(gameState.playerSelectedDice, 'attack');
  const playerDefenses = countDiceOfType(gameState.playerSelectedDice, 'defense');
  const playerSteals = countDiceOfType(gameState.playerSelectedDice, 'steal');
  const playerGodTokens = countDiceOfType(gameState.playerSelectedDice, 'god_token');
  
  const opponentAttacks = countDiceOfType(gameState.opponentSelectedDice, 'attack');
  const opponentDefenses = countDiceOfType(gameState.opponentSelectedDice, 'defense');
  const opponentSteals = countDiceOfType(gameState.opponentSelectedDice, 'steal');
  const opponentGodTokens = countDiceOfType(gameState.opponentSelectedDice, 'god_token');
  
  // Calculate damage
  const damageToOpponent = Math.max(0, playerAttacks - opponentDefenses);
  const damageToPlayer = Math.max(0, opponentAttacks - playerDefenses);
  
  // Calculate steals (if hand symbols exceed opponent's total)
  const stolenFromOpponent = playerSteals > 0 ? Math.min(opponentGodTokens, playerSteals) : 0;
  const stolenFromPlayer = opponentSteals > 0 ? Math.min(playerGodTokens, opponentSteals) : 0;
  
  // Update health
  gameState.opponentHealth = Math.max(0, gameState.opponentHealth - damageToOpponent);
  gameState.playerHealth = Math.max(0, gameState.playerHealth - damageToPlayer);
  
  // Update god tokens
  gameState.playerGodTokens += playerGodTokens + stolenFromOpponent - stolenFromPlayer;
  gameState.opponentGodTokens += opponentGodTokens + stolenFromPlayer - stolenFromOpponent;
  
  // Update UI
  renderHealthStones('player', gameState.playerHealth);
  renderHealthStones('opponent', gameState.opponentHealth);
  
  // Create result message
  let resultMessage = 'Turn resolution:<br>';
  if (damageToOpponent > 0) resultMessage += `You dealt ${damageToOpponent} damage to opponent.<br>`;
  if (damageToPlayer > 0) resultMessage += `Opponent dealt ${damageToPlayer} damage to you.<br>`;
  if (stolenFromOpponent > 0) resultMessage += `You stole ${stolenFromOpponent} god tokens.<br>`;
  if (stolenFromPlayer > 0) resultMessage += `Opponent stole ${stolenFromPlayer} god tokens from you.<br>`;
  if (playerGodTokens > 0) resultMessage += `You gained ${playerGodTokens} god tokens.<br>`;
  if (opponentGodTokens > 0) resultMessage += `Opponent gained ${opponentGodTokens} god tokens.<br>`;
  
  updateStatus(resultMessage);
  
  // Check for game over
  if (gameState.playerHealth <= 0 || gameState.opponentHealth <= 0) {
    endGame();
    return;
  }
  
  // Switch current player and start a new round
  toggleCurrentPlayer();
  
  // Wait a bit before starting new round
  setTimeout(startNewRound, RESOLUTION_DELAY);
}

// Count dice of a specific type
export function countDiceOfType(dice: DiceSymbol[], type: DiceSymbolType): number {
  return dice.filter(die => die.type === type).length;
}

// Handle end of game
export function endGame(): void {
  if (gameState.playerHealth <= 0 && gameState.opponentHealth <= 0) {
    updateStatus('Game over! It\'s a tie!');
  } else if (gameState.playerHealth <= 0) {
    updateStatus('Game over! You lost!');
  } else {
    updateStatus('Game over! You won!');
  }
  
  // Send game over notification
  sendGameData({
    type: 'game_over',
    winner: gameState.playerHealth > 0 ? 'player' : 'opponent'
  });
}
