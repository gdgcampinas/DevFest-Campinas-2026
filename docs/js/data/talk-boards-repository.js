/**
 * Quadro público de cada palestra (`talk-boards/<talkKey>`): as perguntas aprovadas na ordem certa, escrito pelo moderador
 * e lido pela plateia e pelo quadro da sala. É a única leitura das perguntas ao vivo pelo celular: 1 documento por
 * palestra em vez de reler todas as perguntas e todos os votos (ver features/board-publisher.js).
 */
const talkBoardsRepository = window.createFirestoreDocumentRepository({
  db: window.firebaseClient.db,
  collectionName: "talk-boards",
  edition: CURRENT_EDITION,
});

window.talkBoardsRepository = talkBoardsRepository;
