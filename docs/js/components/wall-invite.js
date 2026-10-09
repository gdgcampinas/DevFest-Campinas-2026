/**
 * Convites pro mural de recados no site: o CARTÃO da home (Gumbleton, título, frase e botão) e o LINK curto que aparece depois que a pessoa avalia uma palestra. Só texto escapado e classes do
 * styles.css (.chip-btn) e do css/wall.css; o texto vem de data/wall-texts.js (já traduzido) e o endereço é o da página de recados.
 */
function wallInviteCardMarkup({ text, href }) {
  return `<a class="wall-invite-card" href="${escapeHtml(href)}">${mascotMarkup("wall-invite-mascot")}<span class="wall-invite-body"><b>${escapeHtml(text.inviteTitle)}</b><span>${escapeHtml(text.inviteText)}</span></span><span class="chip-btn chip-btn--primary">${escapeHtml(text.inviteButton)}</span></a>`;
}

function wallInviteLinkMarkup({ text, href }) {
  return `<p class="wall-invite-link">${escapeHtml(text.inviteAfterFeedback)} <a href="${escapeHtml(href)}">${escapeHtml(text.inviteButton)}</a></p>`;
}
