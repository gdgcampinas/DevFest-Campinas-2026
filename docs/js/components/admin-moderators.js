/**
 * Marcação da seção Moderadores do admin, em duas colunas no computador: o formulário de cadastro (desenhado UMA vez, quem digita não perde o texto quando a lista muda) e a lista viva (áreas
 * `data-slot`). Só texto escapado e classes do styles.css (.mod, .chip-btn, .feedback-input) e do css/admin.css. Os hooks são `data-*` (features/admin-moderators.js).
 */
function adminModeratorsShellMarkup({ text }) {
  return `<div class="ad-cols">
    <section class="ad-card">
      ${adminCardHeadMarkup({ title: text.addTitle, subtitle: text.intro, icon: "users" })}
      <input class="feedback-input" type="email" inputmode="email" autocomplete="off" autocapitalize="off" spellcheck="false" data-moderator-email placeholder="${escapeHtml(text.placeholder)}">
      <div class="ad-links"><button type="button" class="chip-btn chip-btn--primary" data-moderator-add>${escapeHtml(text.addButton)}</button></div>
      <div data-slot="message"></div>
    </section>
    <section class="ad-card">
      <div data-slot="count"></div>
      <div data-slot="list"></div>
    </section>
  </div>`;
}

/** `list` já em ordem; `armedId` = o e-mail com a remoção armada (2º toque confirma); `selfEmail` ganha a etiqueta "você"; `formatDate(ms)` escreve a data do cadastro. */
function adminModeratorsSlots({ list, armedId = null, selfEmail = "", busy = false, message = "", text, formatDate = () => "" }) {
  const meta = item => [item.addedBy ? `${text.addedBy} ${item.addedBy}` : "", item.createdAtMs ? formatDate(item.createdAtMs) : ""].filter(Boolean).join(" · ");
  const row = item => `<li class="ad-person">${initialAvatarMarkup(item.id)}<div class="ad-person-main"><strong>${escapeHtml(item.id)}${item.id === selfEmail ? ` <small>(${escapeHtml(text.you)})</small>` : ""}</strong>${meta(item) ? `<span>${escapeHtml(meta(item))}</span>` : ""}</div><button type="button" class="chip-btn chip-btn--danger" data-moderator-remove="${escapeHtml(item.id)}"${busy ? " disabled" : ""}>${escapeHtml(item.id === armedId ? text.removeConfirm : text.removeButton)}</button></li>`;
  return {
    message: message ? `<p class="mod-hint mod-notice" role="status">${escapeHtml(message)}</p>` : "",
    count: `<div class="ad-card-head"><div><h2 class="mod-section-title">${escapeHtml(text.listTitle)} <span class="ad-count">${list.length}</span></h2></div></div>`,
    list: list.length
      ? `<ul class="ad-people">${list.map(row).join("")}</ul>`
      : adminEmptyMarkup(text.empty),
  };
}
