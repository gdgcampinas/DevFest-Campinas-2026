/** Único template de ícone SVG — os paths vêm de data/icons.js (iconsRepository). */
function iconMarkup(name, className = "icon") {
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true">${iconsRepository.get(name)}</svg>`;
}
