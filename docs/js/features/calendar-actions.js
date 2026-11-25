/**
 * Feature: ações de calendário por clique, um listener delegado no
 * rootEl. `[data-ics-key]` baixa o .ics de uma palestra;
 * `[data-agenda-export]` baixa o .ics de toda a "Minha agenda"
 * (favoritos em ordem de horário; `parallel` = as rodadas das sessões em paralelo, a Coding Jam, entram junto). Monta o índice de palestras e devolve
 * { index, event, siteUrl }, o contexto que as outras peças reaproveitam.
 */
function initCalendarActions(rootEl, { schedule, tracks, event, favorites, parallel = [], page = "grade.html" }) {
  const index = buildTalkIndex(schedule, tracks, event.timezone, { parallel });
  const siteUrl = new URL(page, document.baseURI).href;
  favorites?.retain(key => index.get(key)); // favorito de uma palestra que não existe mais (ou de outra versão da grade) inflava o contador de "Minha agenda"
  const toEntry = entry => talkToCalendarEntry(entry, event, siteUrl);

  rootEl.addEventListener("click", clickEvent => {
    const single = clickEvent.target.closest("[data-ics-key]");
    if (single) {
      const entry = index.get(single.dataset.icsKey);
      if (entry) downloadTextFile("devfest-campinas-2026-palestra.ics", "text/calendar;charset=utf-8", buildIcs([toEntry(entry)], { calendarName: event.name }));
      return;
    }
    if (clickEvent.target.closest("[data-agenda-export]")) {
      const entries = favorites.getAll().map(key => index.get(key)).filter(Boolean)
        .sort((a, b) => a.slot.start - b.slot.start).map(toEntry);
      if (entries.length) downloadTextFile("devfest-campinas-2026-minha-agenda.ics", "text/calendar;charset=utf-8", buildIcs(entries, { calendarName: t("calendar.agendaName", "{event} (minha agenda)", { event: event.name }) }));
    }
  });

  // contexto reaproveitado por quem monta o modal (initTalkDetails) e pelo compartilhamento
  return { index, event, siteUrl };
}
