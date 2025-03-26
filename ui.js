// UI event handlers
document.addEventListener('DOMContentLoaded', () => {
    // Roll dice button
    document.getElementById('roll-dice-btn').addEventListener('click', rollPlayerDice);
    
    // Keep selected dice button
    document.getElementById('keep-dice-btn').addEventListener('click', keepSelectedDice);
    
    // Resolve turn button
    document.getElementById('resolve-turn-btn').addEventListener('click', resolveTurn);
});

// Helper to show HTML content in the status area
function updateStatus(message) {
    const statusElement = document.getElementById('game-status');
    statusElement.innerHTML = message;
}
