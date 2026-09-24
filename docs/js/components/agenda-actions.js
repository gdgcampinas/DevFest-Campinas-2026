/**
 * Barra de ações da "Minha agenda": exportar pro calendário, mandar
 * no WhatsApp e copiar o link. Só markup; quem decide quando aparece e
 * o que cada botão faz é features/agenda-share.js e calendar-actions.js.
 */
function agendaActionsMarkup({ count, whatsappUrl }) {
  return `
    <span class="agenda-actions-count">${tn("agenda.saved", count, "{count} palestra salva", "{count} palestras salvas")}</span>
    <button type="button" class="chip-btn" data-agenda-export data-track-event="agenda_export">${iconMarkup("download")}${t("agenda.export", "Exportar (.ics)")}</button>
    <a class="chip-btn" href="${whatsappUrl}" target="_blank" rel="noopener" data-track-event="agenda_share" data-track-target="whatsapp">${iconMarkup("share")}WhatsApp</a>
    <button type="button" class="chip-btn" data-agenda-copy data-track-event="agenda_share" data-track-target="copy">${iconMarkup("link")}<span>${t("agenda.copy", "Copiar link")}</span></button>`;
}
