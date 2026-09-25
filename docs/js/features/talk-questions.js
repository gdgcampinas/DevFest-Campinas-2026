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
 * A lista se atualiza sozinha com o modal aberto (poll, sem listener em tempo real: leituras previsíveis no plano
 * grátis).
 *
 * Auto-correção: este navegador guarda "já fiz check-in" localmente, mas o que vale pro banco é o check-in do uid atual. Se
 * o uid mudou (login trocado, dados do site apagados pela metade), o banco recusa com "permission-denied" mesmo com o
 * check-in "feito" na tela: nesse caso `ensureCheckin(entry)` refaz o check-in (idempotente) e a ação é tentada de novo, uma vez.
 *
 * Tudo entra por parâmetro: `config` (data/talk-questions.js), `now` (relógio, respeita ?demo=), `myCheckins` (o
 * check-in deste navegador) e `deps()` ({ questions, votes, getUid }: os repositories carregam depois, como módulos,
 * então são resolvidos no uso; os testes passam substitutos). Desligado (`config.enabled` falso), não faz nada.
 */
function initTalkQuestions(rootEl, { index, config, myCheckins, myName, now = () => new Date(), deps = defaultQuestionDeps, ensureCheckin = async () => {} }) {
  const timers = new WeakMap();
  const containerOf = element => element.closest("[data-questions-container]");
  const entryOf = element => index.get(containerOf(element).dataset.questionsContainer);

  function stopPolling(containerEl) {
    clearInterval(timers.get(containerEl));
    timers.delete(containerEl);
  }

  /** Só continua atualizando enquanto o bloco existe e está visível (modal aberto). */
  const isOnScreen = containerEl => containerEl.isConnected && containerEl.getClientRects().length > 0;

  const draw = (containerEl, entry, data) => { containerEl.innerHTML = talkQuestionsMarkup({ entryKey: entry.key, maxLength: config.maxLength, limit: config.maxPerPerson, ...data }); };

  async function load(containerEl, entry, { message = "" } = {}) {
    const windowState = questionWindowState(entry.slot, now(), { enforce: config.enforceWindow });
    if (windowState === "before") return draw(containerEl, entry, { phase: "waiting" });
    const { questions, votes, getUid } = deps();
    try {
      const uid = await getUid();
      const [approvedDocs, mineDocs, voteDocs] = await Promise.all([
        questions.getWhere({ talkKey: entry.key, status: [...PUBLIC_QUESTION_STATUSES] }),
        questions.getWhere({ talkKey: entry.key, uid }),
        votes.getWhere({ talkKey: entry.key }),
      ]);
      const mine = mineDocs.sort((a, b) => a.createdAtMs - b.createdAtMs);
      draw(containerEl, entry, {
        phase: windowState,
        approved: rankQuestions(approvedDocs, voteDocs, { myUid: uid, statuses: PUBLIC_QUESTION_STATUSES }),
        mine,
        canAsk: windowState === "open" && mine.length < config.maxPerPerson,
        remaining: config.maxPerPerson - mine.length,
        name: myName.get(),
        message,
      });
    } catch {
      draw(containerEl, entry, { phase: "error", message: t("q.loadError", "Não foi possível carregar as perguntas agora. Confira sua conexão.") });
    }
  }

  /** Preenche containerEl com o bloco de perguntas da palestra (chamado pelo modal). */
  function render(containerEl, entry) {
    if (!config.enabled || !containerEl) return;
    containerEl.dataset.questionsContainer = entry.key;
    stopPolling(containerEl);
    if (!myCheckins.has(entry.key)) return draw(containerEl, entry, { phase: "locked" });
    draw(containerEl, entry, { phase: "loading" });
    load(containerEl, entry);
    timers.set(containerEl, setInterval(() => {
      if (!isOnScreen(containerEl)) stopPolling(containerEl);
      else if (!containerEl.querySelector("textarea:focus, input:focus")) load(containerEl, entry);
    }, config.pollMs));
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
      // "permission-denied" depois de refazer o check-in = já votou (a regra recusa o segundo voto): só recarrega, não é erro pra pessoa.
      const uid = await getUid();
      await withCheckinRetry(entry, () => votes.add(uid, voteBtn.dataset.questionVote, { entryKey: voteBtn.dataset.questionVote, talkKey: entry.key }))
        .catch(error => { if (error.code !== "permission-denied") throw error; });
      await load(containerEl, entry);
    } catch {
      await load(containerEl, entry, { message: t("q.voteError", "Não foi possível votar agora. Tente de novo.") });
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
      await load(containerEl, entry);
    } catch {
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
    getUid: () => window.firebaseClient.ensureAnonymousUid(),
  };
}
