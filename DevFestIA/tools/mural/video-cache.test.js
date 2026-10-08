/**
 * Cache dos vídeos do mural (docs/js/features/video-cache.js): baixa antes, um de cada vez, guarda no Cache Storage, entrega endereço local e tenta de novo depois de uma falha.
 *   node --test DevFestIA/tools/mural/video-cache.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./load.js");
const { createVideoCache } = load("features/video-cache.js");

const A = "https://proxy.test/media/a.mp4";
const B = "https://proxy.test/media/b.mp4";

function setup({ failing = new Set(), stored = {}, noStorage = false } = {}) {
  let time = 1000;
  const calls = [];
  let active = 0;
  let peak = 0;
  const store = new Map(Object.entries(stored).map(([url, body]) => [url, body]));
  const makeResponse = (body, ok = true) => ({ ok, status: ok ? 200 : 503, clone() { return makeResponse(body, ok); }, blob: async () => ({ body }) });
  const cacheStorage = noStorage ? null : {
    open: async () => ({
      match: async url => (store.has(url) ? makeResponse(store.get(url)) : undefined),
      put: async (url, response) => { store.set(url, (await response.blob()).body); },
      keys: async () => [...store.keys()].map(url => ({ url })),
      delete: async request => store.delete(request.url),
    }),
  };
  const fetchFn = async url => {
    calls.push(url);
    active++;
    peak = Math.max(peak, active);
    await new Promise(resolve => setImmediate(resolve));
    active--;
    return failing.has(url) ? makeResponse("", false) : makeResponse(`bytes-de-${url}`);
  };
  const urlApi = { createObjectURL: blob => `blob:${blob.body}` };
  const cache = createVideoCache({ cacheStorage, fetchFn, urlApi, nowMs: () => time, retryMs: 30000 });
  return { cache, calls, store, peak: () => peak, advance: ms => { time += ms; } };
}

test("pede -> null na hora e começa a baixar; quando pronto devolve o endereço local; pedir de novo não rebaixa", async () => {
  const { cache, calls } = setup();
  assert.equal(cache.request(A), null, "ainda não está pronto: a cena não entra");
  await cache.idle();
  assert.equal(cache.request(A), `blob:bytes-de-${A}`);
  cache.request(A);
  assert.equal(calls.length, 1);
  assert.deepEqual(cache.statuses(), { [A]: "ready" });
});

test("a lista é baixada em fila, um clipe de cada vez (não afoga o Wi-Fi do evento)", async () => {
  const { cache, peak } = setup();
  cache.warm([A, B]);
  await cache.idle();
  assert.equal(cache.request(A) !== null && cache.request(B) !== null, true);
  assert.equal(peak(), 1);
});

test("o que já está no Cache Storage não baixa de novo (recarga do mural); o que saiu da lista é apagado do cache", async () => {
  const { cache, calls, store } = setup({ stored: { [A]: "guardado", "https://proxy.test/media/velho.mp4": "x" } });
  cache.warm([A]);
  await cache.idle();
  assert.equal(cache.request(A), "blob:guardado");
  assert.equal(calls.length, 0, "veio do cache, sem rede");
  assert.deepEqual([...store.keys()], [A], "o clipe que saiu da lista foi apagado");
});

test("falha: não entra, espera o prazo e tenta de novo; sem Cache Storage segue só em memória", async () => {
  const failing = new Set([A]);
  const { cache, calls, advance } = setup({ failing, noStorage: true });
  assert.equal(cache.request(A), null);
  await cache.idle();
  assert.deepEqual(cache.statuses(), { [A]: "failed" });
  cache.request(A);
  await cache.idle();
  assert.equal(calls.length, 1, "dentro do prazo não insiste");
  failing.delete(A);
  advance(31000);
  cache.request(A);
  await cache.idle();
  assert.equal(cache.request(A), `blob:bytes-de-${A}`, "passou o prazo e a rede voltou: ficou pronto");
  assert.equal(calls.length, 2);
});
