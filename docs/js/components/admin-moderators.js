/**
 * Marcação da seção Moderadores do admin: o formulário (desenhado UMA vez, quem digita não perde o texto quando a lista muda) e a lista viva (áreas `data-slot`). Só texto escapado e classes do
 * styles.css (.mod, .chip-btn, .feedback-input) e do css/admin.css. Os hooks são `data-*` (features/admin-moderators.js).
 */
function adminModeratorsShellMarkup({ text }) {
  return `<p class="mod-hint">${escapeHtml(text.intro)}</p>
    <div class="ad-card">
      <h2 class="mod-section-title">${escapeHtml(text.addTitle)}</h2>
      <input class="feedback-input" type="email" inputmode="email" autocomplete="off" autocapitalize="off" spellcheck="false" data-moderator-email placeholder="${escapeHtml(text.placeholder)}">
      <div class="ad-links"><button type="button" class="chip-btn chip-btn--primary" data-moderator-add>${escapeHtml(text.addButton)}</button></div>
    </div>
    <div data-slot="message"></div>
    <div data-slot="list"></div>`;
}

/** `list` já em ordem; `armedId` = o e-mail com a remoção armada (2º toque confirma); `selfEmail` ganha a etiqueta "você". */
function adminModeratorsSlots({ list, armedId = null, selfEmail = "", busy = false, message = "", text }) {
  const row = item => `<li class="ad-card"><span>${escapeHtml(item.id)}${item.id === selfEmail ? ` <small>(${escapeHtml(text.you)})</small>` : ""}</span><button type="button" class="chip-btn chip-btn--danger" data-moderator-remove="${escapeHtml(item.id)}"${busy ? " disabled" : ""}>${escapeHtml(item.id === armedId ? text.removeConfirm : text.removeButton)}</button></li>`;
  return {
    message: message ? `<p class="mod-hint mod-notice" role="status">${escapeHtml(message)}</p>` : "",
    list: list.length ? `<ul class="ad-list">${list.map(row).join("")}</ul>` : `<p class="mod-hint">${escapeHtml(text.empty)}</p>`,
  };
}
