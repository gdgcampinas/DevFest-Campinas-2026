/**
 * Página: Palestrantes. Galeria extraída do schedule (features/speakers.js)
 * com filtro por trilha (features/track-filter.js, o mesmo da Grade);
 * cada palestra listada abre o mesmo modal de detalhe da Grade, com
 * favoritos, então palestrante, palestra e "Minha agenda" andam juntos.
 */
function initPalestrantes() {
  const reveal = initShell("palestrantes");
  const speakers = extractSpeakers(SCHEDULE, TRACKS, EVENT.timezone);
  const tabsEl = document.querySelector(".tabs");
  const gridEl = document.querySelector(".speakers-grid");

  renderTabs(TRACKS, tabsEl, { counts: speakerCountsByTrack(speakers, TRACKS) });
  const filter = initSpeakerTrackFilter(tabsEl, gridEl);
  renderSpeakersSection(speakers, document.getElementById("speakersSection"), gridEl, { reveal, showAll: () => filter.select(ALL_TRACKS) });

  initFavorites(document.body, favoritesRepository);
  const modal = createTalkModal();
  const calendar = initCalendarActions(document.body, { schedule: SCHEDULE, tracks: TRACKS, event: EVENT, favorites: favoritesRepository });
  initTalkDetails(document.body, { schedule: SCHEDULE, tracks: TRACKS, timezone: EVENT.timezone, reveal, modal, favorites: favoritesRepository, calendar });
}

initPalestrantes();
