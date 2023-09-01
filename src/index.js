function main() {
    displayGreeting();
    const whoGoesFirst = coinToss();
    const playerHands = rollPhase(whoGoesFirst);
    const godFavors = godFavorPhase();
    const result = resolutionPhase(playerHands, godFavors);
    displayResult(result);
}