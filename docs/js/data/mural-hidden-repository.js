/**
 * Fotos ESCONDIDAS do mural (`mural-hidden/<álbum>`: documento com `ids`, a lista das fotos que o moderador tirou do ar). O mural (plateia, login anônimo) só LÊ, com listener (1 leitura por
 * mudança): a foto some do telão assim que o moderador a esconde. Quem grava é o moderador (moderationMuralHiddenRepository, em moderation-repositories.js). `type="module"` só por causa do SDK.
 */
window.muralHiddenRepository = window.createFirestoreDocumentRepository({
  db: window.firebaseClient.db,
  collectionName: "mural-hidden",
});

/**
 * Fotos APROVADAS do mural (`mural-approved/<álbum>`: documento com `ids`, as fotos que o moderador liberou). Só vale nos álbuns com `approval: true` (data/mural-albums.js): o telão mostra a foto
 * desse álbum só depois de ela entrar nessa lista. Mesmo contrato do `mural-hidden` (o mural só lê com listener; quem grava é o moderador, moderationMuralApprovedRepository).
 */
window.muralApprovedRepository = window.createFirestoreDocumentRepository({
  db: window.firebaseClient.db,
  collectionName: "mural-approved",
});
