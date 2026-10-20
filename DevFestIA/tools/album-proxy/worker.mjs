/**
 * Adaptador do Cloudflare Worker (raiz de composição do intermediário na nuvem). Só liga as peças: o segredo `ALBUMS` (JSON { id: link | { url, live } }) vira o registro,
 * o cache da Cloudflare guarda cada álbum pelo tempo do caso de uso, e o handler responde. `POST /sync` e o agendamento (cron de wrangler.toml) disparam o job do Sympla no GitHub (sync-trigger.mjs; segredo `SYNC_GITHUB_TOKEN`, variáveis `SYNC_REPO` e `SYNC_WORKFLOW`). Variáveis: `ALBUMS` (segredo), `MEDIA_BASE` (endereço da release com os clipes de vídeo, em wrangler.toml; vazio = vídeos desligados) e `ALLOWED_ORIGINS` (lista separada por vírgula, opcional).
 */
import { parseAlbumPage } from "./parse-album.mjs";
import { createGooglePhotosRepository } from "./google-photos-repository.mjs";
import { createAlbumService } from "./album-service.mjs";
import { createAlbumHandler } from "./album-handler.mjs";
import { createMediaService, releaseSource } from "./media-service.mjs";
import { createSyncTrigger } from "./sync-trigger.mjs";
import { createSyncHandler } from "./sync-handler.mjs";

const DEFAULT_ORIGINS = ["https://gdgcampinas.github.io", "http://localhost:8080", "http://127.0.0.1:8080"];
const cacheKey = id => new Request(`https://album-cache.invalid/${id}`);

/** Cache da Cloudflare (`caches.default`) no mesmo contrato get/set do resto. */
export function createWorkerCache(cacheStorage) {
  return {
    async get(id) {
      const hit = await cacheStorage.match(cacheKey(id));
      return hit ? hit.json() : null;
    },
    set: (id, value) => cacheStorage.put(cacheKey(id), new Response(JSON.stringify(value), { headers: { "cache-control": "max-age=21600" } })),
  };
}

/** Cache da borda pros clipes (chave = o endereço do pedido sem os cabeçalhos): o GitHub é consultado uma vez, não a cada mural. */
export function withEdgeCache(media, cacheStorage) {
  return {
    async get(name) {
      const key = new Request(`https://media-cache.invalid/${name}`);
      const hit = await cacheStorage.match(key);
      if (hit) return hit;
      const fresh = await media.get(name);
      await cacheStorage.put(key, fresh.clone());
      return fresh;
    },
  };
}

/** Guarda o horário do último disparo no cache da borda (vale entre instâncias do Worker). */
export function createWorkerStore(cacheStorage) {
  const key = name => new Request(`https://sync-store.invalid/${name}`);
  return {
    async get(name) {
      const hit = await cacheStorage.match(key(name));
      return hit ? Number(await hit.text()) : null;
    },
    set: (name, value) => cacheStorage.put(key(name), new Response(String(value), { headers: { "cache-control": "max-age=3600" } })),
  };
}

const syncTriggerOf = env => createSyncTrigger({ fetchFn: fetch, token: env.SYNC_GITHUB_TOKEN, repo: env.SYNC_REPO, workflow: env.SYNC_WORKFLOW, store: createWorkerStore(caches.default) });
const originsOf = env => (env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(",").map(origin => origin.trim()) : DEFAULT_ORIGINS);

export default {
  /** Agendamento (cron de wrangler.toml): dispara o sync do Sympla sem esperar. */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(syncTriggerOf(env).trigger({ force: true }));
  },
  async fetch(request, env) {
    if (new URL(request.url).pathname.replace(/\/+$/, "") === "/sync") return createSyncHandler({ trigger: syncTriggerOf(env), allowedOrigins: originsOf(env) })(request);
    const service = createAlbumService({
      registry: JSON.parse(env.ALBUMS ?? "{}"),
      repository: createGooglePhotosRepository(),
      cache: createWorkerCache(caches.default),
      parse: parseAlbumPage,
    });
    const allowedOrigins = originsOf(env);
    const media = withEdgeCache(createMediaService({ source: releaseSource({ baseUrl: env.MEDIA_BASE }) }), caches.default);
    return createAlbumHandler({ service, media, allowedOrigins })(request);
  },
};
