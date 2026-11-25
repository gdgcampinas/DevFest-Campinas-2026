/**
 * Página: Palestrantes. Galeria extraída do schedule (features/speakers.js)
 * com filtro por trilha (features/track-filter.js, o mesmo da Grade);
 * cada palestra listada abre o mesmo modal de detalhe da Grade, com
 * favoritos, então palestrante, palestra e "Minha agenda" andam juntos.
 */
function initPalestrantes() {
  const reveal = initShell("palestrantes");
  const parallel = parallelSpeakers({ sessions: parallelSessionsRepository.visible({ devMode: isDevModeStored() }), tracks: TRACKS, findHost: name => sponsorsRepository.findByName(name) }); // a Liga (Coding Jam), que não está na grade
  const speakers = sortSpeakersByName([...extractSpeakers(SCHEDULE, TRACKS, EVENT.timezone), ...parallel]); // alfabética: o mais fácil de achar alguém
  const tabsEl = document.querySelector(".tabs");
  const gridEl = document.querySelector(".speakers-grid");

  renderTabs(TRACKS, tabsEl, { counts: speakerCountsByTrack(speakers, TRACKS) });
  const filter = initSpeakerTrackFilter(tabsEl, gridEl);
  toggleBadgedHeader(speakers, document.getElementById("gdeSection"), { reveal });
  renderSpeakersSection(speakers, document.getElementById("speakersSection"), gridEl, { reveal, showAll: () => filter.select(ALL_TRACKS) });

  initFavorites(document.body, favoritesRepository);
  const agendaPromo = defaultAgendaPromo();
  initInviteSlot(document.getElementById("agendaTip"), { render: () => agendaPromo.tipMarkup("speakersTip"), subscribe: favoritesRepository.subscribe });
  const modal = createTalkModal();
  initSpeakerPhotoZoom();
  const wallInvite = defaultWallInvite();
  const calendar = initCalendarActions(document.body, { schedule: SCHEDULE, tracks: TRACKS, event: EVENT, favorites: favoritesRepository });
  const { feedback, questions, contest } = initFeedbackFlow({ calendar, reveal, createModal, invite: wallInvite.linkMarkup });
  initTalkDetails(document.body, { schedule: SCHEDULE, tracks: TRACKS, timezone: EVENT.timezone, reveal, modal, favorites: favoritesRepository, calendar, feedback, questions, contest });
}

initPalestrantes();
