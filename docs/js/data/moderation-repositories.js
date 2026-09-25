/**
 * Repositories da tela do moderador (moderacao.html): as mesmas coleções da plateia, mas sobre o app do MODERADOR
 * (window.moderatorClient.db), que tem o login Google dele, separado do da plateia. Mesmo padrão de
 * talk-questions-repository.js.
 */
const moderationQuestionsRepository = window.createFirestoreRepository({
  db: window.moderatorClient.db,
  collectionName: "talk-questions",
  edition: CURRENT_EDITION,
});
const moderationVotesRepository = window.createFirestoreRepository({
  db: window.moderatorClient.db,
  collectionName: "talk-question-votes",
  edition: CURRENT_EDITION,
});

const moderationBoardsRepository = window.createFirestoreDocumentRepository({
  db: window.moderatorClient.db,
  collectionName: "talk-boards",
  edition: CURRENT_EDITION,
});

window.moderationQuestionsRepository = moderationQuestionsRepository;
window.moderationBoardsRepository = moderationBoardsRepository;
window.moderationVotesRepository = moderationVotesRepository;
