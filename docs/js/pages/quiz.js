/** Página: quiz "Monte sua trilha" (features/quiz.js). */
function initQuizPage() {
  const reveal = initShell("quiz");
  const { questions, copy, scoring } = quizRepository.getAll();
  initQuiz({
    mountEl: document.getElementById("quizSection"),
    questions,
    copy,
    scoring,
    tracks: TRACKS,
    talkIndex: buildTalkIndex(SCHEDULE, TRACKS, EVENT.timezone),
    topicIds: talkTopicsRepository.topicIds(),
    topicsOf: talk => talkTopicsRepository.forTalk(talk),
    favorites: favoritesRepository,
    reveal,
    timezone: EVENT.timezone,
    resultUrl: `${location.origin}${location.pathname}`,
  });
}

initQuizPage();
