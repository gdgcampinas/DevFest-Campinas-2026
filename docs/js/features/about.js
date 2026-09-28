/** Feature: blocos institucionais ("Sobre"). Reusa o card com ícone de components/info-card.js (mesmo padrão de
 * "Antes de vir" e "Por que patrocinar"): cada item já traz `icon` (nome de data/icons.js) resolvido em SVG aqui,
 * pra o componente genérico não precisar saber de iconsRepository. */
function renderAbout(sections, mountEl) {
  renderInfoCards(sections.map(section => ({ ...section, icon: iconMarkup(section.icon) })), mountEl);
}
