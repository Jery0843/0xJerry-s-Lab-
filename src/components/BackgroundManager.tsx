'use client';

import { useEffect, useState } from 'react';

export default function BackgroundManager() {
  const [background, setBackground] = useState<string>('');

  useEffect(() => {
    fetch('/api/admin/background')
      .then(res => res.json())
      .then(data => {
        const bg = data.background || 'matrix';
        setBackground(bg);
        document.body.setAttribute('data-theme', bg);
      })
      .catch(() => {
        setBackground('matrix');
        document.body.setAttribute('data-theme', 'matrix');
      });
  }, []);

  return (
    <>
      {background === 'snow' && <SnowBackground />}
      {background === 'spring' && <SpringBackground />}
      {background === 'matrix' && <MatrixBackground />}
    </>
  );
}

function SnowBackground() {
  useEffect(() => {
    document.body.setAttribute('data-theme', 'snow');
    const container = document.createElement('div');
    container.id = 'snow-container';
    container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:-1;overflow:hidden';
    document.body.appendChild(container);

    const snowSymbols = ['❄', '❅', '❆'];
    for (let i = 0; i < 80; i++) {
      const snow = document.createElement('div');
      snow.textContent = snowSymbols[Math.floor(Math.random() * snowSymbols.length)];
      const size = Math.random() * 20 + 10;
      const left = Math.random() * 100;
      const duration = Math.random() * 5 + 10;
      const delay = Math.random() * 5;
      const sway = Math.random() * 100 - 50;
      snow.style.cssText = `position:absolute;color:#fff;font-size:${size}px;left:${left}%;animation:snowfall-${i} ${duration}s linear infinite;animation-delay:${delay}s;opacity:${Math.random() * 0.5 + 0.5}`;
      container.appendChild(snow);
      
      const keyframes = `@keyframes snowfall-${i}{0%{transform:translateY(-10vh) translateX(0)}100%{transform:translateY(110vh) translateX(${sway}px)}}`;
      const style = document.createElement('style');
      style.textContent = keyframes;
      document.head.appendChild(style);
    }

    return () => {
      container.remove();
      document.querySelectorAll('style').forEach(s => {
        if (s.textContent?.includes('snowfall-')) s.remove();
      });
    };
  }, []);

  return null;
}

function SpringBackground() {
  useEffect(() => {
    document.body.setAttribute('data-theme', 'spring');
    let canvas = document.getElementById('bg-canvas') as HTMLCanvasElement;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'bg-canvas';
      canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:-1';
      document.body.appendChild(canvas);
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{x: number, y: number, vx: number, vy: number, radius: number, hue: number}> = [];
    
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: Math.random() * 3 + 1,
        hue: Math.random() * 60 + 90
      });
    }

    let animationId: number;
    function animate() {
      if (!ctx || !canvas) return;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p, i) => {
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
        gradient.addColorStop(0, `hsla(${p.hue}, 100%, 60%, 0.8)`);
        gradient.addColorStop(1, `hsla(${p.hue}, 100%, 60%, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        ctx.fill();
        
        p.x += p.vx;
        p.y += p.vy;
        p.hue += 0.5;
        
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        
        particles.forEach((p2, j) => {
          if (i !== j) {
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 150) {
              ctx.strokeStyle = `hsla(${(p.hue + p2.hue) / 2}, 100%, 60%, ${0.2 * (1 - dist / 150)})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        });
      });
      
      animationId = requestAnimationFrame(animate);
    }
    
    requestAnimationFrame(animate);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      canvas?.remove();
    };
  }, []);

  return null;
}

function MatrixBackground() {
  useEffect(() => {
    document.body.setAttribute('data-theme', 'matrix');
    let canvas = document.getElementById('bg-canvas') as HTMLCanvasElement;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'bg-canvas';
      canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:-1';
      document.body.appendChild(canvas);
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = '01アイウエオカキクケコサシスセソタチツテト';
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = Array(Math.floor(columns)).fill(1);

    let animationId: number;
    let lastTime = 0;
    const fps = 20;
    const interval = 1000 / fps;
    
    function animate(currentTime: number) {
      if (!ctx || !canvas) return;
      
      const deltaTime = currentTime - lastTime;
      
      if (deltaTime > interval) {
        lastTime = currentTime - (deltaTime % interval);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0F0';
        ctx.font = fontSize + 'px monospace';

        for (let i = 0; i < drops.length; i++) {
          const text = chars[Math.floor(Math.random() * chars.length)];
          ctx.fillText(text, i * fontSize, drops[i] * fontSize);
          
          if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
        }
      }
      
      animationId = requestAnimationFrame(animate);
    }
    
    requestAnimationFrame(animate);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      canvas?.remove();
    };
  }, []);

  return null;
}
