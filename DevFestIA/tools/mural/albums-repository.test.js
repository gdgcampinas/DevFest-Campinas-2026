/**
 * Repository dos álbuns no mural (docs/js/data/albums-repository.js): leitura do intermediário, limpeza dos dados, última lista boa guardada e falhas.
 *   node --test DevFestIA/tools/mural/albums-repository.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./load.js");
const { createFakeClock } = require("../lib/fake-clock.js");
const { memoryStorage } = require("../lib/dom-harness.js");
const { defaultSchedule, withTimeout } = load("features/scheduler.js");
globalThis.defaultSchedule = defaultSchedule;
globalThis.withTimeout = withTimeout;
const { createAlbumsRepository, sanitizeAlbumPhotos } = load("data/albums-repository.js");

const good = (id, extra = {}) => ({ id, url: `https://lh3.googleusercontent.com/pw/${id}`, width: 3000, height: 2000, takenAt: 1, addedAt: 2, ...extra });
const answer = (body, status = 200) => async () => ({ ok: status < 400, status, json: async () => body });

test("lê o álbum no intermediário, pelo id, e devolve só os campos que o mural usa", async () => {
  const urls = [];
  const repository = createAlbumsRepository({ baseUrl: "https://proxy.test/", fetchFn: async url => { urls.push(url); return { ok: true, json: async () => ({ title: "Ao vivo", fetchedAt: 5, photos: [good("a", { lixo: 1 }), good("b")] }) }; }, schedule: createFakeClock().schedule });
  const album = await repository.get("ao-vivo");
  assert.deepEqual(urls, ["https://proxy.test/albums/ao-vivo"], "sem barra duplicada");
  assert.deepEqual([album.id, album.title, album.count], ["ao-vivo", "Ao vivo", 2]);
  assert.deepEqual(Object.keys(album.photos[0]).sort(), ["addedAt", "height", "id", "takenAt", "url", "width"]);
});

test("foto malformada, sem https ou sem tamanho é descartada (o mural nunca recebe lixo)", () => {
  const photos = sanitizeAlbumPhotos([good("ok"), { id: "sem-url", width: 1, height: 1 }, good("http", { url: "http://x/y" }), good("sem-tamanho", { width: 0 }), null, "texto"]);
  assert.deepEqual(photos.map(photo => photo.id), ["ok"]);
  assert.deepEqual(sanitizeAlbumPhotos(undefined), []);
});

test("guarda a última lista boa e a devolve marcada stale quando o intermediário cai, dá erro, demora ou responde lixo", async () => {
  const clock = createFakeClock();
  const storage = memoryStorage();
  let mode = "ok";
  const fetchFn = async () => {
    if (mode === "down") throw new Error("sem rede");
    if (mode === "500") return { ok: false, status: 500 };
    if (mode === "hang") return new Promise(() => {});
    if (mode === "empty") return { ok: true, json: async () => ({ photos: [] }) };
    return { ok: true, json: async () => ({ title: "Ao vivo", photos: [good("a")] }) };
  };
  const repository = createAlbumsRepository({ baseUrl: "https://p", fetchFn, storage, timeoutMs: 8000, schedule: clock.schedule });
  assert.equal((await repository.get("ao-vivo")).stale, undefined);
  for (const failure of ["down", "500", "empty"]) {
    mode = failure;
    const album = await repository.get("ao-vivo");
    assert.equal(album.stale, true, failure);
    assert.equal(album.photos[0].id, "a");
  }
  mode = "hang";
  const pending = repository.get("ao-vivo");
  await clock.tick(8001);
  assert.equal((await pending).stale, true, "demorou além do tempo limite");
  const afterReload = createAlbumsRepository({ baseUrl: "https://p", fetchFn: async () => { throw new Error("sem rede"); }, storage, schedule: clock.schedule });
  assert.equal((await afterReload.get("ao-vivo")).photos[0].id, "a", "a lista boa sobrevive a recarregar a página");
});

test("sem lista guardada o erro aparece (a fonte reabre com espera crescente); storage que falha não quebra nada", async () => {
  const clock = createFakeClock();
  const noStorage = createAlbumsRepository({ baseUrl: "https://p", fetchFn: answer({}, 502), schedule: clock.schedule });
  await assert.rejects(noStorage.get("novo"), /respondeu 502/);
  const broken = { getItem() { throw new Error("bloqueado"); }, setItem() { throw new Error("cheio"); } };
  const repository = createAlbumsRepository({ baseUrl: "https://p", fetchFn: answer({ title: "T", photos: [good("a")] }), storage: broken, schedule: clock.schedule });
  assert.equal((await repository.get("ao-vivo")).count, 1);
  const corrupt = memoryStorage({ "devfest-campinas-2026:albums": "{isso não é json" });
  assert.equal(createAlbumsRepository({ baseUrl: "https://p", fetchFn: answer({ photos: [good("z")] }), storage: corrupt, schedule: clock.schedule }).lastGood("x"), null);
});

test("stale que o próprio intermediário avisou é repassado", async () => {
  const repository = createAlbumsRepository({ baseUrl: "https://p", fetchFn: answer({ title: "T", stale: true, photos: [good("a")] }), schedule: createFakeClock().schedule });
  assert.equal((await repository.get("x")).stale, true);
});
