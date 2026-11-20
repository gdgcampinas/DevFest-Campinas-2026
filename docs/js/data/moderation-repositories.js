/**
 * Repositories da tela do moderador (moderacao.html, sorteio.html): as mesmas coleções da plateia, mas sobre
 * o app do MODERADOR (window.moderatorClient.db), que tem o login Google dele, separado do da plateia. Mesmo
 * padrão de firestore-repository.js.
 */
const moderationQuestionsRepository = window.createFirestoreRepository({
  db: window.moderatorClient.db,
  collectionName: "talk-questions",
});
const moderationVotesRepository = window.createFirestoreRepository({
  db: window.moderatorClient.db,
  collectionName: "talk-question-votes",
});

const moderationBoardsRepository = window.createFirestoreDocumentRepository({
  db: window.moderatorClient.db,
  collectionName: "talk-boards",
});

/** Cadastros do sorteio, do lado do moderador: só ele lista (ver firestore.rules), a plateia nunca. */
const moderationRaffleEntriesRepository = window.createFirestoreRepository({
  db: window.moderatorClient.db,
  collectionName: "raffle-entries",
});
/** Sorteios já feitos (um por prêmio): só o moderador cria e lista. */
const moderationRaffleDrawsRepository = window.createFirestoreRepository({
  db: window.moderatorClient.db,
  collectionName: "raffle-draws",
});

/** Código atual do QR do sorteio (`raffle-session/current`): só o moderador lê e grava, a plateia nunca. */
const moderationRaffleSessionRepository = window.createFirestoreDocumentRepository({
  db: window.moderatorClient.db,
  collectionName: "raffle-session",
});

/** Rodada atual do sorteio (`raffle-state/current`): só o moderador lê e grava. "Resetar" abre a rodada seguinte. */
const moderationRaffleStateRepository = window.createFirestoreDocumentRepository({
  db: window.moderatorClient.db,
  collectionName: "raffle-state",
});

/** Concurso da sessão (Coding Jam), do lado do moderador: lista projetos e votos, apaga projeto e publica o pódio. */
const moderationContestProjectsRepository = window.createFirestoreRepository({
  db: window.moderatorClient.db,
  collectionName: "contest-projects",
});
const moderationContestVotesRepository = window.createFirestoreRepository({
  db: window.moderatorClient.db,
  collectionName: "contest-votes",
});
const moderationContestResultsRepository = window.createFirestoreDocumentRepository({
  db: window.moderatorClient.db,
  collectionName: "contest-results",
});

/** Fotos escondidas do mural (`mural-hidden/<álbum>`), do lado do moderador: lê e regrava a lista de ids (tirar do ar / voltar ao ar). */
const moderationMuralHiddenRepository = window.createFirestoreDocumentRepository({
  db: window.moderatorClient.db,
  collectionName: "mural-hidden",
});

/** Controle remoto do mural (`mural-control/current`), do lado do moderador: lê o estado e regrava o documento inteiro (aviso, fixar, pausar, recarregar, emergência). */
const moderationMuralControlRepository = window.createFirestoreDocumentRepository({
  db: window.moderatorClient.db,
  collectionName: "mural-control",
});

/** Lista de moderadores (`moderators/<e-mail>`): só o DONO lista, cadastra e apaga (regras do Firestore); a tela do admin (seção Moderadores) é quem usa. */
const moderationModeratorsRepository = window.createFirestoreCollectionRepository({
  db: window.moderatorClient.db,
  collectionName: "moderators",
});

window.moderationModeratorsRepository = moderationModeratorsRepository;
window.moderationMuralControlRepository = moderationMuralControlRepository;
window.moderationMuralHiddenRepository = moderationMuralHiddenRepository;
window.moderationQuestionsRepository = moderationQuestionsRepository;
window.moderationContestProjectsRepository = moderationContestProjectsRepository;
window.moderationContestVotesRepository = moderationContestVotesRepository;
window.moderationContestResultsRepository = moderationContestResultsRepository;
window.moderationBoardsRepository = moderationBoardsRepository;
window.moderationVotesRepository = moderationVotesRepository;
window.moderationRaffleEntriesRepository = moderationRaffleEntriesRepository;
window.moderationRaffleDrawsRepository = moderationRaffleDrawsRepository;
window.moderationRaffleSessionRepository = moderationRaffleSessionRepository;
window.moderationRaffleStateRepository = moderationRaffleStateRepository;
