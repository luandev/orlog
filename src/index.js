// import  './gameLogic';
import simpleRTC from "./simpleRTC";
import './rollDiceBox';

(async () => {
  const deliverMessage = await simpleRTC((message) => {
    const messageDiv = document.createElement("div");
    messageDiv.innerText = `They: ${message}`;
    messages.appendChild(messageDiv);
  });

  //   Function to send a message over the data channel
  function sendMessage() {
    const message = document.getElementById("messageBox").value;
    deliverMessage(message);

    // Display the sent message in your own chat
    const messageDiv = document.createElement("div");
    messageDiv.innerText = "You: " + message;
    messages.appendChild(messageDiv);

    // Clear the input box
    document.getElementById("messageBox").value = "";
  }

  const messages = document.getElementById("messages");
  document.getElementById("sendButton").addEventListener("click", sendMessage);
})().catch((err) => console.error(`🐞`, err));
