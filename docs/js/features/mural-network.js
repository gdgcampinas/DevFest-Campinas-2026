/**
 * Rede do mural. O evento "online" do navegador MENTE (Wi-Fi conectado sem internet também é "online"), então o estado vem de uma SONDA de
 * verdade, repetida de tempos em tempos, com espera crescente enquanto está fora (features/backoff.js).
 *   createNetworkMonitor   estado { online, offlineSince, lastOutageMs }, aviso só nas mudanças
 *   createFetchProbe       sonda padrão: pede um endereço minúsculo de fora do site (o service worker só trata a mesma origem, então
 *                          nunca devolve resposta guardada) com tempo limite
 * Tudo injetável: `probe()` (promise<boolean>), `schedule`, `nowMs`, `win` (eventos online/offline). Dual (navegador e Node).
 */
function createNetworkMonitor({ win, probe, nowMs, schedule, config, onChange = () => {} }) {
  let online = true;
  let offlineSince = null;
  let lastOutageMs = 0;
  let attempt = 0;
  let cancelNext = () => {};
  let stopped = false;

  const state = () => ({ online, offlineSince, lastOutageMs });

  function setOnline(next) {
    if (next === online) return;
    online = next;
    if (next) {
      lastOutageMs = nowMs() - offlineSince;
      offlineSince = null;
      attempt = 0;
    } else {
      offlineSince = nowMs();
    }
    onChange(state());
  }

  async function check() {
    cancelNext();
    let ok = false;
    try {
      ok = Boolean(await probe());
    } catch {
      ok = false;
    }
    if (stopped) return;
    setOnline(ok);
    cancelNext = schedule(check, ok ? config.probeEveryMs : backoffDelay(attempt++, config.backoff));
  }

  const onBrowserOffline = () => setOnline(false);
  const onBrowserOnline = () => check(); // o navegador diz que voltou: confere de verdade

  return {
    state,
    start() {
      win.addEventListener("offline", onBrowserOffline);
      win.addEventListener("online", onBrowserOnline);
      return check();
    },
    /** Confere agora (ex.: uma escuta do banco caiu e queremos saber se foi a internet). */
    check,
    stop() {
      stopped = true;
      cancelNext();
      win.removeEventListener("offline", onBrowserOffline);
      win.removeEventListener("online", onBrowserOnline);
    },
  };
}

/** Sonda por `fetch` sem CORS: só interessa se a conexão fecha dentro do prazo. */
function createFetchProbe({ fetchFn = globalThis.fetch?.bind(globalThis), url, timeoutMs, schedule, makeController = () => new AbortController() }) {
  return async () => {
    const controller = makeController();
    const cancel = schedule(() => controller.abort(), timeoutMs);
    try {
      await fetchFn(`${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`, { mode: "no-cors", cache: "no-store", signal: controller.signal });
      return true;
    } catch {
      return false;
    } finally {
      cancel();
    }
  };
}

if (typeof module !== "undefined") {
  // no Node, `backoffDelay` não é global: o teste injeta pelo `globalThis`
  module.exports = { createNetworkMonitor, createFetchProbe };
}
