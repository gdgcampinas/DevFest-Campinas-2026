/**
 * O que ESTE navegador já fez de feedback: check-ins e avaliações (chaves de
 * palestra, e "event-end" pro evento). O uid anônimo do Firebase também é por
 * navegador, então isto equivale ao que existe no Firestore pra esta pessoa,
 * sem gastar leituras (limite do plano grátis) pra montar "Minhas palestras".
 * Trocar o storage é editar só estas linhas.
 */
const myCheckinsRepository = createPersistedSetRepository({ storageKey: "devfest-campinas-2026:my-checkins" });
const myRatingsRepository = createPersistedSetRepository({ storageKey: "devfest-campinas-2026:my-ratings" });
