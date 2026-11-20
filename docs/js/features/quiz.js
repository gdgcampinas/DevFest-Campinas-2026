/**
 * Feature: quiz "Monte sua trilha". Máquina de passos (intro -> perguntas
 * -> resultado) sobre o dado de data/quiz.js e a pontuação de
 * quiz-scoring.js. Tudo entra por parâmetro: perguntas, textos, trilhas,
 * índice de palestras, assuntos das palestras e favoritos (nada global além das funções puras).
 *
 * As respostas pontuam ASSUNTOS (data/talk-topics.js). Cada palestra pontua pelos assuntos
 * dela; a trilha do resultado é a que reúne as melhores palestras pra pessoa, e a agenda sugerida
 * é uma palestra por horário, de qualquer trilha, sem choque. Com `reveal` o resultado lista essas
 * palestras e adiciona à "Minha agenda"; sem `reveal` (palestras ainda mock) mostra só a trilha.
 * `?trilha=<id>` abre direto o resultado de outra pessoa (3 palestras espalhadas da trilha).
 */
const QUIZ_TRACK_PARAM = "trilha";
const QUIZ_TALKS_COUNT = 4;
const QUIZ_TRACK_TOP_TALKS = 3;

function initQuiz({ mountEl, questions, copy, tracks, talkIndex, topicIds, topicsOf, favorites, reveal, timezone, resultUrl, search = location.search }) {
  const trackById = id => tracks.find(track => track.id === id);
  const trackIds = tracks.map(track => track.id);
  const sharedTrack = trackById(new URLSearchParams(search).get(QUIZ_TRACK_PARAM));
  let state = sharedTrack ? { step: "result", shared: true, result: { winnerId: sharedTrack.id, runnerUpId: null, entries: spreadOf(sharedTrack.id) } } : { step: "intro" };
  let choices = {};
  let agendaAdded = false;

  const urlFor = trackId => `${resultUrl}?${QUIZ_TRACK_PARAM}=${trackId}`;

  function spreadOf(trackId) {
    return reveal ? pickSpread(talkIndex.getAll().filter(entry => entry.track.id === trackId), QUIZ_TALKS_COUNT) : [];
  }

  /** Resultado de quem respondeu: trilha, vice e agenda saem das palestras que mais pontuam (sem pontuação nenhuma = primeira trilha, sem palestras). */
  function personalResult() {
    const topicScores = scoreQuiz(questions, choices, topicIds).scores;
    const scored = scoreTalks(talkIndex.getAll(), topicScores, topicsOf);
    const { winnerId, runnerUpId } = rankTracks(scored, trackIds, QUIZ_TRACK_TOP_TALKS);
    return { winnerId, runnerUpId, entries: reveal ? pickAgenda(scored, QUIZ_TALKS_COUNT) : [] };
  }

  function resultMarkup() {
    state.result ??= personalResult();
    const { winnerId, runnerUpId, entries } = state.result;
    const track = trackById(winnerId);
    return quizResultMarkup({
      track,
      runnerUp: runnerUpId ? trackById(runnerUpId) : null,
      talks: entries.map(entry => ({
        timeLabel: formatEventTime(entry.slot.start, timezone),
        title: entry.data.title,
        speakerNames: talkSpeakerNames(entry.data),
        roomLabel: tt(entry.track.room),
      })),
      talksHint: state.shared ? "" : copy.suggestedHint,
      talksNotice: copy.talksSoon,
      agendaAdded,
      whatsappUrl: `https://wa.me/?text=${encodeURIComponent(`${copy.shareMessage(track.label)} ${urlFor(winnerId)}`)}`,
      sharedBanner: state.shared ? copy.sharedBanner(track.label) : null,
      copy,
    });
  }

  function render() {
    if (state.step === "intro") mountEl.innerHTML = quizIntroMarkup(copy);
    else if (state.step === "result") mountEl.innerHTML = resultMarkup();
    else {
      const question = questions[state.step];
      mountEl.innerHTML = quizQuestionMarkup({ question, index: state.step, total: questions.length, selectedId: choices[question.id], isLast: state.step === questions.length - 1, copy });
    }
    mountEl.querySelector("[data-quiz-focus]")?.focus({ preventScroll: false });
  }

  function go(step) {
    state = { ...state, step };
    render();
  }

  mountEl.addEventListener("change", event => {
    if (!event.target.matches("[data-quiz-answer]")) return;
    choices[questions[state.step].id] = event.target.value;
    mountEl.querySelector("[data-quiz-next]").disabled = false;
  });

  mountEl.addEventListener("click", event => {
    const has = selector => event.target.closest(selector);
    if (has("[data-quiz-start]")) go(0);
    else if (has("[data-quiz-back]")) go(state.step - 1);
    else if (has("[data-quiz-next]")) go(state.step === questions.length - 1 ? "result" : state.step + 1);
    else if (has("[data-quiz-restart]")) {
      choices = {};
      agendaAdded = false;
      state = { step: 0 };
      render();
    } else if (has("[data-quiz-copy]")) {
      copyWithFeedback(urlFor(state.result.winnerId), { labelEl: has("[data-quiz-copy]").querySelector("span"), idleText: copy.share, doneText: copy.shared });
    } else if (has("[data-quiz-add-agenda]")) {
      favorites.addAll(state.result.entries.map(entry => entry.key));
      agendaAdded = true;
      render();
    }
  });

  render();
}
