/**
 * Convites pro álbum ao vivo no site: o CARTÃO da home (Gumble, título, frase e botão), a FAIXA da grade e o LINK curto depois do check-in. Só texto escapado e classes do styles.css (.chip-btn)
 * e do css/promo.css (cartão e faixa) e css/photo-invite.css (o que é do álbum); o texto vem de data/photo-invite.js e o endereço é o do convite do álbum (abre em outra aba: é o Google Fotos).
 */
const photoInviteLinkAttrs = href => `href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer"`;

function photoInviteCardMarkup({ text, href }) {
  return `<a class="promo-card photo-invite-card" ${photoInviteLinkAttrs(href)}>${mascotMarkup("photo-invite-mascot")}<span class="promo-card-body photo-invite-body"><b>${escapeHtml(text.cardTitle)}</b><span>${escapeHtml(text.cardText)}</span></span><span class="chip-btn chip-btn--primary">${escapeHtml(text.cardButton)}</span></a>`;
}

function photoInviteBannerMarkup({ text, href }) {
  return `<a class="promo-tip photo-invite-banner" ${photoInviteLinkAttrs(href)}><span>${escapeHtml(text.bannerText)}</span><b>${escapeHtml(text.bannerButton)}</b></a>`;
}

function photoInviteLinkMarkup({ text, href }) {
  return `<p class="photo-invite-link">${escapeHtml(text.afterCheckin)} <a ${photoInviteLinkAttrs(href)}>${escapeHtml(text.afterCheckinButton)}</a></p>`;
}
