/**
 * Liga fonte ao vivo -> mural (docs/js/features/mural-live-bindings.js): estado das cenas, interrupção e comemoração só na publicação AO VIVO.
 *   node --test DevFestIA/tools/mural/bindings.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./load.js");
const { createFreshPublishDetector } = load("features/publish-detector.js");
globalThis.createFreshPublishDetector = createFreshPublishDetector;
const { createLiveBindings } = load("features/mural-live-bindings.js");

const definitions = [
  { id: "registered", bind: { live: "registered" } },
  { id: "podium", bind: { live: "podium", pick: "podium", interrupt: { sceneId: "podio-jam", priority: 100, ttlMs: 1000, immediate: true }, celebrate: true } },
  { id: "sem-bind" },
];
const setup = () => {
  const live = {};
  const pushed = [];
  let celebrations = 0;
  const onUpdate = createLiveBindings({ definitions, live, mural: { pushInterrupt: interrupt => pushed.push(interrupt) }, celebrate: () => celebrations++ });
  return { live, pushed, onUpdate, celebrations: () => celebrations };
};

test("fonte simples: guarda o valor no estado que as cenas leem", () => {
  const { live, onUpdate } = setup();
  onUpdate("registered", { total: 50 });
  assert.deepEqual(live.registered, { total: 50 });
  onUpdate("registered", null);
  assert.equal(live.registered, null);
});

test("fonte sem bind é ignorada", () => {
  const { live, onUpdate } = setup();
  onUpdate("sem-bind", { x: 1 });
  onUpdate("desconhecida", { x: 1 });
  assert.deepEqual(live, {});
});

test("pódio publicado ao vivo: guarda { key, items }, empurra a interrupção e comemora uma vez", () => {
  const { live, pushed, onUpdate, celebrations } = setup();
  onUpdate("podium:k1", null); // viu a sessão sem pódio
  assert.deepEqual(live, {});
  onUpdate("podium:k1", { podium: [{ place: 1, project: "A", name: "Ana" }] });
  assert.deepEqual(live.podium, { key: "k1", items: [{ place: 1, project: "A", name: "Ana" }] });
  assert.equal(pushed.length, 1);
  assert.equal(pushed[0].sceneId, "podio-jam");
  assert.equal(celebrations(), 1);
  onUpdate("podium:k1", { podium: [{ place: 1, project: "A", name: "Ana" }, { place: 2, project: "B", name: "Beto" }] });
  assert.equal(pushed.length, 1, "completar o pódio não é nova publicação");
});

test("pódio que já estava publicado quando o mural abriu: vira cena do rodízio, sem interromper nem comemorar", () => {
  const { live, pushed, onUpdate, celebrations } = setup();
  onUpdate("podium:k1", { podium: [{ place: 1, project: "A", name: "Ana" }] });
  assert.equal(live.podium.key, "k1");
  assert.equal(pushed.length, 0);
  assert.equal(celebrations(), 0);
});

test("pódio despublicado some do estado, mas só se era o da mesma sessão; outra sessão não apaga o pódio", () => {
  const { live, onUpdate } = setup();
  onUpdate("podium:k1", { podium: [{ place: 1, project: "A", name: "Ana" }] });
  onUpdate("podium:k2", null);
  assert.equal(live.podium.key, "k1", "k2 vazio não apaga o pódio de k1");
  onUpdate("podium:k1", { podium: [] });
  assert.equal(live.podium, undefined);
});

test("duas sessões com concurso têm detectores separados", () => {
  const { pushed, onUpdate } = setup();
  onUpdate("podium:k1", null);
  onUpdate("podium:k2", null);
  onUpdate("podium:k1", { podium: [{ place: 1 }] });
  onUpdate("podium:k2", { podium: [{ place: 1 }] });
  assert.equal(pushed.length, 2);
});

test("a comemoração espera `celebrateDelayMs` (o pódio entra do 3º ao 1º e a festa é na hora do 1º); sem atraso é na hora", async () => {
  const { createFakeClock } = require("../lib/fake-clock.js");
  const clock = createFakeClock();
  let celebrations = 0;
  const delayed = createLiveBindings({
    definitions: [{ id: "podium", bind: { live: "podium", pick: "podium", celebrate: true, celebrateDelayMs: 2900 } }],
    live: {}, mural: { pushInterrupt() {} }, celebrate: () => celebrations++, schedule: clock.schedule,
  });
  delayed("podium:k1", null);
  delayed("podium:k1", { podium: [{ place: 1 }] });
  await clock.tick(2899);
  assert.equal(celebrations, 0);
  await clock.tick(2);
  assert.equal(celebrations, 1);
});
