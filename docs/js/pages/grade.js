/**
 * Página: Grade. Só a agenda completa (legenda, filtro, modal de
 * detalhe) — sem hero/pill/sticky, mas marca slot ativo/passado do
 * mesmo jeito (createLiveStatus funciona com `elements` parcial).
 */
function initGrade() {
  const reveal = initShell("grade");

  const tabsEl = document.querySelector(".tabs");
  const agendaEl = document.getElementById("agenda");
  renderLegend(TRACKS, document.querySelector(".tracks-legend"));
  renderTabs(TRACKS, tabsEl);
  renderAgenda(SCHEDULE, TRACKS, EVENT.timezone, agendaEl, { reveal, favorites: favoritesRepository });
  initTrackFilter(tabsEl, agendaEl);

  initFavorites(document.body, favoritesRepository);
  const favToggleEl = document.getElementById("favToggle");
  renderFavoritesToggle(favToggleEl, "Minha agenda");
  initFavoritesFilter({ toggleEl: favToggleEl, scopeEl: agendaEl, emptyEl: document.getElementById("favoritesEmpty"), repository: favoritesRepository });

  const calendar = initCalendarActions(document.body, { schedule: SCHEDULE, tracks: TRACKS, event: EVENT, favorites: favoritesRepository });
  initAgendaShare({ mountEl: document.getElementById("agendaActions"), favorites: favoritesRepository, index: calendar.index, baseUrl: calendar.siteUrl });
  initSharedAgendaBanner({
    bannerEl: document.getElementById("sharedAgendaBanner"),
    favorites: favoritesRepository,
    index: calendar.index,
    onSaved: () => { if (!agendaEl.classList.contains("favs-only")) favToggleEl.click(); },
  });

  const modal = createTalkModal();
  initTalkDetails(document.body, { schedule: SCHEDULE, tracks: TRACKS, timezone: EVENT.timezone, reveal, modal, favorites: favoritesRepository, calendar });

  const liveStatus = createLiveStatus({ schedule: SCHEDULE, tracks: TRACKS, event: EVENT, reveal, favorites: favoritesRepository, now: resolveNow() });
  liveStatus.tick();
  setInterval(liveStatus.tick, 1000);
}

initGrade();
