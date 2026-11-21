/** O cabeçalho do selo de aniversário: o selo redondo (opcional, `sealMarkup` de components/anniversary-seal.js) como link à esquerda da pílula, na mesma linha; ambos levam à história. */
function anniversaryHeaderMarkup({ pillMarkup, sealMarkup = "", href = "historia.html" }) {
  const seal = sealMarkup ? `<a class="anniversary-seal" href="${escapeHtml(href)}" data-track-event="anniversary_seal">${sealMarkup}</a>` : "";
  return `${seal}${pillMarkup}`;
}

/** Componente: o selo de aniversário (pílula dourada com ícone) que LEVA à página de história. Só marcação; os números entram em destaque por numberTemplateMarkup (components/number-template.js). */
function anniversaryBadgeMarkup(template, values, { href = "historia.html" } = {}) {
  return `<a class="anniversary-badge" href="${escapeHtml(href)}" data-track-event="anniversary_badge">${iconMarkup("sparkles")}<span>${numberTemplateMarkup(template, values)}</span></a>`;
}
