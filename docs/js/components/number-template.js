/**
 * Componente: uma frase com `{chave}` onde os números entram em destaque (<b>). O texto é escapado e SÓ depois os números entram, então nada do dado vira HTML.
 * Usado pelo selo de aniversário, pela seção "Nossa história" da home e pela cena do telão.
 */
function numberTemplateMarkup(template, values) {
  return Object.entries(values).reduce((html, [key, value]) => html.replace(`{${key}}`, `<b>${Number(value)}</b>`), escapeHtml(template));
}
