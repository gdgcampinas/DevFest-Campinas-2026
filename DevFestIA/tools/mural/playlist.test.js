/**
 * Regras puras do rodízio do mural (docs/js/features/mural-playlist.js): disponibilidade, ordem, interrupção, castigo e filtro.
 *   node --test DevFestIA/tools/mural/playlist.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./load.js");
const { sceneAvailable, pickNextScene, pruneInterrupts, withCooldown, filterScenesByIds } = load("features/mural-playlist.js");

const ctx = (extra = {}) => ({ now: new Date("2026-11-28T15:00:00Z"), reveal: true, phase: "live", live: {}, ...extra });
const scene = (id, extra = {}) => ({ id, type: "x", ...extra });
const ids = [scene("a"), scene("b"), scene("c")];

test("cena desligada, fora da janela de datas ou sem o line-up revelado não aparece", () => {
  assert.equal(sceneAvailable(scene("a", { enabled: false }), ctx()), false);
  assert.equal(sceneAvailable(scene("a", { from: "2026-11-28T16:00:00Z" }), ctx()), false);
  assert.equal(sceneAvailable(scene("a", { until: "2026-11-28T14:00:00Z" }), ctx()), false);
  assert.equal(sceneAvailable(scene("a", { requires: { reveal: true } }), ctx({ reveal: false })), false);
  assert.equal(sceneAvailable(scene("a", { requires: { reveal: true } }), ctx()), true);
});

test("cena por fase do evento e por fonte ao vivo pronta", () => {
  const before = scene("a", { requires: { phases: ["before"] } });
  assert.equal(sceneAvailable(before, ctx({ phase: "live" })), false);
  assert.equal(sceneAvailable(before, ctx({ phase: "before" })), true);
  const podium = scene("p", { requires: { live: "podium" } });
  assert.equal(sceneAvailable(podium, ctx()), false);
  assert.equal(sceneAvailable(podium, ctx({ live: { podium: { key: "k" } } })), true);
});

test("o rodízio segue a ordem e dá a volta", () => {
  const order = [];
  let currentId = null;
  for (let i = 0; i < 5; i++) {
    currentId = pickNextScene({ scenes: ids, currentId, ctx: ctx(), nowMs: 0 }).scene.id;
    order.push(currentId);
  }
  assert.deepEqual(order, ["a", "b", "c", "a", "b"]);
});

test("pula cena indisponível e cena de castigo; castigo vence com o tempo", () => {
  const scenes = [scene("a"), scene("b", { enabled: false }), scene("c")];
  assert.equal(pickNextScene({ scenes, currentId: "a", ctx: ctx(), nowMs: 0 }).scene.id, "c");
  const cooldowns = withCooldown({}, "c", 1000, 5000);
  assert.equal(pickNextScene({ scenes, currentId: "a", cooldowns, ctx: ctx(), nowMs: 2000 }).scene.id, "a", "c está de castigo, a volta pra a");
  assert.equal(pickNextScene({ scenes, currentId: "a", cooldowns, ctx: ctx(), nowMs: 6001 }).scene.id, "c", "castigo acabou");
});

test("nenhuma cena disponível devolve null (o motor usa a reserva)", () => {
  assert.equal(pickNextScene({ scenes: [scene("a", { enabled: false })], ctx: ctx(), nowMs: 0 }), null);
  assert.equal(pickNextScene({ scenes: [], ctx: ctx(), nowMs: 0 }), null);
});

test("interrupção de maior prioridade entra na frente; vencida ou de cena indisponível é ignorada", () => {
  const interrupts = [
    { sceneId: "b", priority: 10, createdAt: 1, expiresAt: 100 },
    { sceneId: "c", priority: 90, createdAt: 2, expiresAt: 100 },
    { sceneId: "a", priority: 99, createdAt: 3, expiresAt: 5 }, // vencida
  ];
  const picked = pickNextScene({ scenes: ids, currentId: "a", interrupts, ctx: ctx(), nowMs: 10 });
  assert.equal(picked.scene.id, "c");
  assert.equal(picked.interrupt, interrupts[1]);
  const noC = pickNextScene({ scenes: [scene("a"), scene("b"), scene("c", { enabled: false })], currentId: "a", interrupts, ctx: ctx(), nowMs: 10 });
  assert.equal(noC.scene.id, "b", "a interrupção da cena indisponível cai pra seguinte");
});

test("pruneInterrupts tira as vencidas e a que acabou de ser usada", () => {
  const used = { sceneId: "b", priority: 1, createdAt: 1, expiresAt: 100 };
  const kept = { sceneId: "c", priority: 1, createdAt: 1, expiresAt: 100 };
  const expired = { sceneId: "a", priority: 1, createdAt: 1, expiresAt: 5 };
  assert.deepEqual(pruneInterrupts([used, kept, expired], 10, used), [kept]);
});

test("?cenas= filtra e ordena; ids desconhecidos são ignorados; nenhum válido mantém tudo", () => {
  assert.deepEqual(filterScenesByIds(ids, ["c", "a"]).map(s => s.id), ["c", "a"]);
  assert.deepEqual(filterScenesByIds(ids, ["zzz", "b"]).map(s => s.id), ["b"]);
  assert.equal(filterScenesByIds(ids, ["zzz"]), ids);
  assert.equal(filterScenesByIds(ids, []), ids);
});
