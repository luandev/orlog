import * as PIXI from 'pixi.js';
import { gameState, resetGameState } from './game-state';
import { DiceSymbol } from '../types/game';
import { DICE_SYMBOLS, TOTAL_DICE, DICE_SIZE, AI_SELECTION_DELAY } from './constants';
import { renderDiceResults, renderHealthStones, updateStatus } from '../ui/ui-renderer';
import { startNewRound, rollDice, selectDie, keepSelectedDice, resolveTurn } from './game-logic';

export class Game {
  private app: PIXI.Application;
  private diceContainer: PIXI.Container;
  private dice: PIXI.Sprite[] = [];
  private isRolling: boolean = false;

  constructor() {
    // Create PixiJS application
    this.app = new PIXI.Application({
      width: 800,
      height: 300,
      backgroundColor: 0x1a2530,
      resolution: window.devicePixelRatio || 1,
      antialias: true
    });

    // Add the canvas to the DOM
    const container = document.getElementById('game-canvas-container');
    if (container) {
      container.appendChild(this.app.view as HTMLCanvasElement);
    }

    // Create container for dice
    this.diceContainer = new PIXI.Container();
    this.app.stage.addChild(this.diceContainer);
    
    // Set up event handlers
    this.setupEventHandlers();
  }

  // Start the game
  public start(): void {
    // Reset game state
    resetGameState();
    
    // Render health stones
    renderHealthStones('player', gameState.playerHealth);
    renderHealthStones('opponent', gameState.opponentHealth);
    
    // Start first round
    startNewRound();
  }

  // Set up event handlers
  private setupEventHandlers(): void {
    // Roll dice button
    const rollDiceBtn = document.getElementById('roll-dice-btn');
    if (rollDiceBtn) {
      rollDiceBtn.addEventListener('click', () => this.handleRollDice());
    }
    
    // Keep selected dice button
    const keepDiceBtn = document.getElementById('keep-dice-btn');
    if (keepDiceBtn) {
      keepDiceBtn.addEventListener('click', () => this.handleKeepDice());
    }
    
    // Resolve turn button
    const resolveTurnBtn = document.getElementById('resolve-turn-btn');
    if (resolveTurnBtn) {
      resolveTurnBtn.addEventListener('click', () => this.handleResolveTurn());
    }
  }

  // Handle roll dice button click
  private async handleRollDice(): Promise<void> {
    if (gameState.currentPlayer !== 'player' || gameState.gamePhase !== 'rolling' || this.isRolling) {
      return;
    }

    // Hide roll button and update status
    const rollDiceBtn = document.getElementById('roll-dice-btn');
    if (rollDiceBtn) {
      rollDiceBtn.classList.add('hidden');
    }
    updateStatus('Rolling dice...');
    
    // Clear existing dice
    this.clearDice();
    
    // Roll dice animation
    this.isRolling = true;
    const results = await this.animateRollDice();
    this.isRolling = false;
    
    // Update game state
    gameState.playerDice = results;
    gameState.gamePhase = 'selecting';
    
    // Update UI
    renderDiceResults('player', results);
    updateStatus('Select up to 3 dice to keep');
    
    // Show keep dice button
    const keepDiceBtn = document.getElementById('keep-dice-btn');
    if (keepDiceBtn) {
      keepDiceBtn.classList.remove('hidden');
    }
  }

  // Handle keep dice button click
  private handleKeepDice(): void {
    keepSelectedDice();
    
    // If it's now opponent's turn (AI), handle their dice roll and selection
    if (gameState.currentPlayer === 'opponent') {
      this.handleAITurn();
    }
  }

  // Handle resolve turn button click
  private handleResolveTurn(): void {
    resolveTurn();
    
    // If it's now player's turn again, enable roll button
    if (gameState.currentPlayer === 'player' && gameState.gamePhase === 'rolling') {
      const rollDiceBtn = document.getElementById('roll-dice-btn');
      if (rollDiceBtn) {
        rollDiceBtn.classList.remove('hidden');
      }
    } 
    // If it's opponent's turn (AI), handle their dice roll and selection
    else if (gameState.currentPlayer === 'opponent' && gameState.gamePhase === 'rolling') {
      this.handleAITurn();
    }
  }

