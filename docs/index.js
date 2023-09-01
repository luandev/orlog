const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

let localConnection;
let remoteConnection;
const iceServers = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

// Create a local peer connection
localConnection = new RTCPeerConnection(iceServers);

// Set up the offerer and answerer
localConnection.createOffer()
  .then(offer => localConnection.setLocalDescription(offer))
  .then(() => remoteConnection.setRemoteDescription(localConnection.localDescription))
  .then(() => remoteConnection.createAnswer())
  .then(answer => remoteConnection.setLocalDescription(answer))
  .then(() => localConnection.setRemoteDescription(remoteConnection.localDescription))
  .catch(error => console.error('Error setting up the connection:', error));


// Create a data channel for messaging
const dataChannel = localConnection.createDataChannel('chat');

dataChannel.onopen = (event) => {
  console.log('Data channel is open');
};

dataChannel.onmessage = (event) => {
  displayMessage(event.data, 'remote');
};

// Set up the remote peer connection
remoteConnection = new RTCPeerConnection(iceServers);
remoteConnection.ondatachannel = (event) => {
  const receiveChannel = event.channel;

  receiveChannel.onmessage = (event) => {
    displayMessage(event.data, 'remote');
  };
};

// Function to display messages in the chat window
function displayMessage(message, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.textContent = `${sender}: ${message}`;
  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Handle sending a message
sendButton.addEventListener('click', () => {
  const message = messageInput.value;
  displayMessage(message, 'local');
  dataChannel.send(message);
  messageInput.value = '';
});