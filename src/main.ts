import { initWebRTC } from './networking/webrtc';
import { setupUIHandlers } from './ui/ui-handlers';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  console.log('Orlog Game Starting...');
  
  // Set up the WebRTC connection
  initWebRTC();
  
  // Set up UI event handlers
  setupUIHandlers();
});
