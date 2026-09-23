/** Números públicos do evento (só o total de inscritos, sem dado pessoal), gravados pelo job do Sympla. Id = edição. */
window.eventStatsRepository = window.createPublicLookupRepository({
  db: window.firebaseClient.db,
  collectionName: "event-stats",
});
