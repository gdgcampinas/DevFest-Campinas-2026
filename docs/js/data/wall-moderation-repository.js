/**
 * Recados do mural, do lado do MODERADOR (app com o login Google dele, separado do da plateia): lista tudo, muda o estado (aprovar, recusar, tirar do ar) e conta os pendentes. Só a área de admin
 * carrega este arquivo (nenhuma outra tela de moderação precisa dele). Mesmo padrão de moderation-repositories.js; o nome da coleção vem de data/wall-config.js.
 */
const moderationWallRepository = window.createFirestoreRepository({
  db: window.moderatorClient.db,
  collectionName: WALL_CONFIG.collection,
  edition: CURRENT_EDITION,
});

window.moderationWallRepository = moderationWallRepository;