  // Handle AI turn
  private async handleAITurn(): Promise<void> {
    if (gameState.currentPlayer !== 'opponent') return;
    
    // AI roll dice
    updateStatus('Opponent is rolling dice...');
    
    // Clear existing dice
    this.clearDice();
    
    // Roll dice animation
    this.isRolling = true;
    const results = await this.animateRollDice();
    this.isRolling = false;
    
    // Update game state
    gameState.opponentDice = results;
    gameState.gamePhase = 'selecting';
    
    // Update UI
    renderDiceResults('opponent', results);
    updateStatus('Opponent is selecting dice...');
    
    // AI selects dice (with delay to simulate thinking)
    setTimeout(() => {
      // Simple AI strategy: prioritize attack, then defense, then steal, then god tokens
      const attackDice = results.filter(die => die.type === 'attack');
      const defenseDice = results.filter(die => die.type === 'defense');
      const stealDice = results.filter(die => die.type === 'steal');
      const godTokenDice = results.filter(die => die.type === 'god_token');
      
      // Select up to 3 dice in priority order
      const selection = [...attackDice, ...defenseDice, ...stealDice, ...godTokenDice].slice(0, 3);
      
      // Update game state
      gameState.opponentSelectedDice = selection;
      
      // Update UI
      renderDiceResults('opponent', results);
      updateStatus('Opponent has selected their dice.');
      
      // If player has already selected, move to resolution
      if (gameState.playerSelectedDice.length === 3) {
        gameState.gamePhase = 'resolution';
        const resolveTurnBtn = document.getElementById('resolve-turn-btn');
        if (resolveTurnBtn) {
          resolveTurnBtn.classList.remove('hidden');
        }
        updateStatus('Both players have selected dice. Ready to resolve the turn.');
      }
    }, AI_SELECTION_DELAY);
  }

  // Animate dice roll
  private animateRollDice(): Promise<DiceSymbol[]> {
    return new Promise((resolve) => {
      // Create dice sprites
      for (let i = 0; i < TOTAL_DICE; i++) {
        // Create a random die
        const die = this.createDie();
        
        // Position the die
        die.x = Math.random() * (this.app.screen.width - DICE_SIZE);
        die.y = Math.random() * (this.app.screen.height - DICE_SIZE);
        
        // Add to container
        this.diceContainer.addChild(die);
        this.dice.push(die);
      }
      
      // Animation variables
      let frames = 0;
      const totalFrames = 60; // 1 second at 60 FPS
      
      // Animation ticker
      const ticker = this.app.ticker.add(() => {
        // Update dice rotation and position
        this.dice.forEach(die => {
          die.rotation += 0.1;
          die.x += (Math.random() - 0.5) * 5;
          die.y += (Math.random() - 0.5) * 5;
          
          // Keep dice within bounds
          if (die.x < 0) die.x = 0;
          if (die.x > this.app.screen.width - DICE_SIZE) die.x = this.app.screen.width - DICE_SIZE;
          if (die.y < 0) die.y = 0;
          if (die.y > this.app.screen.height - DICE_SIZE) die.y = this.app.screen.height - DICE_SIZE;
        });
        
        // Increment frame count
        frames++;
        
        // End animation
        if (frames >= totalFrames) {
          // Stop ticker
          ticker.stop();
          
          // Generate random dice results
          const results: DiceSymbol[] = [];
          const symbols = Object.values(DICE_SYMBOLS);
          
          for (let i = 0; i < TOTAL_DICE; i++) {
            const randomIndex = Math.floor(Math.random() * symbols.length);
            results.push(symbols[randomIndex]);
          }
          
          // Resolve with results
          resolve(results);
        }
      });
    });
  }

  // Create a single die sprite
  private createDie(): PIXI.Sprite {
    // Create a white square
    const graphics = new PIXI.Graphics();
    graphics.beginFill(0xecf0f1);
    graphics.drawRoundedRect(0, 0, DICE_SIZE, DICE_SIZE, 10);
    graphics.endFill();
    
    // Convert to texture
    const texture = this.app.renderer.generateTexture(graphics);
    const die = new PIXI.Sprite(texture);
    
    // Set pivot point to center for rotation
    die.anchor.set(0.5);
    die.x = DICE_SIZE / 2;
    die.y = DICE_SIZE / 2;
    
    return die;
  }

  // Clear all dice
  private clearDice(): void {
    // Remove all dice
    this.diceContainer.removeChildren();
    this.dice = [];
  }
}
