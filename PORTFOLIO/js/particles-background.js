/**
 * Black & white particle network background.
 * Particles drift slowly; nearby nodes connect with faint lines.
 * Mouse hover repels nearby particles and draws extra links to the cursor.
 */
(function () {
  'use strict';

  const CONFIG = {
    particleCount: 80,
    particleColor: '#1a1a1a',
    lineColor: 'rgba(80, 80, 80,',
    backgroundColor: '#ffffff',
    minRadius: 1,
    maxRadius: 2.5,
    connectionDistance: 140,
    lineOpacityMax: 0.35,
    speed: 0.35,
    mouseRadius: 120,
    mouseRepelStrength: 0.8,
    mouseLineDistance: 160,
    mouseLineOpacity: 0.45,
    clickBurstStrength: 6,
    clickBurstRadius: 180,
  };

  class Particle {
    constructor(x, y, width, height) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * CONFIG.speed;
      this.vy = (Math.random() - 0.5) * CONFIG.speed;
      this.radius =
        CONFIG.minRadius +
        Math.random() * (CONFIG.maxRadius - CONFIG.minRadius);
      this.bounds = { width, height };
    }

    update(mouse) {
      this.x += this.vx;
      this.y += this.vy;

      if (mouse.active) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.hypot(dx, dy);

        if (dist < CONFIG.mouseRadius && dist > 0) {
          const force =
            ((CONFIG.mouseRadius - dist) / CONFIG.mouseRadius) *
            CONFIG.mouseRepelStrength;
          this.vx += (dx / dist) * force * 0.15;
          this.vy += (dy / dist) * force * 0.15;
        }
      }

      const speed = Math.hypot(this.vx, this.vy);
      const maxSpeed = CONFIG.speed * 3;
      if (speed > maxSpeed) {
        this.vx = (this.vx / speed) * maxSpeed;
        this.vy = (this.vy / speed) * maxSpeed;
      }

      if (this.x < 0 || this.x > this.bounds.width) this.vx *= -1;
      if (this.y < 0 || this.y > this.bounds.height) this.vy *= -1;

      this.x = Math.max(0, Math.min(this.bounds.width, this.x));
      this.y = Math.max(0, Math.min(this.bounds.height, this.y));
    }

    draw(ctx) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = CONFIG.particleColor;
      ctx.fill();
    }
  }

  class ParticleBackground {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.mouse = { x: 0, y: 0, active: false };
      this.animationId = null;
      this.dpr = 1;

      this.onResize = this.onResize.bind(this);
      this.onMouseMove = this.onMouseMove.bind(this);
      this.onMouseLeave = this.onMouseLeave.bind(this);
      this.onClick = this.onClick.bind(this);
      this.animate = this.animate.bind(this);
    }

    init() {
      this.onResize();
      window.addEventListener('resize', this.onResize);
      window.addEventListener('mousemove', this.onMouseMove);
      window.addEventListener('mouseleave', this.onMouseLeave);
      window.addEventListener('click', this.onClick);
      this.animationId = requestAnimationFrame(this.animate);
    }

    destroy() {
      cancelAnimationFrame(this.animationId);
      window.removeEventListener('resize', this.onResize);
      window.removeEventListener('mousemove', this.onMouseMove);
      window.removeEventListener('mouseleave', this.onMouseLeave);
      window.removeEventListener('click', this.onClick);
    }

    onResize() {
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { innerWidth: w, innerHeight: h } = window;

      this.canvas.width = w * this.dpr;
      this.canvas.height = h * this.dpr;
      this.canvas.style.width = `${w}px`;
      this.canvas.style.height = `${h}px`;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

      const count = Math.round(
        CONFIG.particleCount * Math.sqrt((w * h) / (1280 * 720))
      );

      if (this.particles.length === 0) {
        this.particles = Array.from({ length: count }, () =>
          this.createParticle(w, h)
        );
      } else {
        this.particles.forEach((p) => {
          p.bounds = { width: w, height: h };
          p.x = Math.min(p.x, w);
          p.y = Math.min(p.y, h);
        });

        while (this.particles.length < count) {
          this.particles.push(this.createParticle(w, h));
        }
        this.particles.length = count;
      }
    }

    createParticle(width, height) {
      return new Particle(
        Math.random() * width,
        Math.random() * height,
        width,
        height
      );
    }

    onMouseMove(event) {
      this.mouse.x = event.clientX;
      this.mouse.y = event.clientY;
      this.mouse.active = true;
    }

    onMouseLeave() {
      this.mouse.active = false;
    }

    onClick(event) {
      const cx = event.clientX;
      const cy = event.clientY;

      for (const p of this.particles) {
        const dx = p.x - cx;
        const dy = p.y - cy;
        const dist = Math.hypot(dx, dy);

        if (dist < CONFIG.clickBurstRadius && dist > 0) {
          const force =
            ((CONFIG.clickBurstRadius - dist) / CONFIG.clickBurstRadius) *
            CONFIG.clickBurstStrength;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }
    }

    drawConnections() {
      const { particles, ctx } = this;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);

          if (dist < CONFIG.connectionDistance) {
            const opacity =
              (1 - dist / CONFIG.connectionDistance) * CONFIG.lineOpacityMax;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `${CONFIG.lineColor}${opacity})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
    }

    drawMouseConnections() {
      if (!this.mouse.active) return;

      const { particles, ctx, mouse } = this;

      for (const p of particles) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);

        if (dist < CONFIG.mouseLineDistance) {
          const opacity =
            (1 - dist / CONFIG.mouseLineDistance) * CONFIG.mouseLineOpacity;
          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = `${CONFIG.lineColor}${opacity})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = CONFIG.particleColor;
      ctx.fill();
    }

    animate() {
      const { ctx, canvas, particles } = this;
      const w = canvas.width / this.dpr;
      const h = canvas.height / this.dpr;

      ctx.fillStyle = CONFIG.backgroundColor;
      ctx.fillRect(0, 0, w, h);

      particles.forEach((p) => p.update(this.mouse));

      this.drawConnections();

      particles.forEach((p) => p.draw(ctx));

      this.drawMouseConnections();

      this.animationId = requestAnimationFrame(this.animate);
    }
  }

  function initParticleBackground() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return null;

    const bg = new ParticleBackground(canvas);
    bg.init();
    return bg;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initParticleBackground);
  } else {
    initParticleBackground();
  }

  window.ParticleBackground = { init: initParticleBackground, CONFIG };
})();
