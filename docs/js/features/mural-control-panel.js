/**
 * Feature: tela do moderador do CONTROLE do mural (ferramenta interna, mural-controle.html), feita pro celular. Escreve avisos, fixa ou pausa o rodízio, manda recarregar e arma a emergência:
 * cada ação vira o documento `mural-control/current` (Firestore) e o mural do telão só LÊ e obedece (features/mural-control.js). Só o e-mail Google da lista de moderadores das regras grava;
 * outra conta vê "sem permissão" (a regra é a defesa, a tela só avisa). Retoma o login que já estava feito.
 * O formulário é desenhado UMA vez (quem digita não perde o texto quando o estado muda); só as áreas vivas (`data-slot`) são refeitas. A emergência exige dois toques (o primeiro pede confirmação
 * e vale `confirmMs`). Tudo por parâmetro: `repository` ({ listen, set }), `rules` (as regras puras de features/mural-control.js), `limits` (MURAL_CONFIG.control), `scenes` ([{ id, label }]),
 * `templates` (data/mural-notices.js), `login`, `nowMs`, `makeId`, `schedule`, `formatTime`, `refreshMs`, `confirmMs`.
 * `embedded` (dentro da área de admin, que faz o login uma vez): sem porta de entrada, conta nem título; liga na hora, já logado. Devolve `{ stop }` (desliga a escuta e os temporizadores).
 */
