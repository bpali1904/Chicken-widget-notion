(() => {
  const chicken = document.getElementById("chicken");

  // Sprite sheets: each should be 144x24 (6 frames * 24px wide)
  const SPRITES = {
    right: "./chicken-right.png",
    left: "./chicken-left.png",
  };

  const FRAME_W = 24;
  const FRAME_H = 24;
  const FRAMES = 6;

  // Movement tuning
  const SPEED = 180; // pixels per second (adjust)
  const ARRIVE_EPS = 2; // "close enough" radius in px
  const ANIM_FPS = 12; // walking animation speed

  // State
  let pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let target = { x: pos.x, y: pos.y };
  let moving = false;
  let dir = "right"; // "right" | "left"
  let frame = 0;

  // Timers
  let lastTs = performance.now();
  let animAcc = 0;

  // Ensure correct initial sprite + idle frame
  setDirection(dir);
  setFrame(0);
  applyPosition();

  // Click-to-move
  window.addEventListener("click", (e) => {
    // Set target to click point (but account for sprite anchor)
    // We'll treat pos as the chicken's top-left
    target.x = e.clientX;
    target.y = e.clientY;

    // Decide direction immediately based on target
    const newDir = (target.x >= pos.x) ? "right" : "left";
    if (newDir !== dir) setDirection(newDir);

    moving = true;
  });

  // Keep chicken within bounds on resize
  window.addEventListener("resize", () => {
    pos.x = clamp(pos.x, 0, window.innerWidth - FRAME_W);
    pos.y = clamp(pos.y, 0, window.innerHeight - FRAME_H);
    target.x = clamp(target.x, 0, window.innerWidth - FRAME_W);
    target.y = clamp(target.y, 0, window.innerHeight - FRAME_H);
    applyPosition();
  });

  function tick(ts) {
    const dt = (ts - lastTs) / 1000;
    lastTs = ts;

    // Move toward target
    if (moving) {
      // Update direction continuously if target is on other side
      const desiredDir = (target.x >= pos.x) ? "right" : "left";
      if (desiredDir !== dir) setDirection(desiredDir);

      const dx = target.x - pos.x;
      const dy = target.y - pos.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= ARRIVE_EPS) {
        // Arrived: snap + idle on frame 0 of current direction
        pos.x = target.x;
        pos.y = target.y;
        moving = false;
        setFrame(0);
        applyPosition();
      } else {
        const step = SPEED * dt;
        const t = Math.min(1, step / dist);

        pos.x += dx * t;
        pos.y += dy * t;

        // Clamp within viewport
        pos.x = clamp(pos.x, 0, window.innerWidth - FRAME_W);
        pos.y = clamp(pos.y, 0, window.innerHeight - FRAME_H);

        // Animate walk frames while moving
        animAcc += dt;
        const frameTime = 1 / ANIM_FPS;
        while (animAcc >= frameTime) {
          animAcc -= frameTime;
          frame = (frame + 1) % FRAMES;
          setFrame(frame);
        }

        applyPosition();
      }
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

  function setDirection(newDir) {
    dir = newDir;
    chicken.style.backgroundImage = url("${SPRITES[dir]}");
    // When direction changes, reset animation accumulator lightly
    animAcc = 0;
    // If idle, keep frame 0. If moving, keep current frame.
    if (!moving) setFrame(0);
  }

  function setFrame(i) {
    // i: 0..5
    const x = -i * FRAME_W;
    const y = 0;
    chicken.style.backgroundPosition = ${x}px ${y}px;
  }

  function applyPosition() {
    // Place chicken top-left at pos
    chicken.style.left = ${Math.round(pos.x)}px;
    chicken.style.top = ${Math.round(pos.y)}px;
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }
})();
  
