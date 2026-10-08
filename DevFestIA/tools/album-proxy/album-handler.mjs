/**
 * Camada HTTP do intermediário, independente de onde roda (Cloudflare Worker, servidor local, função de outro provedor): recebe um `Request` padrão e devolve um `Response` padrão.
 *   GET /albums        -> { albums: ["id", ...] }          (só os ids, nunca os links)
 *   GET /albums/<id>   -> { id, title, fetchedAt, count, photos: [...], stale? }
 * CORS só pros endereços de `allowedOrigins` (o mural e o ambiente local). `Cache-Control` curto: o navegador e a borda guardam por alguns segundos.
 */
const json = (body, status, headers) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", ...headers } });

export function createAlbumHandler({ service, allowedOrigins, maxAgeSeconds = 15 }) {
  const allowed = new Set(allowedOrigins);
  const corsHeaders = request => {
    const origin = request.headers.get("origin");
    return origin && allowed.has(origin) ? { "access-control-allow-origin": origin, vary: "Origin" } : { vary: "Origin" };
  };

  return async function handle(request) {
    const cors = corsHeaders(request);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...cors, "access-control-allow-methods": "GET, OPTIONS", "access-control-max-age": "600" } });
    if (request.method !== "GET") return json({ error: "método não permitido" }, 405, cors);
    const path = new URL(request.url).pathname.replace(/\/+$/, "");
    if (path === "/albums") return json({ albums: service.ids() }, 200, { ...cors, "cache-control": `public, max-age=${maxAgeSeconds}` });
    const match = /^\/albums\/([A-Za-z0-9_-]{1,64})$/.exec(path);
    if (!match) return json({ error: "não encontrado" }, 404, cors);
    try {
      return json(await service.getAlbum(match[1]), 200, { ...cors, "cache-control": `public, max-age=${maxAgeSeconds}` });
    } catch (error) {
      return json({ error: error.message }, error.status ?? 500, cors);
    }
  };
}
