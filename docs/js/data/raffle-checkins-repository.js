/**
 * Check-in do sorteio: prova de presença, feito com o QR/link que a organização mostra NO evento
 * (`sorteio.html?checkin=1`). Sem ele, a regra do Firestore recusa o cadastro (raffle-entries) — é isso que
 * garante que o cadastro só abre durante o evento e só pra quem está lá. Mesmo padrão de
 * checkin-repository.js.
 */
const raffleCheckinsRepository = window.createFirestoreRepository({
  db: window.firebaseClient.db,
  collectionName: "raffle-checkins",
  edition: CURRENT_EDITION,
});

window.raffleCheckinsRepository = raffleCheckinsRepository;
