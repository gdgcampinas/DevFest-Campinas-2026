/**
 * Componente: o selo de aniversário (pílula dourada com ícone). Só marcação, tudo escapado. `template` é a frase com `{chave}` (data/anniversary.js) e `values` os números
 * de cada chave: o texto é escapado e SÓ depois os números entram, em destaque (<b>), então nada do dado vira HTML.
 */
function anniversaryBadgeMarkup(template, values) {
  const label = Object.entries(values).reduce((html, [key, value]) => html.replace(`{${key}}`, `<b>${Number(value)}</b>`), escapeHtml(template));
  return `<span class="anniversary-badge">${iconMarkup("sparkles")}<span>${label}</span></span>`;
}
