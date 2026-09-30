/**
 * Repositories da tela do moderador (moderacao.html, sorteio.html): as mesmas coleções da plateia, mas sobre
 * o app do MODERADOR (window.moderatorClient.db), que tem o login Google dele, separado do da plateia. Mesmo
 * padrão de firestore-repository.js.
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

/** Cadastros do sorteio, do lado do moderador: só ele lista (ver firestore.rules), a plateia nunca. */
const moderationRaffleEntriesRepository = window.createFirestoreRepository({
  db: window.moderatorClient.db,
  collectionName: "raffle-entries",
  edition: CURRENT_EDITION,
});
/** Sorteios já feitos (um por prêmio): só o moderador cria e lista. */
const moderationRaffleDrawsRepository = window.createFirestoreRepository({
  db: window.moderatorClient.db,
  collectionName: "raffle-draws",
  edition: CURRENT_EDITION,
});

/** Código atual do QR do sorteio (`raffle-session/current`): só o moderador lê e grava, a plateia nunca. */
const moderationRaffleSessionRepository = window.createFirestoreDocumentRepository({
  db: window.moderatorClient.db,
  collectionName: "raffle-session",
  edition: CURRENT_EDITION,
});

window.moderationQuestionsRepository = moderationQuestionsRepository;
window.moderationBoardsRepository = moderationBoardsRepository;
window.moderationVotesRepository = moderationVotesRepository;
window.moderationRaffleEntriesRepository = moderationRaffleEntriesRepository;
window.moderationRaffleDrawsRepository = moderationRaffleDrawsRepository;
window.moderationRaffleSessionRepository = moderationRaffleSessionRepository;
