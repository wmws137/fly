export function createParticles() {
  return { list: [] };
}

export function resetParticles(particles) {
  particles.list = [];
}

export function spawnPickupBurst(particles, x, y) {
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 100;
    const life = 0.35 + Math.random() * 0.35;
    particles.list.push({
      x,
      y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      life,
      maxLife: life,
      r: 2 + Math.random() * 3,
    });
  }
}

export function updateParticles(particles, dt) {
  for (const p of particles.list) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.9;
    p.vy *= 0.9;
    p.life -= dt;
  }
  particles.list = particles.list.filter((p) => p.life > 0);
}

export function drawParticles(ctx, world, particles) {
  for (const p of particles.list) {
    const sy = p.y - world.cameraY;
    if (sy < -20 || sy > 700) continue;
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = `rgba(255, 193, 7, ${alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, sy, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
}
