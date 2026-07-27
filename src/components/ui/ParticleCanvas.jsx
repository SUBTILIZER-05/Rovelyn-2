import React, { useEffect, useRef } from 'react';

export function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse tracking for subtle repulsion
    const mouse = {
      x: -1000,
      y: -1000,
      radius: 160,
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // 300 to 400 crisp, pin-prick micro-stars
    const particleCount = Math.min(400, Math.max(300, Math.floor((width * height) / 3800)));
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      // Hard limit max radius to 1.5px (ranging from 0.5px to 1.5px)
      const radius = Math.random() * 1.0 + 0.5;
      const alpha = Math.random() * 0.08 + 0.08; // Average ~0.12

      const x = Math.random() * width;
      const y = Math.random() * height;

      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius,
        baseAlpha: alpha,
        density: Math.random() * 15 + 8,
      });
    }

    // Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render Deep Dark Violet Void Gradient (#080711 to #030308)
      const radGrad = ctx.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, Math.max(width, height) * 0.7);
      radGrad.addColorStop(0, '#080711');
      radGrad.addColorStop(1, '#030308');

      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, width, height);

      // Render 300-400 Crisp Micro-Stars
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Lazy space drift
        p.x += p.vx;
        p.y += p.vy;

        // Screen wrap
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Mouse Repulsion Physics
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let currentAlpha = p.baseAlpha;

        if (distance < mouse.radius) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const force = (mouse.radius - distance) / mouse.radius;
          const directionX = forceDirectionX * force * p.density * 0.4;
          const directionY = forceDirectionY * force * p.density * 0.4;

          p.x -= directionX;
          p.y -= directionY;

          // Max 0.3 opacity on hover
          currentAlpha = Math.min(0.3, p.baseAlpha + force * 0.18);
        }

        // Draw crisp pin-prick dot (NO shadow blur / NO large spheres)
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        ctx.fill();

        // Subtle proximity line effect near cursor
        if (distance < mouse.radius) {
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const p2Dx = mouse.x - p2.x;
            const p2Dy = mouse.y - p2.y;
            const p2Distance = Math.sqrt(p2Dx * p2Dx + p2Dy * p2Dy);

            if (p2Distance < mouse.radius) {
              const pDistance = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
              if (pDistance < 80) {
                const lineAlpha = (1 - pDistance / 80) * 0.08 * (1 - distance / mouse.radius);
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = `rgba(255, 255, 255, ${lineAlpha})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
              }
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 block w-full h-full"
    />
  );
}

export default ParticleCanvas;
