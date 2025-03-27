import { DiceSymbol, PlayerType } from '../types/game';
import { gameState } from '../game/game-state';
import { selectDie } from '../game/game-logic';
import { INITIAL_HEALTH } from '../game/constants';

// Render health stones
export function renderHealthStones(player: PlayerType, health: number): void {
  const container = document.getElementById(`${player}-stones`);
  if (!container) return;
  
  container.innerHTML = '';
  
  const totalStones = INITIAL_HEALTH;
  for (let i = 0; i < totalStones; i++) {
    const stone = document.createElement('div');
    stone.className = i < health ? 'stone' : 'stone lost';
    container.appendChild(stone);
  }
  
  const healthElement = document.getElementById(`${player}-health`);
  if (healthElement) {
    healthElement.textContent = health.toString();
  }
}

// Render dice results in the UI
export function renderDiceResults(player: PlayerType, dice: DiceSymbol[]): void {
  const container = document.getElementById(`${player}-dice`);
  if (!container) return;
  
  container.innerHTML = '';
  
  dice.forEach((die, index) => {
    const dieElement = document.createElement('div');
    dieElement.className = 'dice-face';
    
    // Check if this die is selected
    const selectedDice = player === 'player' ? 
      gameState.playerSelectedDice : gameState.opponentSelectedDice;
    if (selectedDice.includes(die)) {
      dieElement.classList.add('selected');
    }
    
    // Add the symbol
    const symbolElement = document.createElement('div');
    symbolElement.className = 'dice-icon';
    
    let symbol = '';
    switch(die.name) {
      case 'Axe': symbol = '⚔️'; break;
      case 'Arrow': symbol = '🏹'; break;
      case 'Helmet': symbol = '🛡️'; break;
      case 'Shield': symbol = '🔰'; break;
      case 'Hand': symbol = '👐'; break;
      case 'Prayer': symbol = '✨'; break;
    }
    
    symbolElement.textContent = symbol;
    dieElement.appendChild(symbolElement);
    
    // Add type below the symbol
    const typeElement = document.createElement('div');
    typeElement.className = 'dice-type';
    typeElement.textContent = die.type;
    dieElement.appendChild(typeElement);
    
    // Add click event for selection
    if (player === 'player' && gameState.gamePhase === 'selecting' && gameState.currentPlayer === 'player') {
      dieElement.addEventListener('click', () => selectDie('player', index));
    }
    
    container.appendChild(dieElement);
  });
}

// Update status message
export function updateStatus(message: string): void {
  const statusElement = document.getElementById('game-status');
  if (statusElement) {
    statusElement.innerHTML = message;
  }
}
