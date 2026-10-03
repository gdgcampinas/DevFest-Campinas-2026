/**
 * Motor do papel picado (puro: sem DOM, sem relógio, sem Math.random fixo; DUAL, testado em Node em
 * DevFestIA/tools/raffle/). Cria os pedaços e avança a física; quem desenha é features/confetti.js. Tudo por
 * parâmetro (`random`, `config`, `bounds`), então o teste é determinístico e o visual é só dado (data/raffle-confetti.js).
 *
 * Um pedaço: { x, y, vx, vy, rotation, spin, wobble, wobbleSpeed, sway, width, height, color, age, ttl, delay }.
 * `delay` > 0 = ainda não começou (a chuva escalona a largada). `wobble` vira o "vira-e-desvira" do papel (escala em Y).
 */
const degToRad = degrees => (degrees * Math.PI) / 180;
const between = (random, [min, max]) => min + random() * (max - min);

function baseParticle(random, config, palette) {
  const longSide = between(random, config.size);
  return {
    rotation: random() * Math.PI * 2,
    spin: (random() - 0.5) * 10,
    wobble: random() * Math.PI * 2,
    wobbleSpeed: 6 + random() * 8,
    sway: (random() - 0.5) * 60,
    width: longSide,
    height: longSide * (0.4 + random() * 0.15),
    color: palette[Math.floor(random() * palette.length)],
    age: 0,
    ttl: (config.ttlMs / 1000) * (0.8 + random() * 0.4),
  };
}

/** Explosão em leque pra cima a partir de `origin`. */
function createBurst({ origin, count, random, config, palette }) {
  return Array.from({ length: count }, () => {
    const angle = degToRad(-90 + (random() - 0.5) * 2 * config.burstSpreadDeg);
    const speed = between(random, config.burstSpeed);
    return { ...baseParticle(random, config, palette), x: origin.x, y: origin.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, delay: 0 };
  });
}

/** Chuva caindo do topo, largando escalonada. */
function createRain({ count, width, random, config, palette }) {
  return Array.from({ length: count }, () => ({
    ...baseParticle(random, config, palette),
    x: random() * width,
    y: -20 - random() * 80,
    vx: (random() - 0.5) * 80,
    vy: 120 + random() * 120,
    delay: random() * (config.rainSpreadMs / 1000),
  }));
}

/** Os pedaços de um disparo: explosão em `origin` (se houver) + chuva. `bounds` = { width, height } da tela. */
function createConfettiBatch({ origin, bounds, random, config, palette }) {
  const burst = origin ? createBurst({ origin, count: config.burstCount, random, config, palette }) : [];
  return [...burst, ...createRain({ count: config.rainCount, width: bounds.width, random, config, palette })];
}

/** Avança `dt` segundos (muta os pedaços) e devolve só os que continuam na tela e dentro da vida. */
function stepConfetti(particles, dt, { config, bounds }) {
  const drag = Math.exp(-config.airDrag * dt);
  return particles.filter(particle => {
    if (particle.delay > 0) {
      particle.delay -= dt;
      return true;
    }
    particle.age += dt;
    particle.vx *= drag;
    particle.vy = Math.min((particle.vy + config.gravity * dt) * drag, config.terminalVelocity);
    particle.x += (particle.vx + Math.sin(particle.wobble) * particle.sway) * dt;
    particle.y += particle.vy * dt;
    particle.rotation += particle.spin * dt;
    particle.wobble += particle.wobbleSpeed * dt;
    return particle.age < particle.ttl && particle.y < bounds.height + 60;
  });
}

/** 1 enquanto vive; some nos últimos 25% da vida. */
const confettiAlpha = particle => Math.min(1, (particle.ttl - particle.age) / (particle.ttl * 0.25));

if (typeof module !== "undefined") module.exports = { createBurst, createRain, createConfettiBatch, stepConfetti, confettiAlpha };
