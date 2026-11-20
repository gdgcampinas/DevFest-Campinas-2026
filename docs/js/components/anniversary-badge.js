/** Componente: o selo de aniversário (pílula dourada com ícone). Só marcação, tudo escapado; `label` já vem pronto de features/anniversary.js. */
function anniversaryBadgeMarkup(label) {
  return `<span class="anniversary-badge">${iconMarkup("sparkles")}<span>${escapeHtml(label)}</span></span>`;
}
