/**
 * Dispara o job "🎫 Sincronizar Sympla" do GitHub Actions (workflow_dispatch). O agendamento do próprio GitHub roda em média a cada 4 h, então o Worker faz isso a cada 5 min (cron do Cloudflare)
 * e a pedido do site (`POST /sync`, quando alguém acabou de comprar o ingresso e quer liberar o cartão). Puro e injetável: `fetchFn`, `token` (segredo SYNC_GITHUB_TOKEN, só permissão de Actions
 * neste repositório), `repo`, `workflow`, `ref`, `now` e `store` ({ get, set } do horário do último disparo; na Cloudflare o cache da borda, entre instâncias do Worker). Espera mínima entre
 * disparos (`cooldownMs`, padrão 2 min); o job tem `concurrency` no workflow, então dois disparos juntos nunca rodam em paralelo.
 * `trigger({ force })` devolve { status: "started" | "cooldown" | "disabled" | "error", retryInMs?, httpStatus? }. `force` (o cron) ignora a espera.
 */
export function createSyncTrigger({ fetchFn, token = "", repo, workflow, ref = "main", now = () => Date.now(), cooldownMs = 120000, store = createMemoryStore() }) {
  return {
    async trigger({ force = false } = {}) {
      if (!token) return { status: "disabled" };
      const time = now();
      const last = (await store.get("last")) ?? -Infinity;
      if (!force && time - last < cooldownMs) return { status: "cooldown", retryInMs: cooldownMs - (time - last) };
      await store.set("last", time);
      try {
        const response = await fetchFn(`https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches`, {
          method: "POST",
          headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28", "user-agent": "devfest-sync-trigger", "content-type": "application/json" },
          body: JSON.stringify({ ref }),
        });
        return response.status === 204 ? { status: "started" } : { status: "error", httpStatus: response.status };
      } catch {
        return { status: "error" };
      }
    },
  };
}

/** Guarda o horário do último disparo em memória (testes e servidor local). */
export function createMemoryStore() {
  const values = new Map();
  return { get: async key => values.get(key) ?? null, set: async (key, value) => void values.set(key, value) };
}
