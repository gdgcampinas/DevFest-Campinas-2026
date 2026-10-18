/**
 * Componente: a galeria de fundos de tela. Só marcação, tudo escapado e por parâmetro: `wallpapers` (data/wallpapers.js) e `text` (WALLPAPER_TEXTS). Cada cartão mostra a miniatura numa moldura de
 * celular (com o relógio e a data da tela de bloqueio por cima, só ilustração: o arquivo baixado é limpo) e o botão de baixar (link com `download`).
 */
function wallpapersHeadMarkup(text) {
  return `
    <span class="wp-badge">${escapeHtml(text.badge)}</span>
    <h2>${escapeHtml(text.title)}</h2>
    <p>${escapeHtml(text.sub)}</p>`;
}

function wallpaperCardMarkup(wallpaper, text) {
  return `
    <figure class="wp-card">
      <a class="wp-phone" href="${escapeHtml(wallpaper.image)}" target="_blank" rel="noopener" aria-label="${escapeHtml(wallpaper.title)}">
        <img src="${escapeHtml(wallpaper.thumb)}" alt="${escapeHtml(`${text.photoOf}: ${wallpaper.title}`)}" loading="lazy" decoding="async">
        <span class="wp-lock" aria-hidden="true"><b>${escapeHtml(text.lockTime)}</b><small>${escapeHtml(text.lockDate)}</small></span>
      </a>
      <figcaption>
        <strong>${escapeHtml(wallpaper.title)}</strong>
        <a class="chip-btn chip-btn--primary" href="${escapeHtml(wallpaper.image)}" download="${escapeHtml(wallpaper.filename)}" data-track-event="wallpaper_download" data-track-place="${escapeHtml(wallpaper.id)}">${escapeHtml(text.download)}</a>
      </figcaption>
    </figure>`;
}

/** Um cartão "Como usar" por sistema: nome e passos numerados. */
function wallpaperGuideMarkup(guide) {
  const steps = guide.steps.map(step => `<li>${escapeHtml(step)}</li>`).join("");
  return `<div class="wp-guide" data-guide="${escapeHtml(guide.id)}"><strong>${escapeHtml(guide.title)}</strong><ol>${steps}</ol></div>`;
}

function wallpapersGalleryMarkup({ wallpapers, text }) {
  return `
    <div class="wp-grid">${wallpapers.map(item => wallpaperCardMarkup(item, text)).join("")}</div>
    <h3 class="wp-guides-title">${escapeHtml(text.guidesTitle)}</h3>
    <div class="wp-guides">${text.guides.map(wallpaperGuideMarkup).join("")}</div>`;
}

function wallpapersSoonMarkup(text) {
  return `<p class="wp-soon">${escapeHtml(text.soon)}</p>`;
}
