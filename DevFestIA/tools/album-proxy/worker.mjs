/**
 * Adaptador do Cloudflare Worker (raiz de composição do intermediário na nuvem). Só liga as peças: o segredo `ALBUMS` (JSON { id: link | { url, live } }) vira o registro,
 * o cache da Cloudflare guarda cada álbum pelo tempo do caso de uso, e o handler responde. Variáveis: `ALBUMS` (segredo) e `ALLOWED_ORIGINS` (lista separada por vírgula, opcional).
 */
import { parseAlbumPage } from "./parse-album.mjs";
import { createGooglePhotosRepository } from "./google-photos-repository.mjs";
import { createAlbumService } from "./album-service.mjs";
import { createAlbumHandler } from "./album-handler.mjs";

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

export default {
  async fetch(request, env) {
    const service = createAlbumService({
      registry: JSON.parse(env.ALBUMS ?? "{}"),
      repository: createGooglePhotosRepository(),
      cache: createWorkerCache(caches.default),
      parse: parseAlbumPage,
    });
    const allowedOrigins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(",").map(origin => origin.trim()) : DEFAULT_ORIGINS;
    return createAlbumHandler({ service, allowedOrigins })(request);
  },
};
