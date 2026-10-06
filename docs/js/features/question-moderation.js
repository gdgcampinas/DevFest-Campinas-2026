/**
 * Feature: tela do moderador de perguntas (ferramenta interna, uma por sala). É quem decide o que vai ao ar:
 * mostra as perguntas da palestra que está rolando na trilha (ou da última que terminou, pra dar tempo de
 * responder) em quatro grupos (fila, no ar, respondidas, rejeitadas) e muda o estado com um toque. Só e-mail Google
 * da lista de moderadores nas regras do Firestore consegue listar tudo e alterar o `status`; quem entrar com outra
 * conta vê "sem permissão" (a regra é a defesa, a tela só avisa).
 *
 * Reusa resolveEventState() (mesmo relógio do site), talkKey() e rankQuestions(); tudo por parâmetro (`deps()` dá
 * repositories e login). `pinnedCode` (`?palestra=<código>`) fixa a palestra em qualquer dia e horário. Retoma o login
 * que já estava feito.
 *
 * Esta tela também é quem PUBLICA o quadro da palestra (`talk-boards/<talkKey>`, ver features/board-publisher.js): as
 * perguntas chegam por listener (1 leitura por mudança, sem repetir consulta), os votos são contados no servidor a cada
 * `config.boardPublishMs` e quando o conjunto de aprovadas muda, e o quadro só é regravado se a ordem mudou. Por isso a
 * ordem que a plateia vê só anda com esta tela aberta na palestra (aviso no handoff).
 */
function pickModerationTalk({ schedule, track, now, pinnedSlot = null, allowsQuestions = () => true }) {
  const describe = slot => ({ key: talkKey(slot, track.id), title: slot.talks[track.id].title, data: slot.talks[track.id], questionsEnabled: allowsQuestions(slot.talks[track.id]) });
  if (pinnedSlot) return describe(pinnedSlot);
  const talkSlots = schedule.filter(slot => slot.talks?.[track.id]);
  const state = resolveEventState(now, schedule);
  const slot = state.phase === "live" && state.activeSlot?.talks?.[track.id]
    ? state.activeSlot
    : talkSlots.filter(candidate => candidate.end <= now).pop();
  return slot ? describe(slot) : null;
}

function initQuestionModeration(rootEl, { schedule, track, config, now = () => new Date(), pinnedCode = null, codeOf, deps = defaultModerationDeps, whenReady = runAfterModules, allowsQuestions = talkHighlightsRepository.allowsQuestions, contest = null, hasContest = talkHighlightsRepository.hasContest }) {
  let email = "";
  let watch = null; // { talk, publisher, stopListening, timer } da palestra que está sendo moderada
  let questions = [];
  let counts = {};
  let lastApproved = "";
  let publishing = false;
  let publishAgain = false;
  let notice = "";

  const draw = data => { rootEl.innerHTML = questionModerationMarkup({ trackLabel: track.label, email, ...data }); };
  const drawReady = () => draw({ phase: "ready", talkTitle: watch.talk.title, message: notice, questions: rankQuestions(questions, counts, { statuses: Object.values(QUESTION_STATUS) }) });
  const pickTalk = () => pickModerationTalk({ schedule, track, now: now(), pinnedSlot: findTalkSlotByCode(schedule, track, pinnedCode, codeOf), allowsQuestions });

  /** Conta os votos e regrava o quadro se a ordem mudou; uma publicação por vez (se pediram outra no meio, faz mais uma ao fim). */
  async function publish() {
    if (!watch) return;
    if (publishing) { publishAgain = true; return; }
    publishing = true;
    const current = watch;
    try {
      counts = await current.publisher.publish(questions);
      notice = "";
    } catch {
      notice = "Não consegui atualizar o quadro público agora. Tentando de novo em instantes.";
    }
    publishing = false;
    if (watch === current) drawReady();
    if (publishAgain) { publishAgain = false; publish(); }
  }

  function stopWatching() {
    if (!watch) return;
    watch.stopListening();
    clearInterval(watch.timer);
    watch = null;
    questions = [];
    counts = {};
    lastApproved = "";
    notice = "";
  }

  function onQuestions(docs) {
    questions = docs;
    const approved = approvedSignature(docs);
    if (approved !== lastApproved) { lastApproved = approved; publish(); }
    else drawReady();
  }

  function onListenError(error) {
    draw({ phase: "error", message: error.code === "permission-denied" ? "Sem permissão: essa conta não está na lista de moderadores." : "Não foi possível carregar agora. Tentando de novo em instantes." });
  }

  /**
   * Sessão sem perguntas pelo site (ex.: Coding Jam): se ela tem concurso, liga o painel dele (features/contest-moderation.js);
   * senão só avisa. Nos dois casos confere de tempos em tempos se a sala já passou pra outra palestra.
   */
  function startWithoutQuestions(talk) {
    const contestSession = contest && hasContest(talk.data) ? contest.start({ talk, draw: data => draw({ phase: "contest", talkTitle: talk.title, ...data }) }) : null;
    if (!contestSession) draw({ phase: "empty", message: `${talk.title}: as perguntas ao vivo estão desativadas nesta sessão.` });
    watch = { talk, stopListening: () => contestSession?.stop(), timer: setInterval(() => (pickTalk()?.key !== talk.key ? startWatching() : null), config.boardPublishMs) };
  }

  function startWatching() {
    stopWatching();
    const talk = pickTalk();
    if (!talk) return draw({ phase: "empty", message: "Nenhuma palestra nesta sala por enquanto." });
    if (!talk.questionsEnabled) return startWithoutQuestions(talk);
    const { questions: questionsRepo, votes, boards } = deps();
    watch = {
      talk,
      publisher: createBoardPublisher({ talkKey: talk.key, votes, boards, includeVotes: config.publishVotes }),
      stopListening: () => {},
      // A cada ciclo confere se a sala já passou pra outra palestra; senão, só recalcula a ordem.
      timer: setInterval(() => (pickTalk()?.key !== talk.key ? startWatching() : publish()), config.boardPublishMs),
    };
    drawReady();
    // Por último: o listener pode responder na hora (cache), e aí `watch` já precisa existir.
    watch.stopListening = questionsRepo.listen({ talkKey: talk.key }, onQuestions, onListenError);
  }

  rootEl.addEventListener("click", async event => {
    if (event.target.closest("[data-mod-signin]")) {
      try {
        email = await deps().signIn();
        startWatching();
      } catch (error) {
        console.warn("[moderação] falha no login com Google:", error);
        draw({ phase: "signin", message: signInErrorMessage(error) });
      }
    } else if (event.target.closest("[data-mod-signout]")) {
      stopWatching();
      await deps().signOut();
      email = "";
      draw({ phase: "signin" });
    } else {
      const setBtn = event.target.closest("[data-question-set]");
      if (!setBtn) return;
      setBtn.disabled = true;
      // O listener traz a mudança; se o banco recusar, reabilita o botão.
      await deps().questions.update(setBtn.dataset.questionId, { status: setBtn.dataset.questionSet }).catch(() => { if (watch) drawReady(); });
    }
  });

  draw({ phase: "signin" });
  // Tablet que recarregou (ou dormiu): o login Google persiste, então retoma sozinho sem pedir de novo.
  whenReady(async () => {
    email = (await deps().restore().catch(() => null)) ?? "";
    if (email) startWatching();
  });
}

function defaultModerationDeps() {
  return {
    questions: window.moderationQuestionsRepository,
    votes: window.moderationVotesRepository,
    boards: window.moderationBoardsRepository,
    ...defaultModeratorLoginDeps(),
  };
}
