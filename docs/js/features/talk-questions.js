/**
 * Feature: perguntas ao vivo por palestra (bloco dentro do modal, lado da plateia). Regras do jogo (as do banco,
 * espelhadas na tela):
 *   - só quem fez check-in NA palestra pergunta e vota;
 *   - só do início ao fim da palestra (question-window.js; `config.enforceWindow` liga e desliga essa trava, ver
 *     data/talk-questions.js); antes mostra o aviso, depois só leitura;
 *   - até `config.maxPerPerson` perguntas por pessoa por palestra;
 *   - a pergunta nasce "pending": só depois que o moderador aprova ela entra na lista pública, no voto e no quadro
 *     da sala. Quem enviou vê as próprias com o estado (aguardando, aprovada, respondida, não aprovada);
 *   - 1 voto por pessoa por pergunta aprovada, sem desfazer.
 * Leitura barata (plano grátis, sem Blaze): a lista pública vem de UM documento por palestra (`talk-boards/<talkKey>`, escrito
 * pela tela do moderador, ver board-publisher.js) ouvido com listener só enquanto o modal está aberto: cada mudança de
 * ordem custa 1 leitura, e não uma consulta repetida de todas as perguntas e votos. As próprias perguntas são lidas uma vez
 * ao abrir (só por quem já perguntou nessa palestra neste navegador) e depois só a cada `config.mineRefreshMs` enquanto alguma espera o moderador. Os votos NÃO são lidos: "Votado" vem
 * dos votos que este navegador guardou (`myVotes`). O número de votos só aparece se o quadro publicar (`config.publishVotes`).
 *
 * Auto-correção: este navegador guarda "já fiz check-in" localmente, mas o que vale pro banco é o check-in do uid atual. Se
 * o uid mudou (login trocado, dados do site apagados pela metade), o banco recusa com "permission-denied" mesmo com o
 * check-in "feito" na tela: nesse caso `ensureCheckin(entry)` refaz o check-in (idempotente) e a ação é tentada de novo, uma vez.
 *
 * Tudo entra por parâmetro: `config` (data/talk-questions.js), `now` (relógio, respeita ?demo=), `myCheckins`, `myVotes` e `myAsked` (o
 * que este navegador já fez) e `deps()` ({ questions, votes, boards, getUid }: os repositories carregam depois, como módulos,
 * então são resolvidos no uso; os testes passam substitutos). Desligado (`config.enabled` falso), não faz nada.
 */
