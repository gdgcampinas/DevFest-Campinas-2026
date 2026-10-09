/**
 * Marcação da marca (mascote Gumbleton e logo do GDG Campinas): uma peça só pra todas as telas, a partir de data/brand.js. Imagem que não carrega some sozinha (`onerror` remove o elemento): a tela
 * nunca mostra imagem quebrada. `className` é a classe da tela que usa (o tamanho é dela). Decorativa (`alt` vazio) no mascote; o logo leva o nome da comunidade.
 */
function mascotMarkup(className = "brand-mascot") {
  return `<img class="${escapeHtml(className)}" src="${escapeHtml(brandRepository.getAll().mascot)}" alt="" onerror="this.remove()">`;
}

function logoMarkup(className = "brand-logo") {
  return `<img class="${escapeHtml(className)}" src="${escapeHtml(brandRepository.getAll().logo)}" alt="GDG Campinas" onerror="this.remove()">`;
}
