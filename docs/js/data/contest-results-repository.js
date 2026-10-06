/**
 * Pódio de cada sessão com concurso (`contest-results/<talkKey>`): escrito pelo moderador de uma vez, quando decide mostrar o
 * resultado, e lido pela plateia, pelos cards da grade e pelo quadro da sala. Um documento por sessão, como talk-boards-repository.js.
 */
const contestResultsRepository = window.createFirestoreDocumentRepository({
  db: window.firebaseClient.db,
  collectionName: "contest-results",
  edition: CURRENT_EDITION,
});

window.contestResultsRepository = contestResultsRepository;
