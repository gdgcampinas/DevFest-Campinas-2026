/**
 * Página: Palestrantes. Galeria extraída do schedule (features/speakers.js);
 * cada palestra listada abre o mesmo modal de detalhe da Grade, com
 * favoritos, então palestrante, palestra e "Minha agenda" andam juntos.
 */
function initPalestrantes() {
  const reveal = initShell("palestrantes");
  renderSpeakersSection(SCHEDULE, TRACKS, document.getElementById("speakersSection"), document.querySelector(".speakers-grid"), { reveal, timezone: EVENT.timezone });

  initFavorites(document.body, favoritesRepository);
  const modal = createTalkModal(document.getElementById("talkModal"), document.getElementById("talkModalContent"));
  initTalkDetails(document.body, { schedule: SCHEDULE, tracks: TRACKS, timezone: EVENT.timezone, reveal, modal, favorites: favoritesRepository });
}

initPalestrantes();
