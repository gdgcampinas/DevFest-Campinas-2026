/**
 * Recados do mural, do lado da PLATEIA: 1 documento por aparelho e espaço (id "<uid>_wall-<1..3>"), sempre criado como `pending` (a regra exige). Só cria e lê o próprio (o telão lê os
 * aprovados por `listen({ status: "approved" })`, ver data/mural-sources.js). Mesmo padrão de contest-projects-repository.js; o nome da coleção vem de data/wall-config.js.
 */
const wallRepository = window.createFirestoreRepository({
  db: window.firebaseClient.db,
  collectionName: WALL_CONFIG.collection,
  edition: CURRENT_EDITION,
});

window.wallRepository = wallRepository;
