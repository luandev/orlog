import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { DiceSymbol } from '../types/game';
import { DICE_SYMBOLS, TOTAL_DICE } from '../game/constants';

// 3D rendering objects
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let diceObjects: { mesh: THREE.Mesh; body: CANNON.Body }[] = [];
let world: CANNON.World; // Physics world

// Initialize 3D environment
export function init3DDice(): void {
  const container = document.getElementById('dice-container');
  if (!container) return;
  
  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a2530);
  
  // Create camera
  camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.z = 10;
  
  // Create renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);
  
  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);
  
  // Set up physics
  world = new CANNON.World();
  world.gravity.set(0, -9.82, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 20;
  
  // Add floor
  const floorShape = new CANNON.Plane();
  const floorBody = new CANNON.Body({ mass: 0 });
  floorBody.addShape(floorShape);
  floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
  floorBody.position.y = -2;
  world.addBody(floorBody);
  
  // Handle window resize
  window.addEventListener('resize', () => {
    if (!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
  
  // Start animation loop
  animate();
}

// Create a single die with physics
function createDie(): { mesh: THREE.Mesh; body: CANNON.Body } {
  // Create the 3D geometry
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  
  // Create materials for each face
  const materials = [
    new THREE.MeshStandardMaterial({ color: 0xecf0f1, map: createDiceTexture(DICE_SYMBOLS.AXE.name) }),
    new THREE.MeshStandardMaterial({ color: 0xecf0f1, map: createDiceTexture(DICE_SYMBOLS.ARROW.name) }),
    new THREE.MeshStandardMaterial({ color: 0xecf0f1, map: createDiceTexture(DICE_SYMBOLS.HELMET.name) }),
    new THREE.MeshStandardMaterial({ color: 0xecf0f1, map: createDiceTexture(DICE_SYMBOLS.SHIELD.name) }),
    new THREE.MeshStandardMaterial({ color: 0xecf0f1, map: createDiceTexture(DICE_SYMBOLS.HAND.name) }),
    new THREE.MeshStandardMaterial({ color: 0xecf0f1, map: createDiceTexture(DICE_SYMBOLS.PRAYER.name) })
  ];
  
  // Create the die mesh
  const die = new THREE.Mesh(geometry, materials);
  scene.add(die);
  
  // Create physics body
  const shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
  const body = new CANNON.Body({ mass: 1 });
  body.addShape(shape);
  body.position.set(
    Math.random() * 4 - 2,
    Math.random() * 4 + 3,
    Math.random() * 4 - 2
  );
  body.angularVelocity.set(
    Math.random() * 10,
    Math.random() * 10,
    Math.random() * 10
  );
  world.addBody(body);
  
  return { mesh: die, body: body };
}

// Create a texture for a die face
function createDiceTexture(symbol: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  
  // Fill background
  ctx.fillStyle = '#ecf0f1';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw symbol
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 50px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  let symbol_text = '';
  switch(symbol) {
    case 'Axe': symbol_text = '⚔️'; break;
    case 'Arrow': symbol_text = '🏹'; break;
    case 'Helmet': symbol_text = '🛡️'; break;
    case 'Shield': symbol_text = '🔰'; break;
    case 'Hand': symbol_text = '👐'; break;
    case 'Prayer': symbol_text = '✨'; break;
  }
  
  ctx.fillText(symbol_text, canvas.width / 2, canvas.height / 2);
  
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Roll the dice
export function rollDice(count = TOTAL_DICE): Promise<DiceSymbol[]> {
  // Clear existing dice
  diceObjects.forEach(die => {
    scene.remove(die.mesh);
    world.removeBody(die.body);
  });
  diceObjects = [];
  
  // Create new dice
  for (let i = 0; i < count; i++) {
    diceObjects.push(createDie());
  }
  
  return new Promise(resolve => {
    // Wait for dice to settle
    const checkDiceSettled = setInterval(() => {
      const allSettled = diceObjects.every(die => {
        const velocity = die.body.velocity.length();
        const angularVelocity = die.body.angularVelocity.length();
        return velocity < 0.1 && angularVelocity < 0.1;
      });
      
      if (allSettled) {
        clearInterval(checkDiceSettled);
        
        // Determine which faces are up
        const results = diceObjects.map(die => {
          // Get rotation and determine which face is most "up"
          const rotation = new THREE.Euler().setFromQuaternion(
            new THREE.Quaternion(
              die.body.quaternion.x,
              die.body.quaternion.y,
              die.body.quaternion.z,
              die.body.quaternion.w
            )
          );
          
          // Simplified face detection based on rotation
          // In a real implementation, this would be more accurate
          const x = Math.abs(rotation.x % (Math.PI * 2));
          const y = Math.abs(rotation.y % (Math.PI * 2));
          
          let faceIndex: number;
          if (Math.abs(x - Math.PI/2) < 0.5) faceIndex = 0;
          else if (Math.abs(x - 3*Math.PI/2) < 0.5) faceIndex = 1;
          else if (Math.abs(y - Math.PI/2) < 0.5) faceIndex = 2;
          else if (Math.abs(y - 3*Math.PI/2) < 0.5) faceIndex = 3;
          else if (y < 0.5 || y > 3*Math.PI/2 - 0.5) faceIndex = 4;
          else faceIndex = 5;
          
          // Map face index to symbol
          const symbols = Object.values(DICE_SYMBOLS);
          return symbols[faceIndex];
        });
        
        resolve(results);
      }
    }, 100);
  });
}

// Animation loop
function animate(): void {
  requestAnimationFrame(animate);
  
  // Update physics
  world.step(1/60);
  
  // Update mesh positions
  diceObjects.forEach(die => {
    die.mesh.position.copy(die.body.position as unknown as THREE.Vector3);
    die.mesh.quaternion.copy(die.body.quaternion as unknown as THREE.Quaternion);
  });
  
  renderer.render(scene, camera);
}
