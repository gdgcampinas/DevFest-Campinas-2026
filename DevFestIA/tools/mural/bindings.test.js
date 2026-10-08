/**
 * Liga fonte ao vivo -> mural (docs/js/features/mural-live-bindings.js): estado das cenas, interrupção e comemoração só na publicação AO VIVO.
 *   node --test DevFestIA/tools/mural/bindings.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./load.js");
const { createFreshPublishDetector } = load("features/publish-detector.js");
globalThis.createFreshPublishDetector = createFreshPublishDetector;
globalThis.createNewItemsDetector = load("features/new-items-detector.js").createNewItemsDetector;
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

const albumDefinitions = [{ id: "album", bind: { live: "albums", collect: true, notifyNew: { live: "newPhoto", minGapMs: 15000, expireMs: 120000, interrupt: { sceneId: "foto-nova", priority: 80, ttlMs: 60000, immediate: true } } } }];
const albumOf = ids => ({ photos: ids.map(id => ({ id, url: `https://lh3/${id}`, width: 1, height: 1 })) });

function albumSetup() {
  const { createFakeClock } = require("../lib/fake-clock.js");
  const clock = createFakeClock();
  const live = {};
  const pushed = [];
  const onUpdate = createLiveBindings({ definitions: albumDefinitions, live, mural: { pushInterrupt: interrupt => pushed.push(interrupt) }, schedule: clock.schedule, nowMs: clock.nowMs });
  return { clock, live, pushed, onUpdate };
}

test("álbuns: cada álbum guarda a sua lista em live.albums[chave]", () => {
  const { live, onUpdate } = albumSetup();
  onUpdate("album:ao-vivo", albumOf(["a"]));
  onUpdate("album:elotech", albumOf(["x", "y"]));
  assert.deepEqual(Object.keys(live.albums), ["ao-vivo", "elotech"]);
  assert.equal(live.albums.elotech.photos.length, 2);
});

test("foto nova: a primeira leitura é só a base; depois a nova vai pro estado e entra na frente do rodízio", () => {
  const { live, pushed, onUpdate } = albumSetup();
  onUpdate("album:ao-vivo", albumOf(["a", "b"]));
  assert.equal(live.newPhoto, undefined, "as fotos que já estavam lá não são novas");
  assert.equal(pushed.length, 0);
  onUpdate("album:ao-vivo", albumOf(["c", "a", "b"]));
  assert.equal(live.newPhoto.photo.id, "c");
  assert.equal(live.newPhoto.key, "ao-vivo");
  assert.equal(pushed.length, 1);
  assert.equal(pushed[0].sceneId, "foto-nova");
});

test("foto nova: no máximo uma interrupção a cada 15 s; as demais entram no estado mas não cortam a cena", async () => {
  const { clock, live, pushed, onUpdate } = albumSetup();
  onUpdate("album:ao-vivo", albumOf(["a"]));
  onUpdate("album:ao-vivo", albumOf(["b", "a"]));
  await clock.tick(5000);
  onUpdate("album:ao-vivo", albumOf(["c", "b", "a"]));
  assert.equal(pushed.length, 1, "passaram só 5 s");
  assert.equal(live.newPhoto.photo.id, "c", "mas o estado já aponta a mais nova");
  await clock.tick(11000);
  onUpdate("album:ao-vivo", albumOf(["d", "c", "b", "a"]));
  assert.equal(pushed.length, 2, "passou de 15 s");
});

test("foto nova: várias de uma vez devolvem a mais nova primeiro; o aviso some sozinho depois do prazo", async () => {
  const { clock, live, onUpdate } = albumSetup();
  onUpdate("album:ao-vivo", albumOf(["a"]));
  onUpdate("album:ao-vivo", albumOf(["c", "b", "a"]));
  assert.deepEqual(live.newPhoto.photos.map(photo => photo.id), ["c", "b"]);
  await clock.tick(119000);
  assert.ok(live.newPhoto);
  await clock.tick(2000);
  assert.equal(live.newPhoto, undefined, "expirou: a cena de destaque sai do rodízio");
});

test("foto nova: um aviso mais novo não é apagado pelo prazo do anterior; álbuns diferentes têm detectores e intervalos separados", async () => {
  const { clock, live, pushed, onUpdate } = albumSetup();
  onUpdate("album:ao-vivo", albumOf(["a"]));
  onUpdate("album:outro", albumOf(["x"]));
  onUpdate("album:ao-vivo", albumOf(["b", "a"]));
  await clock.tick(100000);
  onUpdate("album:ao-vivo", albumOf(["c", "b", "a"]));
  await clock.tick(30000);
  assert.equal(live.newPhoto.photo.id, "c", "o prazo da foto 'b' não apagou o aviso da 'c'");
  onUpdate("album:outro", albumOf(["y", "x"]));
  assert.equal(live.newPhoto.key, "outro");
  assert.equal(pushed.length, 3);
});
