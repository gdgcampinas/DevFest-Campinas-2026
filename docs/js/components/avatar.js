/**
 * Avatar genérico — foto ou iniciais como fallback. Único lugar que
 * sabe desenhar isso; reusado no card de pessoa (time), no card de
 * palestra (agenda) e no modal de detalhe/galeria de palestrantes.
 * Foto ausente nunca quebra o layout — cai pra iniciais automaticamente.
 */
function initials(name) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function avatarMarkup(name, photo, className = "avatar") {
  return photo
    ? `<img class="${className}" src="${photo}" alt="${name}" loading="lazy">`
    : `<div class="${className} ${className}--fallback">${initials(name)}</div>`;
}
