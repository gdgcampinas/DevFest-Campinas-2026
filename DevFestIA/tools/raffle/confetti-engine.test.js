/**
 * Testes do motor do papel picado (docs/js/features/confetti-engine.js): criação dos pedaços, física e fim da vida,
 * tudo determinístico (sorteador injetado) e com a config real do site.
 *   node --test DevFestIA/tools/raffle/confetti-engine.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createBurst, createRain, createConfettiBatch, stepConfetti, confettiAlpha } = require("../../../docs/js/features/confetti-engine.js");

const read = file => fs.readFileSync(path.join(__dirname, "..", "..", "..", "docs", "js", file), "utf8");
const { RAFFLE_CONFETTI: config } = vm.runInNewContext(`${read("data/repository.js")}\n${read("data/raffle-confetti.js")}\n({ RAFFLE_CONFETTI })`);

/** Sorteador com semente (mulberry32): mesma sequência sempre. */
function seeded(seed = 7) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const palette = ["#aaa", "#bbb", "#ccc", "#ddd"];
const bounds = { width: 1280, height: 720 };
const origin = { x: 640, y: 500 };

test("explosão: a quantidade pedida, saindo da origem, em leque pra cima, com as cores da paleta", () => {
  const burst = createBurst({ origin, count: 120, random: seeded(), config, palette });
  assert.equal(burst.length, 120);
  burst.forEach(p => {
    assert.deepEqual([p.x, p.y], [origin.x, origin.y]);
    assert.ok(p.vy < 0, "sobe");
    assert.ok(palette.includes(p.color));
    assert.equal(p.delay, 0);
    const speed = Math.hypot(p.vx, p.vy);
    assert.ok(speed >= config.burstSpeed[0] - 1 && speed <= config.burstSpeed[1] + 1, `velocidade ${speed}`);
  });
  assert.ok(burst.some(p => p.vx < 0) && burst.some(p => p.vx > 0), "abre pros dois lados");
});

test("chuva: nasce acima do topo, espalhada pela largura, com largada escalonada", () => {
  const rain = createRain({ count: 100, width: bounds.width, random: seeded(3), config, palette });
  assert.equal(rain.length, 100);
  rain.forEach(p => {
    assert.ok(p.y < 0, "começa fora da tela, acima");
    assert.ok(p.x >= 0 && p.x <= bounds.width);
    assert.ok(p.delay >= 0 && p.delay <= config.rainSpreadMs / 1000);
    assert.ok(p.vy > 0, "desce");
  });
  assert.ok(Math.max(...rain.map(p => p.delay)) > 0.5, "nem todos largam juntos");
  assert.ok(Math.max(...rain.map(p => p.x)) - Math.min(...rain.map(p => p.x)) > bounds.width / 2, "cobre a tela");
});

test("lote: com origem tem explosão + chuva; sem origem só a chuva", () => {
  const withBurst = createConfettiBatch({ origin, bounds, random: seeded(), config, palette });
  assert.equal(withBurst.length, config.burstCount + config.rainCount);
  const rainOnly = createConfettiBatch({ origin: null, bounds, random: seeded(), config, palette });
  assert.equal(rainOnly.length, config.rainCount);
});

test("física: o papel desacelera, cai e a velocidade de queda nunca passa do limite", () => {
  let particles = createConfettiBatch({ origin, bounds, random: seeded(11), config, palette });
  for (let i = 0; i < 40; i++) {
    particles = stepConfetti(particles, 1 / 60, { config, bounds });
    particles.forEach(p => assert.ok(p.vy <= config.terminalVelocity + 1e-9));
  }
  assert.ok(particles.every(p => Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.rotation)), "nada vira NaN");
});

test("física: a explosão sobe primeiro e depois desce (gravidade)", () => {
  const [p] = createBurst({ origin, count: 1, random: seeded(5), config, palette });
  const startY = p.y;
  let highest = startY;
  let particles = [p];
  for (let i = 0; i < 20; i++) { particles = stepConfetti(particles, 1 / 60, { config, bounds }); highest = Math.min(highest, p.y); }
  assert.ok(highest < startY - 20, "chegou a subir");
  for (let i = 0; i < 60; i++) particles = stepConfetti(particles, 1 / 60, { config, bounds });
  assert.ok(!particles.length || p.vy > 0, "depois de um tempo está caindo");
});

test("chuva só começa a mexer depois do atraso; antes disso fica parada acima da tela", () => {
  const rain = createRain({ count: 5, width: 800, random: () => 0.9, config, palette }); // atraso grande
  const startY = rain.map(p => p.y);
  const after = stepConfetti(rain, 0.1, { config, bounds });
  assert.equal(after.length, 5, "continuam vivos esperando");
  assert.deepEqual(after.map(p => p.y), startY, "ainda não se moveram");
  assert.ok(after.every(p => p.age === 0));
});

test("fim da vida: tudo some depois do tempo (ou ao sair pela base) e o alpha esmaece no fim", () => {
  let particles = createConfettiBatch({ origin, bounds, random: seeded(2), config, palette });
  let seconds = 0;
  while (particles.length && seconds < 20) { particles = stepConfetti(particles, 1 / 30, { config, bounds }); seconds += 1 / 30; }
  assert.equal(particles.length, 0, "a animação termina sozinha");
  assert.ok(seconds < (config.ttlMs / 1000) * 1.3 + config.rainSpreadMs / 1000 + 0.5, `durou ${seconds.toFixed(1)}s`);
  assert.equal(confettiAlpha({ ttl: 4, age: 1 }), 1);
  assert.equal(confettiAlpha({ ttl: 4, age: 3.5 }), 0.5);
  assert.equal(confettiAlpha({ ttl: 4, age: 4 }), 0);
});

test("determinístico: a mesma semente dá exatamente o mesmo lote", () => {
  const a = createConfettiBatch({ origin, bounds, random: seeded(99), config, palette });
  const b = createConfettiBatch({ origin, bounds, random: seeded(99), config, palette });
  assert.deepEqual(a, b);
});
