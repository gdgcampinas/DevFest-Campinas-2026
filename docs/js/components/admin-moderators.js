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

/** Link do convite (abre o Gmail em outra aba); sem convite liberado ou sem endereço, nada. */
function adminModeratorInviteLink(invite, emails, label, hook) {
  const url = invite?.urlFor(emails);
  return url ? `<a class="chip-btn" ${hook} href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(label)}</a>` : "";
}

/**
 * `list` já em ordem; `armedId` = o e-mail com a remoção armada (2º toque confirma); `selfEmail` ganha a etiqueta "você"; `formatDate(ms)` escreve a data do cadastro; `invite` (opcional,
 * features/moderator-invite.js): "Convidar" em cada linha e "Convidar todos" no topo; `seen` (opcional, Map e-mail → ms do último acesso) mostra quem já entrou (`formatSeen(ms)` escreve a hora). A lista só é lida pela conta dona (regras do Firestore), então só ela vê os botões.
 */
function adminModeratorsSlots({ list, armedId = null, selfEmail = "", busy = false, message = "", text, formatDate = () => "", invite = null, seen = null, formatSeen = () => "" }) {
  const meta = item => [item.addedBy ? `${text.addedBy} ${item.addedBy}` : "", item.createdAtMs ? formatDate(item.createdAtMs) : ""].filter(Boolean).join(" · ");
  const others = list.filter(item => item.id !== selfEmail);
  const status = item => (!seen || item.id === selfEmail ? "" : seen.has(item.id)
    ? `<span class="ad-seen ad-seen--yes">${escapeHtml(`${text.seen} ${formatSeen(seen.get(item.id))}`.trim())}</span>`
    : `<span class="ad-seen">${escapeHtml(text.notSeen)}</span>`);
  const summary = seen && others.length ? `<p class="mod-hint">${escapeHtml(text.seenCount.replace("{seen}", others.filter(item => seen.has(item.id)).length).replace("{total}", others.length))}</p>` : "";
  const row = item => `<li class="ad-person">${initialAvatarMarkup(item.id)}<div class="ad-person-main"><strong>${escapeHtml(item.id)}${item.id === selfEmail ? ` <small>(${escapeHtml(text.you)})</small>` : ""}</strong>${meta(item) ? `<span>${escapeHtml(meta(item))}</span>` : ""}${status(item)}</div><div class="ad-person-actions">${item.id === selfEmail ? "" : adminModeratorInviteLink(invite, [item.id], invite?.text.button, "data-moderator-invite")}<button type="button" class="chip-btn chip-btn--danger" data-moderator-remove="${escapeHtml(item.id)}"${busy ? " disabled" : ""}>${escapeHtml(item.id === armedId ? text.removeConfirm : text.removeButton)}</button></div></li>`;
  const inviteAll = adminModeratorInviteLink(invite, list.map(item => item.id).filter(id => id !== selfEmail), invite?.text.allButton, "data-moderator-invite-all");
  return {
    message: message ? `<p class="mod-hint mod-notice" role="status">${escapeHtml(message)}</p>` : "",
    count: `<div class="ad-card-head"><div><h2 class="mod-section-title">${escapeHtml(text.listTitle)} <span class="ad-count">${list.length}</span></h2></div></div>${summary}${inviteAll ? `<div class="ad-links">${inviteAll}</div><p class="mod-hint">${escapeHtml(invite.text.hint)}</p>` : ""}`,
    list: list.length
      ? `<ul class="ad-people">${list.map(row).join("")}</ul>`
      : adminEmptyMarkup(text.empty),
  };
}
