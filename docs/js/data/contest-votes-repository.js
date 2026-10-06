/**
 * Votos do concurso da sessão: 1 por check-in (o id do voto é o mesmo do check-in), em projeto de outra pessoa da mesma sessão (`projectId`). Mesmo padrão de feedback-repository.js.
 */
const contestVotesRepository = window.createFirestoreRepository({
  db: window.firebaseClient.db,
  collectionName: "contest-votes",
  edition: CURRENT_EDITION,
});

window.contestVotesRepository = contestVotesRepository;
