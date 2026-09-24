/**
 * Seletor de idioma do cabeçalho ("PT | EN"). Só markup: cada idioma é um link
 * pra mesma página com ?lang= (features/i18n.js grava a escolha e a página recarrega
 * no idioma). Só aparece quando há mais de um idioma com dicionário.
 */
function languageSwitcherMarkup({ languages, current, hrefFor, label }) {
  const links = languages
    .map(language => `<a href="${hrefFor(language.id)}" lang="${language.htmlLang}" hreflang="${language.htmlLang}" title="${language.name}"${language.id === current ? ` aria-current="true" class="current"` : ""}>${language.label}</a>`)
    .join("");
  return `<nav class="lang-switcher" aria-label="${label}">${links}</nav>`;
}
