/** Componente: o selo de aniversário (pílula dourada com ícone) que LEVA à página de história. Só marcação; os números entram em destaque por numberTemplateMarkup (components/number-template.js). */
function anniversaryBadgeMarkup(template, values, { href = "historia.html" } = {}) {
  return `<a class="anniversary-badge" href="${escapeHtml(href)}" data-track-event="anniversary_badge">${iconMarkup("sparkles")}<span>${numberTemplateMarkup(template, values)}</span></a>`;
}
