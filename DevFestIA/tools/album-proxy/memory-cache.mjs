/** Cache em memória (servidor local e testes). No Worker o cache é o da Cloudflare (worker.mjs). Mesmo contrato: get(key) / set(key, value). */
export function createMemoryCache() {
  const store = new Map();
  return { get: async key => store.get(key) ?? null, set: async (key, value) => void store.set(key, value) };
}
