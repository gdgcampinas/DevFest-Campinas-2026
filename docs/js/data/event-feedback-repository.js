/**
 * Feedback do evento inteiro (fim de dia): 1 registro por pessoa por
 * edição — a "chave" aqui é a própria edição (`CURRENT_EDITION`), não
 * uma palestra. Mesmo padrão de checkin-repository.js.
 */
const eventFeedbackRepository = window.createFirestoreRepository({
  db: window.firebaseClient.db,
  collectionName: "event-feedback",
  edition: CURRENT_EDITION,
});

window.eventFeedbackRepository = eventFeedbackRepository;
