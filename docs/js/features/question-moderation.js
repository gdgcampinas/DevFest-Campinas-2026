/**
 * Feature: tela do moderador de perguntas (ferramenta interna, uma por sala). É quem decide o que vai ao ar:
 * mostra as perguntas da palestra que está rolando na trilha (ou da última que terminou, pra dar tempo de
 * responder) em quatro grupos (fila, no ar, respondidas, rejeitadas) e muda o estado com um toque. Só e-mail Google
 * da lista de moderadores nas regras do Firestore consegue listar tudo e alterar o `status`; quem entrar com outra
 * conta vê "sem permissão" (a regra é a defesa, a tela só avisa).
 *
 * Reusa resolveEventState() (mesmo relógio do site), talkKey() e rankQuestions(); tudo por parâmetro (`deps()` dá
 * repositories e login). Atualiza sozinha a cada `config.boardPollMs` e retoma o login que já estava feito.
 */
function pickModerationTalk({ schedule, track, now }) {
  const talkSlots = schedule.filter(slot => slot.talks?.[track.id]);
  const state = resolveEventState(now, schedule);
  const slot = state.phase === "live" && state.activeSlot?.talks?.[track.id]
    ? state.activeSlot
    : talkSlots.filter(candidate => candidate.end <= now).pop();
  return slot ? { key: talkKey(slot, track.id), title: slot.talks[track.id].title } : null;
}

function initQuestionModeration(rootEl, { schedule, track, config, now = () => new Date(), deps = defaultModerationDeps, whenReady = runAfterModules }) {
  let email = "";
  let timer = null;

  const draw = data => { rootEl.innerHTML = questionModerationMarkup({ trackLabel: track.label, email, ...data }); };

  async function refresh() {
    if (!email) return draw({ phase: "signin" });
    const talk = pickModerationTalk({ schedule, track, now: now() });
    if (!talk) return draw({ phase: "empty", message: "Nenhuma palestra nesta sala por enquanto." });
    const { questions, votes } = deps();
    try {
      const [questionDocs, voteDocs] = await Promise.all([questions.getWhere({ talkKey: talk.key }), votes.getWhere({ talkKey: talk.key })]);
      draw({ phase: "ready", talkTitle: talk.title, questions: rankQuestions(questionDocs, voteDocs, { statuses: Object.values(QUESTION_STATUS) }) });
    } catch (error) {
      draw({ phase: "error", message: error.code === "permission-denied" ? "Sem permissão: essa conta não está na lista de moderadores." : "Não foi possível carregar agora. Tentando de novo em instantes." });
    }
  }

  const startPolling = () => { timer = setInterval(refresh, config.boardPollMs); };
  const stopPolling = () => clearInterval(timer);

  rootEl.addEventListener("click", async event => {
    if (event.target.closest("[data-mod-signin]")) {
      try {
        email = await deps().signIn();
        startPolling();
        refresh();
      } catch {
        draw({ phase: "signin", message: "Não foi possível entrar. Tente de novo." });
      }
    } else if (event.target.closest("[data-mod-signout]")) {
      stopPolling();
      await deps().signOut();
      email = "";
      refresh();
    } else {
      const setBtn = event.target.closest("[data-question-set]");
      if (!setBtn) return;
      setBtn.disabled = true;
      await deps().questions.update(setBtn.dataset.questionId, { status: setBtn.dataset.questionSet }).catch(() => {});
      refresh();
    }
  });

  refresh();
  // Tablet que recarregou (ou dormiu): o login Google persiste, então retoma sozinho sem pedir de novo.
  whenReady(async () => {
    email = (await deps().restore().catch(() => null)) ?? "";
    if (email) {
      startPolling();
      refresh();
    }
  });
}

function defaultModerationDeps() {
  return {
    questions: window.moderationQuestionsRepository,
    votes: window.moderationVotesRepository,
    signIn: () => window.moderatorClient.signInWithGoogle(),
    restore: () => window.moderatorClient.restoreModerator(),
    signOut: () => window.moderatorClient.signOutModerator(),
  };
}
