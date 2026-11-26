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

/**
 * O botão do convite. Com envio pelo site (`invite.send`) é um botão em dois toques (`armedId` = "invite:<key>"; `key` = o e-mail, ou "*" pra todos); sem envio é o link que abre o Gmail em outra aba.
 * Sem convite liberado ou sem destinatário, nada.
 */
function adminModeratorInviteControl({ invite, emails, key, label, armedId, busy }) {
  if (!invite || emails.length === 0) return "";
  if (invite.send) return `<button type="button" class="chip-btn" data-moderator-send="${escapeHtml(key)}"${busy ? " disabled" : ""}>${escapeHtml(armedId === `invite:${key}` ? invite.text.confirm : label)}</button>`;
  return `<a class="chip-btn" data-moderator-invite="${escapeHtml(key)}" href="${escapeHtml(invite.urlFor(emails))}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`;
}

/**
 * `list` já em ordem; `armedId` = o e-mail com a remoção armada (2º toque confirma); `selfEmail` ganha a etiqueta "você"; `formatDate(ms)` escreve a data do cadastro; `invite` (opcional,
 * features/moderator-invite.js): "Convidar" em cada linha e "Convidar todos" no topo; `seen` (opcional, Map e-mail → ms do último acesso) mostra quem já entrou (`formatSeen(ms)` escreve a hora);
 * `invited` (opcional, Map e-mail → ms do último envio; só com envio pelo site) mostra quem já foi convidado e troca o botão para "Reenviar". A lista só é lida pela conta dona (regras do Firestore), então só ela vê os botões.
 */
function adminModeratorsSlots({ list, armedId = null, selfEmail = "", busy = false, message = "", text, formatDate = () => "", invite = null, seen = null, invited = null, formatSeen = () => "" }) {
  const meta = item => [item.addedBy ? `${text.addedBy} ${item.addedBy}` : "", item.createdAtMs ? formatDate(item.createdAtMs) : ""].filter(Boolean).join(" · ");
  const others = list.filter(item => item.id !== selfEmail);
  const at = (label, ms) => escapeHtml(`${label} ${ms ? formatSeen(ms) : ""}`.trim()); // sem horário (ainda não chegou) fica só a frase
  const status = item => (!seen || item.id === selfEmail ? "" : seen.has(item.id)
    ? `<span class="ad-seen ad-seen--yes">${at(text.seen, seen.get(item.id))}</span>`
    : `<span class="ad-seen">${escapeHtml(text.notSeen)}</span>`);
  const invitation = item => {
    if (!invited || !invite?.send || item.id === selfEmail) return "";
    if (invited.has(item.id)) return `<span class="ad-invited ad-invited--sent">${at(invite.text.invitedAt, invited.get(item.id))}</span>`;
    return seen?.has(item.id) ? "" : `<span class="ad-invited">${escapeHtml(invite.text.notInvited)}</span>`;
  };
  const alreadyReached = id => Boolean(invite?.send && invited && (invited.has(id) || seen?.has(id)));
  const everyone = invite ? moderatorInviteAllTargets({ emails: others.map(item => item.id), invited: invite.send ? invited : null, seen }) : { emails: [] };
  const summary = seen && others.length ? `<p class="mod-hint">${escapeHtml(text.seenCount.replace("{seen}", others.filter(item => seen.has(item.id)).length).replace("{total}", others.length))}</p>` : "";
  const row = item => `<li class="ad-person">${initialAvatarMarkup(item.id)}<div class="ad-person-main"><strong>${escapeHtml(item.id)}${item.id === selfEmail ? ` <small>(${escapeHtml(text.you)})</small>` : ""}</strong>${meta(item) ? `<span>${escapeHtml(meta(item))}</span>` : ""}${invitation(item)}${status(item)}</div><div class="ad-person-actions">${item.id === selfEmail ? "" : adminModeratorInviteControl({ invite, emails: [item.id], key: item.id, label: alreadyReached(item.id) ? invite.text.resend : invite?.text.button, armedId, busy })}<button type="button" class="chip-btn chip-btn--danger" data-moderator-remove="${escapeHtml(item.id)}"${busy ? " disabled" : ""}>${escapeHtml(item.id === armedId ? text.removeConfirm : text.removeButton)}</button></div></li>`;
  const inviteAll = adminModeratorInviteControl({ invite, emails: everyone.emails, key: "*", label: everyone.resend ? invite.text.resendAll : invite?.text.allButton, armedId, busy });
  return {
    message: message ? `<p class="mod-hint mod-notice" role="status">${escapeHtml(message)}</p>` : "",
    count: `<div class="ad-card-head"><div><h2 class="mod-section-title">${escapeHtml(text.listTitle)} <span class="ad-count">${list.length}</span></h2></div></div>${summary}${inviteAll ? `<div class="ad-links">${inviteAll}</div><p class="mod-hint">${escapeHtml(invite.send ? invite.text.sendHint : invite.text.hint)}</p>` : ""}`,
    list: list.length
      ? `<ul class="ad-people">${list.map(row).join("")}</ul>`
      : adminEmptyMarkup(text.empty),
  };
}
