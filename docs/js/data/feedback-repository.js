/**
 * Feedback de uma palestra: nota (1-5) + "o que mais gostou" + nome
 * opcional, 1 registro por pessoa por `talkKey`. Mesmo padrão de
 * checkin-repository.js.
 */
const feedbackRepository = window.createFirestoreRepository({
  db: window.firebaseClient.db,
  collectionName: "talk-feedback",
  edition: CURRENT_EDITION,
});

window.feedbackRepository = feedbackRepository;
