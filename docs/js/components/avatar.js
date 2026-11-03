/**
 * Avatar genérico — foto ou iniciais como fallback. Único lugar que
 * sabe desenhar isso; reusado no card de pessoa (time), no card de
 * palestra (agenda) e no modal de detalhe/galeria de palestrantes.
 * Foto ausente nunca quebra o layout — cai pra iniciais automaticamente.
 */
function initials(name) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

/** Foto de quem fala pode abrir ampliada (features/speaker-photo-zoom.js): `zoom` = { meta, talks: [títulos], color } grava o que o modal mostra. Logo em SVG (ex.: GDG Campinas) não amplia. */
function avatarMarkup(name, photo, className = "avatar", zoom = null) {
  if (!photo) return `<div class="${className} ${className}--fallback">${initials(name)}</div>`;
  const zoomable = zoom && !/\.svg(\?|$)/i.test(photo);
  const zoomAttrs = zoomable
    ? ` data-zoom-photo data-zoom-name="${escapeHtml(name)}" data-zoom-meta="${escapeHtml(zoom.meta ?? "")}" data-zoom-talks="${escapeHtml((zoom.talks ?? []).join("\n"))}" data-zoom-color="${escapeHtml(zoom.color ?? "")}" tabindex="0"`
    : "";
  return `<img class="${className}" src="${photo}" alt="${name}" loading="lazy"${zoomAttrs}>`;
}
