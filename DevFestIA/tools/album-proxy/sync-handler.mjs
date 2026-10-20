/**
 * Camada HTTP do disparo do sync (independente do provedor): `POST /sync` pede ao GitHub pra rodar o job agora (com espera mínima entre pedidos, ver sync-trigger.mjs).
 *   202 { status: "started" }  disparou  |  429 { status: "cooldown", retryInMs }  rodou há pouco  |  503 { status: "disabled" }  sem token configurado  |  502 { status: "error" }  o GitHub recusou
 * Nunca devolve o token nem a resposta do GitHub. CORS só pros endereços de `allowedOrigins` (o site). Qualquer método que não seja POST/OPTIONS recebe 405.
 */
const STATUS = { started: 202, cooldown: 429, disabled: 503, error: 502 };
const json = (body, status, headers) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } });

export function createSyncHandler({ trigger, allowedOrigins }) {
  const allowed = new Set(allowedOrigins);
  return async function handle(request) {
    const origin = request.headers.get("origin");
    const cors = origin && allowed.has(origin) ? { "access-control-allow-origin": origin, vary: "Origin" } : { vary: "Origin" };
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...cors, "access-control-allow-methods": "POST, OPTIONS", "access-control-max-age": "600" } });
    if (request.method !== "POST") return json({ error: "método não permitido" }, 405, cors);
    const result = await trigger.trigger();
    return json({ status: result.status, ...(result.retryInMs ? { retryInMs: result.retryInMs } : {}) }, STATUS[result.status] ?? 500, cors);
  };
}
