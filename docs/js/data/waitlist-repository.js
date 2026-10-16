/**
 * Lista de espera dos ingressos, do lado da PLATEIA: 1 documento por aparelho (id "<uid>_interest"), criado uma vez (a regra recusa o segundo como "update"); a pessoa lê só o próprio
 * (pra mostrar "você já está na lista"). Mesmo padrão de wall-repository.js; o nome da coleção vem de data/waitlist-config.js.
 */
const waitlistRepository = window.createFirestoreRepository({
  db: window.firebaseClient.db,
  collectionName: WAITLIST_CONFIG.collection,
  edition: CURRENT_EDITION,
});

window.waitlistRepository = waitlistRepository;
