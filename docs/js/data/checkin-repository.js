/**
 * Check-in numa palestra: 1 registro por pessoa (uid anônimo) por
 * `talkKey`. Sobre createFirestoreRepository (window global, ver
 * firestore-repository.js) — mesmo tipo="module" só pelo SDK, mas o
 * resultado (`checkinRepository`) chega ao resto do site como um
 * repository comum, `window.checkinRepository`, usado dentro de
 * handlers de clique (depois que a página já carregou, nunca no
 * bootstrap síncrono — ver nota em firebase-client.js sobre ordem de
 * execução de módulo vs script clássico).
 */
const checkinRepository = window.createFirestoreRepository({
  db: window.firebaseClient.db,
  collectionName: "checkins",
  edition: CURRENT_EDITION,
});

window.checkinRepository = checkinRepository;
