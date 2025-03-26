import { GameMessageUnion } from '../types/game';
import { initGame } from '../game/game-logic';
import { handleGameMessage } from './message-handler';
import { updateStatus } from '../ui/ui-renderer';

// WebRTC variables
let peerConnection: RTCPeerConnection | null = null;
let dataChannel: RTCDataChannel | null = null;
let isHost = false;
let isConnected = false;

// DOM Elements
let createGameBtn: HTMLButtonElement;
let joinGameBtn: HTMLButtonElement;
let copyCodeBtn: HTMLButtonElement;
let localDescriptionElem: HTMLTextAreaElement;
let remoteDescriptionElem: HTMLTextAreaElement;
let connectionCodeDiv: HTMLElement;
let connectionArea: HTMLElement;
let gameArea: HTMLElement;

// Configuration for WebRTC
const config: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

// Initialize WebRTC
export function initWebRTC(): void {
  // Get DOM elements
  createGameBtn = document.getElementById('create-game-btn') as HTMLButtonElement;
  joinGameBtn = document.getElementById('join-game-btn') as HTMLButtonElement;
  copyCodeBtn = document.getElementById('copy-code-btn') as HTMLButtonElement;
  localDescriptionElem = document.getElementById('local-description') as HTMLTextAreaElement;
  remoteDescriptionElem = document.getElementById('remote-description') as HTMLTextAreaElement;
  connectionCodeDiv = document.getElementById('connection-code') as HTMLElement;
  connectionArea = document.getElementById('connection-area') as HTMLElement;
  gameArea = document.getElementById('game-area') as HTMLElement;
  
  // Add event listeners
  createGameBtn.addEventListener('click', createGame);
  joinGameBtn.addEventListener('click', joinGame);
  copyCodeBtn.addEventListener('click', copyConnectionCode);
}

// Create a new game as host
async function createGame(): Promise<void> {
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
      if (event.candidate === null && peerConnection?.localDescription) {
        localDescriptionElem.value = JSON.stringify(peerConnection.localDescription);
        connectionCodeDiv.classList.remove('hidden');
      }
    });
    
    updateStatus('Creating game... Waiting for opponent to join');
  } catch (error) {
    console.error('Error creating game:', error);
    updateStatus(`Failed to create game: ${error instanceof Error ? error.message : String(error)}`);
    createGameBtn.disabled = false;
  }
}

// Join an existing game
async function joinGame(): Promise<void> {
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
      if (event.candidate === null && peerConnection?.localDescription) {
        localDescriptionElem.value = JSON.stringify(peerConnection.localDescription);
        connectionCodeDiv.classList.remove('hidden');
        updateStatus('Answer created. Share it with the host and wait for connection...');
      }
    });
  } catch (error) {
    console.error('Error joining game:', error);
    updateStatus(`Failed to join game: ${error instanceof Error ? error.message : String(error)}`);
    joinGameBtn.disabled = false;
  }
}

// Set up peer connection event listeners
function setupPeerConnectionListeners(): void {
  if (!peerConnection) return;
  
  peerConnection.addEventListener('connectionstatechange', () => {
    if (peerConnection?.connectionState === 'connected') {
      connectionEstablished();
    }
  });
  
  peerConnection.addEventListener('iceconnectionstatechange', () => {
    if (
      peerConnection?.iceConnectionState === 'disconnected' ||
      peerConnection?.iceConnectionState === 'failed'
    ) {
      updateStatus('Connection lost. Reload the page to try again.');
    }
  });
}

// Set up data channel event listeners
function setupDataChannelListeners(channel: RTCDataChannel): void {
  channel.addEventListener('open', () => {
    connectionEstablished();
  });
  
  channel.addEventListener('message', event => {
    try {
      const message = JSON.parse(event.data) as GameMessageUnion;
      handleGameMessage(message);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
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
function connectionEstablished(): void {
  if (isConnected) return;
  isConnected = true;
  
  updateStatus('Connected! Game starting...');
  connectionArea.classList.add('hidden');
  gameArea.classList.remove('hidden');
  
  // Initialize the game
  initGame(isHost);
}

// Send game data to the peer
export function sendGameData(data: GameMessageUnion): void {
  if (!dataChannel || dataChannel.readyState !== 'open') {
    console.error('Data channel not open');
    return;
  }
  
  dataChannel.send(JSON.stringify(data));
}

// Copy connection code to clipboard
function copyConnectionCode(): void {
  localDescriptionElem.select();
  document.execCommand('copy');
  copyCodeBtn.textContent = 'Copied!';
  setTimeout(() => {
    copyCodeBtn.textContent = 'Copy Code';
  }, 2000);
}
