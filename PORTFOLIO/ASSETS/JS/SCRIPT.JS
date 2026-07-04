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

/* ------------------------------------------------------------------ *
 * Interactive UI behaviors (typewriter, scroll reveal, active nav,   *
 * skill bars, tilt cards, contact form, back-to-top, mobile menu).   *
 * All progressive-enhancement: the page works without JS.            *
 * ------------------------------------------------------------------ */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  document.addEventListener("DOMContentLoaded", function () {
    initTypewriter();
    initScrollReveal();
    initActiveNav();
    initNavbarState();
    initSkillBars();
    initTilt();
    initProjectGlow();
    initContactForm();
    initBackToTop();
    initMobileMenu();
  });

  /* Typewriter that cycles through the pipe-separated words. */
  function initTypewriter() {
    const el = document.getElementById("typewriter");
    if (!el) return;
    const words = (el.dataset.words || "").split("|").filter(Boolean);
    if (!words.length) return;

    if (reduceMotion) {
      el.textContent = words[0];
      return;
    }

    let wi = 0;
    let ci = 0;
    let deleting = false;

    function tick() {
      const word = words[wi];
      el.textContent = word.slice(0, ci);
      let delay = deleting ? 45 : 90;

      if (!deleting && ci === word.length) {
        deleting = true;
        delay = 1400;
      } else if (deleting && ci === 0) {
        deleting = false;
        wi = (wi + 1) % words.length;
        delay = 300;
      } else {
        ci += deleting ? -1 : 1;
      }
      setTimeout(tick, delay);
    }
    tick();
  }

  /* Fade/slide sections in as they enter the viewport. */
  function initScrollReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("visible"));
      return;
    }

    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    items.forEach((el) => io.observe(el));
  }

  /* Highlight the nav link for the section currently in view. */
  function initActiveNav() {
    const links = Array.from(document.querySelectorAll(".nav-link"));
    if (!links.length || !("IntersectionObserver" in window)) return;
    const map = new Map();
    links.forEach((link) => {
      const id = link.getAttribute("href").slice(1);
      const section = document.getElementById(id);
      if (section) map.set(section, link);
    });

    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach((entry) => {
          const link = map.get(entry.target);
          if (!link) return;
          if (entry.isIntersecting) {
            links.forEach((l) => l.classList.remove("active"));
            link.classList.add("active");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    map.forEach((_, section) => io.observe(section));
  }

  /* Solid navbar + scroll progress bar as the page scrolls. */
  function initNavbarState() {
    const navbar = document.getElementById("navbar");
    const progress = document.getElementById("scroll-progress");

    function onScroll() {
      const y = window.scrollY || window.pageYOffset;
      if (navbar) navbar.classList.toggle("scrolled", y > 20);
      if (progress) {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        const pct = h > 0 ? (y / h) * 100 : 0;
        progress.style.width = pct + "%";
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* Animate skill bars to their data-level width when visible. */
  function initSkillBars() {
    const bars = document.querySelectorAll(".bar-fill");
    if (!bars.length) return;
    const fill = (bar) => {
      bar.style.width = (bar.dataset.level || 0) + "%";
    };
    if (!("IntersectionObserver" in window)) {
      bars.forEach(fill);
      return;
    }
    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            fill(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    bars.forEach((b) => io.observe(b));
  }

  /* Subtle 3D tilt toward the cursor on .tilt elements. */
  function initTilt() {
    if (reduceMotion) return;
    const els = document.querySelectorAll(".tilt");
    els.forEach((el) => {
      el.style.transformStyle = "preserve-3d";
      el.addEventListener("mousemove", function (e) {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform =
          "perspective(700px) rotateX(" +
          (-py * 6).toFixed(2) +
          "deg) rotateY(" +
          (px * 6).toFixed(2) +
          "deg) translateY(-4px)";
      });
      el.addEventListener("mouseleave", function () {
        el.style.transform = "";
      });
    });
  }

  /* Move the highlight glow on project thumbnails with the cursor. */
  function initProjectGlow() {
    document.querySelectorAll(".project-card").forEach((card) => {
      const thumb = card.querySelector(".project-thumb");
      if (!thumb) return;
      card.addEventListener("mousemove", function (e) {
        const r = thumb.getBoundingClientRect();
        thumb.style.setProperty("--mx", e.clientX - r.left + "px");
        thumb.style.setProperty("--my", e.clientY - r.top + "px");
      });
    });
  }

  /* Front-end-only contact form: validates and shows a confirmation. */
  function initContactForm() {
    const form = document.getElementById("contact-form");
    const status = document.getElementById("form-status");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      let ok = true;
      const fields = form.querySelectorAll("input, textarea");
      fields.forEach((input) => {
        const field = input.closest(".field");
        const valid = input.checkValidity() && input.value.trim() !== "";
        if (field) field.classList.toggle("invalid", !valid);
        if (!valid) ok = false;
      });

      if (!ok) {
        if (status) {
          status.style.color = "#ff7a90";
          status.textContent = "Please fill in all fields with a valid email.";
        }
        return;
      }

      if (status) {
        status.style.color = "";
        status.textContent = "Thanks! Your message is ready to send.";
      }
      form.reset();
      // NOTE: No backend — wire this up to an email service or API to actually send.
    });
  }

  /* Back-to-top button appears after scrolling down. */
  function initBackToTop() {
    const btn = document.getElementById("to-top");
    if (!btn) return;
    window.addEventListener(
      "scroll",
      function () {
        btn.classList.toggle("show", (window.scrollY || 0) > 500);
      },
      { passive: true }
    );
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* Mobile hamburger menu. */
  function initMobileMenu() {
    const toggle = document.getElementById("nav-toggle");
    const links = document.getElementById("nav-links");
    if (!toggle || !links) return;
    toggle.addEventListener("click", function () {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }
})();