function initMuralControlPanel(rootEl, { repository, rules, limits, scenes, templates, login = defaultModeratorLoginDeps(), nowMs = () => Date.now(), makeId = () => Math.random().toString(36).slice(2, 10), schedule = defaultSchedule, formatTime = () => "", refreshMs = 15000, confirmMs = 5000, whenReady = runAfterModules, embedded = false }) {
  let email = "";
  let doc = null;
  let busy = false;
  let active = false;
  let stopListening = () => {};
  let cancelRefresh = () => {};
  let cancelConfirm = () => {};
  const ui = { kind: "info", noticeMinutes: limits.noticeDefaultMinutes, holdMinutes: limits.holdDefaultMinutes, emergencyConfirm: false, message: "" };
  const sceneLabel = id => scenes.find(scene => scene.id === id)?.label ?? id;
  const field = attr => rootEl.querySelector(`[${attr}]`);

  function drawSlots() {
    const state = rules.normalize(doc, nowMs(), limits);
    const formatMs = ms => formatTime(new Date(ms));
    const slots = muralControlSlots({ state, summary: rules.summarize(state, { sceneLabel, formatTime: formatMs }), ui, limits, formatTime: formatMs, busy });
    Object.entries(slots).forEach(([name, markup]) => {
      const slot = rootEl.querySelector(`[data-slot="${name}"]`);
      if (slot) slot.innerHTML = markup;
    });
  }

  function drawShell() {
    rootEl.innerHTML = muralControlShellMarkup({ email, limits, scenes, templates, embedded });
    drawSlots();
  }

  function drawSignIn() {
    rootEl.innerHTML = `${moderatorSignInMarkup({ hint: "Entre com a conta Google de moderador pra controlar o telão." })}${ui.message ? `<p class="mod-hint mod-notice" role="status">${escapeHtml(ui.message)}</p>` : ""}`;
  }

  function tick() {
    if (!active) return;
    drawSlots(); // avisos que venceram saem da lista
    cancelRefresh = schedule(tick, refreshMs);
  }

  function start() {
    active = true;
    ui.message = "";
    drawShell();
    stopListening = repository.listen(limits.docKey, next => { doc = next; if (active) drawSlots(); }, () => {
      ui.message = "Não consegui ler o estado do telão. Confira a conexão.";
      if (active) drawSlots();
    });
    cancelRefresh = schedule(tick, refreshMs);
  }

  function stop() {
    active = false;
    stopListening();
    cancelRefresh();
    cancelConfirm();
  }

  /** Grava o próximo estado (já calculado pelas regras puras). O estado local muda na hora e volta ao do banco se ele recusar. */
  async function save(buildNext, done) {
    if (busy) return;
    let next;
    try {
      next = buildNext();
    } catch (error) {
      ui.message = `${error.message[0].toUpperCase()}${error.message.slice(1)}.`;
      return drawSlots();
    }
    const previous = doc;
    doc = next;
    busy = true;
    ui.message = "";
    drawSlots();
    try {
      await repository.set(limits.docKey, next);
      ui.message = done;
    } catch (error) {
      doc = previous;
      ui.message = error?.code === "permission-denied" ? "Sem permissão: esta conta não é de moderador." : "Não consegui salvar. Tente de novo.";
    }
    busy = false;
    if (active) drawSlots();
  }

  const minutes = value => Number(value) * 60000;
  const actions = {
    "data-notice-template": button => { field("data-notice-text").value = button.dataset.noticeTemplate; },
    "data-emergency-template": button => { field("data-emergency-text").value = button.dataset.emergencyTemplate; },
    "data-notice-kind": button => { ui.kind = button.dataset.noticeKind; drawSlots(); },
    "data-notice-minutes": button => { ui.noticeMinutes = Number(button.dataset.noticeMinutes); drawSlots(); },
    "data-hold-minutes": button => { ui.holdMinutes = Number(button.dataset.holdMinutes); drawSlots(); },
    "data-notice-publish": () => save(() => rules.addNotice(doc, { text: field("data-notice-text").value, kind: ui.kind, ttlMs: minutes(ui.noticeMinutes), id: makeId(), nowMs: nowMs() }, limits), "Aviso publicado no telão.").then(() => { if (!ui.message.startsWith("Não") && !ui.message.startsWith("Sem")) field("data-notice-text").value = ""; }),
    "data-notice-remove": button => save(() => rules.removeNotice(doc, button.dataset.noticeRemove, nowMs(), limits), "Aviso removido."),
    "data-hold-pause": () => save(() => rules.holdScene(doc, { sceneId: null, ttlMs: minutes(ui.holdMinutes), nowMs: nowMs() }, limits), "Telão pausado."),
    "data-hold-pin": () => save(() => rules.holdScene(doc, { sceneId: field("data-hold-scene").value, ttlMs: minutes(ui.holdMinutes), nowMs: nowMs() }, limits), "Cena fixada no telão."),
    "data-hold-release": () => save(() => rules.releaseHold(doc, nowMs(), limits), "Rodízio solto."),
    "data-reload": () => save(() => rules.orderReload(doc, nowMs(), limits), "Pedido enviado: o mural recarrega em instantes."),
    "data-emergency-arm": () => {
      if (!field("data-emergency-text").value.trim()) {
        ui.message = "Escreva o texto da emergência.";
        return drawSlots();
      }
      if (!ui.emergencyConfirm) {
        ui.emergencyConfirm = true;
        ui.message = "";
        cancelConfirm = schedule(() => { ui.emergencyConfirm = false; if (active) drawSlots(); }, confirmMs);
        return drawSlots();
      }
      cancelConfirm();
      ui.emergencyConfirm = false;
      return save(() => rules.armEmergency(doc, { text: field("data-emergency-text").value, nowMs: nowMs() }, limits), "EMERGÊNCIA ARMADA no telão.");
    },
    "data-emergency-disarm": () => save(() => rules.disarmEmergency(doc, nowMs(), limits), "Emergência desarmada."),
  };

  rootEl.addEventListener("click", async event => {
    if (event.target.closest("[data-mod-signin]")) {
      try {
        email = await login.signIn();
        start();
      } catch (error) {
        ui.message = signInErrorMessage(error);
        drawSignIn();
      }
      return;
    }
    if (event.target.closest("[data-mod-signout]")) {
      stop();
      await login.signOut();
      email = "";
      ui.message = "";
      return drawSignIn();
    }
    const name = Object.keys(actions).find(attr => event.target.closest(`[${attr}]`));
    if (name) actions[name](event.target.closest(`[${name}]`));
  });

  if (embedded) {
    start();
  } else {
    drawSignIn();
    whenReady(async () => {
      email = (await login.restore().catch(() => null)) ?? "";
      if (email) start();
    });
  }
  return { stop };
}

/** Os parâmetros padrão do painel, montados com os repositories e as regras do site: o que mural-controle.html e a seção Telão da área de admin usam (nos testes, cada parâmetro é trocado por um substituto). */
function defaultMuralControlPanelDeps() {
  return {
    repository: window.moderationMuralControlRepository,
    rules: { normalize: normalizeControl, summarize: summarizeControl, addNotice, removeNotice, holdScene, releaseHold, armEmergency, disarmEmergency, orderReload },
    limits: muralConfigRepository.getAll().control,
    scenes: muralScenesRepository.options(),
    templates: muralNoticeTemplatesRepository.getAll(),
    formatTime: date => formatEventTime(date, EVENT.timezone),
  };
}
