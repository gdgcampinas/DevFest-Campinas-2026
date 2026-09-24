/** Página: quiz "Monte sua trilha" (features/quiz.js). */
function initQuizPage() {
  const reveal = initShell("quiz");
  const { questions, copy } = quizRepository.getAll();
  initQuiz({
    mountEl: document.getElementById("quizSection"),
    questions,
    copy,
    tracks: TRACKS,
    talkIndex: buildTalkIndex(SCHEDULE, TRACKS, EVENT.timezone),
    favorites: favoritesRepository,
    reveal,
    timezone: EVENT.timezone,
    resultUrl: `${location.origin}${location.pathname}`,
  });
}

initQuizPage();
