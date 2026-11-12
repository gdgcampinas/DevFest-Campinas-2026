/**
 * Feature: quiz "Monte sua trilha". Máquina de passos (intro -> perguntas
 * -> resultado) sobre o dado de data/quiz.js e a pontuação de
 * quiz-scoring.js. Tudo entra por parâmetro: perguntas, textos, trilhas,
 * índice de palestras e favoritos (nada global além das funções puras).
 *
 * Resultado: a trilha vencedora (e a segunda, se pontuou). Com `reveal`,
 * também sugere palestras da trilha e adiciona à "Minha agenda"; sem
 * `reveal` (PROD antes da revelação) mostra só a trilha, porque as
 * palestras ainda são mock. `?trilha=<id>` abre direto o resultado.
 */
const QUIZ_TRACK_PARAM = "trilha";
const QUIZ_TALKS_COUNT = 3;

function initQuiz({ mountEl, questions, copy, tracks, talkIndex, favorites, reveal, timezone, resultUrl, search = location.search }) {
  const trackById = id => tracks.find(track => track.id === id);
  const trackIds = tracks.map(track => track.id);
  const sharedTrack = trackById(new URLSearchParams(search).get(QUIZ_TRACK_PARAM));
  let state = sharedTrack ? { step: "result", trackId: sharedTrack.id, shared: true } : { step: "intro" };
  let choices = {};
  let agendaAdded = false;

  const urlFor = trackId => `${resultUrl}?${QUIZ_TRACK_PARAM}=${trackId}`;

  function suggestedEntries(trackId) {
    if (!reveal) return [];
    return pickSpread(talkIndex.getAll().filter(entry => entry.track.id === trackId), QUIZ_TALKS_COUNT);
  }

  function resultMarkup() {
    const { winnerId, runnerUpId } = state.shared
      ? { winnerId: state.trackId, runnerUpId: null }
      : scoreQuiz(questions, choices, trackIds);
    const track = trackById(winnerId);
    state.trackId = winnerId;
    const entries = suggestedEntries(winnerId);
    return quizResultMarkup({
      track,
      runnerUp: runnerUpId ? trackById(runnerUpId) : null,
      talks: entries.map(entry => ({
        timeLabel: formatEventTime(entry.slot.start, timezone),
        title: entry.data.title,
        speakerNames: speakerList(entry.data).map(speaker => speaker.name).join(` ${t("common.and", "e")} `),
      })),
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
      copyWithFeedback(urlFor(state.trackId), { labelEl: has("[data-quiz-copy]").querySelector("span"), idleText: copy.share, doneText: copy.shared });
    } else if (has("[data-quiz-add-agenda]")) {
      favorites.addAll(suggestedEntries(state.trackId).map(entry => entry.key));
      agendaAdded = true;
      render();
    }
  });

  render();
}
