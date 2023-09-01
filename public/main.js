// Variables to store peer connections and data channels
var conf = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
const peerConnection = new RTCPeerConnection(conf);
const dataChannel = peerConnection.createDataChannel("textChat");
const candidates = [];

const answerDialog = document.getElementById("answerDialog");
const offerDialog = document.getElementById("offerDialog");
const linkElement = document.getElementById("link");
const answerElement = document.getElementById("answer");
const responseElement = document.getElementById("response");
const messages = document.getElementById("messages");

let started = false;
peerConnection.onicecandidate = async (event) => {
  if (event.candidate) {
    candidates.push(event.candidate);
  }
};
const url = new URL(window.location.href);

// Function to handle when the data channel is open
function handleDataChannelOpen(event) {
  console.log("Data channel opened");
}

// Function to handle incoming messages on the data channel
function handleDataChannelMessage(event) {
  const messageDiv = document.createElement("div");
  messageDiv.innerText = event.data;
  messages.appendChild(messageDiv);
}

// Function to send a message over the data channel
function sendMessage() {
  const message = document.getElementById("messageBox").value;
  dataChannel.send(message);

  // Display the sent message in your own chat
  const messageDiv = document.createElement("div");
  messageDiv.innerText = "You: " + message;
  document.getElementById("messages").appendChild(messageDiv);

  // Clear the input box
  document.getElementById("messageBox").value = "";
}

// Create an offer and set the local description
async function createOffer() {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  setTimeout(() => {
    createLink([peerConnection.localDescription, ...candidates]);
    offerDialog.addEventListener("close", async (event) => {
      const peerAnswer = responseElement.value;
      if (!peerAnswer) {
        event.preventDefault();
        alert("waiting for peer response");
      }
      const response = JSON.parse(atob(peerAnswer));
      await acceptOffer(response);
    });
    offerDialog.showModal();
  }, 2000);
}

async function acceptOffer([answer, candidate, ...restCandidates]) {
  await peerConnection.setRemoteDescription(answer);
  await peerConnection.addIceCandidate(candidate);
}

function createLink(data) {
  const stringData = JSON.stringify(data);
  const encodedData = btoa(stringData);
  url.searchParams.append("offer", encodedData);
  linkElement.href = url.href;
  linkElement.innerText = "Share offer link with peer";
}

async function createAnswer([offer, candidate, ...restCandidates]) {
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  setTimeout(async () => {
    const stringData = JSON.stringify([answer, ...candidates]);
    const encodedData = btoa(stringData);
    answerElement.innerText = encodedData;
    await peerConnection.addIceCandidate(candidate);
    answerDialog.showModal();
  }, 2000);
}

async function displayMessage(event) {
  console.log(event);
  document.body
}

// Set up event listener to receive data channel
peerConnection.ondatachannel = (event) => {
  const receiveChannel = event.channel;

  receiveChannel.onopen = () => {
    console.log("Remote data channel is open");
  };

  receiveChannel.onmessage = (event) => {
    handleDataChannelMessage(event);
  };
};

peerConnection.onconnectionstatechange = (event) => {
  console.log("onconnectionstatechange", event);
};

peerConnection.onsignalingstatechange = (event) => {
  console.log("onsignalingstatechange", event);
};

// Event listener for the send button
document.getElementById("sendButton").addEventListener("click", sendMessage);
// Set up event handlers for the data channel
dataChannel.onopen = handleDataChannelOpen;
dataChannel.onmessage = handleDataChannelMessage;

async function createConnection() {
  const offer = url.searchParams.get("offer");
  if (offer) {
    const peerOffer = JSON.parse(atob(offer));
    console.log(peerOffer);
    await createAnswer(peerOffer);
  } else {
    await createOffer();
  }
}

createConnection().catch((err) => console.error(err));
