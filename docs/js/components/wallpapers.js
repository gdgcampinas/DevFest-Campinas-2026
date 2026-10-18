/**
 * Componente: a galeria de fundos de tela. Só marcação, tudo escapado e por parâmetro: `wallpapers` (data/wallpapers.js) e `text` (WALLPAPER_TEXTS). Cada cartão mostra a miniatura numa moldura de
 * celular e o botão de baixar (link com `download`).
 */
function wallpaperCardMarkup(wallpaper, text) {
  return `
    <figure class="wp-card">
      <a class="wp-phone" href="${escapeHtml(wallpaper.image)}" target="_blank" rel="noopener" aria-label="${escapeHtml(wallpaper.title)}">
        <img src="${escapeHtml(wallpaper.thumb)}" alt="${escapeHtml(`${text.photoOf}: ${wallpaper.title}`)}" loading="lazy" decoding="async">
      </a>
      <figcaption>
        <strong>${escapeHtml(wallpaper.title)}</strong>
        <a class="chip-btn chip-btn--primary" href="${escapeHtml(wallpaper.image)}" download="${escapeHtml(wallpaper.filename)}" data-track-event="wallpaper_download" data-track-place="${escapeHtml(wallpaper.id)}">${escapeHtml(text.download)}</a>
      </figcaption>
    </figure>`;
}

function wallpapersGalleryMarkup({ wallpapers, text }) {
  return `
    <div class="wp-grid">${wallpapers.map(item => wallpaperCardMarkup(item, text)).join("")}</div>
    <p class="wp-tip">${escapeHtml(text.tip)}</p>`;
}

function wallpapersSoonMarkup(text) {
  return `<p class="wp-soon">${escapeHtml(text.soon)}</p>`;
}
