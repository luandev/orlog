import { Game } from './game/game';

document.addEventListener('DOMContentLoaded', () => {
  console.log('Orlog Game Starting...');
  
  // Initialize the game
  const game = new Game();
  game.start();
});
