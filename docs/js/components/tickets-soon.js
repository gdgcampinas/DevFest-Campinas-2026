/**
 * Marcação do bloco "ingressos em breve" da página Ingressos, no lugar da caixa de "serão revelados": o aviso, cartões-fantasma bloqueados (cadeado, SEM nome nem valor: os tipos ainda não foram
 * revelados) e o botão que leva ao cartão da lista de espera (#waitlist). Só texto escapado e classes de css/waitlist.css. `count` vem de data/waitlist-config.js; os textos de data/waitlist-texts.js.
 */
function ticketsSoonMarkup({ text, count }) {
  const ghosts = Array.from({ length: count }, () => `
      <div class="wl-ghost" aria-hidden="true">
        <span class="wl-ghost-lock">${iconMarkup("lock")}</span>
        <i class="wl-ghost-line wl-ghost-line--short"></i><i class="wl-ghost-line wl-ghost-line--price"></i><i class="wl-ghost-line"></i>
        <small>${escapeHtml(text.soonLocked)}</small>
      </div>`).join("");
  return `
    <div class="wl-soon">
      <h2 class="wl-soon-title">${escapeHtml(text.soonTitle)}</h2>
      <p class="wl-soon-body">${escapeHtml(text.soonBody)}</p>
      <div class="wl-ghosts">${ghosts}</div>
      <a class="cta" href="#waitlist" data-track-event="waitlist_open" data-track-place="soon">${escapeHtml(text.openButton)}</a>
    </div>`;
}
