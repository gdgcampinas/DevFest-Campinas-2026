/**
 * Motor do MURAL do telão (mural.html): o rodízio de cenas que roda sozinho o dia inteiro, sem ninguém operando. Só orquestra; tudo que ele usa
 * vem por parâmetro (cenas como dado, tipos de cena num registro, relógio, agendador, contexto), então o teste injeta substitutos e anda o tempo.
 *
 * Contrato de um TIPO de cena (components/mural-scenes/*.js, registrado em pages/mural.js):
 *   prepare?(params, ctx) -> dado | MURAL_SKIP     carrega o que a cena precisa (foto, leitura); pode demorar, tem tempo limite; MURAL_SKIP = "sem nada pra
 *                                                  mostrar agora" (castigo curto, não conta como falha)
 *   render(prepared, params, ctx) -> { markup, mount?(el, deps) -> dispose? }   HTML da cena + comportamento opcional (relógio, QR, animação)
 *
 * O que faz o mural se corrigir sozinho (cada item tem teste em DevFestIA/tools/dom/mural-engine.dom.test.js):
 *   - cada cena roda num bloco protegido: erro no prepare, no render ou no mount (ou um erro solto da página enquanto ela está no ar)
 *     coloca a cena de castigo e o rodízio segue na hora pra próxima;
 *   - prepare que nunca termina estoura o tempo limite;
 *   - sem nenhuma cena disponível (ou todas falhando) entra a cena de RESERVA, que não depende de rede, e o HTML de emergência se até ela falhar;
 *   - o rodízio avisa o vigia (features/mural-health.js) do prazo da próxima troca; se o prazo estourar, é ele que recarrega a página;
 *   - voltando de uma recarga, retoma na cena em que estava (ledger).
 * Interrupções (`pushInterrupt`): uma cena com prioridade entra na frente da fila, uma vez (ex.: o pódio do Coding Jam recém-publicado).
 * Controle remoto (features/mural-control.js): `hold({ sceneId, untilMs, critical })` PARA o rodízio numa cena (fixar, pausar ou a emergência, que usa `emergencyScene`) até `untilMs` ou até `release()`;
 * com a cena parada o motor só renova o prazo do vigia (nada de redesenhar). Cena fixada que não tem nada pra mostrar (ou falha) é solta e o rodízio volta; a emergência (`critical`) nunca é solta
 * sozinha: se falhar, o HTML de emergência segura a tela e o motor tenta de novo.
 */
const MURAL_SKIP = Symbol("mural-skip");

