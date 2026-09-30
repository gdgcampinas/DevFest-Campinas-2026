/**
 * O que ESTE navegador já fez no sorteio: se a pessoa já se cadastrou. Mesmo padrão local-first de
 * my-feedback.js (persisted-set-repository.js), próprio arquivo porque não é "feedback" — é o cadastro do
 * sorteio, outra coleção do Firestore.
 */
const myRaffleRepository = createPersistedSetRepository({ storageKey: "devfest-campinas-2026:my-raffle" });
