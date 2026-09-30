/**
 * Cadastro no sorteio: um registro por pessoa (chave fixa "raffle", ver RAFFLE_ENTRY_KEY em
 * features/raffle-signup.js), nome e sobrenome. Sobre createFirestoreRepository (window global, ver
 * firestore-repository.js), mesmo padrão de checkin-repository.js/event-feedback-repository.js.
 */
const raffleEntriesRepository = window.createFirestoreRepository({
  db: window.firebaseClient.db,
  collectionName: "raffle-entries",
  edition: CURRENT_EDITION,
});

window.raffleEntriesRepository = raffleEntriesRepository;
