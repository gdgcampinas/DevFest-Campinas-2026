/**
 * Cache dos VÍDEOS do mural (clipes de alguns MB). O telão não pode engasgar nem depender do Wi-Fi do evento no meio de uma cena, então o clipe é baixado ANTES, um de cada vez, guardado no
 * Cache Storage do navegador (sobrevive à recarga do mural: a recarga preventiva de 2 em 2 horas não rebaixa tudo) e entregue à cena como endereço local (`blob:`). A cena só entra quando o
 * clipe já está pronto; enquanto não estiver, ela não aparece (o rodízio segue sem ela) e o download continua tentando.
 *   request(url)   devolve o endereço local se o clipe já está pronto; senão devolve null e (re)começa o download (falha: espera `retryMs` antes de tentar de novo)
 *   warm(urls)     baixa a lista em fila (um de cada vez) e apaga do cache os clipes que saíram da lista
 *   statuses()     { [url]: "loading" | "ready" | "failed" } (painel de diagnóstico)
 * Tudo injetado: `cacheStorage` (caches; null = só memória), `fetchFn`, `urlApi` ({ createObjectURL }), `cacheName`, `nowMs`, `retryMs`. Dual (navegador e Node).
 */
function createVideoCache({ cacheStorage = null, fetchFn, urlApi, cacheName = "mural-video", nowMs = () => Date.now(), retryMs = 30000 }) {
  const entries = new Map(); // url -> { status, objectUrl, retryAt }
  let chain = Promise.resolve();

  async function download(url) {
    const cache = cacheStorage ? await cacheStorage.open(cacheName).catch(() => null) : null;
    let response = cache ? await cache.match(url).catch(() => undefined) : undefined;
    if (!response) {
      response = await fetchFn(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await cache?.put(url, response.clone()).catch(() => {}); // sem espaço no cache: segue só com a cópia em memória
    }
    return urlApi.createObjectURL(await response.blob());
  }

  function load(url) {
    entries.set(url, { status: "loading", objectUrl: null, retryAt: 0 });
    chain = chain.then(async () => {
      try {
        entries.set(url, { status: "ready", objectUrl: await download(url), retryAt: 0 });
      } catch {
        entries.set(url, { status: "failed", objectUrl: null, retryAt: nowMs() + retryMs });
      }
    });
  }

  return {
    request(url) {
      const entry = entries.get(url);
      if (!entry || (entry.status === "failed" && nowMs() >= entry.retryAt)) load(url);
      return entry?.status === "ready" ? entry.objectUrl : null;
    },
    warm(urls) {
      urls.forEach(url => this.request(url));
      if (cacheStorage) {
        chain = chain.then(async () => {
          const cache = await cacheStorage.open(cacheName).catch(() => null);
          const stored = (await cache?.keys().catch(() => [])) ?? [];
          await Promise.all(stored.filter(request => !urls.includes(request.url)).map(request => cache.delete(request).catch(() => {})));
        });
      }
    },
    statuses: () => Object.fromEntries([...entries].map(([url, entry]) => [url, entry.status])),
    idle: () => chain, // só pro teste esperar a fila esvaziar
  };
}

if (typeof module !== "undefined") module.exports = { createVideoCache };
