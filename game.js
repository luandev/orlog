// Game state
let gameState = {
    playerHealth: 15,
    opponentHealth: 15,
    currentPlayer: null, // 'player' or 'opponent'
    gamePhase: 'waiting', // 'waiting', 'rolling', 'selecting', 'resolution'
    playerDice: [],
    opponentDice: [],
    playerSelectedDice: [],
    opponentSelectedDice: [],
    playerGodTokens: 0,
    opponentGodTokens: 0,
    roundNumber: 0
};

// Game initialization
function initGame(isHost) {
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
function startNewRound() {
    gameState.roundNumber++;
    gameState.gamePhase = 'rolling';
    gameState.playerDice = [];
    gameState.opponentDice = [];
    gameState.playerSelectedDice = [];
    gameState.opponentSelectedDice = [];
    
    updateStatus(`Round ${gameState.roundNumber} - ${gameState.currentPlayer === 'player' ? 'Your' : 'Opponent\'s'} turn`);
    
    if (gameState.currentPlayer === 'player') {
        document.getElementById('roll-dice-btn').classList.remove('hidden');
        updateStatus('Your turn. Roll the dice!');
    } else {
        updateStatus('Opponent\'s turn. Waiting for opponent to roll dice...');
    }
}

// Roll dice for the current player
async function rollPlayerDice() {
    if (gameState.currentPlayer !== 'player' || gameState.gamePhase !== 'rolling') {
        return;
    }
    
    document.getElementById('roll-dice-btn').classList.add('hidden');
    updateStatus('Rolling dice...');
    
    // Roll 3D dice and get results
    const diceResults = await rollDice(6);
    gameState.playerDice = diceResults;
    
    // Render dice results in UI
    renderDiceResults('player', diceResults);
    
    // Enter selection phase
    gameState.gamePhase = 'selecting';
    document.getElementById('keep-dice-btn').classList.remove('hidden');
    updateStatus('Select dice to keep (click on dice)');
    
    // Send dice roll to opponent
    sendGameData({
        type: 'dice_roll',
        dice: diceResults
    });
}

// Handle dice selection
function selectDie(player, index) {
    if (player !== gameState.currentPlayer || gameState.gamePhase !== 'selecting') {
        return;
    }
    
    if (player === 'player') {
        const die = gameState.playerDice[index];
        const selectedIndex = gameState.playerSelectedDice.findIndex(d => d === die);
        
        if (selectedIndex === -1) {
            // Add to selected if not already selected
            if (gameState.playerSelectedDice.length < 3) {
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
function keepSelectedDice() {
    if (gameState.currentPlayer !== 'player' || gameState.gamePhase !== 'selecting') {
        return;
    }
    
    document.getElementById('keep-dice-btn').classList.add('hidden');
    
    // If not enough dice selected, auto-select up to 3
    while (gameState.playerSelectedDice.length < 3) {
        for (let i = 0; i < gameState.playerDice.length; i++) {
            const die = gameState.playerDice[i];
            if (!gameState.playerSelectedDice.includes(die)) {
                gameState.playerSelectedDice.push(die);
                if (gameState.playerSelectedDice.length === 3) break;
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
    if (gameState.opponentSelectedDice.length === 3) {
        gameState.gamePhase = 'resolution';
        document.getElementById('resolve-turn-btn').classList.remove('hidden');
        updateStatus('Both players have selected dice. Ready to resolve the turn.');
    }
}

// Resolve the current turn
function resolveTurn() {
    if (gameState.gamePhase !== 'resolution') {
        return;
    }
    
    document.getElementById('resolve-turn-btn').classList.add('hidden');
    
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
    gameState.currentPlayer = gameState.currentPlayer === 'player' ? 'opponent' : 'player';
    
    // Wait a bit before starting new round
    setTimeout(startNewRound, 3000);
}

// Count dice of a specific type
function countDiceOfType(dice, type) {
    return dice.filter(die => die.type === type).length;
}

// Handle end of game
function endGame() {
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

// Render health stones
function renderHealthStones(player, health) {
    const container = document.getElementById(`${player}-stones`);
    container.innerHTML = '';
    
    const totalStones = 15;
    for (let i = 0; i < totalStones; i++) {
        const stone = document.createElement('div');
        stone.className = i < health ? 'stone' : 'stone lost';
        container.appendChild(stone);
    }
    
    document.getElementById(`${player}-health`).textContent = health;
}

// Render dice results in the UI
function renderDiceResults(player, dice) {
    const container = document.getElementById(`${player}-dice`);
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
        if (player === 'player' && gameState.gamePhase === 'selecting') {
            dieElement.addEventListener('click', () => selectDie('player', index));
        }
        
        container.appendChild(dieElement);
    });
}

// Handle game messages from opponent
function handleGameMessage(message) {
    switch (message.type) {
        case 'dice_roll':
            if (gameState.currentPlayer === 'opponent') {
                gameState.opponentDice = message.dice;
                renderDiceResults('opponent', message.dice);
                updateStatus('Opponent has rolled their dice.');
            }
            break;
            
        case 'dice_selection':
            if (gameState.currentPlayer === 'opponent') {
                gameState.opponentSelectedDice = message.selection;
                renderDiceResults('opponent', gameState.opponentDice);
                updateStatus('Opponent has selected their dice.');
                
                // If player has already selected, move to resolution
                if (gameState.playerSelectedDice.length === 3) {
                    gameState.gamePhase = 'resolution';
                    document.getElementById('resolve-turn-btn').classList.remove('hidden');
                    updateStatus('Both players have selected dice. Ready to resolve the turn.');
                }
            }
            break;
            
        case 'game_over':
            // Game already handled locally, but could add additional processing here
            break;
            
        default:
            console.warn('Unknown message type:', message.type);
    }
}
