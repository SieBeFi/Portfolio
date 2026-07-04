/**
 * Starry animated particle background.
 * Renders a full-screen constellation of drifting "stars" that:
 *  - twinkle and slowly move,
 *  - connect to nearby stars with fading lines,
 *  - react to the mouse (nearby stars link to the cursor and are gently pushed).
 * Pure vanilla JS + <canvas>, no dependencies, no backend.
 */
(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const canvas = document.getElementById("bg-stars");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");

  // Tunables
  const STAR_COLOR = "255, 255, 255";
  const LINK_COLOR = "140, 170, 255";
  const LINK_DISTANCE = 130; // px between stars to draw a line
  const MOUSE_DISTANCE = 170; // px radius the cursor influences
  const MOUSE_PUSH = 0.6; // how strongly the cursor nudges nearby stars
  const BASE_DENSITY = 0.00012; // stars per px^2 of viewport

  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let stars = [];
  const mouse = { x: null, y: null };

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function createStars() {
    const target = Math.round(width * height * BASE_DENSITY);
    const count = Math.max(40, Math.min(target, 220));
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: rand(0, width),
        y: rand(0, height),
        vx: rand(-0.25, 0.25),
        vy: rand(-0.25, 0.25),
        radius: rand(0.6, 1.9),
        twinkle: rand(0, Math.PI * 2),
        twinkleSpeed: rand(0.005, 0.02),
      });
    }
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    createStars();
  }

  function drawLinks() {
    for (let i = 0; i < stars.length; i++) {
      const a = stars[i];

      // Star-to-star links
      for (let j = i + 1; j < stars.length; j++) {
        const b = stars[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < LINK_DISTANCE) {
          const alpha = (1 - dist / LINK_DISTANCE) * 0.5;
          ctx.strokeStyle = "rgba(" + LINK_COLOR + "," + alpha + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // Star-to-cursor links
      if (mouse.x !== null) {
        const mdx = a.x - mouse.x;
        const mdy = a.y - mouse.y;
        const mdist = Math.hypot(mdx, mdy);
        if (mdist < MOUSE_DISTANCE) {
          const alpha = (1 - mdist / MOUSE_DISTANCE) * 0.7;
          ctx.strokeStyle = "rgba(" + LINK_COLOR + "," + alpha + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();

          // Gentle push away from the cursor
          const force = ((MOUSE_DISTANCE - mdist) / MOUSE_DISTANCE) * MOUSE_PUSH;
          if (mdist > 0.01) {
            a.x += (mdx / mdist) * force;
            a.y += (mdy / mdist) * force;
          }
        }
      }
    }
  }

  function step() {
    ctx.clearRect(0, 0, width, height);

    if (!prefersReducedMotion) {
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.x += s.vx;
        s.y += s.vy;

        // Wrap around edges
        if (s.x < -5) s.x = width + 5;
        if (s.x > width + 5) s.x = -5;
        if (s.y < -5) s.y = height + 5;
        if (s.y > height + 5) s.y = -5;

        s.twinkle += s.twinkleSpeed;
      }
    }

    drawLinks();

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const flicker = 0.55 + 0.45 * Math.sin(s.twinkle);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(" + STAR_COLOR + "," + flicker + ")";
      ctx.fill();
    }

    requestAnimationFrame(step);
  }

  function onMove(x, y) {
    mouse.x = x;
    mouse.y = y;
  }

  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", function (e) {
    onMove(e.clientX, e.clientY);
  });
  window.addEventListener(
    "touchmove",
    function (e) {
      if (e.touches && e.touches.length) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    { passive: true }
  );
  window.addEventListener("mouseout", function () {
    mouse.x = null;
    mouse.y = null;
  });

  resize();
  requestAnimationFrame(step);
})();
