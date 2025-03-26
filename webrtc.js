let peerConnection;
let dataChannel;
let isHost = false;
let isConnected = false;

// DOM Elements
const createGameBtn = document.getElementById('create-game-btn');
const joinGameBtn = document.getElementById('join-game-btn');
const copyCodeBtn = document.getElementById('copy-code-btn');
const localDescriptionElem = document.getElementById('local-description');
const remoteDescriptionElem = document.getElementById('remote-description');
const connectionCodeDiv = document.getElementById('connection-code');
const connectionArea = document.getElementById('connection-area');
const gameArea = document.getElementById('game-area');
const gameStatus = document.getElementById('game-status');

// Configuration for WebRTC
const config = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ]
};

// Initialize event listeners
function initWebRTC() {
    createGameBtn.addEventListener('click', createGame);
    joinGameBtn.addEventListener('click', joinGame);
    copyCodeBtn.addEventListener('click', copyConnectionCode);
}

// Create a new game as host
async function createGame() {
    isHost = true;
    createGameBtn.disabled = true;
    
    try {
        // Create peer connection
        peerConnection = new RTCPeerConnection(config);
        setupPeerConnectionListeners();
        
        // Create data channel
        dataChannel = peerConnection.createDataChannel('gameChannel');
        setupDataChannelListeners(dataChannel);
        
        // Create offer
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        // Display the local description (offer) to share
        peerConnection.addEventListener('icecandidate', event => {
            if (event.candidate === null) {
                localDescriptionElem.value = JSON.stringify(peerConnection.localDescription);
                connectionCodeDiv.classList.remove('hidden');
            }
        });
        
        updateStatus('Creating game... Waiting for opponent to join');
    } catch (error) {
        console.error('Error creating game:', error);
        updateStatus('Failed to create game: ' + error.message);
        createGameBtn.disabled = false;
    }
}

// Join an existing game
async function joinGame() {
    joinGameBtn.disabled = true;
    
    try {
        // Parse the remote description (offer)
        const remoteDesc = JSON.parse(remoteDescriptionElem.value);
        
        // Create peer connection
        peerConnection = new RTCPeerConnection(config);
        setupPeerConnectionListeners();
        
        // Set up data channel event handler
        peerConnection.addEventListener('datachannel', event => {
            dataChannel = event.channel;
            setupDataChannelListeners(dataChannel);
        });
        
        // Set remote description (offer)
        await peerConnection.setRemoteDescription(remoteDesc);
        
        // Create answer
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        // Display the local description (answer) to share
        peerConnection.addEventListener('icecandidate', event => {
            if (event.candidate === null) {
                localDescriptionElem.value = JSON.stringify(peerConnection.localDescription);
                connectionCodeDiv.classList.remove('hidden');
                updateStatus('Answer created. Share it with the host and wait for connection...');
            }
        });
    } catch (error) {
        console.error('Error joining game:', error);
        updateStatus('Failed to join game: ' + error.message);
        joinGameBtn.disabled = false;
    }
}

// Set up peer connection event listeners
function setupPeerConnectionListeners() {
    peerConnection.addEventListener('connectionstatechange', () => {
        if (peerConnection.connectionState === 'connected') {
            connectionEstablished();
        }
    });
    
    peerConnection.addEventListener('iceconnectionstatechange', () => {
        if (peerConnection.iceConnectionState === 'disconnected' ||
            peerConnection.iceConnectionState === 'failed') {
            updateStatus('Connection lost. Reload the page to try again.');
        }
    });
}

// Set up data channel event listeners
function setupDataChannelListeners(channel) {
    channel.addEventListener('open', () => {
        connectionEstablished();
    });
    
    channel.addEventListener('message', event => {
        const message = JSON.parse(event.data);
        handleGameMessage(message);
    });
    
    channel.addEventListener('close', () => {
        updateStatus('Connection closed. Reload the page to play again.');
    });
    
    channel.addEventListener('error', error => {
        console.error('Data channel error:', error);
        updateStatus('Connection error. Reload the page to try again.');
    });
}

// Handle successful connection
function connectionEstablished() {
    if (isConnected) return;
    isConnected = true;
    
    updateStatus('Connected! Game starting...');
    connectionArea.classList.add('hidden');
    gameArea.classList.remove('hidden');
    
    // Initialize the game
    initGame(isHost);
}

// Send game data to the peer
function sendGameData(data) {
    if (!dataChannel || dataChannel.readyState !== 'open') {
        console.error('Data channel not open');
        return;
    }
    
    dataChannel.send(JSON.stringify(data));
}

// Copy connection code to clipboard
function copyConnectionCode() {
    localDescriptionElem.select();
    document.execCommand('copy');
    copyCodeBtn.textContent = 'Copied!';
    setTimeout(() => {
        copyCodeBtn.textContent = 'Copy Code';
    }, 2000);
}

// Update status message
function updateStatus(message) {
    gameStatus.textContent = message;
}

// Initialize WebRTC when the page loads
document.addEventListener('DOMContentLoaded', initWebRTC);
