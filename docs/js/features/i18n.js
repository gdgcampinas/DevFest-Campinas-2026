/**
 * Internacionalização no navegador: cria a instância global (`i18n`, `t`, `tn`)
 * a partir do núcleo (i18n-core.js) e dos dados (data/i18n/*). Trocar de idioma
 * recarrega a página com ?lang= (nada é redesenhado à mão). Textos fixos do HTML
 * levam `data-i18n="chave"` (o português continua escrito no HTML como padrão) e
 * `data-i18n-attrs="atributo:chave,..."` pros atributos (placeholder, aria-label,
 * title). Precisa carregar depois de data/i18n/languages.js e dos dicionários e
 * antes de qualquer script que chame t() ao desenhar.
 */
function localStorageOrNull() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const i18n = createI18n({
  languages: i18nLanguagesRepository.getAll(),
  dictionaries: I18N_DICTIONARIES,
  defaultLang: I18N_DEFAULT_LANGUAGE,
  storage: localStorageOrNull(),
  search: location.search,
});
const t = i18n.t;
const tn = i18n.tn;
const tt = i18n.tt;
document.documentElement.lang = i18n.htmlLang;

/** Traduz os elementos com data-i18n dentro de rootEl. No idioma padrão não mexe em nada. */
function applyStaticTranslations(rootEl = document) {
  if (i18n.isDefault) return;
  rootEl.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n, el.textContent); });
  rootEl.querySelectorAll("[data-i18n-attrs]").forEach(el => {
    el.dataset.i18nAttrs.split(",").forEach(pair => {
      const [attribute, key] = pair.split(":");
      el.setAttribute(attribute, t(key, el.getAttribute(attribute)));
    });
  });
}

/** Link da página atual em outro idioma, preservando os demais parâmetros (?demo=, ?lineup=...). */
function languageHref(langId) {
  const url = new URL(location.href);
  url.searchParams.set("lang", langId);
  return url.search;
}
