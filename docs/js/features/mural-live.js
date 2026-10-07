/**
 * Dados AO VIVO do mural (inscritos, pódio do Coding Jam, no futuro foto e aviso). Todo dado ao vivo entra por UM contrato:
 *   open(onData, onError) -> stop        (ou uma promise de stop, quando abrir exige login)
 * e passa por `createResilientListener`, que cuida sozinho de: erro (reabre com espera crescente), silêncio longo (reabre) e queda de
 * internet (o mural manda `reconnect()` quando a rede volta). O mural segue com o último dado que tem enquanto isso. Dual (navegador e Node).
 * `createLiveHub` junta as fontes, guarda o último valor de cada uma e avisa quem ouvir. Tudo injetável: `schedule`, `nowMs`, backoff.
 */
function createResilientListener({ open, onData, onStatus = () => {}, schedule, nowMs, backoff, silenceMs = 0 }) {
  let generation = 0;
  let attempt = 0;
  let stopCurrent = () => {};
  let cancelRetry = () => {};
  let cancelSilence = () => {};
  let stopped = false;

  function armSilence(mine) {
    cancelSilence();
    if (!silenceMs) return;
    cancelSilence = schedule(() => { if (mine === generation) fail(mine, new Error("fonte muda")); }, silenceMs);
  }

  function fail(mine, error) {
    if (stopped || mine !== generation) return;
    generation++; // callbacks atrasados da escuta antiga passam a ser ignorados
    stopCurrent();
    stopCurrent = () => {};
    cancelSilence();
    onStatus({ state: "retrying", error, attempt });
    cancelRetry = schedule(openNow, backoffDelay(attempt++, backoff));
  }

  function openNow() {
    if (stopped) return;
    cancelRetry();
    const mine = ++generation;
    const receive = value => {
      if (mine !== generation || stopped) return;
      attempt = 0;
      armSilence(mine);
      onStatus({ state: "live", at: nowMs() });
      onData(value);
    };
    try {
      Promise.resolve(open(receive, error => fail(mine, error))).then(
        stop => { if (mine === generation && !stopped) stopCurrent = stop ?? (() => {}); else stop?.(); },
        error => fail(mine, error)
      );
    } catch (error) {
      fail(mine, error);
    }
    armSilence(mine);
  }

  return {
    start: openNow,
    /** Reabre agora (a internet voltou): zera a espera. */
    reconnect() {
      if (stopped) return;
      generation++;
      stopCurrent();
      stopCurrent = () => {};
      attempt = 0;
      openNow();
    },
    stop() {
      stopped = true;
      generation++;
      stopCurrent();
      cancelRetry();
      cancelSilence();
    },
  };
}

/** `sources`: [{ id, enabled, open, silenceMs }]. Guarda o último valor de cada fonte e chama `onUpdate(id, value, previous)` a cada mudança. */
function createLiveHub({ sources, schedule, nowMs, backoff, onUpdate = () => {}, onStatus = () => {} }) {
  const values = new Map();
  const statuses = new Map();
  const listeners = [];

  return {
    start() {
      sources.filter(source => source.enabled !== false).forEach(source => {
        const listener = createResilientListener({
          open: source.open,
          silenceMs: source.silenceMs,
          schedule, nowMs, backoff,
          onData: value => {
            const previous = values.get(source.id);
            values.set(source.id, value);
            onUpdate(source.id, value, previous);
          },
          onStatus: status => { statuses.set(source.id, status); onStatus(source.id, status); },
        });
        listeners.push(listener);
        listener.start();
      });
    },
    reconnectAll: () => listeners.forEach(listener => listener.reconnect()),
    stop: () => listeners.forEach(listener => listener.stop()),
    get: id => values.get(id),
    status: id => statuses.get(id) ?? null,
    statuses: () => Object.fromEntries(statuses),
  };
}

if (typeof module !== "undefined") module.exports = { createResilientListener, createLiveHub };
