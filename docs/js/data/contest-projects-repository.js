/**
 * Projetos do concurso da sessão: 1 por pessoa por `talkKey` (id "<uid>_<talkKey>"), cadastrados com check-in e durante a sessão (a regra exige). Mesmo padrão de feedback-repository.js.
 */
const contestProjectsRepository = window.createFirestoreRepository({
  db: window.firebaseClient.db,
  collectionName: "contest-projects",
  edition: CURRENT_EDITION,
});

window.contestProjectsRepository = contestProjectsRepository;
