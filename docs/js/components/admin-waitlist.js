/**
 * Marcação da seção Lista de espera do admin: o cabeçalho com o total, a barra (busca, baixar CSV, copiar e-mails) e a lista viva (áreas `data-slot`, a busca é desenhada UMA vez pra quem digita não perder o
 * texto). Só texto escapado e classes do styles.css (.mod, .chip-btn, .feedback-input) e do css/admin.css; os hooks são `data-*` (features/admin-waitlist.js). Nome e e-mail vêm da plateia: sempre escapados.
 */
function adminWaitlistShellMarkup({ text }) {
  return `<section class="ad-card ad-card--wide">
    <div data-slot="count"></div>
    <p class="mod-hint">${escapeHtml(text.intro)}</p>
    <div class="ad-wl-bar">
      <input class="feedback-input" type="search" autocomplete="off" spellcheck="false" data-waitlist-search placeholder="${escapeHtml(text.searchPlaceholder)}" aria-label="${escapeHtml(text.searchPlaceholder)}">
      <button type="button" class="chip-btn chip-btn--primary" data-waitlist-download>${escapeHtml(text.downloadButton)}</button>
      <button type="button" class="chip-btn" data-waitlist-copy>${escapeHtml(text.copyButton)}</button>
    </div>
    <div data-slot="message"></div>
    <div data-slot="list"></div>
  </section>`;
}

/** `total` = cadastros, `unique` = pessoas (e-mails diferentes); `list` já filtrada e em ordem; `armedId` = a remoção armada (2º toque confirma). `formatDate(ms)` escreve a data. */
function adminWaitlistSlots({ list, total, unique, query = "", armedId = null, busy = false, message = "", text, formatDate = () => "" }) {
  const meta = item => [item.source ? `${text.sourceLabel}: ${item.source}` : "", item.lang ? item.lang.toUpperCase() : "", item.createdAtMs ? formatDate(item.createdAtMs) : ""].filter(Boolean).join(" · ");
  const row = item => `<li class="ad-person">${initialAvatarMarkup(item.name || item.email)}<div class="ad-person-main"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.email)}</span>${meta(item) ? `<span>${escapeHtml(meta(item))}</span>` : ""}</div><button type="button" class="chip-btn chip-btn--danger" data-waitlist-remove="${escapeHtml(item.id)}"${busy ? " disabled" : ""}>${escapeHtml(item.id === armedId ? text.removeConfirm : text.removeButton)}</button></li>`;
  const duplicates = total - unique;
  return {
    count: `<div class="ad-card-head">${adminIconMarkup("mail")}<div><h2 class="mod-section-title">${escapeHtml(text.title)} <span class="ad-count">${unique}</span></h2>${duplicates > 0 ? `<p class="mod-hint">${escapeHtml(text.duplicates.replace("{n}", duplicates))}</p>` : ""}</div></div>`,
    message: message ? `<p class="mod-hint mod-notice" role="status">${escapeHtml(message)}</p>` : "",
    list: list.length ? `<ul class="ad-people">${list.map(row).join("")}</ul>` : adminEmptyMarkup(query ? text.noMatch : text.empty),
  };
}
