/**
 * Controle remoto do mural (`mural-control/current`: avisos, fixar/pausar, recarregar, emergência), lado do TELÃO: o mural (login anônimo) só LÊ, com escuta (1 leitura por mudança). Quem grava é o moderador
 * (moderationMuralControlRepository, em moderation-repositories.js, mural-controle.html). `type="module"` só por causa do SDK.
 */
window.muralControlRepository = window.createFirestoreDocumentRepository({
  db: window.firebaseClient.db,
  collectionName: "mural-control",
  edition: CURRENT_EDITION,
});
