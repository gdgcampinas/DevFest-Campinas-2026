/**
 * Votos nas perguntas: 1 por pessoa por pergunta (`entryKey` = id da
 * pergunta, `talkKey` = palestra dela). Mesmo padrão de feedback-repository.js.
 */
const talkQuestionVotesRepository = window.createFirestoreRepository({
  db: window.firebaseClient.db,
  collectionName: "talk-question-votes",
  edition: CURRENT_EDITION,
});

window.talkQuestionVotesRepository = talkQuestionVotesRepository;
