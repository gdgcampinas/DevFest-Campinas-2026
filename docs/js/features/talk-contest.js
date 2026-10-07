/**
 * Feature: concurso da sessão (Coding Jam), bloco dentro do modal da palestra, lado da plateia. Regras do jogo (as do banco,
 * espelhadas na tela):
 *   - só quem fez check-in NA sessão cadastra projeto e vota;
 *   - só do início ao fim da sessão (a mesma trava de horário das perguntas, `enforceWindow`; antes mostra o aviso, depois só o
 *     pódio quando o moderador publicar);
 *   - 1 projeto por pessoa (nome da pessoa e do projeto), sem edição: o moderador apaga se houver erro e a pessoa cadastra de novo;
 *   - 1 voto por check-in, em projeto de outra pessoa, sem desfazer. A plateia nunca vê o placar.
 * Leitura barata (plano grátis, sem Blaze): a lista de projetos é lida UMA vez ao abrir a sessão e de novo só no botão "Atualizar"
 * (com intervalo mínimo `config.refreshMinMs`), nunca sozinha; fora da janela de votação não se lê a lista. O pódio é UM documento
 * (`contest-results/<talkKey>`), lido quando a sessão termina e no botão. "Votado" vem dos votos que este navegador guardou (`myVotes`).
 * Auto-correção do check-in: igual às perguntas (`withCheckinRetry`).
 *
 * Tudo entra por parâmetro: `config` (data/talk-contest.js), `enforceWindow` (a trava das perguntas), `now` (relógio, respeita ?demo=),
 * `myCheckins`/`myVotes`/`myName` (o que este navegador já fez) e `deps()` ({ projects, votes, results, getUid }, resolvidos no uso;
 * os testes passam substitutos). Desligado (`config.enabled` falso), não faz nada.
 */
