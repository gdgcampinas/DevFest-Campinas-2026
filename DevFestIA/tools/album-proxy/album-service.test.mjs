/**
 * Caso de uso do intermediário (album-service.mjs) e camada HTTP (album-handler.mjs): cache, busca compartilhada, lista antiga quando a busca falha, CORS e rotas.
 *   node --test DevFestIA/tools/album-proxy/*.test.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createAlbumService, AlbumError } from "./album-service.mjs";
import { createAlbumHandler } from "./album-handler.mjs";
import { createMemoryCache } from "./memory-cache.mjs";
import { createGooglePhotosRepository } from "./google-photos-repository.mjs";
import { createWorkerCache, withEdgeCache } from "./worker.mjs";
import { createMediaService, releaseSource } from "./media-service.mjs";
import { parseAlbumPage } from "./parse-album.mjs";
import { albumPage } from "./album-fixture.mjs";

const LIVE = "https://photos.app.goo.gl/ao-vivo";
const OLD = "https://photos.app.goo.gl/antigo";
const page = ids => albumPage({ items: ids.map((id, index) => ({ id, addedAt: 1000 + index })) });

function setup({ pages = {}, ttl, staleMaxMs } = {}) {
  let time = 1_000_000;
  const calls = [];
  const state = { pages: { [LIVE]: page(["AF1QipA"]), [OLD]: page(["AF1QipX", "AF1QipY"]), ...pages }, failing: new Set() };
  const repository = { fetchAlbumPage: async url => { calls.push(url); if (state.failing.has(url)) throw new Error("Google fora do ar"); return state.pages[url]; } };
  const service = createAlbumService({ registry: { "ao-vivo": { url: LIVE, live: true }, antigo: OLD }, repository, cache: createMemoryCache(), now: () => time, parse: parseAlbumPage, ttl, staleMaxMs });
  return { service, calls, state, advance: ms => (time += ms) };
}

test("busca, lê e devolve; o link do álbum não aparece na resposta", async () => {
  const { service } = setup();
  const album = await service.getAlbum("ao-vivo");
  assert.equal(album.count, 1);
  assert.equal(album.photos[0].id, "AF1QipA");
  assert.ok(!JSON.stringify(album).includes("photos.app.goo.gl"));
});

test("cache: o álbum ao vivo vale 45 s e os demais 10 min; depois disso busca de novo", async () => {
  const { service, calls, advance } = setup();
  await service.getAlbum("ao-vivo");
  await service.getAlbum("ao-vivo");
  assert.equal(calls.length, 1);
  advance(44_000);
  await service.getAlbum("ao-vivo");
  assert.equal(calls.length, 1);
  advance(2_000);
  await service.getAlbum("ao-vivo");
  assert.equal(calls.length, 2, "passou de 45 s");
  await service.getAlbum("antigo");
  advance(300_000);
  await service.getAlbum("antigo");
  assert.equal(calls.length, 3, "o antigo ainda vale aos 5 min");
  advance(400_000);
  await service.getAlbum("antigo");
  assert.equal(calls.length, 4);
});

test("pedidos ao mesmo tempo do mesmo álbum compartilham UMA busca ao Google", async () => {
  const { service, calls } = setup();
  const results = await Promise.all(Array.from({ length: 20 }, () => service.getAlbum("ao-vivo")));
  assert.equal(calls.length, 1);
  assert.ok(results.every(album => album.count === 1));
});

test("foto nova no álbum aparece depois que o cache vence", async () => {
  const { service, state, advance } = setup();
  assert.equal((await service.getAlbum("ao-vivo")).count, 1);
  state.pages[LIVE] = page(["AF1QipA", "AF1QipB", "AF1QipC"]);
  advance(46_000);
  const album = await service.getAlbum("ao-vivo");
  assert.deepEqual(album.photos.map(photo => photo.id), ["AF1QipC", "AF1QipB", "AF1QipA"]);
});

test("Google fora do ar: devolve a última lista boa marcada stale; sem lista antiga é erro 502", async () => {
  const { service, state, advance } = setup();
  await service.getAlbum("ao-vivo");
  state.failing.add(LIVE);
  advance(60_000);
  const stale = await service.getAlbum("ao-vivo");
  assert.equal(stale.stale, true);
  assert.equal(stale.count, 1);
  const fresh = setup();
  fresh.state.failing.add(OLD);
  await assert.rejects(fresh.service.getAlbum("antigo"), error => error instanceof AlbumError && error.status === 502);
});

test("página que o Google mudou (sem fotos) também cai na lista antiga em vez de apagar tudo", async () => {
  const { service, state, advance } = setup();
  await service.getAlbum("ao-vivo");
  state.pages[LIVE] = `<html>${" ".repeat(3000)}formato novo</html>`;
  advance(60_000);
  const album = await service.getAlbum("ao-vivo");
  assert.equal(album.stale, true);
  assert.equal(album.count, 1);
});

test("lista antiga muito velha (passou de staleMaxMs) não é mais devolvida", async () => {
  const { service, state, advance } = setup({ staleMaxMs: 3_600_000 });
  await service.getAlbum("ao-vivo");
  state.failing.add(LIVE);
  advance(4_000_000);
  await assert.rejects(service.getAlbum("ao-vivo"), error => error.status === 502);
});

test("álbum desconhecido: 404; e ids como __proto__ não vazam nada do objeto", async () => {
  const { service } = setup();
  await assert.rejects(service.getAlbum("nao-existe"), error => error.status === 404);
  await assert.rejects(service.getAlbum("__proto__"), error => error.status === 404);
  await assert.rejects(service.getAlbum("constructor"), error => error.status === 404);
  assert.deepEqual(service.ids(), ["ao-vivo", "antigo"]);
});

test("repository: o link curto vira o endereço longo (redirecionamento com agente simples) e a página sai com o agente de navegador", async () => {
  const seen = [];
  const fetchFn = async (url, options) => {
    seen.push({ url, agent: options.headers["user-agent"], redirect: options.redirect });
    if (url.startsWith("https://photos.app.goo.gl/")) return { status: 302, headers: new Headers({ location: "https://photos.google.com/share/AF1QipXYZ?key=abc" }) };
    return { ok: true, status: 200, text: async () => "html do álbum" };
  };
  const repository = createGooglePhotosRepository({ fetchFn });
  assert.equal(await repository.fetchAlbumPage("https://photos.app.goo.gl/abc"), "html do álbum");
  assert.deepEqual(seen.map(call => [call.url, call.redirect]), [["https://photos.app.goo.gl/abc", "manual"], ["https://photos.google.com/share/AF1QipXYZ?key=abc", "follow"]]);
  assert.equal(seen[0].agent, "Mozilla/5.0", "o link curto só redireciona com o agente simples");
  assert.match(seen[1].agent, /Chrome/);
});

test("repository: link já longo vai direto à página; link curto que não redireciona é erro claro", async () => {
  const urls = [];
  const direct = createGooglePhotosRepository({ fetchFn: async url => { urls.push(url); return { ok: true, text: async () => "html" }; } });
  await direct.fetchAlbumPage("https://photos.google.com/share/AF1QipXYZ?key=abc");
  assert.deepEqual(urls, ["https://photos.google.com/share/AF1QipXYZ?key=abc"]);
  const noRedirect = createGooglePhotosRepository({ fetchFn: async () => ({ status: 200, headers: new Headers() }) });
  await assert.rejects(noRedirect.fetchAlbumPage("https://photos.app.goo.gl/abc"), /não redirecionou \(200\)/);
});

test("repository: só busca endereços do Google Fotos (também no destino do redirecionamento) e avisa quando o Google responde erro", async () => {
  const repository = createGooglePhotosRepository({ fetchFn: async () => ({ ok: true, text: async () => "html" }) });
  await assert.rejects(repository.fetchAlbumPage("https://exemplo.com/x"), /fora do Google Fotos/);
  await assert.rejects(repository.fetchAlbumPage("http://photos.app.goo.gl/abc"), /fora do Google Fotos/);
  const hijacked = createGooglePhotosRepository({ fetchFn: async () => ({ status: 302, headers: new Headers({ location: "https://malicioso.com/x" }) }) });
  await assert.rejects(hijacked.fetchAlbumPage("https://photos.app.goo.gl/abc"), /fora do Google Fotos/);
  const failing = createGooglePhotosRepository({ fetchFn: async () => ({ ok: false, status: 429 }) });
  await assert.rejects(failing.fetchAlbumPage("https://photos.google.com/share/x?key=y"), /429/);
});

const ORIGIN = "https://gdgcampinas.github.io";
const handlerFor = options => createAlbumHandler({ service: setup(options).service, allowedOrigins: [ORIGIN, "http://localhost:8080"] });
const get = (handler, path, origin) => handler(new Request(`https://proxy.test${path}`, { headers: origin ? { origin } : {} }));

test("HTTP: lista os ids, devolve o álbum em JSON e libera só os endereços permitidos (CORS)", async () => {
  const handler = handlerFor();
  const list = await get(handler, "/albums", ORIGIN);
  assert.deepEqual(await list.json(), { albums: ["ao-vivo", "antigo"] });
  assert.equal(list.headers.get("access-control-allow-origin"), ORIGIN);
  const album = await get(handler, "/albums/ao-vivo", "http://localhost:8080");
  assert.equal(album.status, 200);
  assert.equal(album.headers.get("access-control-allow-origin"), "http://localhost:8080");
  assert.match(album.headers.get("cache-control"), /max-age=15/);
  assert.equal((await album.json()).photos.length, 1);
  const stranger = await get(handler, "/albums/ao-vivo", "https://outro-site.com");
  assert.equal(stranger.headers.get("access-control-allow-origin"), null, "outro site não recebe a liberação");
  assert.equal(stranger.status, 200);
});

test("HTTP: preflight, método errado, rota desconhecida e id desconhecido", async () => {
  const handler = handlerFor();
  const preflight = await handler(new Request("https://proxy.test/albums/ao-vivo", { method: "OPTIONS", headers: { origin: ORIGIN } }));
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-origin"), ORIGIN);
  assert.equal((await handler(new Request("https://proxy.test/albums", { method: "POST" }))).status, 405);
  assert.equal((await get(handler, "/outra-coisa")).status, 404);
  assert.equal((await get(handler, "/albums/nao-existe")).status, 404);
  assert.equal((await get(handler, "/albums/../segredo")).status, 404);
  assert.equal((await get(handler, "/albums/ao-vivo/")).status, 200, "barra no fim é aceita");
});

test("HTTP: /join leva ao convite do álbum colaborativo (ao vivo) e NUNCA devolve o link de um álbum de evento passado", async () => {
  const handler = handlerFor();
  const join = await get(handler, "/join/ao-vivo");
  assert.equal(join.status, 302);
  assert.equal(join.headers.get("location"), LIVE);
  assert.equal(join.headers.get("cache-control"), "no-store");
  const old = await get(handler, "/join/antigo");
  assert.equal(old.status, 404, "álbum que não é colaborativo não tem convite");
  assert.equal(old.headers.get("location"), null);
  assert.ok(!JSON.stringify(await old.json()).includes("photos.app.goo.gl"));
  assert.equal((await get(handler, "/join/nao-existe")).status, 404);
  assert.equal((await get(handler, "/join/__proto__")).status, 404);
  assert.equal((await handler(new Request("https://proxy.test/join/ao-vivo", { method: "POST" }))).status, 405);
});

test("HTTP: Google fora do ar sem lista antiga vira 502 em JSON, sem expor o link", async () => {
  const options = { };
  const built = setup(options);
  built.state.failing.add(OLD);
  const handler = createAlbumHandler({ service: built.service, allowedOrigins: [ORIGIN] });
  const response = await get(handler, "/albums/antigo", ORIGIN);
  assert.equal(response.status, 502);
  const body = await response.json();
  assert.match(body.error, /não consegui ler o álbum antigo/);
  assert.ok(!JSON.stringify(body).includes("photos.app.goo.gl"));
});

test("cache do Worker: guarda e devolve pelo contrato get/set da Cloudflare", async () => {
  const store = new Map();
  const cacheStorage = { match: async request => (store.has(request.url) ? new Response(store.get(request.url)) : undefined), put: async (request, response) => void store.set(request.url, await response.text()) };
  const cache = createWorkerCache(cacheStorage);
  assert.equal(await cache.get("ao-vivo"), null);
  await cache.set("ao-vivo", { id: "ao-vivo", count: 3 });
  assert.deepEqual(await cache.get("ao-vivo"), { id: "ao-vivo", count: 3 });
});

// ---------- /media: clipes de vídeo do mural ----------
const bytes = new Uint8Array([0, 0, 0, 24, 102, 116, 121, 112]);
function mediaHandler({ files = { "devfest-2025-abertura.mp4": bytes }, failing = false } = {}) {
  const requested = [];
  const media = createMediaService({ source: releaseSource({ baseUrl: "https://github.test/releases/download/v1/", fetchFn: async (url, options) => {
    requested.push([url, options.redirect]);
    if (failing) throw new Error("rede");
    const name = url.split("/").pop();
    return files[name] ? new Response(files[name], { status: 200, headers: { "content-length": String(files[name].length), "content-type": "application/octet-stream" } }) : new Response("nada", { status: 404 });
  } }) });
  return { handler: createAlbumHandler({ service: setup().service, media, allowedOrigins: [ORIGIN] }), requested };
}

test("HTTP /media: entrega o clipe com tipo de vídeo, cache longo e CORS só pros endereços permitidos (o GitHub não manda CORS, por isso o intermediário)", async () => {
  const { handler, requested } = mediaHandler();
  const response = await get(handler, "/media/devfest-2025-abertura.mp4", ORIGIN);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "video/mp4", "o tipo certo, não o octet-stream do GitHub");
  assert.match(response.headers.get("cache-control"), /max-age=86400/);
  assert.equal(response.headers.get("content-length"), String(bytes.length));
  assert.equal(response.headers.get("access-control-allow-origin"), ORIGIN);
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [...bytes]);
  assert.deepEqual(requested, [["https://github.test/releases/download/v1/devfest-2025-abertura.mp4", "follow"]]);
  assert.equal((await get(handler, "/media/devfest-2025-abertura.mp4", "https://outro-site.com")).headers.get("access-control-allow-origin"), null);
});

test("HTTP /media: só nomes .mp4 simples (nada de caminho nem '..'); arquivo que não existe é 404; GitHub fora do ar é 502; sem fonte configurada os vídeos estão desligados", async () => {
  const { handler, requested } = mediaHandler();
  for (const path of ["/media/..%2F..%2Fsegredo.mp4", "/media/Abertura.mp4", "/media/clipe.mov", "/media/.mp4", "/media/a/b.mp4", "/media/__proto__"]) {
    assert.equal((await get(handler, path)).status, 404, path);
  }
  assert.equal(requested.length, 0, "nome inválido nem chega ao GitHub");
  assert.equal((await get(handler, "/media/nao-existe.mp4")).status, 404);
  assert.equal((await get(mediaHandler({ failing: true }).handler, "/media/devfest-2025-abertura.mp4")).status, 502);
  const off = createAlbumHandler({ service: setup().service, media: createMediaService({ source: releaseSource({ baseUrl: "" }) }), allowedOrigins: [ORIGIN] });
  assert.equal((await get(off, "/media/devfest-2025-abertura.mp4")).status, 404);
  const none = createAlbumHandler({ service: setup().service, allowedOrigins: [ORIGIN] });
  assert.equal((await get(none, "/media/devfest-2025-abertura.mp4")).status, 404, "handler sem media também não quebra");
  assert.equal((await handler(new Request("https://proxy.test/media/devfest-2025-abertura.mp4", { method: "POST" }))).status, 405);
});

test("cache da borda: o GitHub é consultado uma vez e os pedidos seguintes saem do cache", async () => {
  let upstream = 0;
  const store = new Map();
  const cacheStorage = { match: async key => store.get(key.url)?.clone(), put: async (key, response) => { store.set(key.url, response); } };
  const media = withEdgeCache({ get: async () => { upstream++; return new Response("corpo", { headers: { "content-length": "5" } }); } }, cacheStorage);
  assert.equal(await (await media.get("a.mp4")).text(), "corpo");
  assert.equal(await (await media.get("a.mp4")).text(), "corpo");
  assert.equal(upstream, 1);
});