function initTalkQuestions(rootEl, { index, config, myCheckins, myVotes, myAsked, myName, now = () => new Date(), deps = defaultQuestionDeps, ensureCheckin = async () => {} }) {
  const sessions = new WeakMap(); // container -> { entry, uid, board, mine, lastMineMs, stopListening, timer, dirty }
  const containerOf = element => element.closest("[data-questions-container]");
  const entryOf = element => index.get(containerOf(element).dataset.questionsContainer);

  /** Só continua atualizando enquanto o bloco existe e está visível (modal aberto). */
  const isOnScreen = containerEl => containerEl.isConnected && containerEl.getClientRects().length > 0;
  const isTyping = containerEl => Boolean(containerEl.querySelector("textarea:focus, input:focus"));

  function stopSession(containerEl) {
    const session = sessions.get(containerEl);
    if (!session) return;
    session.stopListening?.();
    clearInterval(session.timer);
    sessions.delete(containerEl);
  }

  const draw = (containerEl, entry, data) => { containerEl.innerHTML = talkQuestionsMarkup({ entryKey: entry.key, maxLength: config.maxLength, limit: config.maxPerPerson, ...data }); };
  const hasPending = session => session.mine.some(question => question.status === QUESTION_STATUS.pending);

  /** Redesenha com o que já está na memória (sem ler nada). Enquanto a pessoa digita só marca "sujo" e espera; `force` = ação dela. */
  function paint(containerEl, { force = false, message = "" } = {}) {
    const session = sessions.get(containerEl);
    if (!session?.ready) return;
    if (!force && isTyping(containerEl)) { session.dirty = true; return; }
    session.dirty = false;
    const { entry } = session;
    const windowState = questionWindowState(entry.slot, now(), { enforce: config.enforceWindow });
    if (windowState === "before") return draw(containerEl, entry, { phase: "waiting" });
    draw(containerEl, entry, {
      phase: windowState,
      approved: decorateQuestions(session.board, { myUid: session.uid, votedIds: new Set(myVotes.getAll()) }),
      mine: session.mine,
      canAsk: windowState === "open" && session.mine.length < config.maxPerPerson,
      remaining: config.maxPerPerson - session.mine.length,
      name: myName.get(),
      message,
    });
  }

  async function refreshMine(session) {
    const { questions } = deps();
    session.mine = (await questions.getWhere({ talkKey: session.entry.key, uid: session.uid })).sort((a, b) => a.createdAtMs - b.createdAtMs);
    session.lastMineMs = Date.now();
  }

  const drawLoadError = (containerEl, entry) => draw(containerEl, entry, { phase: "error", message: t("q.loadError", "Não foi possível carregar as perguntas agora. Confira sua conexão.") });

  async function startSession(containerEl, entry) {
    const session = { entry, uid: null, board: [], mine: [], lastMineMs: 0, dirty: false, ready: false, stopListening: null, timer: null };
    sessions.set(containerEl, session);
    const isCurrent = () => sessions.get(containerEl) === session;
    try {
      const { boards, getUid } = deps();
      session.uid = await getUid();
      if (myAsked.has(entry.key)) await refreshMine(session); // quem nunca perguntou aqui não gasta essa leitura
      if (!isCurrent()) return;
      session.ready = true;
      session.stopListening = boards.listen(entry.key, board => { session.board = board?.questions ?? []; paint(containerEl); }, () => isCurrent() && drawLoadError(containerEl, entry));
      session.timer = setInterval(() => tick(containerEl), config.pollMs);
    } catch {
      if (isCurrent()) drawLoadError(containerEl, entry);
    }
  }

  /** A cada `pollMs`: sai se o modal fechou; senão redesenha (horário da palestra, o que chegou enquanto digitava) e relê as próprias perguntas se ainda esperam. */
  async function tick(containerEl) {
    const session = sessions.get(containerEl);
    if (!session) return;
    if (!isOnScreen(containerEl)) return stopSession(containerEl);
    if (hasPending(session) && Date.now() - session.lastMineMs >= config.mineRefreshMs) await refreshMine(session).catch(() => {});
    paint(containerEl);
  }

  /** Preenche containerEl com o bloco de perguntas da palestra (chamado pelo modal). */
  function render(containerEl, entry) {
    if (!config.enabled || !containerEl) return;
    containerEl.dataset.questionsContainer = entry.key;
    stopSession(containerEl);
    if (!myCheckins.has(entry.key)) return draw(containerEl, entry, { phase: "locked" });
    draw(containerEl, entry, { phase: "loading" });
    startSession(containerEl, entry);
  }

  /** Roda `action`; se o banco recusar (check-in do uid atual ausente), refaz o check-in e tenta mais uma vez. */
  async function withCheckinRetry(entry, action) {
    try {
      return await action();
    } catch (error) {
      if (error.code !== "permission-denied") throw error;
      await ensureCheckin(entry);
      return action();
    }
  }

  /** Cria a pergunta no primeiro espaço livre da pessoa nessa palestra; sem espaço, o limite acabou. */
  async function addQuestion(entry, { text, name }) {
    const { questions, getUid } = deps();
    const uid = await getUid();
    const used = (await questions.getWhere({ talkKey: entry.key, uid })).map(question => question.entryKey);
    const slot = firstFreeQuestionSlot(used, entry.key, config.maxPerPerson);
    if (!slot) throw new Error("question-limit");
    const entryKey = questionEntryKey(entry.key, slot);
    await withCheckinRetry(entry, () => questions.add(uid, entryKey, { entryKey, talkKey: entry.key, uid, text, name, status: QUESTION_STATUS.pending }));
  }

  // Check-in feito agora (feedback-flow dispara o evento): destrava os blocos abertos.
  rootEl.addEventListener(FEEDBACK_CHANGED_EVENT, () => {
    rootEl.querySelectorAll("[data-questions-container]").forEach(containerEl => {
      const entry = index.get(containerEl.dataset.questionsContainer);
      if (entry && isOnScreen(containerEl)) render(containerEl, entry);
    });
  });

  rootEl.addEventListener("click", async event => {
    const voteBtn = event.target.closest("[data-question-vote]");
    if (!voteBtn) return;
    const containerEl = containerOf(voteBtn);
    const entry = entryOf(voteBtn);
    voteBtn.disabled = true;
    try {
      const { votes, getUid } = deps();
      // "permission-denied" depois de refazer o check-in = já votou (a regra recusa o segundo voto): só marca, não é erro pra pessoa.
      const uid = await getUid();
      await withCheckinRetry(entry, () => votes.add(uid, voteBtn.dataset.questionVote, { entryKey: voteBtn.dataset.questionVote, talkKey: entry.key }))
        .catch(error => { if (error.code !== "permission-denied") throw error; });
      myVotes.addAll([voteBtn.dataset.questionVote]);
      paint(containerEl, { force: true });
    } catch {
      paint(containerEl, { force: true, message: t("q.voteError", "Não foi possível votar agora. Tente de novo.") });
    }
  });

  rootEl.addEventListener("submit", async event => {
    const form = event.target.closest("[data-question-form]");
    if (!form) return;
    event.preventDefault();
    const containerEl = containerOf(form);
    const entry = entryOf(form);
    const submitBtn = form.querySelector("[type=submit]");
    const text = form.querySelector("[name=text]").value.trim();
    const name = form.querySelector("[name=name]").value.trim();
    if (!text || !name) return showFormError(form, submitBtn, t("q.required", "Escreva a pergunta e seu nome pra enviar."));
    submitBtn.disabled = true;
    try {
      await addQuestion(entry, { text, name });
      rememberName(myName, name);
      myAsked.addAll([entry.key]);
      const session = sessions.get(containerEl);
      if (session) await refreshMine(session);
      paint(containerEl, { force: true });
    } catch (error) {
      if (error.message === "question-limit") {
        // O limite já estava cheio (perguntas de antes deste navegador guardar "já perguntei aqui"): mostra as próprias e o aviso do máximo.
        myAsked.addAll([entry.key]);
        const session = sessions.get(containerEl);
        if (session) await refreshMine(session).catch(() => {});
        return paint(containerEl, { force: true });
      }
      submitBtn.disabled = false;
      showFormError(form, submitBtn, t("q.sendError", "Não foi possível enviar. Confira o check-in, sua conexão, o horário da palestra e o limite de perguntas."));
    }
  });

  return { render };
}

/** Padrão de produção: os repositories do Firebase (módulos, só existem depois do carregamento). */
function defaultQuestionDeps() {
  return {
    questions: window.talkQuestionsRepository,
    votes: window.talkQuestionVotesRepository,
    boards: window.talkBoardsRepository,
    getUid: () => window.firebaseClient.ensureAnonymousUid(),
  };
}