function initTalkContest(rootEl, { index, config, enforceWindow, myCheckins, myVotes, myName, now = () => new Date(), deps = defaultContestDeps, ensureCheckin = async () => {}, highlightOf = talkHighlightsRepository.forTalk }) {
  const sessions = new WeakMap(); // container -> { entry, uid, projects, podium, lastLoadMs, alreadyVoted, state, ready, dirty, notice, timer }
  const containerOf = element => element.closest("[data-contest-container]");
  const entryOf = element => index.get(containerOf(element).dataset.contestContainer);
  const windowStateOf = entry => questionWindowState(entry.slot, now(), { enforce: enforceWindow });
  const myProjectId = session => `${session.uid}_${session.entry.key}`;

  function stopSession(containerEl) {
    const session = sessions.get(containerEl);
    if (!session) return;
    clearInterval(session.timer);
    sessions.delete(containerEl);
  }

  const draw = (containerEl, entry, data) => { containerEl.innerHTML = talkContestMarkup({ entryKey: entry.key, maxLength: config.maxLength, highlight: highlightOf(entry.data), ...data }); };
  const drawLoadError = (containerEl, entry) => draw(containerEl, entry, { phase: "error", message: t("contest.loadError", "Não foi possível carregar os projetos agora. Confira sua conexão.") });

  /**
   * Redesenha com o que já está na memória (sem ler nada). Enquanto a pessoa digita só marca "sujo" e espera; `force` = ação dela.
   * `message` (aviso de uma ação: erro, "aguarde") fica guardado na sessão e sobrevive aos redesenhos automáticos até a próxima ação,
   * que o troca (ou limpa, com ""); os redesenhos do ciclo não passam `message` e só reaproveitam o último.
   */
  function paint(containerEl, { force = false, message } = {}) {
    const session = sessions.get(containerEl);
    if (!session?.ready) return;
    if (message !== undefined) session.notice = message;
    if (!force && isTypingInBlock(containerEl)) { session.dirty = true; return; }
    session.dirty = false;
    const { entry } = session;
    // Pódio publicado vale em qualquer fase: o resultado é a última palavra (e some a votação).
    const phase = session.podium?.length ? "closed" : windowStateOf(entry);
    if (phase === "before") return draw(containerEl, entry, { phase: "waiting" });
    const mine = session.projects.find(project => project.id === myProjectId(session)) ?? null;
    draw(containerEl, entry, {
      phase,
      projects: session.projects,
      mine,
      votedId: session.projects.find(project => myVotes.has(project.id))?.id ?? "",
      alreadyVoted: session.alreadyVoted,
      podium: session.podium,
      name: myName.get(),
      message: session.notice,
    });
  }

  async function loadProjects(session) {
    const { projects } = deps();
    session.projects = (await projects.getWhere({ talkKey: session.entry.key })).sort((a, b) => a.createdAtMs - b.createdAtMs);
    session.lastLoadMs = Date.now();
  }

  async function loadPodium(session) {
    const { results } = deps();
    session.podium = (await results.get(session.entry.key))?.podium ?? null;
    session.lastLoadMs = Date.now();
  }

  /**
   * Lê só o que a janela pede: aberta = a lista de projetos; fechada = o pódio. Com a trava de horário desligada (teste em DEV) a
   * janela nunca fecha, então o pódio também é lido ao abrir (senão não haveria como ver o resultado publicado).
   */
  async function loadFor(session, state) {
    if (state === "open") await loadProjects(session);
    if (state === "closed" || !enforceWindow) await loadPodium(session);
  }

  /** Só lê quando a janela muda (antes: nada; aberta: projetos; fechada: pódio). */
  async function syncWithWindow(session) {
    const state = windowStateOf(session.entry);
    if (state === session.state) return;
    session.state = state;
    await loadFor(session, state);
  }

  async function startSession(containerEl, entry) {
    const session = { entry, uid: null, projects: [], podium: null, lastLoadMs: 0, alreadyVoted: false, state: null, ready: false, dirty: false, notice: "", timer: null };
    sessions.set(containerEl, session);
    const isCurrent = () => sessions.get(containerEl) === session;
    try {
      session.uid = await deps().getUid();
      await syncWithWindow(session);
      if (!isCurrent()) return;
      session.ready = true;
      session.timer = setInterval(() => tick(containerEl), config.pollMs);
      paint(containerEl);
    } catch {
      if (isCurrent()) drawLoadError(containerEl, entry);
    }
  }

  /** A cada `pollMs`: sai se o modal fechou; senão confere se a sessão abriu ou fechou (e lê o que isso pede) e redesenha. */
  async function tick(containerEl) {
    const session = sessions.get(containerEl);
    if (!session) return;
    if (!isBlockOnScreen(containerEl)) return stopSession(containerEl);
    await syncWithWindow(session).catch(() => {});
    paint(containerEl);
  }

  /** Preenche containerEl com o bloco do concurso (chamado pelo modal). */
  function render(containerEl, entry) {
    if (!config.enabled || !containerEl) return;
    containerEl.dataset.contestContainer = entry.key;
    stopSession(containerEl);
    if (!myCheckins.has(entry.key)) return draw(containerEl, entry, { phase: "locked" });
    draw(containerEl, entry, { phase: "loading" });
    startSession(containerEl, entry);
  }

  // Check-in feito agora (feedback-flow dispara o evento): destrava os blocos abertos.
  rootEl.addEventListener(FEEDBACK_CHANGED_EVENT, () => {
    rootEl.querySelectorAll("[data-contest-container]").forEach(containerEl => {
      const entry = index.get(containerEl.dataset.contestContainer);
      if (entry && isBlockOnScreen(containerEl)) render(containerEl, entry);
    });
  });

  rootEl.addEventListener("click", async event => {
    const refreshBtn = event.target.closest("[data-contest-refresh]");
    const voteBtn = event.target.closest("[data-contest-vote]");
    const button = refreshBtn ?? voteBtn;
    if (!button) return;
    const containerEl = containerOf(button);
    const session = sessions.get(containerEl);
    if (!session) return;
    if (refreshBtn) {
      if (Date.now() - session.lastLoadMs < config.refreshMinMs) return paint(containerEl, { force: true, message: t("contest.refreshWait", "Aguarde alguns segundos pra atualizar de novo.") });
      try {
        await loadFor(session, windowStateOf(session.entry));
        paint(containerEl, { force: true, message: "" });
      } catch {
        paint(containerEl, { force: true, message: t("contest.loadError", "Não foi possível carregar os projetos agora. Confira sua conexão.") });
      }
      return;
    }
    voteBtn.disabled = true;
    const { entry } = session;
    try {
      const { votes, getUid } = deps();
      const uid = await getUid();
      const projectId = voteBtn.dataset.contestVote;
      // "permission-denied" pode ser "já votou" (a regra recusa o segundo voto, que cai no mesmo id) OU outra recusa (sessão encerrada,
      // projeto apagado...): só conta como "já votou" se o voto existe mesmo no banco; senão o erro sobe e a pessoa vê o aviso.
      let alreadyVoted = false;
      await withCheckinRetry(ensureCheckin, entry, () => votes.add(uid, entry.key, { entryKey: entry.key, talkKey: entry.key, projectId }))
        .catch(async error => { if (error.code !== "permission-denied" || !(await votes.has(uid, entry.key))) throw error; alreadyVoted = true; });
      if (alreadyVoted) session.alreadyVoted = true;
      else myVotes.addAll([projectId]);
      paint(containerEl, { force: true, message: "" });
    } catch {
      paint(containerEl, { force: true, message: t("contest.voteError", "Não foi possível votar agora. Tente de novo.") });
    }
  });

  rootEl.addEventListener("submit", async event => {
    const form = event.target.closest("[data-contest-form]");
    if (!form) return;
    event.preventDefault();
    const containerEl = containerOf(form);
    const session = sessions.get(containerEl);
    if (!session) return;
    const { entry } = session;
    const submitBtn = form.querySelector("[type=submit]");
    const project = form.querySelector("[name=project]").value.trim();
    const name = form.querySelector("[name=name]").value.trim();
    if (!project || !name) return showFormError(form, submitBtn, t("contest.required", "Escreva o nome do projeto e o seu nome pra cadastrar."));
    submitBtn.disabled = true;
    try {
      const { projects, getUid } = deps();
      const uid = await getUid();
      await withCheckinRetry(ensureCheckin, entry, () => projects.add(uid, entry.key, { entryKey: entry.key, talkKey: entry.key, uid, name, project }));
      rememberName(myName, name);
      await loadProjects(session);
      paint(containerEl, { force: true, message: "" });
    } catch {
      // Se o projeto já existia (cadastrado antes, em outro momento), a recusa some ao reler a lista e a pessoa o vê como "Seu projeto".
      await loadProjects(session).catch(() => {});
      if (session.projects.some(candidate => candidate.id === myProjectId(session))) return paint(containerEl, { force: true, message: "" });
      submitBtn.disabled = false;
      showFormError(form, submitBtn, t("contest.sendError", "Não foi possível cadastrar. Confira o check-in, sua conexão e o horário da sessão."));
    }
  });

  return { render };
}

/** Padrão de produção: os repositories do Firebase (módulos, só existem depois do carregamento). */
function defaultContestDeps() {
  return {
    projects: window.contestProjectsRepository,
    votes: window.contestVotesRepository,
    results: window.contestResultsRepository,
    getUid: () => window.firebaseClient.ensureAnonymousUid(),
  };
}
