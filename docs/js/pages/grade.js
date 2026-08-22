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
  renderAgenda(SCHEDULE, TRACKS, EVENT.timezone, agendaEl, { reveal });
  initTrackFilter(tabsEl, agendaEl);

  const modal = createTalkModal(document.getElementById("talkModal"), document.getElementById("talkModalContent"));
  initTalkDetails(document.body, { schedule: SCHEDULE, tracks: TRACKS, timezone: EVENT.timezone, reveal, modal });

  const liveStatus = createLiveStatus({ schedule: SCHEDULE, tracks: TRACKS, event: EVENT, reveal, now: resolveNow() });
  liveStatus.tick();
  setInterval(liveStatus.tick, 1000);
}

initGrade();
