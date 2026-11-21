/**
 * Componente: o conteúdo do "ver a foto maior" (features/lightbox.js), só marcação e tudo escapado: a foto grande, a legenda (`title` em destaque e `caption`) e, havendo mais de uma foto,
 * os botões de anterior e próxima. `text` traz os rótulos (`prev`, `next`) pra leitores de tela e tradução.
 */
function lightboxMarkup({ src, alt, title = "", caption = "", hasNav = false, text }) {
  const nav = hasNav
    ? `<button type="button" class="lightbox-nav lightbox-prev" data-lightbox-step="-1" aria-label="${escapeHtml(text.prev)}">‹</button>
       <button type="button" class="lightbox-nav lightbox-next" data-lightbox-step="1" aria-label="${escapeHtml(text.next)}">›</button>`
    : "";
  const legend = title || caption
    ? `<figcaption>${title ? `<strong>${escapeHtml(title)}</strong>` : ""}${caption ? `<span>${escapeHtml(caption)}</span>` : ""}</figcaption>`
    : "";
  return `<figure class="lightbox-figure"><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" decoding="async">${legend}</figure>${nav}`;
}
