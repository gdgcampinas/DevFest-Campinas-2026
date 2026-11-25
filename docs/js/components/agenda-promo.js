/**
 * Divulgação da "Minha agenda": o CARTÃO da home (ícone da estrela, título, frase e botão), a DICA em linha (Grade e Palestrantes) e o SELO "Novo" do botão da Grade.
 * Só texto escapado e as classes do css/promo.css (as mesmas dos convites do álbum). O texto vem de data/agenda-promo.js.
 */
function agendaPromoCardMarkup({ title, text, button, href }) {
  return `<a class="promo-card" href="${escapeHtml(href)}"><span class="promo-icon">${iconMarkup("star")}</span><span class="promo-card-body"><b>${escapeHtml(title)}</b><span>${escapeHtml(text)}</span></span><span class="chip-btn chip-btn--primary">${escapeHtml(button)}</span></a>`;
}

function agendaPromoTipMarkup({ text }) {
  return `<p class="promo-tip">${iconMarkup("star")}<span>${escapeHtml(text)}</span></p>`;
}

function agendaPromoBadgeMarkup({ text }) {
  return `<span class="promo-badge">${escapeHtml(text)}</span>`;
}
