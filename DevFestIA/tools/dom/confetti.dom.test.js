/**
 * Testes do papel picado na tela (docs/js/features/confetti.js) em jsdom: o canvas aparece e some sozinho, respeita
 * "Reduzir movimento" (a menos que force), junta disparos num canvas só e nunca quebra. Relógio, quadro de animação e
 * canvas de mentira injetados; o motor de física tem os próprios testes em tools/raffle/.
 *   node --test DevFestIA/tools/dom/confetti.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE } = require("../lib/dom-harness.js");

const SCRIPTS = [...SITE_BASE, "data/raffle-confetti.js", "features/confetti-engine.js", "features/confetti.js"];
const windows = [];
test.after(() => windows.forEach(window => window.close()));

function setup({ reduced = false, getContext } = {}) {
  const site = loadSite({ scripts: SCRIPTS });
  const { window, document } = site;
  windows.push(window);
  const draws = { fillRects: 0, clears: 0 };
  const ctx = {
    setTransform() {}, clearRect() { draws.clears++; }, save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
    fillRect() { draws.fillRects++; }, set globalAlpha(v) {}, set fillStyle(v) {},
  };
  window.HTMLCanvasElement.prototype.getContext = getContext ?? (() => ctx);
  const frames = [];
  let time = 0;
  const confetti = site.get("createConfetti")({
    doc: document, win: window, now: () => time, random: (() => { let n = 0; return () => ((n++ * 0.37) % 1); })(),
    requestFrame: callback => frames.push(callback),
    reducedMotion: () => reduced,
  });
  /** Roda quadros de 1/60 s até acabar (ou `max`). */
  const runFrames = (max = 2000) => { let n = 0; while (frames.length && n++ < max) { time += 1000 / 60; frames.shift()(time); } return n; };
  return { confetti, document, window, draws, frames, runFrames, canvases: () => document.querySelectorAll("canvas.raffle-confetti").length };
}

test("dispara: aparece um canvas por cima, desenha pedaços e some sozinho quando acaba", () => {
  const world = setup();
  assert.equal(world.confetti.fire({ origin: { x: 100, y: 100 } }), true);
  assert.equal(world.canvases(), 1);
  assert.equal(world.document.querySelector("canvas.raffle-confetti").getAttribute("aria-hidden"), "true");
  world.runFrames(3);
  assert.ok(world.draws.fillRects > 0, "desenhou");
  world.runFrames();
  assert.equal(world.canvases(), 0, "o canvas saiu da página no fim");
  assert.equal(world.frames.length, 0, "e o laço de quadros parou");
});

test("com 'Reduzir movimento' não dispara; com force (modo telão) dispara mesmo assim", () => {
  const world = setup({ reduced: true });
  assert.equal(world.confetti.fire({ origin: { x: 1, y: 1 } }), false);
  assert.equal(world.canvases(), 0);
  assert.equal(world.confetti.fire({ origin: { x: 1, y: 1 }, force: true }), true);
  assert.equal(world.canvases(), 1);
});

test("sem origem só cai a chuva do topo (nada desenhado no primeiro quadro, porque a chuva espera o atraso)", () => {
  const world = setup();
  world.confetti.fire();
  world.runFrames(1);
  assert.ok(world.draws.fillRects < 100, "a explosão não existe");
  world.runFrames();
  assert.equal(world.canvases(), 0);
});

test("dois disparos seguidos dividem o mesmo canvas e o mesmo laço", () => {
  const world = setup();
  world.confetti.fire({ origin: { x: 10, y: 10 } });
  world.runFrames(5);
  world.confetti.fire({ origin: { x: 20, y: 20 } });
  assert.equal(world.canvases(), 1);
  assert.equal(world.frames.length, 1, "um laço só");
  world.runFrames();
  assert.equal(world.canvases(), 0);
});

test("clear() remove o canvas e para a animação na hora", () => {
  const world = setup();
  world.confetti.fire({ origin: { x: 10, y: 10 } });
  world.confetti.clear();
  assert.equal(world.canvases(), 0);
  world.runFrames(); // o quadro que sobrou não faz nada nem quebra
  assert.equal(world.canvases(), 0);
});

test("se o canvas falhar (sem contexto 2D), nada quebra: o enfeite some e não deixa lixo na página", () => {
  const world = setup({ getContext: () => { throw new Error("sem canvas"); } });
  assert.doesNotThrow(() => world.confetti.fire({ origin: { x: 1, y: 1 } }));
  assert.doesNotThrow(() => world.runFrames());
  assert.equal(world.canvases(), 0);
  assert.equal(world.frames.length, 0);
});

test("a paleta usa as cores da marca dos tokens; sem tokens, as de reserva", () => {
  const site = loadSite({ scripts: SCRIPTS });
  windows.push(site.window);
  const config = site.get("raffleConfettiRepository").getAll();
  const plain = list => JSON.parse(JSON.stringify(list));
  assert.deepEqual(plain(site.get("brandConfettiPalette")(config, site.document, site.window)), plain(config.fallbackColors));
  site.document.documentElement.style.setProperty("--google-blue", "#123456");
  site.document.documentElement.style.setProperty("--google-red", "#654321");
  assert.deepEqual(plain(site.get("brandConfettiPalette")(config, site.document, site.window)), ["#123456", "#654321"]);
});