function createMural({
  contentEl, scenes, registry, reserveScene, emergencyScene = null, emergencyMarkup = "", getContext, config,
  schedule = defaultSchedule, nowMs = () => Date.now(), ledger = null, sceneDeps = {},
  onBoundary = () => false, onSceneChange = () => {}, onFailure = () => {},
}) {
  const doc = contentEl.ownerDocument;
  let current = null; // { scene, startedAt, endsAt, reserve, errored }
  let cooldowns = {};
  let interrupts = [];
  let failures = 0;
  let shown = 0;
  let token = 0;
  let cancelTimer = () => {};
  let beatDueAt = Infinity;
  let startedAt = nowMs();
  let lastError = null;
  let stopped = false;
  let activeEl = null;
  let activeDispose = null;
  let lastSceneId = null;
  let held = null; // { sceneId, until, critical }: o rodízio está parado nessa cena

  const findScene = id => scenes.find(scene => scene.id === id) ?? (emergencyScene?.id === id ? emergencyScene : null);

  const later = ms => {
    cancelTimer();
    beatDueAt = nowMs() + ms + config.watchdogSlackMs;
    cancelTimer = schedule(run, ms);
  };

  function fail(scene, error) {
    lastError = `${scene.id}: ${error?.message ?? error}`;
    cooldowns = withCooldown(cooldowns, scene.id, nowMs(), config.failureCooldownMs);
    if (scene !== reserveScene) failures++;
    onFailure(scene, error);
  }

  function retire() {
    if (!activeEl) return;
    try {
      activeDispose?.();
    } catch (error) {
      lastError = `dispose: ${error?.message ?? error}`;
    }
    const leaving = activeEl;
    doc.querySelectorAll(".mural-scene.is-leaving").forEach(old => old.remove());
    leaving.classList.replace("is-active", "is-leaving");
    schedule(() => leaving.remove(), config.transitionMs);
    activeEl = null;
    activeDispose = null;
  }

  function show(scene, view, seconds) {
    const el = doc.createElement("div");
    el.className = "mural-scene is-active";
    el.dataset.scene = scene.id;
    el.dataset.type = scene.type;
    el.dataset.transition = scene.transition ?? config.motion?.defaultTransition ?? "rise"; // como a cena entra (css/mural.css)
    el.style.setProperty("--scene-ms", String(seconds * 1000)); // o CSS escala animações longas (zoom da foto) ao tempo de tela da cena
    el.innerHTML = view.markup;
    contentEl.appendChild(el);
    let dispose = null;
    try {
      const result = view.mount?.(el, sceneDeps);
      dispose = typeof result === "function" ? result : null; // só função vale como dispose (um mount que devolve outra coisa não derruba a troca)
    } catch (error) {
      el.remove();
      throw error;
    }
    retire();
    activeEl = el;
    activeDispose = dispose;
  }

  /** Último recurso: nem a reserva funcionou. HTML fixo, sem nada que possa falhar. */
  function showEmergency() {
    retire();
    contentEl.innerHTML = emergencyMarkup;
    activeEl = null;
  }

  async function showNext() {
    if (stopped) return;
    cancelTimer();
    if (onBoundary()) return; // a página vai recarregar
    if (held && (nowMs() >= held.until || !findScene(held.sceneId))) held = null;
    if (held && current?.scene.id === held.sceneId && !current.errored) return later(config.holdCheckMs); // já está no ar: só renova o prazo do vigia
    const mine = ++token;
    const ctx = getContext();
    const picked = held ? null : pickNextScene({ scenes, currentId: current?.scene.id ?? lastSceneId, interrupts, cooldowns, ctx, nowMs: nowMs() });
    const scene = held ? findScene(held.sceneId) : picked?.scene ?? reserveScene;
    if (picked?.interrupt) interrupts = pruneInterrupts(interrupts, nowMs(), picked.interrupt);
    const reserve = scene === reserveScene;
    if (reserve && picked === null && !held && current?.reserve && !current.errored) { // a reserva já está no ar e continua sendo a única opção: não redesenha, só olha de novo daqui a pouco
      return later(config.idleRetryMs ?? config.reserveSeconds * 1000);
    }
    const seconds = reserve ? config.reserveSeconds : scene.seconds ?? config.defaultSeconds;
    beatDueAt = nowMs() + config.prepareTimeoutMs + config.watchdogSlackMs;
    try {
      const impl = registry[scene.type];
      if (!impl) throw new Error(`tipo de cena não registrado: ${scene.type}`);
      const params = scene.params ?? {};
      const prepared = await withTimeout(impl.prepare?.(params, ctx), config.prepareTimeoutMs, schedule, "prepare demorou demais");
      if (mine !== token || stopped) return;
      if (prepared === MURAL_SKIP) {
        if (held) held = null; // cena fixada sem nada pra mostrar: solta e o rodízio volta
        cooldowns = withCooldown(cooldowns, scene.id, nowMs(), config.skipCooldownMs);
        lastSceneId = scene.id;
        return later(0);
      }
      show(scene, impl.render(prepared, params, ctx), seconds);
    } catch (error) {
      if (mine !== token || stopped) return;
      fail(scene, error);
      lastSceneId = scene.id;
      if (held?.critical) {
        showEmergency(); // a emergência nunca é solta sozinha: o HTML fixo segura a tela e tenta de novo
        return later(config.retryDelayMs);
      }
      if (held) held = null;
      if (reserve) {
        showEmergency();
        return later(config.reserveSeconds * 1000);
      }
      return later(config.retryDelayMs);
    }
    if (!reserve) failures = 0;
    current = { scene, startedAt: nowMs(), endsAt: nowMs() + seconds * 1000, reserve, errored: false };
    lastSceneId = scene.id;
    shown++;
    if (!reserve) ledger?.saveScene(scene.id);
    onSceneChange({ scene, interrupt: picked?.interrupt ?? null, reserve });
    later(reserve && picked === null ? config.idleRetryMs ?? seconds * 1000 : seconds * 1000); // reserva porque nada estava disponível: olha de novo logo, o dado ao vivo pode estar chegando
  }

  function run() {
    showNext().catch(error => {
      if (stopped) return;
      lastError = `rodízio: ${error?.message ?? error}`;
      failures++;
      showEmergency();
      later(config.reserveSeconds * 1000);
    });
  }

  return {
    start() {
      startedAt = nowMs();
      const remembered = ledger?.lastSceneId();
      const index = scenes.findIndex(scene => scene.id === remembered);
      lastSceneId = index >= 0 ? scenes[(index - 1 + scenes.length) % scenes.length].id : null; // a cena de antes da recarga volta primeiro
      run();
    },
    stop() {
      stopped = true;
      cancelTimer();
      retire();
    },
    /** Entra na frente da fila, uma vez. `immediate` corta a cena atual agora (ex.: pódio publicado ao vivo). */
    pushInterrupt({ sceneId, priority = 50, ttlMs = 60000, immediate = false }) {
      interrupts = [...interrupts, { sceneId, priority, createdAt: nowMs(), expiresAt: nowMs() + ttlMs }];
      if (immediate && !stopped) run();
    },
    /** Erro solto da página (window.error / unhandledrejection) enquanto uma cena está no ar: castiga a cena e segue. */
    reportError(error) {
      if (!current || current.reserve || current.errored || stopped) return;
      current.errored = true;
      fail(current.scene, error);
      run();
    },
    /** Para o rodízio numa cena (`sceneId` null = a que estiver no ar) até `untilMs`; a nova cena entra na hora. `critical` = emergência. */
    hold({ sceneId = null, untilMs = Infinity, critical = false }) {
      const target = sceneId ?? current?.scene.id ?? null;
      if (stopped || !target || !findScene(target)) return;
      held = { sceneId: target, until: untilMs, critical };
      if (current?.scene.id !== target || current.errored) run();
      else later(config.holdCheckMs);
    },
    /** Solta a cena fixada e o rodízio segue pela fila. */
    release() {
      if (!held) return;
      held = null;
      run();
    },
    skip: run,
    state: () => ({
      held: held ? held.sceneId : null,
      startedAt,
      beatDueAt,
      failures,
      shown,
      lastError,
      interrupts: interrupts.length,
      cooling: Object.keys(cooldowns).filter(id => cooldowns[id] > nowMs()),
      current: current && { id: current.scene.id, type: current.scene.type, startedAt: current.startedAt, endsAt: current.endsAt, reserve: current.reserve },
    }),
  };
}
