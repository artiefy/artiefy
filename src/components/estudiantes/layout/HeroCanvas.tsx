'use client';

import React, { useEffect, useRef } from 'react';

const HeroCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasEl = canvas as HTMLCanvasElement;
    const ctx = canvasEl.getContext('2d')!;

    let animationFrameId = 0;
    let width = 0;
    let height = 0;
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    interface Particle {
      x: number;
      y: number;
      directionX: number;
      directionY: number;
      size: number;
      color: string;
    }

    let particlesArray: Particle[] = [];
    const mouse = {
      x: undefined as number | undefined,
      y: undefined as number | undefined,
      radius: 0,
    };

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvasEl.width = Math.floor(width * dpr);
      canvasEl.height = Math.floor(height * dpr);
      canvasEl.style.width = `${width}px`;
      canvasEl.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      mouse.radius = (height / 80) * (width / 80);
    }

    function initParticles() {
      particlesArray = [];
      const numberOfParticles = Math.max(
        40,
        Math.floor((width * height) / 9000)
      );
      for (let i = 0; i < numberOfParticles; i++) {
        const size = Math.random() * 2 + 1;
        const x = Math.random() * (width - size * 4) + size * 2;
        const y = Math.random() * (height - size * 4) + size * 2;
        const directionX = Math.random() * 1 - 0.5;
        const directionY = Math.random() * 1 - 0.5;
        const color = '#00BDD8'; // Indigo 400
        particlesArray.push({ x, y, directionX, directionY, size, color });
      }
    }

    function drawParticle(p: Particle) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2, false);
      ctx.fillStyle = p.color;
      ctx.fill();
    }

    function updateParticle(p: Particle) {
      if (p.x > width || p.x < 0) p.directionX = -p.directionX;
      if (p.y > height || p.y < 0) p.directionY = -p.directionY;

      // mouse interaction (repulsion)
      if (mouse.x !== undefined && mouse.y !== undefined) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < mouse.radius + p.size) {
          if (mouse.x < p.x && p.x < width - p.size * 10) p.x += 2;
          if (mouse.x > p.x && p.x > p.size * 10) p.x -= 2;
          if (mouse.y < p.y && p.y < height - p.size * 10) p.y += 2;
          if (mouse.y > p.y && p.y > p.size * 10) p.y -= 2;
        }
      }

      p.x += p.directionX;
      p.y += p.directionY;
      drawParticle(p);
    }

    function connect() {
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
          const dx = particlesArray[a].x - particlesArray[b].x;
          const dy = particlesArray[a].y - particlesArray[b].y;
          const distance = dx * dx + dy * dy;
          const threshold = (width / 7) * (height / 7);
          if (distance < threshold) {
            const opacity = 1 - distance / 20000;
            ctx.strokeStyle = `rgba(58,244,239,${Math.max(0, Math.min(1, opacity))})`; // #3AF4EF
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
            ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      for (const p of particlesArray) updateParticle(p);
      connect();
      animationFrameId = requestAnimationFrame(animate);
    }

    function handleResize() {
      resize();
      initParticles();
    }

    function handleMouseMove(event: MouseEvent) {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    }

    function handleMouseOut() {
      mouse.x = undefined;
      mouse.y = undefined;
    }

    handleResize();
    initParticles();
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseOut);
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="hero-canvas"
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 opacity-80"
    />
  );
};

export default HeroCanvas;
