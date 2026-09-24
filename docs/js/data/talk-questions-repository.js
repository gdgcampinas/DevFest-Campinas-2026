/**
 * Perguntas da plateia por palestra: 1 por pessoa por `talkKey`, criada
 * depois do check-in (a regra exige). Mesmo padrão de feedback-repository.js.
 */
const talkQuestionsRepository = window.createFirestoreRepository({
  db: window.firebaseClient.db,
  collectionName: "talk-questions",
  edition: CURRENT_EDITION,
});

window.talkQuestionsRepository = talkQuestionsRepository;
