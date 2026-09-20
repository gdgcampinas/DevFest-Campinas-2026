/**
 * Botões "Adicionar ao calendário" de uma palestra (modal de detalhe):
 * link do Google Agenda + download .ics (Apple, Outlook). O .ics é
 * gerado por features/calendar-actions.js a partir de data-ics-key.
 */
function calendarLinksMarkup({ googleUrl, key }) {
  return `
    <div class="cal-links">
      <span class="cal-label">${iconMarkup("calendar")}Adicionar ao calendário</span>
      <a class="cal-link" href="${googleUrl}" target="_blank" rel="noopener" data-track-event="calendar_add" data-track-target="google">Google Agenda</a>
      <button type="button" class="cal-link" data-ics-key="${key}" data-track-event="calendar_add" data-track-target="ics">Apple / Outlook (.ics)</button>
    </div>`;
}
