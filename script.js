// === BASIC SETTINGS YOU CAN TWEAK ===
const SPRITE_WIDTH = 24;   // each frame width in pixels
const SPRITE_HEIGHT = 24;  // each frame height in pixels
const FRAMES = 6;          // total frames per strip
const FPS = 8;             // animation frames per second
const MOVE_SPEED = 60;     // pixels per second (how fast the chicken walks)
const SCALE = 3;           // how much to blow up the chicken on screen (3x => 72px tall)

// Canvas setup
const canvas = document.getElementById('chickenCanvas');
const ctx = canvas.getContext('2d', { alpha: true });

// Handle high-DPI displays so it stays crisp
function setupHiDPI() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  // Keep CSS size the same, increase internal resolution
  const cssWidth = canvas.width;
  const cssHeight = canvas.height;
  canvas.style.width = cssWidth + 'px';
  canvas.style.height = cssHeight + 'px';
  canvas.width = Math.floor(cssWidth * dpr);
  canvas.height = Math.floor(cssHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
setupHiDPI();

// Load sprites
const spriteRight = new Image();
const spriteLeft = new Image();
spriteRight.src = 'chicken_right.png';
spriteLeft.src = 'chicken_left.png';

// State
const state = {
  x: 150,  // start roughly center (in canvas CSS pixels)
  y: 140,  // ground-ish
  targetX: 150,
  targetY: 140,
  facing: 'right',   // 'left' or 'right'
  frame: 0,
  accumTime: 0,
  walking: false
};

// Simple ground baseline so chicken doesn’t float
const groundY = state.y;

// Click to set target
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  state.targetX = clickX;
  // Constrain Y to ground so it walks horizontally (simpler + cuter)
  state.targetY = groundY;
});

// Animation timing
let lastTime = performance.now();

function update(dt) {
  // Movement toward target
  const dx = state.targetX - state.x;
  const dy = state.targetY - state.y;
  const dist = Math.hypot(dx, dy);

  if (dist > 1) {
    state.walking = true;
    // Determine facing by x direction only
    if (dx < 0) state.facing = 'left';
    else if (dx > 0) state.facing = 'right';

    const step = Math.min(dist, MOVE_SPEED * dt); // pixels to move this frame
    if (dist > 0) {
      state.x += (dx / dist) * step;
      state.y += (dy / dist) * step;
    }
  } else {
    state.walking = false;
  }

  // Frame animation
  const secondsPerFrame = 1 / FPS;
  state.accumTime += dt;
  if (state.walking) {
    while (state.accumTime >= secondsPerFrame) {
      state.accumTime -= secondsPerFrame;
      state.frame = (state.frame + 1) % FRAMES;
    }
  } else {
    state.frame = 0; // idle pose = first frame
  }
}

function draw() {
  // Clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Choose sprite based on facing
  const sprite = (state.facing === 'left') ? spriteLeft : spriteRight;

  // Draw scaled, but keep pixels crisp
  const drawW = SPRITE_WIDTH * SCALE;
  const drawH = SPRITE_HEIGHT * SCALE;

  // Source frame in the sprite strip
  const sx = state.frame * SPRITE_WIDTH;
  const sy = 0;

  // Draw centered on the feet-ish; adjust anchor so feet sit on ground
  const anchorX = state.x - drawW / 2;
  const anchorY = state.y - drawH; // bottom aligned to ground

  // Ensure sprite loaded before drawing
  if (sprite.complete && sprite.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = false; // keep it pixelated
    ctx.drawImage(
      sprite,
      sx, sy, SPRITE_WIDTH, SPRITE_HEIGHT,
      Math.round(anchorX), Math.round(anchorY),
      Math.round(drawW), Math.round(drawH)
    );
  }
}

function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000); // clamp big jumps
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// Start after images are ready (best-effort)
Promise.all([
  new Promise(res => { spriteRight.onload = res; }),
  new Promise(res => { spriteLeft.onload = res; })
]).then(() => {
  requestAnimationFrame(loop);
}).catch(() => {
  // Even if images fail to fire onload, start after a short delay
  setTimeout(() => requestAnimationFrame(loop), 200);
});

// Resize handling (optional). If you change canvas CSS size, call setupHiDPI again.
window.addEventListener('resize', () => {
  setupHiDPI();
});
