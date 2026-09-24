/**
 * Feature: perguntas ao vivo por palestra (bloco dentro do modal). Só quem
 * fez check-in na palestra pergunta e vota (a regra do Firestore exige, isto
 * só espelha na tela). Até `config.maxPerPerson` perguntas por pessoa por palestra; 1 voto por pessoa
 * por pergunta, sem desfazer. A lista se atualiza sozinha com o modal aberto
 * (poll, sem listener em tempo real: leituras previsíveis no plano grátis).
 *
 * Tudo entra por parâmetro: `config` (data/talk-questions.js), `deps()` devolve
 * { questions, votes, getUid } (os repositories carregam depois, como módulos,
 * então são resolvidos no uso; os testes passam substitutos), `myCheckins` diz
 * o check-in deste navegador. Desligado (`config.enabled` falso), não faz nada.
 */
function initTalkQuestions(rootEl, { index, config, myCheckins, myName, deps = defaultQuestionDeps }) {
  const timers = new WeakMap();
  const containerOf = element => element.closest("[data-questions-container]");
  const entryOf = element => index.get(containerOf(element).dataset.questionsContainer);

  function stopPolling(containerEl) {
    clearInterval(timers.get(containerEl));
    timers.delete(containerEl);
  }

  /** Só continua atualizando enquanto o bloco existe e está visível (modal aberto). */
  const isOnScreen = containerEl => containerEl.isConnected && containerEl.getClientRects().length > 0;

  async function load(containerEl, entry, { message = "" } = {}) {
    const { questions, votes, getUid } = deps();
    try {
      const uid = await getUid();
      const [questionDocs, voteDocs] = await Promise.all([
        questions.getWhere({ talkKey: entry.key, hidden: false }),
        votes.getWhere({ talkKey: entry.key }),
      ]);
      const ranked = rankQuestions(questionDocs, voteDocs, { myUid: uid });
      containerEl.innerHTML = talkQuestionsMarkup({
        phase: "ready", entryKey: entry.key, questions: ranked, maxLength: config.maxLength,
        canAsk: ranked.filter(question => question.mine).length < config.maxPerPerson, limit: config.maxPerPerson, name: myName.get(), message,
      });
    } catch {
      containerEl.innerHTML = talkQuestionsMarkup({ phase: "error", entryKey: entry.key, message: t("q.loadError", "Não foi possível carregar as perguntas agora. Confira sua conexão.") });
    }
  }

  /** Preenche containerEl com o bloco de perguntas da palestra (chamado pelo modal). */
  function render(containerEl, entry) {
    if (!config.enabled || !containerEl) return;
    containerEl.dataset.questionsContainer = entry.key;
    stopPolling(containerEl);
    if (!myCheckins.has(entry.key)) {
      containerEl.innerHTML = talkQuestionsMarkup({ phase: "locked", entryKey: entry.key });
      return;
    }
    containerEl.innerHTML = talkQuestionsMarkup({ phase: "loading", entryKey: entry.key });
    load(containerEl, entry);
    timers.set(containerEl, setInterval(() => {
      if (!isOnScreen(containerEl)) stopPolling(containerEl);
      else if (!containerEl.querySelector("textarea:focus, input:focus")) load(containerEl, entry);
    }, config.pollMs));
  }

  /**
   * Cria a pergunta no primeiro espaço livre da pessoa nessa palestra ("<palestra>#1" a "#N"). A regra recusa
   * (permission-denied) o espaço já usado, então é só tentar o próximo; se todos falharem, o limite acabou
   * ou falta o check-in, e quem chamou mostra o aviso.
   */
  async function addQuestion(entry, { text, name }) {
    const { questions, getUid } = deps();
    const uid = await getUid();
    for (let slot = 1; slot <= config.maxPerPerson; slot++) {
      const entryKey = `${entry.key}#${slot}`;
      try {
        await questions.add(uid, entryKey, { entryKey, talkKey: entry.key, text, name, hidden: false });
        return;
      } catch (error) {
        if (error.code !== "permission-denied") throw error;
      }
    }
    throw new Error("question-limit");
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
      // "permission-denied" = já votou (a regra recusa o segundo voto): só recarrega, não é erro pra pessoa.
      await votes.add(await getUid(), voteBtn.dataset.questionVote, { entryKey: voteBtn.dataset.questionVote, talkKey: entry.key })
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
      showFormError(form, submitBtn, t("q.sendError", "Não foi possível enviar. Confira o check-in, sua conexão e o limite de perguntas por pessoa."));
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
