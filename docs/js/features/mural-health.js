/**
 * Saúde do mural: decide QUANDO recarregar a página. Ninguém opera o telão, então o próprio mural se vigia. Regras puras (dual: navegador e
 * Node, testadas em DevFestIA/tools/mural) e um vigia que roda num relógio INDEPENDENTE do rodízio.
 *
 *   evaluateHealth    foto da situação + config -> { action: "reload" | "none", reason, degraded }
 *   createReloadLedger  guarda no navegador as últimas recargas e a cena em que estava (volta pra ela depois de recarregar)
 *   createIndependentTicker  relógio num Worker (não é freado em aba oculta); sem Worker cai no setInterval
 *   createWatchdog    a cada batida chama evaluateHealth e, se for o caso, recarrega
 *
 * Motivos de recarga: "stuck" (o rodízio não bateu no prazo), "scene-failures" (cenas falhando em sequência), "preventive" (tempo de execução, pra
 * não acumular memória em 8 h), "version" (saiu versão nova), "offline-recovery" (a internet voltou depois de muito tempo fora). Os três últimos só
 * valem NA TROCA de cena (`atBoundary`), pra não cortar uma cena no meio. Trava anti-laço: recargas demais em pouco tempo = não recarrega,
 * marca `degraded` e o mural segue na cena de reserva.
 */
function evaluateHealth(snapshot, config) {
  const { now, startedAt, beatDueAt, atBoundary = false, failures = 0, pending = [] } = snapshot;
  const reasons = [];
  if (now > beatDueAt) reasons.push("stuck");
  if (failures >= config.maxConsecutiveFailures) reasons.push("scene-failures");
  if (atBoundary) {
    if (now - startedAt >= config.preventiveReloadMs) reasons.push("preventive");
    pending.forEach(reason => reasons.push(reason));
  }
  if (!reasons.length) return { action: "none", reason: null, degraded: false };

  const recent = (snapshot.recentReloads ?? []).filter(time => now - time < config.reloadStormWindowMs).length;
  if (recent >= config.reloadStormMax) return { action: "none", reason: "reload-storm", degraded: true };
  return { action: "reload", reason: reasons[0], degraded: false };
}

/** Memória do que aconteceu antes da recarga. `storage` é um sessionStorage (ou de mentira); sem ele (modo privado) guarda só em memória. */
function createReloadLedger({ storage, key = "devfest-campinas-2026:mural" } = {}) {
  let memory = { reloads: [], lastSceneId: null, lastReason: null };
  const read = () => {
    try {
      return { ...memory, ...JSON.parse(storage.getItem(key) ?? "{}") };
    } catch {
      return memory;
    }
  };
  const write = next => {
    memory = next;
    try {
      storage.setItem(key, JSON.stringify(next));
    } catch {
      /* sem persistência: vale só nesta página */
    }
  };
  return {
    recentReloads: () => read().reloads,
    lastSceneId: () => read().lastSceneId,
    lastReason: () => read().lastReason,
    saveScene: sceneId => write({ ...read(), lastSceneId: sceneId }),
    recordReload: (reason, now) => write({ ...read(), reloads: [...read().reloads.slice(-19), now], lastReason: reason }),
  };
}

const WORKER_SOURCE = "let id=null;onmessage=e=>{clearInterval(id);if(e.data>0)id=setInterval(()=>postMessage(0),e.data)}";

/**
 * Batida num Worker: timers de aba oculta ou em segundo plano são atrasados pelo navegador, os do Worker não. `win` (Worker, Blob, URL,
 * setInterval) e `createWorker` são injetáveis; se o Worker não existir ou falhar, cai no setInterval comum.
 */
function createIndependentTicker({ intervalMs, win = globalThis, createWorker = defaultWorkerFactory } = {}) {
  let stopTicking = () => {};
  return {
    start(onTick) {
      stopTicking();
      try {
        const worker = createWorker(win);
        worker.onmessage = () => onTick();
        worker.onerror = () => { worker.terminate?.(); stopTicking = fallback(win, intervalMs, onTick); };
        worker.postMessage(intervalMs);
        stopTicking = () => { worker.postMessage(0); worker.terminate?.(); };
      } catch {
        stopTicking = fallback(win, intervalMs, onTick);
      }
    },
    stop: () => stopTicking(),
  };
}

function fallback(win, intervalMs, onTick) {
  const id = win.setInterval(onTick, intervalMs);
  return () => win.clearInterval(id);
}

function defaultWorkerFactory(win) {
  const url = win.URL.createObjectURL(new win.Blob([WORKER_SOURCE], { type: "text/javascript" }));
  return new win.Worker(url);
}

/** O vigia: `snapshot()` devolve a foto atual; se a decisão for recarregar, grava no ledger e chama `reload(reason)`. */
function createWatchdog({ ticker, snapshot, config, ledger, reload, nowMs, onDecision = () => {} }) {
  let reloading = false;
  function check({ atBoundary = false } = {}) {
    if (reloading) return { action: "none", reason: null, degraded: false };
    const decision = evaluateHealth({ ...snapshot(), now: nowMs(), atBoundary, recentReloads: ledger.recentReloads() }, config);
    onDecision(decision);
    if (decision.action === "reload") {
      reloading = true;
      ledger.recordReload(decision.reason, nowMs());
      reload(decision.reason);
    }
    return decision;
  }
  return {
    check,
    start: () => ticker.start(() => check()),
    stop: () => ticker.stop(),
  };
}

if (typeof module !== "undefined") module.exports = { evaluateHealth, createReloadLedger, createIndependentTicker, createWatchdog };
