/**
 * Lista de espera dos ingressos, do lado do MODERADOR (app com o login Google dele, separado do da plateia): lista tudo ao vivo, apaga uma pessoa (pedido de saída) e conta. Só a área de admin
 * carrega este arquivo. Mesmo padrão de wall-moderation-repository.js; o nome da coleção vem de data/waitlist-config.js.
 */
const moderationWaitlistRepository = window.createFirestoreRepository({
  db: window.moderatorClient.db,
  collectionName: WAITLIST_CONFIG.collection,
  edition: CURRENT_EDITION,
});

window.moderationWaitlistRepository = moderationWaitlistRepository;
