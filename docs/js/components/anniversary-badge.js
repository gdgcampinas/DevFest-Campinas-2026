/** Componente: o selo de aniversário (pílula dourada com ícone). Só marcação; os números entram em destaque por numberTemplateMarkup (components/number-template.js). */
function anniversaryBadgeMarkup(template, values) {
  return `<span class="anniversary-badge">${iconMarkup("sparkles")}<span>${numberTemplateMarkup(template, values)}</span></span>`;
}
