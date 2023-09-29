(() => {
  // src/simpleRTC.js
  async function simpleRTC_default(onMessage = (r) => r) {
    var conf = {iceServers: [{urls: "stun:stun.l.google.com:19302"}]};
    const peerConnection = new RTCPeerConnection(conf);
    const dataChannel = peerConnection.createDataChannel("textChat");
    const candidates = [];
    const answerDialog = document.getElementById("answerDialog");
    const offerDialog = document.getElementById("offerDialog");
    const linkElement = document.getElementById("link");
    const answerElement = document.getElementById("answer");
    const responseElement = document.getElementById("response");
    let started = false;
    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        candidates.push(event.candidate);
      }
    };
    const url = new URL(window.location.href);
    function handleDataChannelOpen(event) {
      console.log("Data channel opened");
    }
    function handleDataChannelMessage(event) {
      onMessage(event.data);
    }
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
      }, 2e3);
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
      }, 2e3);
    }
    peerConnection.ondatachannel = (event) => {
      const receiveChannel = event.channel;
      receiveChannel.onopen = () => {
        console.log("Remote data channel is open");
      };
      receiveChannel.onmessage = (event2) => {
        handleDataChannelMessage(event2);
      };
    };
    peerConnection.onconnectionstatechange = (event) => {
      console.log("onconnectionstatechange", event);
    };
    peerConnection.onsignalingstatechange = (event) => {
      console.log("onsignalingstatechange", event);
    };
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
    await createConnection().catch((err) => console.error(err));
    return (message) => dataChannel.send(message);
  }

  // src/index.js
  (async () => {
    const deliverMessage = await simpleRTC_default((message) => {
      const messageDiv = document.createElement("div");
      messageDiv.innerText = `They: ${message}`;
      messages.appendChild(messageDiv);
    });
    function sendMessage() {
      const message = document.getElementById("messageBox").value;
      deliverMessage(message);
      const messageDiv = document.createElement("div");
      messageDiv.innerText = "You: " + message;
      messages.appendChild(messageDiv);
      document.getElementById("messageBox").value = "";
    }
    const messages = document.getElementById("messages");
    document.getElementById("sendButton").addEventListener("click", sendMessage);
  })().catch((err) => console.error(`\u{1F41E}`, err));
})();
